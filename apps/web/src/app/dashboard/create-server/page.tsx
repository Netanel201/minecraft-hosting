"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { AlertCircle } from 'lucide-react'

export default function CreateServer() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    serverType: 'paper',
    ram: '2048',
    version: '1.20.1',
  })
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (!formData.name.trim()) {
      setError('יש להזין שם לשרת')
      setLoading(false)
      return
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/servers/create`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${session?.user?.email}`,
          },
        }
      )

      setSuccess(true)
      setFormData({ name: '', serverType: 'paper', ram: '2048', version: '1.20.1' })
      
      // Redirect after success
      setTimeout(() => {
        router.push(`/dashboard/server/${response.data.data.id}`)
      }, 2000)
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'שגיאה ביצירת השרת'
      setError(errorMsg)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary">
      {/* Header */}
      <div className="bg-secondary/50 backdrop-blur-md border-b border-purple/20">
        <div className="container py-6">
          <button
            onClick={() => router.back()}
            className="text-accent hover:underline mb-4 flex items-center gap-2"
          >
            ← חזור
          </button>
          <h1 className="text-4xl font-bold">🎮 יצירת שרת חדש</h1>
          <p className="text-gray-400 mt-2">בחר את הגדרות השרת שלך</p>
        </div>
      </div>

      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-secondary/50 backdrop-blur-md p-8 rounded-2xl border border-purple/20">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6 flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500 text-green-200 p-4 rounded-lg mb-6">
                ✅ השרת נוצר בהצלחה! מעביר אתך לעמוד הניהול...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Server Name */}
              <div>
                <label className="block text-sm font-medium mb-2">📝 שם השרת *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="DragonMC, WarsSMP, וכו'..."
                  className="w-full px-4 py-3 bg-primary/50 border border-purple/30 rounded-lg focus:outline-none focus:border-accent text-white placeholder-gray-500 rtl"
                  required
                  disabled={loading}
                />
              </div>

              {/* Server Type */}
              <div>
                <label className="block text-sm font-medium mb-2">🎯 סוג השרת</label>
                <select
                  name="serverType"
                  value={formData.serverType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-primary/50 border border-purple/30 rounded-lg focus:outline-none focus:border-accent text-white rtl"
                  disabled={loading}
                >
                  <option value="vanilla">Vanilla</option>
                  <option value="paper">Paper (מומלץ)</option>
                  <option value="spigot">Spigot</option>
                  <option value="bukkit">Bukkit</option>
                  <option value="purpur">Purpur</option>
                </select>
              </div>

              {/* RAM */}
              <div>
                <label className="block text-sm font-medium mb-2">💾 זיכרון RAM</label>
                <select
                  name="ram"
                  value={formData.ram}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-primary/50 border border-purple/30 rounded-lg focus:outline-none focus:border-accent text-white rtl"
                  disabled={loading}
                >
                  <option value="1024">1 GB</option>
                  <option value="2048">2 GB (מומלץ)</option>
                  <option value="4096">4 GB</option>
                  <option value="6144">6 GB</option>
                  <option value="8192">8 GB</option>
                </select>
              </div>

              {/* Version */}
              <div>
                <label className="block text-sm font-medium mb-2">📦 גרסת Minecraft</label>
                <select
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-primary/50 border border-purple/30 rounded-lg focus:outline-none focus:border-accent text-white rtl"
                  disabled={loading}
                >
                  <option value="1.20.4">1.20.4 (חדשה ביותר)</option>
                  <option value="1.20.1">1.20.1 (יציבה)</option>
                  <option value="1.20">1.20</option>
                  <option value="1.19.2">1.19.2</option>
                  <option value="1.18.2">1.18.2</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple to-accent text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin">⚙️</div>
                    יוצר שרת...
                  </>
                ) : (
                  <>
                    🚀 יצור שרת
                  </>
                )}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 <strong>טיפ:</strong> Paper הוא הברירה המומלצת לרוב השרתים. הוא מהיר ויציב.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
