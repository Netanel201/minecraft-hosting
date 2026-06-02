'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('אימייל או סיסמה שגויים')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('שגיאה בחיבור')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
      <div className="bg-secondary/50 backdrop-blur-md p-8 rounded-2xl border border-purple/20 w-full max-w-md animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-8">🎮 PlayHost</h1>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-primary/50 border border-purple/30 rounded-lg focus:outline-none focus:border-accent text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-primary/50 border border-purple/30 rounded-lg focus:outline-none focus:border-accent text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-purple to-accent text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'טוען...' : 'כניסה'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          עדיין לא רשום? <Link href="/auth/register" className="text-accent hover:underline">הרשמה</Link>
        </p>
      </div>
    </div>
  )
}
