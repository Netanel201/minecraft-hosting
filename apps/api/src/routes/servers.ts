import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { prisma, io } from '../index'
import { AuthRequest } from '../types'
import { authenticate } from '../middleware/auth'
import Docker from 'dockerode'
import * as fs from 'fs'
import * as path from 'path'

const router = Router()
const docker = new Docker({ socketPath: '/var/run/docker.sock' })

const SERVERS_DIR = '/minecraft-servers'
const EULA_CONTENT = 'eula=true'

// Get user's servers
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const servers = await prisma.server.findMany({
      where: { userId: req.user?.id },
      include: { backups: { take: 5 } },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: servers,
    })
  } catch (error) {
    console.error('Error fetching servers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch servers',
    })
  }
})

// Create a new Minecraft server
router.post('/create', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, serverType, ram, version } = req.body

    if (!name || !serverType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
    }

    const serverId = uuidv4().substring(0, 8)
    const basePort = 25565
    const serverCount = await prisma.server.count({
      where: { userId: req.user?.id },
    })
    const port = basePort + serverCount
    const subdomain = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${serverId}`
    const ramMB = parseInt(ram) || 2048

    const server = await prisma.server.create({
      data: {
        id: serverId,
        name,
        userId: req.user?.id,
        type: serverType,
        ram: ramMB,
        version: version || '1.20.1',
        port,
        subdomain,
        status: 'offline',
        ip: 'localhost',
        motd: `Welcome to ${name}!`,
      },
    })

    // Create server directory
    const serverPath = path.join(SERVERS_DIR, serverId)
    if (!fs.existsSync(serverPath)) {
      fs.mkdirSync(serverPath, { recursive: true })
    }

    // Create EULA file
    fs.writeFileSync(path.join(serverPath, 'eula.txt'), EULA_CONTENT)

    // Create Docker container
    try {
      const container = await docker.createContainer({
        Image: 'itzg/minecraft-server:latest',
        name: server.id,
        Env: [
          'EULA=TRUE',
          `MEMORY=${Math.floor(ramMB / 1024)}G`,
          `TYPE=${serverType.toUpperCase()}`,
          `VERSION=${version}`,
          `MOTD=${server.motd}`,
        ],
        ExposedPorts: {
          '25565/tcp': {},
        },
        HostConfig: {
          PortBindings: {
            '25565/tcp': [{ HostPort: port.toString() }],
          },
          Binds: [`${serverPath}:/data`],
        },
      })
      console.log(`✅ Docker container created for server: ${serverId}`)
    } catch (dockerError) {
      console.error('⚠️ Docker error:', dockerError)
    }

    await prisma.log.create({
      data: {
        serverId: server.id,
        message: 'Server created',
        level: 'info',
      },
    })

    res.json({
      success: true,
      data: server,
      message: `✅ Server "${name}" created successfully!`,
    })
  } catch (error) {
    console.error('Error creating server:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create server',
    })
  }
})

// Get specific server
router.get('/:serverId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const server = await prisma.server.findUnique({
      where: { id: req.params.serverId },
      include: {
        backups: { orderBy: { createdAt: 'desc' }, take: 10 },
        logs: { orderBy: { createdAt: 'desc' }, take: 100 },
      },
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

// START server
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
      console.log(`✅ Started server: ${server.id}`)
    } catch (err: any) {
      if (err.statusCode !== 304) {
        throw err
      }
    }

    const updated = await prisma.server.update({
      where: { id: server.id },
      data: { status: 'online' },
    })

    await prisma.log.create({
      data: {
        serverId: server.id,
        message: '🟢 Server started',
        level: 'info',
      },
    })

    io.to(`server:${server.id}`).emit('server:status', {
      status: 'online',
      message: 'Server is online!',
    })

    res.json({
      success: true,
      data: updated,
      message: '✅ Server started successfully!',
    })
  } catch (error) {
    console.error('Error starting server:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to start server',
    })
  }
})

// STOP server
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
      console.log(`⏹️ Stopped server: ${server.id}`)
    } catch (err: any) {
      if (err.statusCode !== 304) {
        console.error('Error stopping container:', err)
      }
    }

    const updated = await prisma.server.update({
      where: { id: server.id },
      data: { status: 'offline' },
    })

    await prisma.log.create({
      data: {
        serverId: server.id,
        message: '🔴 Server stopped',
        level: 'info',
      },
    })

    io.to(`server:${server.id}`).emit('server:status', {
      status: 'offline',
      message: 'Server is offline',
    })

    res.json({
      success: true,
      data: updated,
      message: '✅ Server stopped successfully!',
    })
  } catch (error) {
    console.error('Error stopping server:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to stop server',
    })
  }
})

// DELETE SERVER
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
      await container.stop()
      await container.remove()
      console.log(`🗑️ Removed Docker container: ${server.id}`)
    } catch (err) {
      console.error('Error removing container:', err)
    }

    const serverPath = path.join(SERVERS_DIR, server.id)
    if (fs.existsSync(serverPath)) {
      fs.rmSync(serverPath, { recursive: true })
    }

    await prisma.log.deleteMany({ where: { serverId: server.id } })
    await prisma.backup.deleteMany({ where: { serverId: server.id } })
    await prisma.server.delete({ where: { id: server.id } })

    res.json({
      success: true,
      message: '✅ Server deleted successfully!',
    })
  } catch (error) {
    console.error('Error deleting server:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete server',
    })
  }
})

export default router
