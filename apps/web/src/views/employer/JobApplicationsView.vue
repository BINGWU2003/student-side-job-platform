<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getJobApplications, reviewApplication } from '@/api/applications';
import type { AppStatus } from '@student-side-job-platform/shared-types';

const statusLabelMap: Record<AppStatus, string> = {
  PENDING: '待处理',
  ACCEPTED: '已录用',
  REJECTED: '已拒绝',
};

type Row = {
  id: number;
  status: AppStatus;
  intro?: string | null;
  hasReviewed?: boolean;
  student?: {
    username?: string;
    phone?: string;
    studentProfile?: { school?: string | null; major?: string | null } | null;
  };
};

const route = useRoute();
const loading = ref(false);
const error = ref('');
const list = ref<Row[]>([]);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getJobApplications(Number(route.params.id), { page: 1, pageSize: 100 });
    list.value = data.list as Row[];
  } catch {
    error.value = '加载申请列表失败';
  } finally {
    loading.value = false;
  }
}

async function handleReview(id: number, action: 'accept' | 'reject') {
  await reviewApplication(id, action);
  await load();
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>申请管理</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <table v-if="!loading && list.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>学生</th>
          <th>状态</th>
          <th>自我介绍</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>#{{ item.id }}</td>
          <td>{{ item.student?.username ?? '-' }}</td>
          <td>{{ statusLabelMap[item.status] }}</td>
          <td>{{ item.intro ?? '-' }}</td>
          <td class="actions">
            <button :disabled="item.status !== 'PENDING'" @click="handleReview(item.id, 'accept')">录用</button>
            <button :disabled="item.status !== 'PENDING'" @click="handleReview(item.id, 'reject')">拒绝</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">暂无申请记录</p>
  </section>
</template>

<style scoped>
.page { display: grid; gap: 12px; }
.table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; }
th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
.actions { display: flex; gap: 8px; }
button { border: 1px solid #94a3b8; border-radius: 6px; padding: 6px 10px; background: #fff; }
.error { color: #dc2626; }
</style>
