import { useState, useEffect } from 'react'

const QUESTION_TIMES = [10, 15, 20, 30, 45, 60]
const INTERMISSION_TIMES = [3, 5, 8, 10]

const DEFAULTS = { question_time: 20, intermission_time: 5, host_controlled: false }

export function loadGameSettings() {
  try {
    const saved = localStorage.getItem('gameSettings')
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

function saveGameSettings(settings) {
  localStorage.setItem('gameSettings', JSON.stringify(settings))
}

export default function GameSettingsModal({ onClose }) {
  const [settings, setSettings] = useState(loadGameSettings)

  function update(key, value) {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      saveGameSettings(next)
      return next
    })
  }

  const estimatedMins = Math.round(
    (10 * (settings.question_time + settings.intermission_time)) / 60
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl shadow-2xl p-6 animate-pop">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Game Settings</h2>
            <p className="text-gray-500 text-xs mt-0.5">Applied to your next quiz session</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Question time */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Time Per Question
              </p>
              <span className="text-2xl font-black text-indigo-400">{settings.question_time}s</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {QUESTION_TIMES.map(t => (
                <button
                  key={t}
                  onClick={() => update('question_time', t)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                    settings.question_time === t
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          {/* Intermission time */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Between Questions
              </p>
              <p className="text-xs text-gray-600 mt-0.5">Rankings shown for this duration</p>
              <span className="text-2xl font-black text-purple-400">{settings.intermission_time}s</span>
            </div>
            <div className="flex gap-2">
              {INTERMISSION_TIMES.map(t => (
                <button
                  key={t}
                  onClick={() => update('intermission_time', t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                    settings.intermission_time === t
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          {/* Host controlled */}
          <div className="flex items-center justify-between bg-gray-800/60 border border-white/5 rounded-2xl p-4">
            <div>
              <p className="font-bold text-white text-sm">Host-Controlled Pacing</p>
              <p className="text-gray-400 text-xs mt-0.5">
                You manually advance each question with a button
              </p>
            </div>
            <button
              onClick={() => update('host_controlled', !settings.host_controlled)}
              className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ml-3 ${
                settings.host_controlled ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  settings.host_controlled ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Summary */}
          <div className="bg-indigo-900/20 border border-indigo-800/40 rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Session Preview
            </p>
            <div className="grid grid-cols-3 gap-3 text-sm text-center">
              <div>
                <p className="text-gray-400 text-xs">Per Question</p>
                <p className="font-black text-white">{settings.question_time}s</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Intermission</p>
                <p className="font-black text-white">
                  {settings.host_controlled ? 'Manual' : `${settings.intermission_time}s`}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Est. 10 Qs</p>
                <p className="font-black text-white">
                  {settings.host_controlled ? 'Flex' : `~${estimatedMins}m`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-colors shadow-lg"
        >
          Save &amp; Close
        </button>
      </div>
    </div>
  )
}
