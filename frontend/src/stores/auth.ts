import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { apiGet, apiPost } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  avatar?: string;
}

interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  user?: AuthUser;
  user_info?: AuthUser;
}

function parseAuthPayload(payload: AuthResponse) {
  const token = payload.accessToken || payload.access_token || '';
  const refreshToken = payload.refreshToken || payload.refresh_token || '';
  const user = payload.user || payload.user_info || null;
  return { token, refreshToken, user };
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));
  const user = ref<AuthUser | null>(JSON.parse(localStorage.getItem('user') || 'null'));

  const isLoggedIn = computed(() => Boolean(token.value));

  function setAuth(newToken: string, newUser: AuthUser, newRefreshToken?: string) {
    token.value = newToken;
    user.value = newUser;
    refreshToken.value = newRefreshToken || null;

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    if (newRefreshToken) {
      localStorage.setItem('refresh_token', newRefreshToken);
    } else {
      localStorage.removeItem('refresh_token');
    }
  }

  function logout() {
    token.value = null;
    refreshToken.value = null;
    user.value = null;

    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  async function login(email: string, password: string) {
    const payload = await apiPost<AuthResponse>('/auth/login', { email, password });
    const parsed = parseAuthPayload(payload);
    if (!parsed.token || !parsed.user) {
      throw new Error('登录返回数据不完整');
    }
    setAuth(parsed.token, parsed.user, parsed.refreshToken || undefined);
    return parsed.user;
  }

  async function register(email: string, password: string, name?: string) {
    const payload = await apiPost<AuthResponse>('/auth/register', { email, password, name });
    const parsed = parseAuthPayload(payload);
    if (!parsed.token || !parsed.user) {
      throw new Error('注册返回数据不完整');
    }
    setAuth(parsed.token, parsed.user, parsed.refreshToken || undefined);
    return parsed.user;
  }

  async function fetchProfile() {
    const profile = await apiGet<AuthUser>('/auth/profile');
    user.value = profile;
    localStorage.setItem('user', JSON.stringify(profile));
    return profile;
  }

  return {
    token,
    refreshToken,
    user,
    isLoggedIn,
    setAuth,
    logout,
    login,
    register,
    fetchProfile,
  };
});
