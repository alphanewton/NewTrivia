import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useAuth } from '@clerk/clerk-react'
import AILoadingScreen from '../components/AILoadingScreen'
import { loadGameSettings } from '../components/GameSettingsModal'

const PRESET_TOPICS = ['History', 'Coding', 'Science', 'Football', 'Technology', 'Geography']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const QUANTITIES = [10, 15, 20]

const TOPIC_ICONS = {
  History: '🏛️', Coding: '💻', Science: '🔬',
  Football: '⚽', Technology: '🚀', Geography: '🌍',
}

export default function HostDashboard() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { getToken } = useAuth()

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [formError, setFormError] = useState('')

  const [selectedTopic, setSelectedTopic] = useState('History')
  const [customTopic, setCustomTopic] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [difficulty, setDifficulty] = useState('medium')
  const [quantity, setQuantity] = useState(10)
  const [hostName, setHostName] = useState('')

  const hasPrefilledRef = useRef(false)
  useEffect(() => {
    if (user && !hasPrefilledRef.current) {
      const name = user.firstName || user.username || ''
      if (name) {
        setHostName(prev => prev || name)
        hasPrefilledRef.current = true
      }
    }
  }, [user])

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/my-history', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setHistory(await res.json())
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false)
    }
  }, [getToken])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  function pickTopic(topic) { setSelectedTopic(topic); setIsCustom(false); setFormError('') }
  function pickCustom() { setIsCustom(true); setFormError('') }

  async function handleCreate(e) {
    e.preventDefault()
    setFormError('')

    const topic = isCustom ? customTopic.trim() : selectedTopic
    const name = hostName.trim()
    if (!topic) { setFormError('Enter a custom topic'); return }
    if (!name) { setFormError('Enter your display name'); return }

    // Read game settings from localStorage (configured via Navbar gear icon)
    const { question_time, intermission_time, host_controlled } = loadGameSettings()

    setGenerating(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/create-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          topic, difficulty, quantity,
          question_time, intermission_time, host_controlled,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setFormError(err.detail || 'Failed to create quiz')
        return
      }

      const data = await res.json()
      localStorage.setItem(`host_${data.room_code}`, user.id)
      localStorage.setItem(`host_name_${data.room_code}`, name)
      navigate(`/room/${data.room_code}`)
    } catch {
      setFormError('Network error — is the backend running on port 8000?')
    } finally {
      setGenerating(false)
    }
  }

  const currentTopicForLoading = isCustom ? customTopic : selectedTopic

  return (
    <>
      {generating && <AILoadingScreen topic={currentTopicForLoading} />}

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-black text-white mb-1">Host Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Welcome back,{' '}
            <span className="font-semibold text-gray-300">{user?.firstName || user?.username || 'Host'}</span>
            <span className="text-gray-600 ml-2">· Game settings via ⚙️ in nav</span>
          </p>
        </div>

        {/* Create Quiz Card */}
        <div className="bg-gray-900 border border-white/5 rounded-3xl shadow-sm overflow-hidden mb-8 animate-slide-up">
          <div className="px-6 pt-5 pb-2 border-b border-white/5">
            <h2 className="text-lg font-black text-white">Configure Quiz</h2>
          </div>

          <form onSubmit={handleCreate} className="p-6 space-y-6">
            {/* Topic */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Topic</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_TOPICS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => pickTopic(t)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                      !isCustom && selectedTopic === t
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span>{TOPIC_ICONS[t]}</span> {t}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={pickCustom}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isCustom
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  ✏️ Other...
                </button>
              </div>
              {isCustom && (
                <input
                  type="text"
                  placeholder="e.g. Greek Mythology, 90s Music, Formula 1..."
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value.slice(0, 80))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
                  autoFocus
                  maxLength={80}
                />
              )}
            </div>

            {/* Difficulty */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Difficulty</p>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2.5 rounded-xl font-bold capitalize text-sm transition-all ${
                      difficulty === d
                        ? d === 'easy'
                          ? 'bg-green-600 text-white shadow-md shadow-green-500/25'
                          : d === 'medium'
                          ? 'bg-yellow-500 text-white shadow-md shadow-yellow-500/25'
                          : 'bg-red-600 text-white shadow-md shadow-red-500/25'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {d === 'easy' ? '😊' : d === 'medium' ? '🤔' : '🔥'} {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Number of Questions</p>
              <div className="flex gap-2">
                {QUANTITIES.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${
                      quantity === q
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Host name */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Your Display Name</p>
              <input
                type="text"
                placeholder="How others will see you in the game"
                value={hostName}
                onChange={e => setHostName(e.target.value.slice(0, 20))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
                maxLength={20}
              />
            </div>

            {formError && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={generating}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg transition-all shadow-lg shadow-green-500/20 hover:scale-[1.01] active:scale-[0.99]"
            >
              Generate &amp; Create Room
            </button>
          </form>
        </div>

        {/* History */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white">Past Games</h2>
            <button onClick={fetchHistory} className="text-xs text-indigo-400 hover:underline font-medium">
              Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <div className="text-4xl mb-3">🎮</div>
              <p>No games yet — create your first quiz above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((s, i) => (
                <div
                  key={s.id}
                  className="bg-gray-800 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-800/50 transition-colors animate-slide-up shadow-sm"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">
                      {TOPIC_ICONS[s.topic] || '❓'}
                    </div>
                    <div>
                      <span className="font-bold text-white">{s.topic}</span>
                      <p className="text-gray-500 text-xs mt-0.5">{s.quantity}q · {s.difficulty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      s.is_active
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-gray-700/50 text-gray-400'
                    }`}>
                      {s.is_active ? '🟢 Active' : 'Ended'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{s.room_code}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
