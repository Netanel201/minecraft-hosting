// Update imports in index.ts to include extended routes
// Add this to the routes section:
// import serversExtendedRoutes from './routes/servers-extended'
// app.use('/api/servers', serversExtendedRoutes)

// DDOS Protection middleware
import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'

export const ddosProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health'
  },
})

// Server status check
export const checkServerStatus = async (serverId: string) => {
  try {
    // Ping the server
    const response = await fetch(`http://localhost:25565`, {
      timeout: 5000,
    })
    return response.ok
  } catch (error) {
    return false
  }
}
