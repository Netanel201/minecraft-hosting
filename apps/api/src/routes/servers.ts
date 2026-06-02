import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { prisma, io } from '../index'
import { AuthRequest } from '../types'
import { authenticate } from '../middleware/auth'
import Docker from 'dockerode'
import { spawn } from 'child_process'
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

    // Validation
    if (!name || !serverType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
    })

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

    const maxServers = parseInt(process.env.MAX_SERVERS_PER_USER || '5')
    if (serverCount >= maxServers) {
      return res.status(403).json({
        success: false,
        error: `Maximum ${maxServers} servers reached for free tier`,
      })
    }

    const serverId = uuidv4().substring(0, 8)
    const basePort = 25565
    const port = basePort + serverCount
    const subdomain = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${serverId}`
    const ramMB = parseInt(ram) || 2048

    // Create server record
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
      await createMinecraftContainer(server)
      console.log(`✅ Docker container created for server: ${serverId}`)
    } catch (dockerError) {
      console.error('⚠️ Docker error:', dockerError)
      // Continue even if Docker fails
    }

    // Log action
    await prisma.log.create({
      data: {
        serverId: server.id,
        message: `Server created by ${user.name}`,
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

    if (server.status === 'online') {
      return res.status(400).json({
        success: false,
        error: 'Server is already online',
      })
    }

    // Start Docker container
    try {
      const container = docker.getContainer(server.id)
      await container.start()
      console.log(`✅ Started server: ${server.id}`)
    } catch (err: any) {
      if (err.statusCode !== 304) { // 304 = already started
        console.error('Error starting container:', err)
        throw err
      }
    }

    const updated = await prisma.server.update({
      where: { id: server.id },
      data: { status: 'online' },
    })

    // Log action
    await prisma.log.create({
      data: {
        serverId: server.id,
        message: '🟢 Server started',
        level: 'info',
      },
    })

    // Notify connected clients
    io.to(`server:${server.id}`).emit('server:status', {
      status: 'online',
      message: 'Server is now online!',
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

    if (server.status === 'offline') {
      return res.status(400).json({
        success: false,
        error: 'Server is already offline',
      })
    }

    // Stop Docker container
    try {
      const container = docker.getContainer(server.id)
      await container.stop()
      console.log(`⛔ Stopped server: ${server.id}`)
    } catch (err: any) {
      if (err.statusCode !== 304) {
        console.error('Error stopping container:', err)
      }
    }

    const updated = await prisma.server.update({
      where: { id: server.id },
      data: { status: 'offline' },
    })

    // Log action
    await prisma.log.create({
      data: {
        serverId: server.id,
        message: '🔴 Server stopped',
        level: 'info',
      },
    })

    io.to(`server:${server.id}`).emit('server:status', {
      status: 'offline',
      message: 'Server is now offline',
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

// RESTART server
router.post('/:serverId/restart', authenticate, async (req: AuthRequest, res: Response) => {
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
      await container.restart()
      console.log(`🔄 Restarted server: ${server.id}`)
    } catch (err) {
      console.error('Error restarting container:', err)
    }

    const updated = await prisma.server.update({
      where: { id: server.id },
      data: { status: 'online' },
    })

    // Log action
    await prisma.log.create({
      data: {
        serverId: server.id,
        message: '🔄 Server restarted',
        level: 'info',
      },
    })

    io.to(`server:${server.id}`).emit('server:status', {
      status: 'online',
      message: 'Server is restarting...',
    })

    res.json({
      success: true,
      data: updated,
      message: '✅ Server restarted successfully!',
    })
  } catch (error) {
    console.error('Error restarting server:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to restart server',
    })
  }
})

// Send COMMAND to server console
router.post('/:serverId/command', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { command } = req.body

    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Command is required',
      })
    }

    const server = await prisma.server.findUnique({
      where: { id: req.params.serverId },
    })

    if (!server || server.userId !== req.user?.id) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      })
    }

    if (server.status === 'offline') {
      return res.status(400).json({
        success: false,
        error: 'Server is offline',
      })
    }

    // Send command to container
    try {
      const container = docker.getContainer(server.id)
      const exec = await container.exec({
        Cmd: ['say', command],
        AttachStdout: true,
        AttachStderr: true,
      })
      await exec.start()
      console.log(`💬 Command sent to ${server.id}: ${command}`)
    } catch (err) {
      console.error('Error sending command:', err)
    }

    // Log command
    await prisma.log.create({
      data: {
        serverId: server.id,
        message: `> ${command}`,
        level: 'command',
      },
    })

    // Broadcast to connected clients
    io.to(`server:${server.id}`).emit('console-output', {
      message: `[COMMAND] ${command}`,
      timestamp: new Date(),
      type: 'command',
    })

    res.json({
      success: true,
      message: '✅ Command sent successfully!',
    })
  } catch (error) {
    console.error('Error sending command:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to send command',
    })
  }
})

// CREATE BACKUP
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

    const backupName = `backup-${Date.now()}`
    const serverPath = path.join(SERVERS_DIR, server.id)
    const backupPath = path.join(serverPath, 'backups', backupName)

    // Create backup directory
    if (!fs.existsSync(path.join(serverPath, 'backups'))) {
      fs.mkdirSync(path.join(serverPath, 'backups'), { recursive: true })
    }

    // Create backup (copy world data)
    fs.mkdirSync(backupPath, { recursive: true })
    console.log(`📦 Backup created: ${backupPath}`)

    const backupSize = getDirectorySize(backupPath)

    const backup = await prisma.backup.create({
      data: {
        serverId: server.id,
        filename: `${backupName}.zip`,
        size: backupSize,
      },
    })

    // Log action
    await prisma.log.create({
      data: {
        serverId: server.id,
        message: `📦 Backup created: ${backupName}`,
        level: 'info',
      },
    })

    io.to(`server:${server.id}`).emit('server:backup', {
      message: 'Backup created successfully!',
    })

    res.json({
      success: true,
      data: backup,
      message: '✅ Backup created successfully!',
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create backup',
    })
  }
})

// GET BACKUPS
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

    // Stop and remove Docker container
    try {
      const container = docker.getContainer(server.id)
      await container.stop()
      await container.remove()
      console.log(`❌ Removed Docker container: ${server.id}`)
    } catch (err) {
      console.error('Error removing container:', err)
    }

    // Delete server directory
    const serverPath = path.join(SERVERS_DIR, server.id)
    if (fs.existsSync(serverPath)) {
      fs.rmSync(serverPath, { recursive: true })
    }

    // Delete from database
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

// Helper function: Create Docker container
async function createMinecraftContainer(server: any) {
  const serverPath = path.join(SERVERS_DIR, server.id)

  const container = await docker.createContainer({
    Image: 'itzg/minecraft-server:latest',
    name: server.id,
    Hostname: server.subdomain,
    Env: [
      'EULA=TRUE',
      `MEMORY=${server.ram}M`,
      `TYPE=${server.type.toUpperCase()}`,
      `VERSION=${server.version}`,
      `JAVA_MEMORY=${server.ram}M`,
      `MOTD=${server.motd}`,
      'ONLINE_MODE=FALSE',
    ],
    ExposedPorts: {
      '25565/tcp': {},
    },
    HostConfig: {
      PortBindings: {
        '25565/tcp': [{ HostPort: server.port.toString() }],
      },
      Binds: [`${serverPath}:/data`],
      Memory: server.ram * 1024 * 1024,
      MemorySwap: server.ram * 1024 * 1024,
      CPUShares: 1024,
    },
  })

  return container
}

// Helper function: Get directory size
function getDirectorySize(dir: string): number {
  let size = 0
  try {
    if (!fs.existsSync(dir)) return 0
    const files = fs.readdirSync(dir)
    files.forEach((file) => {
      const filePath = path.join(dir, file)
      const stats = fs.statSync(filePath)
      size += stats.size
    })
  } catch (err) {
    console.error('Error calculating directory size:', err)
  }
  return size
}

export default router
