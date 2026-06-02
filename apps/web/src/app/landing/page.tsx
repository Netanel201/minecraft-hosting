"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'

interface ServerStats {
  total: number
  online: number
  offline: number
  totalPlayers: number
}

export default function Home() {
  const [stats, setStats] = useState<ServerStats>({
    total: 0,
    online: 0,
    offline: 0,
    totalPlayers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/stats`)
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary">
      {/* Navbar */}
      <nav className="bg-secondary/50 backdrop-blur-md border-b border-purple/20">
        <div className="container flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold">🎮 PlayHost</h1>
          <div className="flex gap-4">
            <a href="/auth/login" className="px-4 py-2 hover:text-accent transition">כניסה</a>
            <a href="/auth/register" className="px-4 py-2 bg-gradient-to-r from-purple to-accent text-white rounded-lg hover:opacity-90 transition">הרשמה</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 text-center">
        <h1 className="text-6xl font-bold mb-6 animate-fade-in">🎮 PlayHost</h1>
        <p className="text-2xl text-gray-300 mb-8">אחסון Minecraft מקצועי וחינמי</p>
        <p className="text-gray-400 mb-12 max-w-2xl mx-auto">הפעל שרתי Minecraft מדהימים בלחיצה אחת. ללא עלויות חבויות, ללא מגבלות מאכזבות.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/auth/register" className="px-8 py-4 bg-gradient-to-r from-purple to-accent text-white font-bold rounded-lg hover:opacity-90 transition">התחל עכשיו 🚀</a>
          <a href="#features" className="px-8 py-4 border border-purple rounded-lg hover:bg-purple/10 transition">למד עוד</a>
        </div>
      </section>

      {/* Global Stats */}
      <section className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-secondary/50 backdrop-blur-md p-8 rounded-xl border border-purple/20 text-center">
            <div className="text-4xl font-bold text-accent mb-2">{stats.total}</div>
            <p className="text-gray-400">שרתים כולל</p>
          </div>
          <div className="bg-secondary/50 backdrop-blur-md p-8 rounded-xl border border-green-500/20 text-center">
            <div className="text-4xl font-bold text-green-500 mb-2">{stats.online}</div>
            <p className="text-gray-400">שרתים פעילים</p>
          </div>
          <div className="bg-secondary/50 backdrop-blur-md p-8 rounded-xl border border-red-500/20 text-center">
            <div className="text-4xl font-bold text-red-500 mb-2">{stats.offline}</div>
            <p className="text-gray-400">שרתים מנותקים</p>
          </div>
          <div className="bg-secondary/50 backdrop-blur-md p-8 rounded-xl border border-purple/20 text-center">
            <div className="text-4xl font-bold text-purple mb-2">{stats.totalPlayers}</div>
            <p className="text-gray-400">שחקנים בחיים</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <h2 className="text-4xl font-bold text-center mb-16">✨ התכונות שלנו</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: '⚡', title: 'יצירה מהירה', desc: 'יצור שרת בלחיצה אחת' },
            { icon: '🔒', title: 'אבטחה מלאה', desc: 'הגנת DDoS וחומת אש' },
            { icon: '💾', title: 'גיבויים אוטומטיים', desc: 'שמור את הנתונים שלך בטוח' },
            { icon: '🚀', title: 'ביצועים מהירים', desc: 'RAM ו-CPU מוקדש' },
            { icon: '🎮', title: 'תמיכה מלאה', desc: 'Paper, Spigot, Vanilla' },
            { icon: '💰', title: 'חינם לחלוטין', desc: 'ללא עלויות חבויות' },
          ].map((feature, i) => (
            <div key={i} className="bg-secondary/50 backdrop-blur-md p-6 rounded-xl border border-purple/20 hover:border-accent/50 transition">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple/20 py-8 mt-20">
        <div className="container text-center text-gray-400">
          <p>© 2024 PlayHost. All rights reserved.</p>
          <p className="text-sm mt-2">Built with ❤️ for Minecraft players</p>
        </div>
      </footer>
    </div>
  )
}
