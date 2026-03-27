<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { deleteApplication, getMyApplications } from '@/api/applications';
import { submitReview } from '@/api/reviews';
import type { ApplicationItem, AppStatus } from '@student-side-job-platform/shared-types';

type Row = ApplicationItem & { job?: { title?: string; endDate?: string } };

const statusLabelMap: Record<AppStatus, string> = {
  PENDING: '待处理',
  ACCEPTED: '已录用',
  REJECTED: '已拒绝',
};

const loading = ref(false);
const error = ref('');
const list = ref<Row[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

function canReview(item: Row) {
  if (item.status !== 'ACCEPTED' || item.hasReviewed) return false;
  const end = item.job?.endDate ? new Date(item.job.endDate).getTime() : 0;
  return end > 0 && end <= Date.now();
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getMyApplications({ page: page.value, pageSize });
    list.value = data.list as Row[];
    total.value = data.total;
  } catch {
    error.value = '加载申请列表失败';
  } finally {
    loading.value = false;
  }
}

async function handleWithdraw(id: number) {
  await deleteApplication(id);
  await load();
}

async function handleReview(id: number) {
  await submitReview({ applicationId: id, rating: 5, comment: '体验很好' });
  await load();
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>我的申请</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <table v-if="!loading && list.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>岗位</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>#{{ item.id }}</td>
          <td>{{ item.job?.title ?? '-' }}</td>
          <td>{{ statusLabelMap[item.status] }}</td>
          <td>{{ String(item.createdAt).slice(0, 10) }}</td>
          <td class="actions">
            <button v-if="item.status === 'PENDING'" @click="handleWithdraw(item.id)">撤回</button>
            <button v-if="canReview(item)" @click="handleReview(item.id)">评价</button>
            <span v-else-if="item.hasReviewed">已评价</span>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">暂无申请记录</p>

    <div class="pager">
      <button :disabled="page <= 1" @click="page -= 1; load()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button :disabled="page >= totalPages" @click="page += 1; load()">下一页</button>
    </div>
  </section>
</template>

<style scoped>
.page { display: grid; gap: 12px; }
.table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; }
th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
.actions { display: flex; gap: 8px; align-items: center; }
button { border: 1px solid #94a3b8; background: #fff; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
.pager { display: flex; gap: 10px; align-items: center; }
.error { color: #dc2626; }
</style>
