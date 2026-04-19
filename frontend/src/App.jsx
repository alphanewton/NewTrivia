import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import HostDashboard from './pages/HostDashboard'
import History from './pages/History'
import Room from './pages/Room'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans relative overflow-x-hidden">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-700/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-700/15 rounded-full blur-3xl animate-float-slow [animation-delay:2s]" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-blue-700/10 rounded-full blur-3xl animate-float [animation-delay:4s]" />
      </div>

      <Navbar />

      <div className="relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/host"
            element={
              <>
                <SignedIn><HostDashboard /></SignedIn>
                <SignedOut><Navigate to="/" replace /></SignedOut>
              </>
            }
          />
          <Route path="/history" element={<History />} />
          <Route path="/room/:roomCode" element={<Room />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
