import { useState, useEffect, useMemo, useRef } from 'react'
import { createAvatar } from '@dicebear/core'
import { bottts } from '@dicebear/collection'

function getAvatarUri(seed) {
  return createAvatar(bottts, { seed, size: 60 }).toDataUri()
}

// Animated score counter
function ScoreCounter({ from, to, duration = 1600 }) {
  const [display, setDisplay] = useState(from)

  useEffect(() => {
    if (from === to) return
    const start = performance.now()
    const diff = to - from

    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + diff * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [from, to, duration])

  return <span>{display.toLocaleString()}</span>
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-3xl drop-shadow-lg">🥇</span>
  if (rank === 2) return <span className="text-2xl">🥈</span>
  if (rank === 3) return <span className="text-2xl">🥉</span>
  return (
    <span className="w-8 h-8 rounded-xl bg-gray-700 flex items-center justify-center text-sm font-black text-gray-300">
      {rank}
    </span>
  )
}

function RankChangeChip({ change }) {
  if (change === 0 || change == null) return (
    <span className="text-xs font-bold text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">—</span>
  )
  if (change > 0) return (
    <span className="text-xs font-black text-green-400 bg-green-900/30 border border-green-700/30 px-2 py-0.5 rounded-full animate-bounce-subtle">
      ↑{change}
    </span>
  )
  return (
    <span className="text-xs font-black text-red-400 bg-red-900/20 border border-red-800/30 px-2 py-0.5 rounded-full">
      ↓{Math.abs(change)}
    </span>
  )
}

// Countdown timer showing seconds remaining before next question
function CountdownBar({ totalSeconds, startTime }) {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    if (!totalSeconds || !startTime) return
    const update = () => {
      const elapsed = (Date.now() - startTime) / 1000
      setRemaining(Math.max(0, totalSeconds - elapsed))
    }
    update()
    const id = setInterval(update, 100)
    return () => clearInterval(id)
  }, [totalSeconds, startTime])

  const pct = totalSeconds > 0 ? remaining / totalSeconds : 0

  return (
    <div className="w-full mt-6 animate-fade-in">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
        <span className="uppercase tracking-widest font-bold">Next question in</span>
        <span className="font-black text-gray-400">{Math.ceil(remaining)}s</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
          style={{ width: `${pct * 100}%`, transition: 'width 0.1s linear' }}
        />
      </div>
    </div>
  )
}

export default function RankRevealView({ leaderboard, previousLeaderboard, playerName, playerAvatarSeed, lastPoints, lastCorrect, intermissionTime, intermissionStartTime }) {
  const [introComplete, setIntroComplete] = useState(false)
  const [revealedCount, setRevealedCount] = useState(0)
  const [showOvertake, setShowOvertake] = useState(false)
  const [firstPlaceFlash, setFirstPlaceFlash] = useState(false)

  const total = leaderboard.length
  // Reveal top-to-bottom: first place shown first
  const revealOrder = leaderboard

  const prevLeader = previousLeaderboard?.[0]?.name
  const newLeader = leaderboard[0]?.name
  const leaderChanged = prevLeader && prevLeader !== newLeader

  const rankChanges = useMemo(() => {
    const map = {}
    if (!previousLeaderboard?.length) return map
    const prevMap = {}
    previousLeaderboard.forEach(p => { prevMap[p.name] = p.rank })
    leaderboard.forEach(p => {
      const prev = prevMap[p.name]
      map[p.name] = prev != null ? prev - p.rank : null
    })
    return map
  }, [leaderboard, previousLeaderboard])

  const prevScores = useMemo(() => {
    const map = {}
    previousLeaderboard?.forEach(p => { map[p.name] = p.score })
    return map
  }, [previousLeaderboard])

  // Brief intro pause before cards start appearing
  useEffect(() => {
    const t = setTimeout(() => setIntroComplete(true), 400)
    return () => clearTimeout(t)
  }, [])

  // Staggered reveal: first place gets extra pause at the top
  useEffect(() => {
    if (!introComplete || revealedCount >= total) return
    const nextEntry = revealOrder[revealedCount]
    const isFirstPlace = nextEntry?.rank === 1
    const delay = isFirstPlace ? 1200 : 700
    const t = setTimeout(() => setRevealedCount(c => c + 1), delay)
    return () => clearTimeout(t)
  }, [revealedCount, total, introComplete, revealOrder])

  // Gold flash on first-place reveal (index 0 = first place)
  useEffect(() => {
    if (revealedCount === 1) {
      const t = setTimeout(() => setFirstPlaceFlash(true), 100)
      return () => clearTimeout(t)
    }
  }, [revealedCount])

  // Show overtake banner after last entry reveals
  useEffect(() => {
    if (revealedCount >= total && leaderChanged) {
      const t = setTimeout(() => setShowOvertake(true), 400)
      return () => clearTimeout(t)
    }
  }, [revealedCount, total, leaderChanged])

  const myEntry = playerName ? leaderboard.find(e => e.name === playerName) : null

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-8 overflow-hidden">

      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-20 animate-float"
            style={{
              background: ['#818cf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'][i % 5],
              left: `${8 + i * 9}%`,
              top: `${15 + (i % 4) * 20}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${4 + i * 0.6}s`,
            }}
          />
        ))}
      </div>

      {/* Gold flash overlay on first-place reveal */}
      {firstPlaceFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-10"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.18) 0%, transparent 70%)',
            animation: 'fadeOut 1.5s ease-out forwards',
          }}
        />
      )}

      {/* Header */}
      <div className="text-center mb-6 animate-pop">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-1">Round Results</p>
        <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          RANKINGS
        </h2>
        {!introComplete && (
          <p className="text-gray-600 text-xs mt-3 animate-pulse">Calculating results...</p>
        )}
      </div>

      {/* Your round result — shown after player's card revealed */}
      {myEntry && revealedCount > leaderboard.indexOf(myEntry) && (
        <div className={`w-full max-w-md mb-4 px-4 py-3 rounded-2xl flex items-center justify-between animate-pop ${
          lastCorrect
            ? 'bg-green-900/25 border border-green-700/40'
            : 'bg-gray-800/60 border border-white/5'
        }`}>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Your result</p>
            <p className={`font-black text-base ${lastCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {lastCorrect ? `+${lastPoints?.toLocaleString() ?? 0} pts` : 'No points'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Your rank</p>
            <p className="font-black text-white text-base">#{myEntry.rank}</p>
          </div>
        </div>
      )}

      {/* NEW LEADER banner */}
      {showOvertake && (
        <div className="mb-5 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl shadow-xl shadow-yellow-500/30 animate-confetti text-center">
          <p className="text-yellow-900 font-black text-lg">👑 NEW LEADER! 👑</p>
          <p className="text-yellow-800 font-bold text-sm">{newLeader} takes the top spot!</p>
        </div>
      )}

      {/* Cards revealed top → bottom (first place first) */}
      <div className="w-full max-w-md space-y-3">
        {revealOrder.map((entry, revealIdx) => {
          const visible = revealIdx < revealedCount
          const isFirstPlace = entry.rank === 1
          const isMe = entry.name === playerName
          const rankChange = rankChanges[entry.name]
          const oldScore = prevScores[entry.name] ?? entry.score
          const seed = isMe && playerAvatarSeed ? playerAvatarSeed : entry.name
          const pointsThisRound = isMe && lastPoints != null ? lastPoints : (entry.score - (prevScores[entry.name] ?? entry.score))

          if (!visible) return (
            <div
              key={entry.name}
              className="h-[68px] rounded-2xl bg-gray-900/20 border border-dashed border-white/5 animate-pulse"
            />
          )

          return (
            <div
              key={entry.name}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all animate-slide-in-right ${
                isFirstPlace
                  ? 'bg-gradient-to-r from-yellow-900/50 to-amber-900/40 border-yellow-500/40 shadow-xl shadow-yellow-500/15 scale-[1.02]'
                  : isMe
                  ? 'bg-indigo-900/30 border-indigo-500/50 shadow-lg shadow-indigo-500/15 ring-1 ring-indigo-500/30'
                  : 'bg-gray-900/70 border-white/5'
              }`}
              style={{ animationDelay: '0s' }}
            >
              {/* Rank badge */}
              <div className="flex-shrink-0 flex items-center justify-center w-9">
                <RankBadge rank={entry.rank} />
              </div>

              {/* Avatar */}
              <div className={`w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 ${
                isFirstPlace ? 'ring-2 ring-yellow-400/60 shadow-lg shadow-yellow-500/20' :
                isMe ? 'ring-2 ring-indigo-400/60' : 'bg-gray-800'
              }`}>
                <img
                  src={getAvatarUri(seed)}
                  alt={entry.name}
                  width={44}
                  height={44}
                  className="w-full h-full"
                />
              </div>

              {/* Name + you badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-black truncate text-base ${isFirstPlace ? 'text-yellow-300' : isMe ? 'text-indigo-300' : 'text-white'}`}>
                    {entry.name}
                  </span>
                  {isMe && (
                    <span className="text-xs text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                      you
                    </span>
                  )}
                  {isFirstPlace && !leaderChanged && (
                    <span className="text-base">👑</span>
                  )}
                </div>
                {/* Points earned this round for current player */}
                {isMe && pointsThisRound > 0 && (
                  <p className="text-xs text-green-400 font-bold mt-0.5">+{pointsThisRound.toLocaleString()} this round</p>
                )}
              </div>

              {/* Rank change */}
              <div className="flex-shrink-0">
                <RankChangeChip change={rankChange} />
              </div>

              {/* Score */}
              <div className={`text-right flex-shrink-0 font-black text-xl ${
                isFirstPlace ? 'text-yellow-300' : isMe ? 'text-indigo-300' : 'text-white'
              }`}>
                <ScoreCounter from={oldScore} to={entry.score} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Player's own rank if not in top 5 */}
      {playerName && !leaderboard.find(e => e.name === playerName) && (
        <div className="mt-4 text-center text-gray-500 text-sm animate-fade-in">
          You are not in the top {total} — keep going!
        </div>
      )}

      {/* Countdown to next question (auto pacing only) */}
      {intermissionTime && intermissionStartTime && revealedCount >= total && (
        <div className="w-full max-w-md">
          <CountdownBar totalSeconds={intermissionTime} startTime={intermissionStartTime} />
        </div>
      )}
    </div>
  )
}
