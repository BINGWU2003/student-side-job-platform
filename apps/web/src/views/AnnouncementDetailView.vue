<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getAnnouncementDetail } from '@/api/announcements';
import type { AnnouncementItem } from '@student-side-job-platform/shared-types';

const route = useRoute();
const loading = ref(false);
const error = ref('');
const detail = ref<AnnouncementItem | null>(null);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    detail.value = await getAnnouncementDetail(Number(route.params.id));
  } catch {
    error.value = '加载公告详情失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <article class="page">
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <template v-if="detail">
      <h1>{{ detail.title }}</h1>
      <p class="meta">发布时间 {{ String(detail.createdAt).slice(0, 10) }}</p>
      <p class="content">{{ detail.content }}</p>
    </template>
  </article>
</template>

<style scoped>
.page { display: grid; gap: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
.meta { color: #64748b; font-size: 13px; }
.content { white-space: pre-wrap; line-height: 1.65; }
.error { color: #dc2626; }
</style>
