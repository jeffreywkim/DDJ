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

  // Add function to handle playing a card
  const playCard = (playerIndex, cardIndex) => {
    // Only allow current player to play
    if (playerIndex !== currentTurn) return

    // Get the card being played
    const player = players[playerIndex]
    const card = player.hand[cardIndex]

    // Add card to play area
    setPlayArea(prev => [...prev, card])

    // Remove card from player's hand
    const newPlayers = [...players]
    newPlayers[playerIndex].hand.splice(cardIndex, 1)
    setPlayers(newPlayers)

    // Check if player has won
    if (newPlayers[playerIndex].hand.length === 0) {
      setGameStatus('finished')
      return
    }

    // Move to next player's turn
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
                      className="card"
                      onClick={() => playCard(playerIndex, cardIndex)}
                      style={{ 
                        cursor: currentTurn === playerIndex ? 'pointer' : 'not-allowed',
                        color: getCardDisplay(card).color 
                      }}
                    >
                      {getCardDisplay(card).display}
                    </div>
                  ))}
                </div>
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