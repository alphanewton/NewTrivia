import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GameProvider, useGame } from '../contexts/GameContext'
import LobbyView from '../components/LobbyView'
import GameView from '../components/GameView'
import PodiumView from '../components/PodiumView'

function RoomInner() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { state, connect, disconnect } = useGame()

  useEffect(() => {
    const hostUserId = localStorage.getItem(`host_${roomCode}`)
    const hostName = localStorage.getItem(`host_name_${roomCode}`)
    const playerName = sessionStorage.getItem('playerName')

    if (hostUserId) {
      connect(roomCode, hostName, hostUserId)
    } else if (playerName) {
      connect(roomCode, playerName, null)
    } else {
      navigate('/', { replace: true })
    }

    return () => disconnect()
  }, [roomCode, connect, disconnect, navigate])

  const { phase, error } = state

  if (phase === 'connecting') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-300 dark:border-indigo-900 border-t-indigo-600 animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Connecting...</p>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4 px-4">
        <div className="text-5xl mb-2">⚠️</div>
        <p className="text-red-500 dark:text-red-400 text-xl text-center font-semibold">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg"
        >
          Back to Home
        </button>
      </div>
    )
  }

  if (phase === 'lobby' || phase === 'starting') return <LobbyView />
  if (phase === 'question' || phase === 'intermission') return <GameView />
  if (phase === 'finished') return <PodiumView />
  return null
}

export default function Room() {
  return (
    <GameProvider>
      <RoomInner />
    </GameProvider>
  )
}
