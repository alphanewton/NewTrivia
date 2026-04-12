import { useState, useMemo } from 'react'
import { createAvatar } from '@dicebear/core'
import { bottts } from '@dicebear/collection'
import QRCode from 'react-qr-code'
import { useGame } from '../contexts/GameContext'

// 16 fun robot seeds for the picker
const ROBOT_SEEDS = [
  'Cosmo', 'Nova', 'Rex', 'Bolt',
  'Zap', 'Cyber', 'Pixel', 'Byte',
  'Chip', 'Max', 'Luna', 'Neon',
  'Atlas', 'Echo', 'Orion', 'Vega',
]

function getAvatarUri(seed) {
  return createAvatar(bottts, { seed, size: 80 }).toDataUri()
}

function BotAvatar({ seed, size = 40, className = '' }) {
  const uri = useMemo(() => getAvatarUri(seed), [seed])
  return (
    <img
      src={uri}
      alt={seed}
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  )
}

function AvatarPickerModal({ currentSeed, onSelect, onClose }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl p-6 animate-pop shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-white">Pick Your Bot</h3>
            <p className="text-gray-500 text-xs">Choose your robot character</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {ROBOT_SEEDS.map(seed => {
            const isSelected = seed === currentSeed
            const isHovered = seed === hovered
            return (
              <button
                key={seed}
                onClick={() => onSelect(seed)}
                onMouseEnter={() => setHovered(seed)}
                onMouseLeave={() => setHovered(null)}
                className={`relative flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-indigo-600/30 border-2 border-indigo-500 shadow-lg shadow-indigo-500/20'
                    : 'border-2 border-transparent hover:bg-gray-800'
                }`}
              >
                <BotAvatar seed={seed} size={52} className={`transition-transform ${isHovered || isSelected ? 'scale-110' : ''}`} />
                <span className="text-xs text-gray-400 font-medium truncate w-full text-center">
                  {seed}
                </span>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow">
                    ✓
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <p className="text-xs text-gray-600 text-center mt-4">
          Only you see your chosen bot — others see bots based on their names
        </p>
      </div>
    </div>
  )
}

function QRModal({ roomCode, onClose }) {
  const joinUrl = `${window.location.origin}/?room=${roomCode}`
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xs bg-gray-900 border border-white/10 rounded-3xl p-6 animate-pop shadow-2xl text-center">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-white">Share Room</h3>
            <p className="text-gray-500 text-xs">Scan to join instantly</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <div className="bg-white rounded-2xl p-3 shadow-lg">
            <QRCode value={joinUrl} size={180} />
          </div>
        </div>

        {/* Room code display */}
        <p className="text-3xl font-black tracking-[0.2em] bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-4">
          {roomCode}
        </p>

        {/* Copy link button */}
        <button
          onClick={handleCopy}
          className={`w-full py-3 font-bold rounded-xl transition-all text-sm ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-white/5'
          }`}
        >
          {copied ? '✓ Copied!' : 'Copy invite link'}
        </button>

        <p className="text-xs text-gray-600 mt-3 break-all">{joinUrl}</p>
      </div>
    </div>
  )
}

export default function LobbyView() {
  const { state, send } = useGame()
  const { roomCode, players, phase, isHost } = state
  const isStarting = phase === 'starting'

  // Works for both players (sessionStorage) and hosts (localStorage)
  const sessionPlayerName = sessionStorage.getItem('playerName')
  const hostDisplayName = isHost && roomCode ? localStorage.getItem(`host_name_${roomCode}`) : null
  const myName = sessionPlayerName || hostDisplayName

  // My avatar seed: stored in sessionStorage, defaults to my name
  const [mySeed, setMySeed] = useState(() => {
    return sessionStorage.getItem('avatarSeed') || myName || 'Cosmo'
  })
  const [showPicker, setShowPicker] = useState(false)
  const [showQR, setShowQR] = useState(false)

  function handleSelectSeed(seed) {
    setMySeed(seed)
    sessionStorage.setItem('avatarSeed', seed)
    setShowPicker(false)
  }

  return (
    <>
      {showPicker && (
        <AvatarPickerModal
          currentSeed={mySeed}
          onSelect={handleSelectSeed}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showQR && roomCode && (
        <QRModal roomCode={roomCode} onClose={() => setShowQR(false)} />
      )}

      <div className="flex flex-col items-center min-h-[calc(100vh-64px)] px-4 py-10">
        <div className="w-full max-w-md animate-fade-in">

          {/* Room code card */}
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">Room Code</p>
            <div className="inline-block px-8 py-5 bg-gray-900 rounded-3xl border-2 border-indigo-500/40 animate-glow-pulse">
              <span className="text-6xl font-black tracking-[0.2em] bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                {roomCode}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <p className="text-gray-600 text-xs">Share this code with friends</p>
              <button
                onClick={() => setShowQR(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs font-bold rounded-lg transition-colors border border-white/5"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                  <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h3v3h-3zM20 20h1v1h-1z"/>
                </svg>
                QR Code
              </button>
            </div>
          </div>

          {/* My character */}
          {myName && (
            <div className="mb-5 flex items-center justify-center gap-4 bg-gray-900/60 border border-white/5 rounded-2xl p-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-1.5 shadow-lg shadow-indigo-500/20">
                  <BotAvatar seed={mySeed} size={52} className="w-full h-full" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow">
                  ✓
                </div>
              </div>
              <div>
                <p className="font-black text-white">{myName}</p>
                <p className="text-gray-500 text-xs">Bot: {mySeed}</p>
              </div>
              <button
                onClick={() => setShowPicker(true)}
                className="ml-auto px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-colors border border-white/5"
              >
                Change bot
              </button>
            </div>
          )}

          {/* Players list */}
          <div className="bg-gray-900/60 backdrop-blur-sm border border-white/5 rounded-3xl p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Players</h2>
              <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full">
                {players.length}
              </span>
            </div>

            {players.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2 animate-float">👀</div>
                <p className="text-gray-600 text-sm">Waiting for players...</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {players.map((p, i) => {
                  const isMe = p.name === myName
                  const seed = isMe ? mySeed : p.name
                  return (
                    <li
                      key={p.name}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl animate-slide-in ${
                        isMe ? 'bg-indigo-900/30 border border-indigo-700/30' : 'bg-gray-800/60'
                      }`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden shadow">
                        <BotAvatar seed={seed} size={36} />
                      </div>
                      <span className="font-semibold text-white">{p.name}</span>
                      {isMe && (
                        <span className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full">
                          you
                        </span>
                      )}
                      {p.is_host && (
                        <span className="ml-auto text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                          Host
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Start button (host only) */}
          {isHost && (
            isStarting ? (
              <div className="w-full py-5 text-center text-xl font-black bg-gradient-to-r from-indigo-800 to-purple-800 rounded-2xl animate-pulse text-gray-300">
                Game starting...
              </div>
            ) : (
              <button
                onClick={() => send({ type: 'start_game' })}
                disabled={players.length === 0}
                className="w-full py-5 text-xl font-black bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-400 hover:via-emerald-400 hover:to-teal-400 disabled:from-gray-700 disabled:via-gray-700 disabled:to-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-xl shadow-green-900/40 hover:shadow-green-800/60 hover:scale-[1.02] active:scale-[0.98]"
              >
                {players.length === 0 ? 'Waiting for players...' : 'Start Game'}
              </button>
            )
          )}
        </div>
      </div>
    </>
  )
}
