import { useState, useEffect } from 'react'
import './GameRoom.css'

function GameRoom() {
  // Game states
  const [deck, setDeck] = useState([])
  const [players, setPlayers] = useState([
    { id: 0, name: 'Player 1' },
    { id: 1, name: 'Player 2' },
    { id: 2, name: 'Player 3' }
  ])
  const [currentTurn, setCurrentTurn] = useState(0)
  const [gameStatus, setGameStatus] = useState('waiting') // waiting, dealing, playing, finished
  const [playArea, setPlayArea] = useState([])
  const [selectedCards, setSelectedCards] = useState([])
  const [lastPlayType, setLastPlayType] = useState(null)
  
  // Initialize deck
  const initializeDeck = () => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades']
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    let newDeck = []
    
    // Add standard cards
    for (let suit of suits) {
      for (let value of values) {
        newDeck.push({ suit, value, id: `${value}-${suit}` })
      }
    }
    
    // Add jokers
    newDeck.push({ suit: 'joker', value: 'HIGH', id: 'joker-high' })
    newDeck.push({ suit: 'joker', value: 'LOW', id: 'joker-low' })
    
    return shuffleDeck(newDeck)
  }
  
  // Shuffle deck using Fisher-Yates algorithm
  const shuffleDeck = (deck) => {
    let shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  
  // Deal cards to players
  const dealCards = () => {
    const newDeck = initializeDeck()
    const numPlayers = 3
    let newPlayers = []
    
    // Create players with their hands
    for (let i = 0; i < numPlayers; i++) {
      newPlayers.push({
        id: i,
        hand: [],
        name: `Player ${i + 1}`
      })
    }
    
    // Deal cards evenly
    let currentPlayer = 0
    while (newDeck.length > 0) {
      const card = newDeck.pop()
      newPlayers[currentPlayer].hand.push(card)
      currentPlayer = (currentPlayer + 1) % numPlayers
    }
    
    setPlayers(newPlayers)
    setDeck([]) // Empty deck after dealing
    setGameStatus('playing')
    setCurrentTurn(0)
  }

  // Start game when we have 3 players
  const startGame = () => {
    if (players.length === 3) {
      setGameStatus('dealing')
      dealCards()
    }
  }

  // Add card value mapping
  const cardValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14, 'LOW': 1, 'HIGH': 15
  }

  // Add hand rankings
  const handRankings = {
    'single': 1,
    'pair': 2,
    'triple': 3,
    'royalstraight': 4,
    'fullhouse': 5
  }

  // Function to get the highest card value in a hand
  const getHighestCardValue = (cards) => {
    return Math.max(...cards.map(card => cardValues[card.value]))
  }

  // Update getPlayType function to properly handle single cards
  const getPlayType = (cards) => {
    // Single card
    if (cards.length === 1) return 'single'
    
    // Pair
    if (cards.length === 2 && cards[0].value === cards[1].value) return 'pair'
    
    // Triple
    if (cards.length === 3 && 
        cards[0].value === cards[1].value && 
        cards[1].value === cards[2].value) return 'triple'
    
    // Full house
    if (cards.length === 5) {
      const valueCounts = {}
      cards.forEach(card => {
        valueCounts[card.value] = (valueCounts[card.value] || 0) + 1
      })
      const counts = Object.values(valueCounts)
      if (counts.includes(3) && counts.includes(2)) return 'fullhouse'
    }
    
    // Royal straight (5+ consecutive cards of same suit)
    if (cards.length >= 5) {
      const sortedCards = [...cards].sort((a, b) => cardValues[a.value] - cardValues[b.value])
      const isConsecutive = sortedCards.every((card, i) => {
        if (i === 0) return true
        return cardValues[card.value] === cardValues[sortedCards[i-1].value] + 1
      })
      const sameSuit = sortedCards.every(card => card.suit === sortedCards[0].suit)
      if (isConsecutive && sameSuit) return 'royalstraight'
    }
    
    return null
  }

  // Update isValidPlay to enforce same hand type and higher value
  const isValidPlay = (cards) => {
    if (cards.length === 0) return false
    
    const playType = getPlayType(cards)
    if (!playType) return false
    
    // If this is the first play, any valid combination is allowed
    if (!lastPlayType) return true
    
    // Must play same type as last play
    if (playType !== lastPlayType) {
      return false
    }
    
    // Compare values based on hand type
    const lastPlayedCards = playArea.slice(-cards.length)
    
    switch (playType) {
      case 'single':
        return cardValues[cards[0].value] > cardValues[lastPlayedCards[0].value]
        
      case 'pair':
        return cardValues[cards[0].value] > cardValues[lastPlayedCards[0].value]
        
      case 'triple':
        return cardValues[cards[0].value] > cardValues[lastPlayedCards[0].value]
        
      case 'fullhouse': {
        // Compare the value of the three of a kind
        const getThreeOfAKindValue = (cards) => {
          const valueCounts = {}
          cards.forEach(card => {
            valueCounts[card.value] = (valueCounts[card.value] || 0) + 1
          })
          return Object.entries(valueCounts).find(([_, count]) => count === 3)[0]
        }
        const lastThreeValue = cardValues[getThreeOfAKindValue(lastPlayedCards)]
        const newThreeValue = cardValues[getThreeOfAKindValue(cards)]
        return newThreeValue > lastThreeValue
      }
        
      case 'royalstraight': {
        // Compare highest card in the straight
        const getHighestValue = (cards) => 
          Math.max(...cards.map(card => cardValues[card.value]))
        return getHighestValue(cards) > getHighestValue(lastPlayedCards)
      }
        
      default:
        return false
    }
  }

  // Update hasValidPlay to check for valid plays based on value
  const hasValidPlay = (playerHand) => {
    if (!lastPlayType) return true // First play of the game
    
    // Try all possible combinations of the same type as lastPlayType
    const lastPlayedCards = playArea.slice(-getPlayTypeLength(lastPlayType))
    
    switch (lastPlayType) {
      case 'single':
        return playerHand.some(card => 
          cardValues[card.value] > cardValues[lastPlayedCards[0].value]
        )
        
      case 'pair':
        for (let i = 0; i < playerHand.length - 1; i++) {
          for (let j = i + 1; j < playerHand.length; j++) {
            if (playerHand[i].value === playerHand[j].value &&
                cardValues[playerHand[i].value] > cardValues[lastPlayedCards[0].value]) {
              return true
            }
          }
        }
        return false
        
      // Add similar checks for triple, fullhouse, and royalstraight
      // ... 
    }
    
    return false
  }

  // Helper function to get the number of cards needed for each play type
  const getPlayTypeLength = (playType) => {
    switch (playType) {
      case 'single': return 1
      case 'pair': return 2
      case 'triple': return 3
      case 'fullhouse': return 5
      case 'royalstraight': return 5
      default: return 0
    }
  }

  // Update playCards function to show more specific error messages
  const playCards = () => {
    const playType = getPlayType(selectedCards)
    
    if (!playType) {
      alert('Invalid combination! Please select a valid hand.')
      return
    }
    
    if (lastPlayType && handRankings[playType] < handRankings[lastPlayType]) {
      alert(`You must play a ${lastPlayType} or higher!`)
      return
    }
    
    if (!isValidPlay(selectedCards)) {
      alert('Your play must be higher than the last played hand!')
      return
    }

    // Add selected cards to play area
    setPlayArea(prev => [...prev, ...selectedCards])
    setLastPlayType(playType)

    // Remove played cards from player's hand
    const newPlayers = [...players]
    selectedCards.forEach(playedCard => {
      const cardIndex = newPlayers[currentTurn].hand.findIndex(card => card.id === playedCard.id)
      if (cardIndex !== -1) {
        newPlayers[currentTurn].hand.splice(cardIndex, 1)
      }
    })
    
    setPlayers(newPlayers)
    setSelectedCards([])

    // Check for winner
    if (newPlayers[currentTurn].hand.length === 0) {
      setGameStatus('finished')
      return
    }

    // Move to next player
    moveToNextPlayer(newPlayers)
  }

  // Add function to handle moving to next player
  const moveToNextPlayer = (currentPlayers) => {
    let nextPlayer = (currentTurn + 1) % players.length
    
    // Check if next player has valid plays
    while (!hasValidPlay(currentPlayers[nextPlayer].hand)) {
      alert(`${currentPlayers[nextPlayer].name} has no valid plays and is skipped!`)
      nextPlayer = (nextPlayer + 1) % players.length
      
      // If we've checked all players, reset the play type
      if (nextPlayer === currentTurn) {
        setLastPlayType(null)
        break
      }
    }
    
    setCurrentTurn(nextPlayer)
  }

  // Add this helper function at the top of your component
  const getCardDisplay = (card) => {
    const suitSymbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    }

    if (card.suit === 'joker') {
      return {
        display: card.value,
        color: 'black'
      }
    }

    return {
      display: `${card.value}${suitSymbols[card.suit]}`,
      color: ['hearts', 'diamonds'].includes(card.suit) ? 'red' : 'black'
    }
  }

  // Add this function to reset the game
  const startNewGame = () => {
    setGameStatus('waiting')
    setPlayArea([])
    setCurrentTurn(0)
    setPlayers([
      { id: 0, name: 'Player 1' },
      { id: 1, name: 'Player 2' },
      { id: 2, name: 'Player 3' }
    ])
  }

  // Add drag handling functions
  const handleDragStart = (e, playerIndex, cardIndex) => {
    // Only allow dragging in your own hand
    if (playerIndex !== currentTurn) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('cardIndex', cardIndex)
  }

  const handleDragOver = (e) => {
    e.preventDefault() // Necessary to allow drop
  }

  const handleDrop = (e, playerIndex, dropCardIndex) => {
    // Only allow sorting in your own hand
    if (playerIndex !== currentTurn) return
    
    const dragCardIndex = parseInt(e.dataTransfer.getData('cardIndex'))
    if (dragCardIndex === dropCardIndex) return

    // Reorder the cards in the player's hand
    const newPlayers = [...players]
    const hand = [...newPlayers[playerIndex].hand]
    const [draggedCard] = hand.splice(dragCardIndex, 1)
    hand.splice(dropCardIndex, 0, draggedCard)
    newPlayers[playerIndex].hand = hand
    setPlayers(newPlayers)
  }

  // Add sorting helper function
  const sortCards = (cards) => {
    const cardValues = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14, 'LOW': 1, 'HIGH': 15
    }
    
    const suitOrder = { 'spades': 0, 'hearts': 1, 'diamonds': 2, 'clubs': 3, 'joker': 4 }
    
    return [...cards].sort((a, b) => {
      // First sort by suit
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit]
      }
      // Then sort by value
      return cardValues[a.value] - cardValues[b.value]
    })
  }

  // Add auto-sort function
  const autoSortHand = (playerIndex) => {
    if (playerIndex !== currentTurn) return
    
    const newPlayers = [...players]
    newPlayers[playerIndex].hand = sortCards(newPlayers[playerIndex].hand)
    setPlayers(newPlayers)
  }

  // Update skip turn function to receive playerIndex
  const skipTurn = (playerIndex) => {
    if (currentTurn !== playerIndex) return
    
    // Check if player really has no valid plays
    if (hasValidPlay(players[currentTurn].hand)) {
      alert('You have valid plays available! Cannot skip turn.')
      return
    }

    alert(`${players[currentTurn].name} skips their turn!`)
    moveToNextPlayer(players)
  }

  // Add clear selection function
  const clearSelection = () => {
    setSelectedCards([])
  }

  // Add reset game function
  const resetGame = () => {
    if (window.confirm('Are you sure you want to reset the game? This will start a new game.')) {
      setGameStatus('waiting')
      setPlayArea([])
      setSelectedCards([])
      setCurrentTurn(0)
      setLastPlayType(null)
      setPlayers([
        { id: 0, name: 'Player 1' },
        { id: 1, name: 'Player 2' },
        { id: 2, name: 'Player 3' }
      ])
    }
  }

  // Update toggleCardSelection function to properly handle multiple selections
  const toggleCardSelection = (playerIndex, cardIndex) => {
    if (playerIndex !== currentTurn) return
    
    const card = players[playerIndex].hand[cardIndex]
    
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id)
      if (isSelected) {
        // Remove card if already selected
        return prev.filter(c => c.id !== card.id)
      } else {
        // Add card if not selected
        return [...prev, card]
      }
    })
  }

  return (
    <div className="game-room">
      <header className="game-header">
        <div className="header-content">
          <h1>Card Game</h1>
          <div className="game-status">Status: {gameStatus}</div>
        </div>
        <button 
          onClick={resetGame} 
          className="reset-button"
        >
          Reset Game
        </button>
      </header>

      <div className="game-content">
        {gameStatus === 'waiting' && (
          <div className="waiting-room">
            <h2>Waiting for Players</h2>
            <p>Players joined: {players.length}/3</p>
            {players.length === 3 && (
              <button onClick={startGame}>Start Game</button>
            )}
          </div>
        )}

        {gameStatus === 'playing' && (
          <div className="game-board">
            {/* Update play area card display */}
            <div className="play-area">
              <h3>Play Area</h3>
              {lastPlayType && (
                <div className="required-play">
                  Required Play: {lastPlayType.charAt(0).toUpperCase() + lastPlayType.slice(1)}
                </div>
              )}
              <div className="cards">
                {playArea.map((card, index) => (
                  <div 
                    key={`play-${index}`} 
                    className="card played"
                    style={{ color: getCardDisplay(card).color }}
                  >
                    {getCardDisplay(card).display}
                  </div>
                ))}
              </div>
            </div>

            {/* Update player hand card display */}
            {players.map((player, playerIndex) => (
              <div 
                key={player.id} 
                className={`player-hand ${currentTurn === playerIndex ? 'active' : ''}`}
              >
                <div className="hand-controls">
                  <h3>{player.name} {currentTurn === playerIndex ? '(Current Turn)' : ''}</h3>
                  {currentTurn === playerIndex && (
                    <div className="button-group">
                      <button 
                        onClick={() => autoSortHand(playerIndex)} 
                        className="sort-button"
                      >
                        Sort Cards
                      </button>
                      <button 
                        onClick={() => skipTurn(playerIndex)} 
                        className="skip-button"
                      >
                        Skip Turn
                      </button>
                      {selectedCards.length > 0 && (
                        <button 
                          onClick={clearSelection} 
                          className="clear-button"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="cards">
                  {player.hand.map((card, cardIndex) => (
                    <div 
                      key={card.id} 
                      className={`card ${selectedCards.some(c => c.id === card.id) ? 'selected' : ''}`}
                      draggable={currentTurn === playerIndex}
                      onDragStart={(e) => handleDragStart(e, playerIndex, cardIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, playerIndex, cardIndex)}
                      onClick={() => toggleCardSelection(playerIndex, cardIndex)}
                      style={{ 
                        cursor: currentTurn === playerIndex ? 'grab' : 'not-allowed',
                        color: getCardDisplay(card).color 
                      }}
                    >
                      {getCardDisplay(card).display}
                    </div>
                  ))}
                </div>
                {currentTurn === playerIndex && selectedCards.length > 0 && (
                  <button onClick={playCards} className="play-button">
                    Play Selected Cards
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {gameStatus === 'finished' && (
          <div className="game-over">
            <h2>Game Over!</h2>
            <p>Winner: {players.find(p => p.hand.length === 0).name}</p>
            <button onClick={startNewGame}>Start New Game</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GameRoom 