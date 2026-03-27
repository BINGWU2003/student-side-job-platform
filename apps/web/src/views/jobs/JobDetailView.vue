<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getJobDetail } from '@/api/jobs';
import { addFavorite, removeFavorite } from '@/api/favorites';
import { submitApplication } from '@/api/applications';
import { submitComplaint } from '@/api/complaints';
import { useAuthStore } from '@/stores/auth';
import type { JobDetail, JobType, SalaryType } from '@student-side-job-platform/shared-types';

const typeLabelMap: Record<JobType, string> = {
  PROMOTION: '促销导购',
  TUTORING: '家教辅导',
  EVENT: '活动策划',
  CATERING: '餐饮服务',
  OTHER: '其他',
};

const salaryTypeLabelMap: Record<SalaryType, string> = {
  HOURLY: '时薪',
  TOTAL: '总薪',
};

const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const error = ref('');
const feedback = ref('');
const detail = ref<JobDetail | null>(null);
const isStudent = computed(() => authStore.role === 'STUDENT');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    detail.value = await getJobDetail(Number(route.params.id));
  } catch {
    error.value = '加载岗位详情失败';
  } finally {
    loading.value = false;
  }
}

async function handleFavorite() {
  if (!detail.value) return;
  feedback.value = '';
  if (detail.value.isFavorited) {
    await removeFavorite(detail.value.id);
  } else {
    await addFavorite(detail.value.id);
  }
  feedback.value = '收藏状态已更新';
  await load();
}

async function handleApply() {
  if (!detail.value) return;
  feedback.value = '';
  await submitApplication(detail.value.id);
  feedback.value = '申请提交成功';
  await load();
}

async function handleComplaint() {
  if (!detail.value) return;
  feedback.value = '';
  await submitComplaint({ jobId: detail.value.id, type: 'OTHER', description: '用户投诉内容' });
  feedback.value = '投诉提交成功';
}

onMounted(load);
</script>

<template>
  <section class="page">
    <p v-if="loading">加载中...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <article v-if="detail" class="card">
      <h1>{{ detail.title }}</h1>
      <p>{{ detail.description }}</p>
      <p>工作地点：{{ detail.location }}</p>
      <p>岗位类型：{{ typeLabelMap[detail.type] }}</p>
      <p>薪资：{{ detail.salary }}（{{ salaryTypeLabelMap[detail.salaryType] }}）</p>
      <p>招募进度：{{ detail.acceptedCount ?? 0 }}/{{ detail.headcount }}</p>
      <p>截止日期：{{ String(detail.deadline).slice(0, 10) }}</p>

      <div v-if="isStudent" class="actions">
        <button @click="handleApply" :disabled="!!detail.hasApplied">{{ detail.hasApplied ? '已申请' : '申请' }}</button>
        <button @click="handleFavorite">{{ detail.isFavorited ? '取消收藏' : '收藏' }}</button>
        <button @click="handleComplaint">投诉</button>
      </div>

      <p v-if="feedback" class="ok">{{ feedback }}</p>
    </article>
  </section>
</template>

<style scoped>
.page { display: grid; gap: 12px; }
.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: grid; gap: 8px; }
.actions { display: flex; gap: 10px; margin-top: 8px; }
button { border: 1px solid #94a3b8; background: #fff; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.error { color: #dc2626; }
.ok { color: #16a34a; }
</style>
