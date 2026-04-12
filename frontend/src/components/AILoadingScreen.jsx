import { useState, useEffect } from 'react'

const MESSAGES = [
  { text: 'Consulting the AI oracle...', emoji: '🔮' },
  { text: 'Crafting mind-bending questions...', emoji: '🧠' },
  { text: 'Mixing facts with challenge...', emoji: '🧪' },
  { text: 'Generating unique trivia...', emoji: '✨' },
  { text: 'Building your perfect quiz...', emoji: '🏗️' },
  { text: 'Adding twists and surprises...', emoji: '🎲' },
  { text: 'Powering up the question engine...', emoji: '⚡' },
  { text: 'Almost there — polishing answers...', emoji: '💎' },
]

export default function AILoadingScreen({ topic }) {
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const msgId = setInterval(() => {
      setMsgIdx(i => (i + 1) % MESSAGES.length)
    }, 2200)
    return () => clearInterval(msgId)
  }, [])

  const msg = MESSAGES[msgIdx]

  return (
    <div className="fixed inset-0 bg-slate-50/95 dark:bg-gray-950/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center px-4">
      {/* Spinning rings */}
      <div className="relative w-44 h-44 mb-10">
        {/* Outermost pulse ring */}
        <div className="absolute inset-0 rounded-full border-2 border-indigo-300/40 dark:border-indigo-500/20 animate-pulse-ring" />
        <div className="absolute inset-0 rounded-full border-2 border-purple-300/30 dark:border-purple-500/15 animate-pulse-ring [animation-delay:0.5s]" />

        {/* Rotating rings */}
        <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-indigo-500 border-r-indigo-400/50 animate-spin" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-7 rounded-full border-4 border-transparent border-t-purple-500 border-l-purple-400/50 animate-spin-reverse" />
        <div className="absolute inset-11 rounded-full border-4 border-transparent border-b-pink-500 border-r-pink-400/50 animate-spin" style={{ animationDuration: '3s' }} />

        {/* Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            key={msgIdx}
            className="text-5xl animate-pop"
          >
            {msg.emoji}
          </span>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1 text-center">
        Generating Quiz
      </h2>
      {topic && (
        <p className="text-indigo-600 dark:text-indigo-400 font-bold text-lg mb-6 text-center">
          {topic}
        </p>
      )}

      {/* Rotating message */}
      <div className="h-8 flex items-center justify-center mb-8">
        <p
          key={msgIdx}
          className="text-gray-500 dark:text-gray-400 text-base animate-fade-in text-center"
        >
          {msg.text}
        </p>
      </div>

      {/* Bouncing dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>

      {/* Progress bar shimmer */}
      <div className="mt-10 w-64 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full w-full rounded-full animate-shimmer bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-[length:200%_100%]" />
      </div>

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-600 text-center max-w-xs">
        AI is crafting unique questions — this may take up to a minute
      </p>
    </div>
  )
}
