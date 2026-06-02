'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות לא תואמות')
      setLoading(false)
      return
    }

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
      router.push('/auth/login?registered=true')
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בהרשמה')
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
            <label className="block text-sm font-medium mb-2">שם</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-primary/50 border border-purple/30 rounded-lg focus:outline-none focus:border-accent text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">אימייל</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-primary/50 border border-purple/30 rounded-lg focus:outline-none focus:border-accent text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">סיסמה</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-primary/50 border border-purple/30 rounded-lg focus:outline-none focus:border-accent text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">אימות סיסמה</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-primary/50 border border-purple/30 rounded-lg focus:outline-none focus:border-accent text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-purple to-accent text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'טוען...' : 'הרשמה'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          כבר יש חשבון? <Link href="/auth/login" className="text-accent hover:underline">כניסה</Link>
        </p>
      </div>
    </div>
  )
}
