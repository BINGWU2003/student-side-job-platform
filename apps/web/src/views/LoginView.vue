<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { login } from '@/api/auth';
import { loginSchema } from '@student-side-job-platform/shared-schemas';

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();

async function handleSubmit() {
  const parsed = loginSchema.safeParse({ username: username.value, password: password.value });
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? '表单参数不合法';
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    const result = await login(parsed.data.username, parsed.data.password);
    authStore.setAuth(result.token, result.user);
    router.push('/');
  } catch {
    error.value = '用户名或密码错误';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="card">
    <h1>登录</h1>
    <form @submit.prevent="handleSubmit">
      <input v-model="username" placeholder="用户名" autocomplete="username" />
      <input
        v-model="password"
        type="password"
        placeholder="密码"
        autocomplete="current-password"
      />
      <p v-if="error" class="error">{{ error }}</p>
      <button :disabled="loading">{{ loading ? '登录中...' : '登录' }}</button>
    </form>
    <p class="footer">
      还没有账号？
      <RouterLink to="/register">立即注册</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.card {
  width: 360px;
  padding: 24px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
}
form {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}
input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px;
}
button {
  background: #0f172a;
  color: #fff;
  border: 0;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
}
.error {
  color: #dc2626;
  font-size: 13px;
}
.footer {
  margin-top: 12px;
  font-size: 13px;
  color: #64748b;
}
.footer a {
  color: #2563eb;
  text-decoration: none;
}
</style>
