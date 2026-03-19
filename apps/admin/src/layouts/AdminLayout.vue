<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">Admin Console</div>
      <nav>
        <RouterLink to="/" exact-active-class="active">仪表盘</RouterLink>
        <RouterLink to="/books" active-class="active">书籍管理</RouterLink>
      </nav>
    </aside>
    <div class="main-container">
      <header class="header">
        <span class="header-title">管理后台</span>
        <div class="header-right">
          <span v-if="authStore.user" class="username">{{ authStore.user.username }}</span>
          <button @click="handleLogout">退出登录</button>
        </div>
      </header>
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: #001529;
  color: #fff;
  padding: 1rem;
  flex-shrink: 0;
}

.logo {
  font-size: 1.2rem;
  font-weight: bold;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  margin-bottom: 1rem;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar nav a {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  padding: 0.6rem 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  transition:
    background 0.2s,
    color 0.2s;
}

.sidebar nav a:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.sidebar nav a.active,
.sidebar nav a.router-link-active {
  background: #1890ff;
  color: #fff;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  font-size: 0.875rem;
  color: #555;
}

.header-right button {
  padding: 0.3rem 0.75rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.875rem;
  color: #555;
}

.header-right button:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background: #f5f5f5;
}
</style>
