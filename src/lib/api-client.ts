/**
 * API Client - Axios wrapper for backend API calls
 * Handles authentication, error handling, and response formatting
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

// API Response types
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sessionToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
    }

    // Return error in consistent format
    return Promise.reject(error);
  }
);

// API Client class
class ApiClient {
  private instance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.instance = axiosInstance;
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Request failed');
    }

    // Ensure we return the data (even if it's an empty object)
    return response.data.data ?? ({} as T);
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Request failed');
    }

    return response.data.data ?? ({} as T);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data, config);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Request failed');
    }

    return response.data.data ?? ({} as T);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Request failed');
    }

    return response.data.data ?? ({} as T);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Request failed');
    }

    return response.data.data ?? ({} as T);
  }
}

// Export singleton instance
export const api = new ApiClient(axiosInstance);

// Export axios instance for advanced usage
export { axiosInstance };
