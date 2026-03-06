import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

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

// ==================== Token 自动续签 ====================

/** 是否正在刷新 token（防止并发刷新） */
let isRefreshing = false;
/** 排队中的请求：刷新完成后按序重试 */
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function onRefreshSuccess(newToken: string) {
  pendingRequests.forEach((cb) => cb.resolve(newToken));
  pendingRequests = [];
}

function onRefreshFailure(err: unknown) {
  pendingRequests.forEach((cb) => cb.reject(err));
  pendingRequests = [];
}

/** 跳过 refresh 的 URL 白名单 */
const AUTH_WHITELIST = ['/auth/login', '/auth/register', '/auth/refresh'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const url = originalRequest?.url || '';

    // 非 401 或白名单请求直接拒绝
    if (
      error.response?.status !== 401 ||
      AUTH_WHITELIST.some((w) => url.includes(w)) ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      // 没有 refreshToken，直接登出
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    // 如果已经在刷新，把请求排队等待
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        originalRequest._retry = true;
        return api(originalRequest);
      });
    }

    // 开始刷新
    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const { data } = await api.post('/auth/refresh', { refreshToken });
      const payload = data?.data || data; // 兼容 ApiEnvelope 包装
      const newAccessToken = payload.accessToken || payload.access_token;
      const newRefreshToken = payload.refreshToken || payload.refresh_token;

      if (!newAccessToken) {
        throw new Error('刷新返回无效');
      }

      // 更新 localStorage
      localStorage.setItem('token', newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }

      // 通知排队请求
      onRefreshSuccess(newAccessToken);

      // 重试原始请求
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      onRefreshFailure(refreshError);
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

function clearAuthAndRedirect() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refresh_token');
  if (window.location.pathname !== '/auth') {
    window.location.href = '/auth';
  }
}

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
