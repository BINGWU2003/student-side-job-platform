import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { UserInfo } from '@student-side-job-platform/shared-types';

export const useAuthStore = defineStore('web-auth', () => {
  const token = ref<string | null>(localStorage.getItem('web_token'));
  const user = ref<UserInfo | null>(JSON.parse(localStorage.getItem('web_user') ?? 'null'));

  const isLoggedIn = computed(() => !!token.value);
  const role = computed(() => user.value?.role ?? null);

  function setAuth(newToken: string, userInfo: UserInfo) {
    token.value = newToken;
    user.value = userInfo;
    localStorage.setItem('web_token', newToken);
    localStorage.setItem('web_user', JSON.stringify(userInfo));
  }

  function setUser(userInfo: UserInfo) {
    user.value = userInfo;
    localStorage.setItem('web_user', JSON.stringify(userInfo));
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('web_token');
    localStorage.removeItem('web_user');
  }

  return { token, user, isLoggedIn, role, setAuth, setUser, logout };
});
