import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../index'
import { AuthRequest } from '../types'
import { authenticate } from '../middleware/auth'
import Docker from 'dockerode'

const router = Router()
const docker = new Docker()

// Get user's servers
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const servers = await prisma.server.findMany({
      where: { userId: req.user?.id },
      include: { backups: true },
    })

    res.json({
      success: true,
      data: servers,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch servers',
    })
  }
})

// Create a new server
router.post('/create', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, serverType, ram, version } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user?.id } })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Check server limits
    const serverCount = await prisma.server.count({
      where: { userId: req.user?.id },
    })

    if (serverCount >= (process.env.MAX_SERVERS_PER_USER || 5)) {
      return res.status(403).json({
        success: false,
        error: 'Maximum servers reached',
      })
    }

    const serverId = uuidv4()
    const port = 25565 + serverCount
    const subdomain = `${name.toLowerCase()}-${serverId.substring(0, 4)}`

    const server = await prisma.server.create({
      data: {
        id: serverId,
        name,
        userId: req.user?.id,
        type: serverType || 'paper',
        ram: parseInt(ram) || 2048,
        version: version || '1.20.1',
        port,
        subdomain,
        status: 'offline',
        ip: `play-host.net`,
      },
    })

    // Create Docker container
    try {
      await createMinecraftContainer(server.id, server.port, server.ram)
    } catch (dockerError) {
      console.error('Docker error:', dockerError)
    }

    res.json({
      success: true,
      data: server,
      message: 'Server created successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'Failed to create server',
    })
  }
})

// Start server
router.post('/:serverId/start', authenticate, async (req: AuthRequest, res: Response) => {
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

    try {
      const container = docker.getContainer(server.id)
      await container.start()
    } catch (err) {
      console.error('Failed to start container:', err)
    }

    const updated = await prisma.server.update({
      where: { id: server.id },
      data: { status: 'online' },
    })

    res.json({
      success: true,
      data: updated,
      message: 'Server started',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start server',
    })
  }
})

// Stop server
router.post('/:serverId/stop', authenticate, async (req: AuthRequest, res: Response) => {
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

    try {
      const container = docker.getContainer(server.id)
      await container.stop()
    } catch (err) {
      console.error('Failed to stop container:', err)
    }

    const updated = await prisma.server.update({
      where: { id: server.id },
      data: { status: 'offline' },
    })

    res.json({
      success: true,
      data: updated,
      message: 'Server stopped',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to stop server',
    })
  }
})

// Delete server
router.delete('/:serverId', authenticate, async (req: AuthRequest, res: Response) => {
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

    try {
      const container = docker.getContainer(server.id)
      await container.remove({ force: true })
    } catch (err) {
      console.error('Failed to remove container:', err)
    }

    await prisma.server.delete({
      where: { id: server.id },
    })

    res.json({
      success: true,
      message: 'Server deleted',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete server',
    })
  }
})

async function createMinecraftContainer(serverId: string, port: number, ram: number) {
  const container = await docker.createContainer({
    Image: 'itzg/minecraft-server:latest',
    name: serverId,
    Env: [
      `EULA=TRUE`,
      `MEMORY=${ram}M`,
      `TYPE=PAPER`,
      `JAVA_MEMORY=${ram}M`,
    ],
    HostConfig: {
      PortBindings: {
        '25565/tcp': [{ HostPort: port.toString() }],
      },
      Memory: ram * 1024 * 1024,
      MemorySwap: ram * 1024 * 1024,
    },
  })

  await container.start()
  return container
}

export default router
