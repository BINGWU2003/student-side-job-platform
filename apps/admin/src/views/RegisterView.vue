<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '@/api/auth';
import { registerSchema } from '@student-side-job-platform/shared-schemas';

const router = useRouter();

const email = ref('');
const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const success = ref(false);

async function handleRegister() {
  const result = registerSchema.safeParse({
    email: email.value,
    username: username.value,
    password: password.value,
  });
  if (!result.success) {
    error.value = result.error.issues[0]?.message ?? '参数错误';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await register(result.data.email, result.data.username, result.data.password);
    success.value = true;
    setTimeout(() => router.push('/login'), 1500);
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    error.value = msg ?? '注册失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-box">
    <h1>注册账号</h1>
    <div v-if="success" class="success">注册成功，正在跳转登录页...</div>
    <form v-else @submit.prevent="handleRegister">
      <div class="field">
        <label>邮箱</label>
        <input v-model="email" type="email" placeholder="请输入邮箱" autocomplete="email" />
      </div>
      <div class="field">
        <label>用户名</label>
        <input v-model="username" type="text" placeholder="请输入用户名" autocomplete="username" />
      </div>
      <div class="field">
        <label>密码</label>
        <input
          v-model="password"
          type="password"
          placeholder="请输入密码"
          autocomplete="new-password"
        />
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="loading">
        {{ loading ? '注册中...' : '注册' }}
      </button>
    </form>
    <p class="register-link">
      已有账号？
      <RouterLink to="/login">去登录</RouterLink>
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

.success {
  text-align: center;
  color: #52c41a;
  padding: 1rem 0;
  font-size: 1rem;
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
