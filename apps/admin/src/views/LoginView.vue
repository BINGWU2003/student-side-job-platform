<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { login } from '@/api/auth';
import { loginSchema } from '@student-side-job-platform/shared-schemas';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('admin');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function handleLogin() {
  const result = loginSchema.safeParse({ username: username.value, password: password.value });
  if (!result.success) {
    error.value = result.error.issues[0]?.message ?? '参数错误';
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    const data = await login(result.data.username, result.data.password);
    if (data.user.role !== 'ADMIN') {
      throw new Error('只有管理员可以登录后台');
    }
    authStore.setAuth(data.token, data.user);
    router.push('/');
  } catch (err) {
    error.value = err instanceof Error ? err.message : '用户名或密码错误';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-box">
    <h1>管理员登录</h1>
    <form @submit.prevent="handleLogin">
      <div class="field">
        <label>用户名</label>
        <input v-model="username" type="text" placeholder="请输入用户名" autocomplete="username" />
      </div>
      <div class="field">
        <label>密码</label>
        <input v-model="password" type="password" placeholder="请输入密码" autocomplete="current-password" />
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="loading">{{ loading ? '登录中...' : '登录' }}</button>
    </form>
  </div>
</template>

<style scoped>
.login-box { background: #fff; padding: 2rem; border-radius: 10px; width: 360px; box-shadow: 0 2px 16px rgba(0,0,0,.1); }
h1 { text-align: center; margin-bottom: 1.5rem; font-size: 1.5rem; }
.field { margin-bottom: 1rem; }
.field label { display: block; margin-bottom: .25rem; font-size: .875rem; color: #4b5563; }
.field input { width: 100%; padding: .55rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; }
.error { color: #ef4444; font-size: .875rem; margin-bottom: .5rem; }
button { width: 100%; padding: .65rem; background: #1d4ed8; color: #fff; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
button:disabled { opacity: .6; cursor: not-allowed; }
</style>
