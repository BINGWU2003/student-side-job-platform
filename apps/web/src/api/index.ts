import { createHttpClient } from '@student-side-job-platform/shared';
import { useAuthStore } from '@/stores/auth';

export const http = createHttpClient({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  getToken: () => localStorage.getItem('web_token'),
  onUnauthorized: () => {
    const authStore = useAuthStore();
    authStore.logout();
    window.location.href = '/login';
  },
});
