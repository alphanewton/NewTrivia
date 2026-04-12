import { useState, useEffect, useCallback } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'

const TOPIC_ICONS = {
  History: '🏛️', Coding: '💻', Science: '🔬',
  Football: '⚽', Technology: '🚀', Geography: '🌍',
}

const DIFFICULTY_COLORS = {
  easy:   { bg: 'bg-green-900/30',  text: 'text-green-400' },
  medium: { bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
  hard:   { bg: 'bg-red-900/30',    text: 'text-red-400' },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDuration(startStr, endStr) {
  if (!startStr || !endStr) return null
  const diff = new Date(endStr) - new Date(startStr)
  const mins = Math.floor(diff / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

function SessionCard({ session, index }) {
  const { topic, difficulty, quantity, started_at, ended_at, is_active, player_count, final_leaderboard, room_code } = session
  const [expanded, setExpanded] = useState(false)

  const topN = (final_leaderboard || []).slice(0, 5)
  const maxScore = topN.length > 0 ? topN[0].score : 1
  const winner = topN[0]
  const duration = formatDuration(started_at, ended_at)
  const diffColors = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.medium

  const totalPlayers = final_leaderboard?.length || player_count || 0
  const avgScore = totalPlayers > 0 && final_leaderboard?.length > 0
    ? Math.round(final_leaderboard.reduce((s, e) => s + e.score, 0) / final_leaderboard.length)
    : null
  const isCloseGame = topN.length >= 2 && maxScore > 0
    ? (maxScore - topN[1].score) / maxScore < 0.1
    : false

  return (
    <div
      className="bg-gray-900/80 border border-white/5 rounded-3xl overflow-hidden shadow-sm animate-slide-up hover:border-indigo-700/40 transition-all duration-200"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Left: icon + meta */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
              {TOPIC_ICONS[topic] || '❓'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-white text-lg truncate">{topic}</h3>
                {isCloseGame && (
                  <span className="text-xs bg-orange-900/30 text-orange-400 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                    🔥 Close game!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold capitalize ${diffColors.bg} ${diffColors.text}`}>
                  {difficulty}
                </span>
                <span className="text-xs text-gray-500">{quantity} questions</span>
                <span className="text-xs text-gray-600">·</span>
                <span className="text-xs text-gray-500">{totalPlayers} {totalPlayers === 1 ? 'player' : 'players'}</span>
              </div>
            </div>
          </div>

          {/* Right: status + room code */}
          <div className="text-right flex-shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
              is_active
                ? 'bg-green-900/30 text-green-400'
                : 'bg-gray-800 text-gray-400'
            }`}>
              {is_active ? '🟢 Live' : 'Ended'}
            </span>
            <p className="text-xs text-gray-600 mt-1 font-mono">{room_code}</p>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 flex-wrap">
          {winner && (
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🏆</span>
              <div>
                <p className="text-xs text-gray-500">Winner</p>
                <p className="text-sm font-black text-white">{winner.name}</p>
              </div>
            </div>
          )}
          {winner && (
            <div>
              <p className="text-xs text-gray-500">Top Score</p>
              <p className="text-sm font-black text-indigo-400">{winner.score.toLocaleString()}</p>
            </div>
          )}
          {avgScore !== null && (
            <div>
              <p className="text-xs text-gray-500">Avg Score</p>
              <p className="text-sm font-black text-gray-300">{avgScore.toLocaleString()}</p>
            </div>
          )}
          {duration && (
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="text-sm font-black text-gray-300">{duration}</p>
            </div>
          )}
          <div className="ml-auto">
            <p className="text-xs text-gray-500">{formatDate(started_at)}</p>
          </div>
        </div>
      </div>

      {/* Leaderboard toggle */}
      {topN.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full px-5 py-2.5 flex items-center justify-between bg-gray-800/50 border-t border-white/5 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <span>Leaderboard</span>
            <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="px-5 pb-5 pt-3 space-y-3 animate-slide-down">
              {topN.map((entry, i) => {
                const pct = Math.round((entry.score / maxScore) * 100)
                const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${entry.rank}`
                return (
                  <div key={entry.name} className="flex items-center gap-3">
                    <span className="w-7 text-center text-sm">{rankIcon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-white truncate">{entry.name}</span>
                        <span className="text-sm font-black text-gray-300 ml-2 flex-shrink-0">{entry.score.toLocaleString()}</span>
                      </div>
                      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            i === 0
                              ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                              : i === 1
                              ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                              : i === 2
                              ? 'bg-gradient-to-r from-orange-400 to-amber-500'
                              : 'bg-gradient-to-r from-indigo-400 to-purple-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}

              {final_leaderboard?.length > 5 && (
                <p className="text-xs text-gray-600 text-center pt-1">
                  +{final_leaderboard.length - 5} more players
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function History() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getToken()
      const res = await fetch('/api/my-history', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setHistory(await res.json())
      } else {
        setError('Failed to load history')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const totalGames = history.length
  const totalPlayers = history.reduce((s, g) => s + (g.player_count || 0), 0)
  const totalQuestions = history.reduce((s, g) => s + (g.quantity || 0), 0)

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-black text-white mb-1">Game History</h1>
        <p className="text-gray-500 text-sm">
          All games hosted by <span className="font-semibold text-gray-300">{user?.firstName || user?.username || 'you'}</span>
        </p>
      </div>

      {/* Summary stats */}
      {!loading && totalGames > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8 animate-slide-up">
          {[
            { label: 'Games Hosted', value: totalGames, icon: '🎮' },
            { label: 'Total Players', value: totalPlayers, icon: '👥' },
            { label: 'Questions Used', value: totalQuestions, icon: '❓' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-gray-900/80 border border-white/5 rounded-2xl p-4 text-center shadow-sm animate-pop"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Refresh */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-300">
          {totalGames > 0 ? `${totalGames} session${totalGames !== 1 ? 's' : ''}` : 'Sessions'}
        </h2>
        <button
          onClick={fetchHistory}
          className="text-xs text-indigo-400 font-semibold hover:underline"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-800/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">
          <div className="text-4xl mb-3">⚠️</div>
          <p>{error}</p>
          <button onClick={fetchHistory} className="mt-3 text-sm text-indigo-400 hover:underline">
            Try again
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="text-5xl mb-4">🎮</div>
          <p className="text-gray-400 font-semibold mb-1">No games yet</p>
          <p className="text-gray-600 text-sm">Create your first quiz from the dashboard!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((session, i) => (
            <SessionCard key={session.id} session={session} index={i} />
          ))}
        </div>
      )}
    </main>
  )
}
