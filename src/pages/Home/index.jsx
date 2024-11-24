import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  return (
    <div>
      <h1>Welcome to DDJ</h1>
      <button onClick={() => navigate('/game')}>
        Start New Game
      </button>
    </div>
  )
}

export default Home
