import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  timestamp?: string;
  message?: string | string[];
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 自动重定向到登录页
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 不在登录/注册请求中处理
      const url = error.config?.url || '';
      if (!url.includes('/login') && !url.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
        // 避免循环重定向
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      }
    }
    return Promise.reject(error);
  }
);

function unwrap<T>(response: AxiosResponse<ApiEnvelope<T> | T>): T {
  const payload: any = response.data;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.get<ApiEnvelope<T> | T>(url, config);
  return unwrap<T>(response);
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.post<ApiEnvelope<T> | T>(url, data, config);
  return unwrap<T>(response);
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.put<ApiEnvelope<T> | T>(url, data, config);
  return unwrap<T>(response);
}

export async function apiDelete<T = { success: boolean }>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.delete<ApiEnvelope<T> | T>(url, config);
  return unwrap<T>(response);
}
