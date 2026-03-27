<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getAnnouncements } from '@/api/announcements';
import type { AnnouncementItem } from '@student-side-job-platform/shared-types';

const loading = ref(false);
const error = ref('');
const list = ref<AnnouncementItem[]>([]);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    list.value = await getAnnouncements();
  } catch {
    error.value = '加载公告列表失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>公告列表</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <ul v-if="!loading && list.length" class="list">
      <li v-for="item in list" :key="item.id" class="card">
        <RouterLink :to="`/announcements/${item.id}`">{{ item.title }}</RouterLink>
        <small>{{ String(item.createdAt).slice(0, 10) }}</small>
      </li>
    </ul>

    <p v-else-if="!loading">暂无公告</p>
  </section>
</template>

<style scoped>
.page { display: grid; gap: 12px; }
.list { display: grid; gap: 10px; }
.card { list-style: none; display: grid; gap: 4px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
.card a { color: #111827; text-decoration: none; font-weight: 600; }
small { color: #64748b; }
.error { color: #dc2626; }
</style>
