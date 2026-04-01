<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const isStudent = computed(() => authStore.role === 'STUDENT');
const isEmployer = computed(() => authStore.role === 'EMPLOYER');

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <div class="layout">
    <header class="header">
      <RouterLink to="/" class="brand">校园兼职平台</RouterLink>
      <nav class="nav">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/announcements">公告</RouterLink>
        <RouterLink to="/jobs">岗位</RouterLink>
        <template v-if="isStudent">
          <RouterLink to="/my/applications">我的申请</RouterLink>
          <RouterLink to="/my/favorites">我的收藏</RouterLink>
          <RouterLink to="/my/complaints">我的投诉</RouterLink>
        </template>
        <template v-if="isEmployer">
          <RouterLink to="/employer/jobs">我的岗位</RouterLink>
          <RouterLink to="/employer/jobs/create">发布岗位</RouterLink>
        </template>
      </nav>
      <div class="actions">
        <RouterLink v-if="!authStore.isLoggedIn" to="/login">登录</RouterLink>
        <RouterLink v-if="!authStore.isLoggedIn" to="/register">注册</RouterLink>
        <RouterLink v-if="authStore.isLoggedIn" to="/my/profile">个人中心</RouterLink>
        <button v-if="authStore.isLoggedIn" @click="handleLogout">退出</button>
      </div>
    </header>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
}
.header {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: #0f172a;
  color: #fff;
}
.brand {
  color: #fff;
  text-decoration: none;
  font-weight: 700;
}
.nav,
.actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.nav a,
.actions a {
  color: #dbeafe;
  text-decoration: none;
  font-size: 14px;
}
.nav a.router-link-active,
.actions a.router-link-active {
  color: #93c5fd;
}
button {
  border: 1px solid #60a5fa;
  background: transparent;
  color: #dbeafe;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
}
.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px;
}
</style>
