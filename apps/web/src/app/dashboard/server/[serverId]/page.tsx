'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { Play, Square, RotateCw, Trash2, Download, Upload } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface Server {
  id: string
  name: string
  status: string
  ip: string
  port: number
  subdomain: string
  ram: number
  players: number
  maxPlayers: number
}

export default function ServerDetails() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [server, setServer] = useState<Server | null>(null)
  const [loading, setLoading] = useState(true)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [command, setCommand] = useState('')
  const [autoBackup, setAutoBackup] = useState(false)

  useEffect(() => {
    fetchServer()
    
    // Connect to WebSocket
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL!)
    setSocket(newSocket)

    newSocket.on('server:log', (data) => {
      setConsoleLogs(prev => [...prev, data.message])
    })

    newSocket.on('server:status', (data) => {
      setServer(prev => prev ? { ...prev, status: data.status, players: data.players } : null)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const fetchServer = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/servers/${params.serverId}`,
        {
          headers: { 'Authorization': `Bearer ${session?.user?.email}` },
        }
      )
      setServer(response.data)
    } catch (error) {
      console.error('Error fetching server:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/servers/${params.serverId}/start`,
        {},
        { headers: { 'Authorization': `Bearer ${session?.user?.email}` } }
      )
      setServer(prev => prev ? { ...prev, status: 'online' } : null)
    } catch (error) {
      console.error('Error starting server:', error)
    }
  }

  const handleStop = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/servers/${params.serverId}/stop`,
        {},
        { headers: { 'Authorization': `Bearer ${session?.user?.email}` } }
      )
      setServer(prev => prev ? { ...prev, status: 'offline' } : null)
    } catch (error) {
      console.error('Error stopping server:', error)
    }
  }

  const handleRestart = async () => {
    await handleStop()
    setTimeout(handleStart, 2000)
  }

  const handleBackup = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/servers/${params.serverId}/backup`,
        {},
        { headers: { 'Authorization': `Bearer ${session?.user?.email}` } }
      )
      alert('✅ גיבוי נוצר בהצלחה!')
    } catch (error) {
      console.error('Error creating backup:', error)
    }
  }

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim()) return

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/servers/${params.serverId}/command`,
        { command },
        { headers: { 'Authorization': `Bearer ${session?.user?.email}` } }
      )
      setCommand('')
    } catch (error) {
      console.error('Error sending command:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('🚨 האם אתה בטוח שברצונך למחוק את השרת? פעולה זו לא ניתנת לביטול!')) {
      return
    }

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/servers/${params.serverId}`,
        { headers: { 'Authorization': `Bearer ${session?.user?.email}` } }
      )
      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting server:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold">טוען...</div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold">השרת לא נמצא</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary pb-20">
      {/* Header */}
      <div className="bg-secondary/50 backdrop-blur-md border-b border-purple/20 sticky top-0 z-50">
        <div className="container py-6">
          <button
            onClick={() => router.back()}
            className="text-accent hover:underline mb-4"
          >
            ← חזור
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold">{server.name}</h1>
              <p className="text-gray-400 mt-2">{server.subdomain}.play-host.net:{server.port}</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-bold ${
              server.status === 'online'
                ? 'bg-green-500/20 text-green-400 border border-green-500'
                : 'bg-red-500/20 text-red-400 border border-red-500'
            }`}>
              {server.status === 'online' ? '🟢 מחובר' : '🔴 מנותק'}
            </span>
          </div>
        </div>
      </div>

      <main className="container py-8">
        {/* Control Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={handleStart}
            disabled={server.status === 'online'}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500 rounded-lg disabled:opacity-50 transition"
          >
            <Play size={20} /> הפעל
          </button>
          <button
            onClick={handleStop}
            disabled={server.status === 'offline'}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500 rounded-lg disabled:opacity-50 transition"
          >
            <Square size={20} /> עצור
          </button>
          <button
            onClick={handleRestart}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500 rounded-lg transition"
          >
            <RotateCw size={20} /> הפעל מחדש
          </button>
          <button
            onClick={handleBackup}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple/20 hover:bg-purple/30 border border-purple rounded-lg transition"
          >
            <Download size={20} /> גיבוי
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Server Stats */}
            <div className="bg-secondary/50 backdrop-blur-md p-6 rounded-xl border border-purple/20">
              <h2 className="text-2xl font-bold mb-6">📊 סטטיסטיקות</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/50 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">שחקנים</p>
                  <p className="text-2xl font-bold text-accent">{server.players}/{server.maxPlayers}</p>
                </div>
                <div className="bg-primary/50 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">RAM</p>
                  <p className="text-2xl font-bold text-accent">{server.ram}GB</p>
                </div>
                <div className="bg-primary/50 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">פורט</p>
                  <p className="text-2xl font-bold text-accent">{server.port}</p>
                </div>
                <div className="bg-primary/50 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">סטטוס</p>
                  <p className="text-2xl font-bold text-accent">{'עוד מעט'}</p>
                </div>
              </div>
            </div>

            {/* Console */}
            <div className="bg-secondary/50 backdrop-blur-md p-6 rounded-xl border border-purple/20">
              <h2 className="text-2xl font-bold mb-4">⌨️ קונסול חי</h2>
              <div className="bg-primary/50 border border-purple/20 rounded-lg p-4 h-64 overflow-y-auto mb-4 font-mono text-sm">
                {consoleLogs.length === 0 ? (
                  <p className="text-gray-500">אין לוגים עדיין...</p>
                ) : (
                  consoleLogs.map((log, i) => (
                    <p key={i} className="text-gray-300">{log}</p>
                  ))
                )}
              </div>
              <form onSubmit={handleCommand} className="flex gap-2">
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="הזן פקודה..."
                  className="flex-1 px-4 py-2 bg-primary/50 border border-purple/30 rounded-lg focus:outline-none focus:border-accent text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-primary font-bold rounded-lg hover:opacity-90 transition"
                >
                  שלח
                </button>
              </form>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Server Info */}
            <div className="bg-secondary/50 backdrop-blur-md p-6 rounded-xl border border-purple/20">
              <h2 className="text-xl font-bold mb-4">🖥️ פרטי השרת</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400">כתובת IP</p>
                  <p className="text-accent font-mono">{server.ip}:{server.port}</p>
                </div>
                <div>
                  <p className="text-gray-400">Subdomain</p>
                  <p className="text-accent font-mono">{server.subdomain}.play-host.net</p>
                </div>
                <div>
                  <p className="text-gray-400">זיכרון RAM</p>
                  <p className="text-accent">{server.ram} GB</p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/10 backdrop-blur-md p-6 rounded-xl border border-red-500/20">
              <h2 className="text-xl font-bold mb-4 text-red-400">🚨 אזור סכנה</h2>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-400 font-bold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Trash2 size={20} /> מחק שרת
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
