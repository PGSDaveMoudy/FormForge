import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { 
  loginSchema, 
  registerSchema, 
  emailVerificationSchema,
  refreshTokenSchema 
} from '@formforge/shared';
import { AuthenticatedRequest } from '../../shared/middleware/auth';

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await AuthService.register(validatedData);

      res.status(201).json({
        success: true,
        message: result.message,
        data: { user: result.user },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({
        success: false,
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AuthService.login(validatedData);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          tokens: {
            accessToken: result.tokens.accessToken,
            expiresIn: result.tokens.expiresIn,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Invalid credentials',
      });
    }
  }

  public static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Refresh token is required',
        });
        return;
      }

      const tokens = await AuthService.refreshTokens(refreshToken);

      // Update refresh token cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          tokens: {
            accessToken: tokens.accessToken,
            expiresIn: tokens.expiresIn,
          },
        },
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Invalid refresh token',
      });
    }
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout',
      });
    }
  }

  public static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = emailVerificationSchema.parse(req.body);
      const result = await AuthService.verifyEmail(validatedData);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(400).json({
        success: false,
        error: 'Email verification failed',
        message: error instanceof Error ? error.message : 'Invalid verification code',
      });
    }
  }

  public static async resendVerificationCode(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Email is required',
        });
        return;
      }

      await AuthService.generateEmailVerificationCode(email);

      res.status(200).json({
        success: true,
        message: 'Verification code sent successfully',
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send verification code',
        message: 'An error occurred while sending verification code',
      });
    }
  }

  public static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }

      // Get fresh user data
      const user = await AuthService.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
        message: 'An error occurred while retrieving profile',
      });
    }
  }
}