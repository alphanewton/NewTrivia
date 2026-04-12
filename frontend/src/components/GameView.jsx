import { useState, useEffect, useRef } from 'react'
import { useGame } from '../contexts/GameContext'
import RankRevealView from './RankRevealView'

const OPTION_CONFIGS = [
  { gradient: 'from-red-500 to-rose-600',      shadow: 'shadow-red-500/30',    hoverShadow: 'hover:shadow-red-500/50',    letter: 'A' },
  { gradient: 'from-blue-500 to-indigo-600',   shadow: 'shadow-blue-500/30',   hoverShadow: 'hover:shadow-blue-500/50',   letter: 'B' },
  { gradient: 'from-amber-400 to-yellow-500',  shadow: 'shadow-amber-500/30',  hoverShadow: 'hover:shadow-amber-500/50',  letter: 'C', dark: true },
  { gradient: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/30',  hoverShadow: 'hover:shadow-green-500/50',  letter: 'D' },
]

function CircularTimer({ timeLimit, active }) {
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const startRef = useRef(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    setTimeLeft(timeLimit)
    if (!active) return undefined

    const id = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const remaining = Math.max(0, timeLimit - elapsed)
      setTimeLeft(Math.ceil(remaining))
      if (remaining <= 0) clearInterval(id)
    }, 100)

    return () => clearInterval(id)
  }, [timeLimit, active])

  const radius = 44
  const circumference = 2 * Math.PI * radius
  const pct = active ? timeLeft / timeLimit : 1
  const offset = circumference * (1 - pct)
  const strokeColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#eab308' : '#ef4444'
  const textColor = pct > 0.5 ? 'text-green-400' : pct > 0.25 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease' }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-3xl font-black ${textColor}`}>
        {active ? timeLeft : ''}
      </span>
    </div>
  )
}

// Shown instead of the timer when host controls pacing
function HostPaceIndicator() {
  return (
    <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
      <div className="w-20 h-20 rounded-full border-2 border-purple-500/40 bg-purple-900/20 flex flex-col items-center justify-center gap-0.5">
        <span className="text-2xl">👑</span>
        <span className="text-purple-400 text-[9px] font-bold uppercase tracking-wide leading-none text-center">Host<br/>paced</span>
      </div>
    </div>
  )
}

export default function GameView() {
  const { state, send } = useGame()
  const {
    phase, isHost, hostControlled, roomCode,
    questionNum, totalQuestions,
    questionText, options, timeLimit,
    hasAnswered, lastCorrect, lastPoints,
    correctAnswerId, correctAnswerIdOnAnswer,
    explanation, leaderboard, previousLeaderboard, isLastQuestion,
  } = state

  // Works for both players (sessionStorage) and hosts (localStorage)
  const playerName = sessionStorage.getItem('playerName') ||
    (isHost && roomCode ? localStorage.getItem(`host_name_${roomCode}`) : null)
  const playerAvatarSeed = sessionStorage.getItem('avatarSeed') || playerName
  const [selectedIdx, setSelectedIdx] = useState(null)

  // Intermission sub-phase: 'answer' → 'ranks'
  const [intermissionSubPhase, setIntermissionSubPhase] = useState('answer')
  const subPhaseTimerRef = useRef(null)

  useEffect(() => {
    if (phase === 'question') {
      setSelectedIdx(null)
      setIntermissionSubPhase('answer')
    }
    if (phase === 'intermission') {
      setIntermissionSubPhase('answer')
      // In host-controlled mode, don't auto-advance to ranks — host decides
      if (!hostControlled) {
        subPhaseTimerRef.current = setTimeout(() => {
          setIntermissionSubPhase('ranks')
        }, 2800)
      }
    }
    return () => clearTimeout(subPhaseTimerRef.current)
  }, [phase, questionNum, hostControlled])

  function handleAnswer(idx) {
    if (hasAnswered || phase !== 'question') return
    setSelectedIdx(idx)
    send({ type: 'submit_answer', answer_id: idx })
  }

  // Host advance: during question → ends question; during intermission → next question
  function handleHostAdvance() {
    if (phase === 'question') {
      send({ type: 'advance_game' })
    } else if (phase === 'intermission') {
      if (intermissionSubPhase === 'answer') {
        // Skip answer reveal, jump to ranks
        clearTimeout(subPhaseTimerRef.current)
        setIntermissionSubPhase('ranks')
      } else {
        // Already showing ranks → advance to next question
        send({ type: 'advance_game' })
      }
    }
  }

  function optionClass(idx) {
    const cfg = OPTION_CONFIGS[idx]
    const base = `w-full py-5 px-4 text-left font-black text-base rounded-2xl transition-all duration-200 shadow-lg flex items-center gap-3 `

    if (phase === 'intermission') {
      if (idx === correctAnswerId) {
        return base + `bg-gradient-to-r ${cfg.gradient} ring-4 ring-white/40 shadow-xl cursor-default scale-[1.02] ${cfg.dark ? 'text-gray-900' : 'text-white'}`
      }
      if (idx === selectedIdx && idx !== correctAnswerId) {
        return base + `bg-gray-800 opacity-60 cursor-default text-gray-400 ring-2 ring-red-500/30`
      }
      return base + 'bg-gray-800/50 opacity-30 cursor-default text-gray-400'
    }

    if (hasAnswered) {
      if (idx === selectedIdx) {
        return lastCorrect
          ? base + `bg-gradient-to-r ${cfg.gradient} ${cfg.dark ? 'text-gray-900' : 'text-white'} ring-4 ring-green-400/60 shadow-xl scale-[1.01]`
          : base + `bg-gradient-to-r from-red-600 to-red-700 text-white ring-4 ring-red-400/50 shadow-xl animate-wrong-shake`
      }
      if (correctAnswerIdOnAnswer !== null && idx === correctAnswerIdOnAnswer && !lastCorrect) {
        return base + `bg-gradient-to-r ${cfg.gradient} ${cfg.dark ? 'text-gray-900' : 'text-white'} ring-4 ring-green-400/40 opacity-90 cursor-default`
      }
      return base + `bg-gray-800/50 opacity-25 cursor-default text-gray-500`
    }

    return (
      base +
      `bg-gradient-to-r ${cfg.gradient} ${cfg.shadow} ${cfg.dark ? 'text-gray-900' : 'text-white'} ` +
      `hover:scale-[1.02] hover:shadow-xl ${cfg.hoverShadow} active:scale-[0.98] cursor-pointer`
    )
  }

  // Rank reveal screen takes over during intermission
  if (phase === 'intermission' && intermissionSubPhase === 'ranks') {
    return (
      <div className="relative">
        <RankRevealView
          leaderboard={leaderboard}
          previousLeaderboard={previousLeaderboard}
          playerName={playerName}
          playerAvatarSeed={playerAvatarSeed}
        />
        {/* Host advance button — only when host controls pacing */}
        {isHost && hostControlled && (
          <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30">
            <button
              onClick={handleHostAdvance}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-2xl shadow-2xl shadow-indigo-500/40 hover:scale-[1.03] active:scale-[0.97] transition-all border border-indigo-400/20 text-sm"
            >
              {isLastQuestion ? 'Show Final Results →' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] px-4 py-5 max-w-xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Question</span>
          <span className="text-sm font-black text-white bg-gray-800 px-2.5 py-1 rounded-lg">
            {questionNum}
            <span className="text-gray-500 font-normal"> / {totalQuestions}</span>
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < questionNum - 1
                  ? 'w-4 bg-indigo-500'
                  : i === questionNum - 1
                  ? 'w-4 bg-purple-500 animate-pulse'
                  : 'w-1.5 bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Timer + question */}
      <div className="flex items-start gap-4 mb-5 animate-fade-in">
        {hostControlled
          ? <HostPaceIndicator />
          : <CircularTimer timeLimit={timeLimit} active={phase === 'question' && !hasAnswered} />
        }
        <div className="flex-1 bg-gray-900/80 border border-white/5 rounded-2xl p-4 min-h-[80px] flex items-center shadow-sm">
          <p className="text-lg sm:text-xl font-bold leading-snug text-white">{questionText}</p>
        </div>
      </div>

      {/* Answer feedback banner */}
      {hasAnswered && phase === 'question' && (
        <div className="mb-4 rounded-2xl overflow-hidden animate-pop">
          {lastCorrect ? (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-4 flex items-center gap-3">
              <span className="text-3xl animate-confetti">✅</span>
              <div>
                <p className="font-black text-lg">Correct!</p>
                <p className="text-green-100 text-sm">+{lastPoints.toLocaleString()} points</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-green-100 text-xs">Speed</p>
                <p className="font-black">{lastPoints >= 900 ? '🔥 Fast!' : lastPoints >= 700 ? '⚡ Good' : '👍 OK'}</p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-5 py-4 flex items-center gap-3">
              <span className="text-3xl animate-wrong-shake">❌</span>
              <div>
                <p className="font-black text-lg">Wrong!</p>
                <p className="text-red-100 text-sm">
                  {correctAnswerIdOnAnswer !== null
                    ? `Correct: ${OPTION_CONFIGS[correctAnswerIdOnAnswer]?.letter}`
                    : 'Better luck next time'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Answer options */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        {options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(idx)}
            disabled={hasAnswered || phase === 'intermission'}
            className={`${optionClass(idx)} animate-pop`}
            style={{ animationDelay: `${idx * 0.07}s` }}
          >
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-black/20 text-sm font-black flex-shrink-0 ${OPTION_CONFIGS[idx].dark ? 'text-gray-900/70' : 'text-white'}`}>
              {OPTION_CONFIGS[idx].letter}
            </span>
            <span>{opt}</span>
          </button>
        ))}
      </div>

      {/* Intermission answer-reveal panel (sub-phase: 'answer') */}
      {phase === 'intermission' && intermissionSubPhase === 'answer' && (
        <div className="bg-gray-900/80 border border-white/5 rounded-2xl p-5 space-y-4 animate-slide-up shadow-sm">
          {explanation && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1.5">Explanation</p>
              <p className="text-gray-200 text-sm leading-relaxed">{explanation}</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-gray-500 text-xs animate-pulse">
              {hostControlled ? 'Waiting for host...' : 'Standings coming up...'}
            </p>
          </div>
        </div>
      )}

      {/* Hint text */}
      {!hasAnswered && phase === 'question' && (
        <p className="text-center text-gray-600 text-xs mt-2">
          Tap an answer{hostControlled ? '' : ' — faster = more points!'}
        </p>
      )}
      {hasAnswered && phase === 'question' && (
        <p className="text-center text-gray-500 text-xs mt-2 animate-pulse">
          {hostControlled ? 'Waiting for host to advance...' : 'Waiting for others...'}
        </p>
      )}

      {/* Host advance button (question phase) — only when hostControlled */}
      {isHost && hostControlled && phase === 'question' && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30">
          <button
            onClick={handleHostAdvance}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            End Question →
          </button>
        </div>
      )}

      {/* Host advance button (answer-reveal sub-phase) — only when hostControlled */}
      {isHost && hostControlled && phase === 'intermission' && intermissionSubPhase === 'answer' && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30">
          <button
            onClick={handleHostAdvance}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            Show Rankings →
          </button>
        </div>
      )}
    </div>
  )
}
