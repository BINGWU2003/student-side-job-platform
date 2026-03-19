import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserInfo } from '@student-side-job-platform/shared-types';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('admin_token'));
  const user = ref<UserInfo | null>(JSON.parse(localStorage.getItem('admin_user') ?? 'null'));

  const isLoggedIn = computed(() => !!token.value);

  function setAuth(newToken: string, userInfo: UserInfo) {
    token.value = newToken;
    user.value = userInfo;
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_user', JSON.stringify(userInfo));
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  return { token, user, isLoggedIn, setAuth, logout };
});
