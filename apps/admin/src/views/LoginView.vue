<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { login } from '@/api/auth';
import { loginSchema } from '@bingwu-my-monorepo/shared-schemas';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function handleLogin() {
  const result = loginSchema.safeParse({ email: email.value, password: password.value });
  if (!result.success) {
    error.value = result.error.issues[0]?.message ?? '参数错误';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const data = await login(result.data.email, result.data.password);
    authStore.setAuth(data.token, data.user);
    router.push('/');
  } catch {
    error.value = '邮箱或密码错误';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-box">
    <h1>管理后台</h1>
    <form @submit.prevent="handleLogin">
      <div class="field">
        <label>邮箱</label>
        <input v-model="email" type="email" placeholder="请输入邮箱" autocomplete="email" />
      </div>
      <div class="field">
        <label>密码</label>
        <input
          v-model="password"
          type="password"
          placeholder="请输入密码"
          autocomplete="current-password"
        />
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
    <p class="register-link">
      没有账号？
      <RouterLink to="/register">立即注册</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.login-box {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  width: 360px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  color: #666;
}

.field input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.error {
  color: #ff4d4f;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

button {
  width: 100%;
  padding: 0.6rem;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #666;
}

.register-link a {
  color: #1890ff;
  text-decoration: none;
}
</style>
