'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Play, RotateCw, Download } from 'lucide-react'

interface Server {
  id: string
  name: string
  status: 'online' | 'offline'
  players: number
  ram: number
}

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([
    { id: '1', name: 'DragonMC', status: 'online', players: 12, ram: 4 },
    { id: '2', name: 'WarsSMP', status: 'offline', players: 0, ram: 8 },
  ])

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')

  const createServer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setServers([...servers, {
      id: Math.random().toString(),
      name: newName,
      status: 'offline',
      players: 0,
      ram: 2,
    }])
    setNewName('')
    setShowForm(false)
  }

  const toggleStatus = (id: string) => {
    setServers(servers.map(s => s.id === id ? { ...s, status: s.status === 'online' ? 'offline' : 'online' } : s))
  }

  const deleteServer = (id: string) => {
    if (confirm('delete?')) setServers(servers.filter(s => s.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary">
      <div className="bg-secondary/50 backdrop-blur-md border-b border-purple/20">
        <div className="container py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold">🖥️ My Servers</h1>
            <Link href="/" className="text-accent hover:underline">← Back</Link>
          </div>
        </div>
      </div>

      <main className="container py-8">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 px-6 py-3 bg-gradient-to-r from-purple to-accent text-white font-bold rounded-lg hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus size={20} /> Create Server
          </button>
        )}

        {showForm && (
          <div className="bg-secondary/50 backdrop-blur-md p-6 rounded-xl border border-purple/20 mb-8">
            <form onSubmit={createServer} className="space-y-4">
              <input
                type="text"
                placeholder="Server Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 bg-primary/50 border border-purple/30 rounded-lg focus:outline-none focus:border-accent text-white"
                required
              />
              <div className="flex gap-4">
                <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple to-accent text-white font-bold rounded-lg hover:opacity-90">
                  Create
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-500/20 border border-gray-500 rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <div key={server.id} className="bg-secondary/50 backdrop-blur-md p-6 rounded-xl border border-purple/20">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{server.name}</h3>
                <span className={`px-3 py-1 rounded text-xs font-bold ${
                  server.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {server.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
              <div className="space-y-2 mb-4 text-sm text-gray-400">
                <p>👥 Players: {server.players}</p>
                <p>💾 RAM: {server.ram}GB</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => toggleStatus(server.id)} className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500 rounded"><Play size={16} /></button>
                <button className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500 rounded"><RotateCw size={16} /></button>
                <button className="p-2 bg-purple/20 hover:bg-purple/30 border border-purple rounded"><Download size={16} /></button>
                <button onClick={() => deleteServer(server.id)} className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500 rounded"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
