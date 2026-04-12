import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUser, SignInButton, SignedOut } from '@clerk/clerk-react'

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Generated',
    desc: 'Every quiz is unique — questions crafted by Gemini AI on any topic you choose.',
    gradient: 'from-indigo-900/50 to-purple-900/50',
    border: 'border-indigo-800/40',
  },
  {
    icon: '⚡',
    title: 'Real-time Multiplayer',
    desc: 'Compete live with friends — answers sync instantly via WebSocket.',
    gradient: 'from-pink-900/50 to-rose-900/50',
    border: 'border-pink-800/40',
  },
  {
    icon: '🏆',
    title: 'Speed Scoring',
    desc: 'Faster correct answers earn more points. Be smart AND quick to top the leaderboard.',
    gradient: 'from-amber-900/50 to-yellow-900/50',
    border: 'border-amber-800/40',
  },
]

const HOW_IT_WORKS = [
  { step: '1', text: 'Host signs in and creates a quiz by picking any topic', color: 'bg-indigo-600' },
  { step: '2', text: 'Players join by entering the 6-digit room code', color: 'bg-purple-600' },
  { step: '3', text: 'Answer AI-generated questions — fastest wins more points!', color: 'bg-pink-600' },
]

export default function Home() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isSignedIn } = useUser()
  const [roomCode, setRoomCode] = useState(() => {
    const param = searchParams.get('room') || ''
    return param.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  })
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')
  const hasPrefilledRef = useRef(false)

  useEffect(() => {
    if (isSignedIn && user && !hasPrefilledRef.current) {
      const name = (user.firstName || user.username || '').slice(0, 20)
      if (name) {
        setPlayerName(prev => prev || name)
        hasPrefilledRef.current = true
      }
    }
  }, [isSignedIn, user])

  function handleJoin(e) {
    e.preventDefault()
    const code = roomCode.trim().toUpperCase()
    const name = playerName.trim()
    if (code.length !== 6) { setError('Room code must be 6 characters'); return }
    if (!name) { setError('Enter your display name'); return }
    if (name.toLowerCase() === 'host') { setError('"Host" is reserved — pick another name'); return }
    sessionStorage.setItem('playerName', name)
    navigate(`/room/${code}`)
  }

  return (
    <main className="overflow-x-hidden">

      {/* ── HERO 1: Main title ── */}
      <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 py-16 text-center">
        <div className="absolute top-10 left-6 md:left-24 text-4xl animate-float opacity-50 select-none">❓</div>
        <div className="absolute top-24 right-8 md:right-32 text-3xl animate-float-slow opacity-40 select-none" style={{animationDelay:'1s'}}>💡</div>
        <div className="absolute bottom-24 left-8 md:left-40 text-3xl animate-float opacity-30 select-none" style={{animationDelay:'2s'}}>🎯</div>
        <div className="absolute bottom-16 right-6 md:right-24 text-4xl animate-float-slow opacity-40 select-none" style={{animationDelay:'0.5s'}}>⚡</div>

        <div className="animate-pop">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-900/40 border border-indigo-700/50 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            AI-Powered Multiplayer Quiz
          </div>

          <h1 className="text-7xl sm:text-8xl font-black mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-none">
            NewTrivia
          </h1>

          <p className="text-xl sm:text-2xl text-gray-300 mb-10 max-w-lg mx-auto font-medium leading-relaxed animate-fade-in [animation-delay:0.15s]">
            Host live quiz battles powered by Google Gemini.<br/>
            <span className="text-gray-500 text-lg">Any topic. Unique every time.</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 animate-fade-in [animation-delay:0.25s]">
            {['🤖 AI Questions', '⚡ Real-time', '🏆 Leaderboards', '🎮 Multiplayer'].map(chip => (
              <span key={chip} className="px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-full text-sm font-medium text-gray-300 shadow-sm">
                {chip}
              </span>
            ))}
          </div>

          <div className="flex flex-col items-center gap-1 text-gray-600 animate-bounce-subtle">
            <span className="text-xs font-medium">Enter a room code below</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── HERO 2: Feature cards ── */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-3xl font-black text-white mb-2">Why NewTrivia?</h2>
          <p className="text-gray-500">Everything you need for an epic quiz night</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`rounded-2xl p-6 bg-gradient-to-br ${f.gradient} border ${f.border} animate-slide-up hover:scale-[1.02] transition-transform duration-200`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-black text-white text-lg mb-1">{f.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HERO 3: How it works ── */}
      <section className="px-4 py-12 max-w-3xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-2xl font-black text-white mb-1">How it works</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {HOW_IT_WORKS.map((h, i) => (
            <div key={h.step} className="flex items-start gap-3 flex-1 animate-slide-up" style={{ animationDelay: `${i * 0.12}s` }}>
              <div className={`w-8 h-8 ${h.color} rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md`}>
                {h.step}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── JOIN FORM ── */}
      <section id="join" className="px-4 py-16 max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white mb-1">Join a game</h2>
          <p className="text-gray-500 text-sm">Got a room code? Enter it below</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-3 animate-slide-up">
          <div className="relative group">
            <input
              type="text"
              placeholder="ENTER CODE"
              value={roomCode}
              onChange={(e) => {
                setError('')
                setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
              }}
              className="w-full px-4 py-5 text-3xl text-center tracking-[0.35em] font-black uppercase bg-gray-900 border-2 border-gray-700 group-hover:border-indigo-600 focus:border-indigo-500 rounded-2xl focus:outline-none text-white placeholder-gray-700 transition-colors"
              maxLength={6}
              autoComplete="off"
            />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Your display name"
              value={playerName}
              onChange={(e) => { setError(''); setPlayerName(e.target.value.slice(0, 20)) }}
              className="w-full px-4 py-4 text-lg bg-gray-900 border-2 border-gray-700 hover:border-indigo-600 focus:border-indigo-500 rounded-2xl focus:outline-none text-white placeholder-gray-600 transition-colors"
              maxLength={20}
            />
            {isSignedIn && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-400 font-medium pointer-events-none">
                from profile
              </span>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-4 text-lg font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 rounded-2xl transition-all shadow-xl shadow-indigo-900/40 hover:shadow-indigo-800/60 hover:scale-[1.02] active:scale-[0.98]"
          >
            Join Game
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm mb-3">Want to host your own game?</p>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-indigo-400 font-bold hover:underline text-sm">
                Sign in to host →
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </section>

      <div className="h-16" />
    </main>
  )
}
