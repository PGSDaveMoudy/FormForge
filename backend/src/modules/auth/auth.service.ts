import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { JWTService } from '../../config/jwt';
import { 
  LoginRequest, 
  RegisterRequest, 
  EmailVerificationRequest,
  AuthTokens,
  User
} from '@formforge/shared';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly EMAIL_CODE_EXPIRY = 15 * 60; // 15 minutes
  private static readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

  public static async register(data: RegisterRequest): Promise<{ user: Omit<User, 'password'>; message: string }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
        role: UserRole.VIEWER,
        organizationId: data.organizationId,
        isEmailVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate and store email verification code
    await this.generateEmailVerificationCode(user.email);

    return {
      user,
      message: 'User registered successfully. Please check your email for verification code.',
    };
  }

  public static async login(data: LoginRequest): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        role: true,
        organizationId: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    const refreshToken = JWTService.generateRefreshToken({ userId: user.id });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.REFRESH_TOKEN_EXPIRY);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWTService.getTokenExpiry(),
      },
    };
  }

  public static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = JWTService.verifyRefreshToken(refreshToken);

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Remove expired token
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { token: refreshToken } });
      }
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new tokens
    const newAccessToken = JWTService.generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      organizationId: storedToken.user.organizationId,
    });

    const newRefreshToken = JWTService.generateRefreshToken({ userId: storedToken.user.id });

    // Update refresh token in database
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.REFRESH_TOKEN_EXPIRY);

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: {
        token: newRefreshToken,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: JWTService.getTokenExpiry(),
    };
  }

  public static async logout(refreshToken: string): Promise<void> {
    // Remove refresh token from database
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  public static async generateEmailVerificationCode(email: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.EMAIL_CODE_EXPIRY);

    // Store in database
    await prisma.emailVerification.upsert({
      where: { email_code: { email, code } },
      create: {
        email,
        code,
        expiresAt,
      },
      update: {
        code,
        expiresAt,
      },
    });

    // Store in Redis for faster lookup
    await redis.setex(`email_verification:${email}`, this.EMAIL_CODE_EXPIRY, code);

    // TODO: Send email with verification code
    console.log(`Email verification code for ${email}: ${code}`);
  }

  public static async verifyEmail(data: EmailVerificationRequest): Promise<{ success: boolean; message: string }> {
    // Check Redis first for performance
    const storedCode = await redis.get(`email_verification:${data.email}`);
    
    if (storedCode !== data.code) {
      // Check database as fallback
      const verification = await prisma.emailVerification.findFirst({
        where: {
          email: data.email,
          code: data.code,
          expiresAt: { gt: new Date() },
        },
      });

      if (!verification) {
        throw new Error('Invalid or expired verification code');
      }
    }

    // Update user as verified
    await prisma.user.update({
      where: { email: data.email },
      data: { isEmailVerified: true },
    });

    // Clean up verification data
    await Promise.all([
      redis.del(`email_verification:${data.email}`),
      prisma.emailVerification.deleteMany({
        where: { email: data.email },
      }),
    ]);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  public static async getUserById(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}