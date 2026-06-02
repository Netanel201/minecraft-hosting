import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth'
import serverRoutes from './routes/servers'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app: Express = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

export const prisma = new PrismaClient()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'בקשות רבות מדי, אנא נסה שוב מאוחר יותר',
})

app.use('/api/', limiter)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/servers', serverRoutes)

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'API is running' })
})

// WebSocket
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

app.use(errorHandler)

const PORT = process.env.API_PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`)
})

export { io }
