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

  // Add helper functions to validate plays
  const isValidPlay = (cards) => {
    if (cards.length === 0) return false
    if (cards.length === 1) return true // single card always valid
    
    // Sort cards by value for easier checking
    const sortedCards = [...cards].sort((a, b) => {
      const values = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14}
      return values[a.value] - values[b.value]
    })

    // Check for pair
    if (cards.length === 2) {
      return cards[0].value === cards[1].value
    }

    // Check for triple
    if (cards.length === 3) {
      return cards[0].value === cards[1].value && cards[1].value === cards[2].value
    }

    // Check for royal straight (5+ cards)
    if (cards.length >= 5) {
      const isConsecutive = sortedCards.every((card, i) => {
        if (i === 0) return true
        const values = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14}
        return values[card.value] === values[sortedCards[i-1].value] + 1
      })
      const sameSuit = sortedCards.every(card => card.suit === sortedCards[0].suit)
      if (isConsecutive && sameSuit) return true
    }

    // Check for full house
    if (cards.length === 5) {
      const valueCounts = {}
      cards.forEach(card => {
        valueCounts[card.value] = (valueCounts[card.value] || 0) + 1
      })
      const counts = Object.values(valueCounts)
      return counts.includes(3) && counts.includes(2)
    }

    return false
  }

  // Update card selection handling
  const toggleCardSelection = (playerIndex, cardIndex) => {
    if (playerIndex !== currentTurn) return

    const card = players[playerIndex].hand[cardIndex]
    
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id)
      if (isSelected) {
        return prev.filter(c => c.id !== card.id)
      } else {
        return [...prev, card]
      }
    })
  }

  // Update play card function to handle multiple cards
  const playCards = () => {
    if (!isValidPlay(selectedCards)) {
      alert('Invalid play! Please select a valid combination.')
      return
    }

    // Add selected cards to play area
    setPlayArea(prev => [...prev, ...selectedCards])

    // Remove played cards from player's hand
    const newPlayers = [...players]
    selectedCards.forEach(playedCard => {
      const cardIndex = newPlayers[currentTurn].hand.findIndex(card => card.id === playedCard.id)
      if (cardIndex !== -1) {
        newPlayers[currentTurn].hand.splice(cardIndex, 1)
      }
    })
    
    setPlayers(newPlayers)
    setSelectedCards([]) // Clear selection

    // Check for winner
    if (newPlayers[currentTurn].hand.length === 0) {
      setGameStatus('finished')
      return
    }

    // Next turn
    setCurrentTurn((currentTurn + 1) % players.length)
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

  return (
    <div className="game-room">
      <header className="game-header">
        <h1>Card Game</h1>
        <div className="game-status">Status: {gameStatus}</div>
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
                <h3>{player.name} {currentTurn === playerIndex ? '(Current Turn)' : ''}</h3>
                <div className="cards">
                  {player.hand.map((card, cardIndex) => (
                    <div 
                      key={card.id} 
                      className={`card ${selectedCards.some(c => c.id === card.id) ? 'selected' : ''}`}
                      onClick={() => toggleCardSelection(playerIndex, cardIndex)}
                      style={{ 
                        cursor: currentTurn === playerIndex ? 'pointer' : 'not-allowed',
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