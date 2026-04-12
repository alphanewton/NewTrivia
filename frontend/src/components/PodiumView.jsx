import { useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'

const PODIUM_CONFIGS = [
  { height: 'h-44', gradient: 'from-yellow-400 to-amber-500', text: 'text-yellow-900', label: '🥇', medal: '1st' },
  { height: 'h-32', gradient: 'from-gray-300 to-gray-400',   text: 'text-gray-700',   label: '🥈', medal: '2nd' },
  { height: 'h-24', gradient: 'from-orange-400 to-amber-600', text: 'text-orange-900', label: '🥉', medal: '3rd' },
]

// Display order: 2nd | 1st | 3rd
const DISPLAY_ORDER = [1, 0, 2]

function StatCard({ icon, label, value, sub, color = 'indigo', delay = 0 }) {
  const colorMap = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400',
    green:  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40 text-green-600 dark:text-green-400',
    amber:  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/40 text-purple-600 dark:text-purple-400',
    pink:   'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800/40 text-pink-600 dark:text-pink-400',
  }
  return (
    <div
      className={`rounded-2xl p-4 border animate-pop ${colorMap[color]}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-0.5">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

function computeStreak(responses) {
  let maxStreak = 0
  let cur = 0
  for (const r of responses) {
    if (r.correct) { cur++; maxStreak = Math.max(maxStreak, cur) }
    else cur = 0
  }
  return maxStreak
}

export default function PodiumView() {
  const navigate = useNavigate()
  const { state } = useGame()
  const { finalLeaderboard, personalStats } = state

  const playerName = sessionStorage.getItem('playerName')
  const myResult = finalLeaderboard.find(p => p.name === playerName)
  const top3 = finalLeaderboard.slice(0, 3)

  const { correct, total, responses } = personalStats
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const fastestCorrect = responses.filter(r => r.correct && r.timeMs != null)
  const fastestMs = fastestCorrect.length > 0
    ? Math.min(...fastestCorrect.map(r => r.timeMs))
    : null
  const avgTimeMs = fastestCorrect.length > 0
    ? fastestCorrect.reduce((sum, r) => sum + r.timeMs, 0) / fastestCorrect.length
    : null
  const streak = computeStreak(responses)
  const totalPointsFromSpeed = responses.filter(r => r.correct).reduce((sum, r) => sum + r.points, 0)

  const rankOrdinal = myResult
    ? (['1st', '2nd', '3rd'][myResult.rank - 1] ?? `#${myResult.rank}`)
    : null

  const rankEmoji = myResult?.rank === 1 ? '🏆' : myResult?.rank === 2 ? '🥈' : myResult?.rank === 3 ? '🥉' : '🎮'

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-64px)] px-4 py-10 max-w-xl mx-auto">

      {/* Heading */}
      <div className="text-center mb-3 animate-confetti">
        <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 dark:from-yellow-300 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
          Game Over!
        </h1>
      </div>

      {myResult && (
        <div className="text-center mb-8 animate-fade-in [animation-delay:0.1s]">
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {rankEmoji} You finished{' '}
            <span className="font-black text-gray-900 dark:text-white">{rankOrdinal}</span>
            {' '}with{' '}
            <span className="font-black text-indigo-600 dark:text-indigo-400">{myResult.score.toLocaleString()} pts</span>
          </p>
        </div>
      )}

      {/* Podium */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-2 mb-8 w-full max-w-xs animate-slide-up [animation-delay:0.2s]">
          {DISPLAY_ORDER.map(pos => {
            const entry = top3[pos]
            if (!entry) return null
            const cfg = PODIUM_CONFIGS[pos]
            return (
              <div key={entry.name} className="flex-1 flex flex-col items-center">
                <p className="text-xs font-bold truncate max-w-full px-1 mb-0.5 text-center text-gray-900 dark:text-white">
                  {entry.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{entry.score.toLocaleString()}</p>
                <div
                  className={`w-full rounded-t-2xl flex flex-col items-center justify-center font-black text-2xl shadow-xl bg-gradient-to-b ${cfg.gradient} ${cfg.text} ${cfg.height} gap-1`}
                >
                  <span>{cfg.label}</span>
                  <span className="text-base font-bold">{cfg.medal}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Personal stats grid */}
      {total > 0 && (
        <div className="w-full mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3 text-center animate-fade-in [animation-delay:0.3s]">
            Your Stats
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon="🎯" label="Accuracy" value={`${accuracy}%`} sub={`${correct}/${total} correct`} color="indigo" delay={0.35} />
            <StatCard icon="⚡" label="Best Streak" value={`${streak} in a row`} sub={streak === total && total > 0 ? '🔥 Perfect!' : undefined} color="amber" delay={0.4} />
            {fastestMs !== null && (
              <StatCard icon="🏎️" label="Fastest Answer" value={`${(fastestMs / 1000).toFixed(1)}s`} sub="from fastest correct" color="green" delay={0.45} />
            )}
            {avgTimeMs !== null && (
              <StatCard icon="⏱️" label="Avg Response" value={`${(avgTimeMs / 1000).toFixed(1)}s`} sub="per correct answer" color="purple" delay={0.5} />
            )}
            {myResult && (
              <StatCard icon="📊" label="Final Score" value={myResult.score.toLocaleString()} sub="total points" color="pink" delay={0.55} />
            )}
            {correct > 0 && (
              <StatCard
                icon="💎"
                label="Avg per Correct"
                value={`${Math.round(totalPointsFromSpeed / correct).toLocaleString()}`}
                sub="pts per correct answer"
                color="indigo"
                delay={0.6}
              />
            )}
          </div>
        </div>
      )}

      {/* Full leaderboard */}
      <div className="w-full bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden mb-6 animate-slide-up [animation-delay:0.4s] shadow-sm">
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/60 dark:to-purple-900/60 border-b border-gray-100 dark:border-white/5">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Final Standings</p>
        </div>

        {finalLeaderboard.length === 0 ? (
          <p className="text-gray-400 text-center py-8 text-sm">No scores to show</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {finalLeaderboard.map((entry, i) => {
              const isMe = entry.name === playerName
              const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
              return (
                <li
                  key={entry.name}
                  className={`flex items-center justify-between px-4 py-3 animate-slide-in transition-colors ${
                    isMe ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''
                  }`}
                  style={{ animationDelay: `${0.4 + i * 0.04}s` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base w-6 text-center">
                      {rankIcon || <span className="text-xs font-black text-gray-400 dark:text-gray-600">#{entry.rank}</span>}
                    </span>
                    <span className={`font-semibold ${isMe ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                      {entry.name}
                    </span>
                    {isMe && (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-100 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded-full">
                        you
                      </span>
                    )}
                  </div>
                  <span className="font-black text-gray-900 dark:text-white">{entry.score.toLocaleString()}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Score distribution bar */}
      {finalLeaderboard.length > 1 && (
        <div className="w-full mb-6 animate-fade-in [animation-delay:0.6s]">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">Score Distribution</p>
          <div className="space-y-2">
            {finalLeaderboard.slice(0, 5).map((entry, i) => {
              const maxScore = finalLeaderboard[0].score || 1
              const pct = Math.round((entry.score / maxScore) * 100)
              const isMe = entry.name === playerName
              return (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-4">{entry.rank}</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 w-20 truncate">{entry.name}</span>
                  <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isMe
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-500'
                      }`}
                      style={{ width: `${pct}%`, animationDelay: `${0.6 + i * 0.1}s` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-12 text-right">{entry.score.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="px-10 py-4 font-black text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-2xl transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-[0.97] animate-pop [animation-delay:0.7s]"
      >
        Play Again
      </button>
    </div>
  )
}
