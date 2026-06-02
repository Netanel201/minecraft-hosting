'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [servers, setServers] = useState([])
  const [stats, setStats] = useState({ online: 0, offline: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.email) {
      fetchServers()
    }
  }, [session])

  const fetchServers = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/servers`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.email}`,
        },
      })
      setServers(response.data)
      
      const online = response.data.filter((s: any) => s.status === 'online').length
      setStats({
        online,
        offline: response.data.length - online,
        total: response.data.length,
      })
    } catch (error) {
      console.error('Error fetching servers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold">טוען...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary">
      {/* Navbar */}
      <nav className="bg-secondary/50 backdrop-blur-md border-b border-purple/20 sticky top-0 z-50">
        <div className="container flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold">🎮 PlayHost</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ redirect: '/auth/login' })}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500 rounded-lg transition"
            >
              התנתקות
            </button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-secondary/50 backdrop-blur-md p-6 rounded-xl border border-purple/20 hover:border-accent/50 transition">
            <div className="text-gray-400 text-sm mb-2">סה"כ שרתים</div>
            <div className="text-4xl font-bold text-accent">{stats.total}</div>
          </div>
          <div className="bg-secondary/50 backdrop-blur-md p-6 rounded-xl border border-green-500/20">
            <div className="text-gray-400 text-sm mb-2">מחוברים</div>
            <div className="text-4xl font-bold text-green-500">{stats.online}</div>
          </div>
          <div className="bg-secondary/50 backdrop-blur-md p-6 rounded-xl border border-red-500/20">
            <div className="text-gray-400 text-sm mb-2">מנותקים</div>
            <div className="text-4xl font-bold text-red-500">{stats.offline}</div>
          </div>
        </div>

        {/* Create Server Button */}
        <button
          onClick={() => router.push('/dashboard/create-server')}
          className="mb-8 px-6 py-3 bg-gradient-to-r from-purple to-accent text-white font-bold rounded-lg hover:opacity-90 transition w-full md:w-auto"
        >
          ➕ יצור שרת חדש
        </button>

        {/* Servers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server: any) => (
            <div
              key={server.id}
              className="bg-secondary/50 backdrop-blur-md p-6 rounded-xl border border-purple/20 hover:border-accent/50 transition cursor-pointer"
              onClick={() => router.push(`/dashboard/server/${server.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{server.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  server.status === 'online'
                    ? 'bg-green-500/20 text-green-400 border border-green-500'
                    : 'bg-red-500/20 text-red-400 border border-red-500'
                }`}>
                  {server.status === 'online' ? '🟢 מחובר' : '🔴 מנותק'}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{server.ip}</p>
              <div className="flex justify-between text-sm text-gray-400">
                <span>🎮 {server.players}/20</span>
                <span>💾 {server.ram}GB</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
