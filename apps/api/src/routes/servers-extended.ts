import { Router, Response } from 'express'
import { prisma } from '../index'
import { AuthRequest } from '../types'
import { authenticate } from '../middleware/auth'

const router = Router()

// Get specific server
router.get('/:serverId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const server = await prisma.server.findUnique({
      where: { id: req.params.serverId },
      include: { backups: true, logs: { take: 50 } },
    })

    if (!server || server.userId !== req.user?.id) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      })
    }

    res.json({
      success: true,
      data: server,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch server',
    })
  }
})

// Send command to server
router.post('/:serverId/command', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { command } = req.body
    const server = await prisma.server.findUnique({
      where: { id: req.params.serverId },
    })

    if (!server || server.userId !== req.user?.id) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      })
    }

    // Log the command
    await prisma.log.create({
      data: {
        serverId: server.id,
        message: `Command: ${command}`,
        level: 'command',
      },
    })

    res.json({
      success: true,
      message: 'Command sent',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send command',
    })
  }
})

// Create backup
router.post('/:serverId/backup', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const server = await prisma.server.findUnique({
      where: { id: req.params.serverId },
    })

    if (!server || server.userId !== req.user?.id) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      })
    }

    const backup = await prisma.backup.create({
      data: {
        serverId: server.id,
        filename: `backup-${Date.now()}.zip`,
        size: 0,
      },
    })

    res.json({
      success: true,
      data: backup,
      message: 'Backup created',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create backup',
    })
  }
})

// Get backups
router.get('/:serverId/backups', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const server = await prisma.server.findUnique({
      where: { id: req.params.serverId },
    })

    if (!server || server.userId !== req.user?.id) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      })
    }

    const backups = await prisma.backup.findMany({
      where: { serverId: server.id },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: backups,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch backups',
    })
  }
})

// Get server logs
router.get('/:serverId/logs', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const server = await prisma.server.findUnique({
      where: { id: req.params.serverId },
    })

    if (!server || server.userId !== req.user?.id) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      })
    }

    const logs = await prisma.log.findMany({
      where: { serverId: server.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json({
      success: true,
      data: logs,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs',
    })
  }
})

export default router
