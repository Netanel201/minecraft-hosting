import { Router, Response } from 'express'
import { prisma } from '../index'
import { AuthRequest } from '../types'

const router = Router()

// Get global stats
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const totalServers = await prisma.server.count()
    const onlineServers = await prisma.server.count({
      where: { status: 'online' },
    })
    const offlineServers = totalServers - onlineServers

    const servers = await prisma.server.findMany({
      select: { players: true },
    })
    const totalPlayers = servers.reduce((sum, s) => sum + s.players, 0)

    res.json({
      success: true,
      data: {
        total: totalServers,
        online: onlineServers,
        offline: offlineServers,
        totalPlayers,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
    })
  }
})

export default router
