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
      <div class="logo">兼职平台后台</div>
      <nav>
        <RouterLink to="/" exact-active-class="active">仪表盘</RouterLink>
        <RouterLink to="/jobs" active-class="active">岗位管理</RouterLink>
        <RouterLink to="/users" active-class="active">用户管理</RouterLink>
        <RouterLink to="/announcements" active-class="active">公告管理</RouterLink>
        <RouterLink to="/complaints" active-class="active">投诉管理</RouterLink>
        <RouterLink to="/logs" active-class="active">操作日志</RouterLink>
      </nav>
    </aside>
    <div class="main-container">
      <header class="header">
        <span class="header-title">管理员后台</span>
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
.admin-layout { display: flex; min-height: 100vh; }
.sidebar { width: 240px; background: #0b1d32; color: #fff; padding: 1rem; flex-shrink: 0; }
.logo { font-size: 1.2rem; font-weight: 700; padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,.12); margin-bottom: 1rem; }
.sidebar nav { display: flex; flex-direction: column; gap: 0.25rem; }
.sidebar nav a { display: block; color: rgba(255,255,255,.75); text-decoration: none; padding: 0.6rem 0.75rem; border-radius: 6px; font-size: 0.9rem; }
.sidebar nav a:hover { background: rgba(255,255,255,.1); color: #fff; }
.sidebar nav a.active, .sidebar nav a.router-link-active { background: #1d4ed8; color: #fff; }
.main-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.header { height: 64px; background: #fff; border-bottom: 1px solid #e5e7eb; padding: 0 1.5rem; display: flex; align-items: center; justify-content: space-between; }
.header-title { font-weight: 600; color: #111827; }
.header-right { display: flex; align-items: center; gap: 1rem; }
.username { font-size: 0.875rem; color: #4b5563; }
.header-right button { padding: 0.35rem 0.8rem; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 0.875rem; color: #4b5563; }
.header-right button:hover { border-color: #ef4444; color: #ef4444; }
.content { flex: 1; padding: 1.25rem; overflow-y: auto; background: #f3f4f6; }
</style>
