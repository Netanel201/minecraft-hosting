import { Request, Response, NextFunction } from 'express'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
