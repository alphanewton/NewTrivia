import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import GameSettingsModal from './GameSettingsModal'

function GearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function HostIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <nav className="flex items-center justify-between px-4 sm:px-5 h-14 sm:h-16 bg-gray-950/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
        <Link to="/" className="text-xl sm:text-2xl font-black tracking-tight select-none flex-shrink-0">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            NewTrivia
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <SignedIn>
            {/* History — text on sm+, icon-only on mobile */}
            <Link
              to="/history"
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              title="History"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">History</span>
            </Link>

            {/* Game settings gear */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
              title="Game Settings"
            >
              <GearIcon />
            </button>
          </SignedIn>

          {/* Host New Game — always visible */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:scale-[1.03] active:scale-[0.97]">
                <HostIcon />
                <span className="hidden xs:inline sm:inline">Host</span>
                <span className="hidden sm:inline"> New Game</span>
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <button
              onClick={() => navigate('/host')}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:scale-[1.03] active:scale-[0.97]"
            >
              <HostIcon />
              <span className="hidden sm:inline">Host New Game</span>
              <span className="sm:hidden">Host</span>
            </button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {showSettings && <GameSettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
