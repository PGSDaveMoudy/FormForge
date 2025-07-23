import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  public static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'formforge',
      audience: 'formforge-app',
    });
  }

  public static generateRefreshToken(payload: { userId: string }): string {
    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: 'formforge',
      audience: 'formforge-app',
    });
  }

  public static verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
      issuer: 'formforge',
      audience: 'formforge-app',
    }) as JWTPayload;
  }

  public static verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
      issuer: 'formforge',
      audience: 'formforge-app',
    }) as { userId: string };
  }

  public static getTokenExpiry(): number {
    return 15 * 60; // 15 minutes in seconds
  }
}