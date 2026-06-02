import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../index'
import { AuthRequest, ApiResponse } from '../types'

const router = Router()

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    )

    res.json({
      success: true,
      data: { user, token },
      message: 'User registered successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    })
  }
})

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing email or password',
      })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    )

    res.json({
      success: true,
      data: { user, token },
      message: 'Login successful',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed',
    })
  }
})

export default router
