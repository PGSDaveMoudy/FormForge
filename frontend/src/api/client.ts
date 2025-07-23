import { AuthTokens } from '@formforge/shared';

export class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;
  private accessToken: string | null = null;

  private constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '/api';
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for refresh tokens
      ...options,
    };

    // Add authorization header if access token exists
    if (this.accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.accessToken}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      // Handle token refresh if needed
      if (response.status === 401 && this.accessToken) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${this.accessToken}`,
          };
          const retryResponse = await fetch(url, config);
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw new Error('Network request failed');
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        success: false,
        error: 'Unknown error',
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.data.tokens.accessToken;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Authentication endpoints
  public async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationId?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  public async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: any; tokens: AuthTokens }> {
    const response = await this.request<{ user: any; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store the access token
    this.accessToken = response.tokens.accessToken;
    return response;
  }

  public async logout(): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
    });
    this.accessToken = null;
  }

  public async getProfile() {
    return this.request('/auth/profile');
  }

  public async verifyEmail(data: { email: string; code: string }) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async resendVerification(email: string) {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Health check
  public async getStatus() {
    return this.request('/status');
  }
}

export const apiClient = ApiClient.getInstance();