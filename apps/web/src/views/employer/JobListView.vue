<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { closeEmployerJob, getEmployerJobs } from '@/api/jobs';
import type { JobItem, JobStatus } from '@student-side-job-platform/shared-types';

const statusLabelMap: Record<JobStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  CLOSED: '已关闭',
};

const router = useRouter();
const loading = ref(false);
const error = ref('');
const list = ref<JobItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const status = ref<JobStatus | ''>('');
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getEmployerJobs({ page: page.value, pageSize, status: status.value || undefined });
    list.value = data.list;
    total.value = data.total;
  } catch {
    error.value = '加载岗位列表失败';
  } finally {
    loading.value = false;
  }
}

async function handleClose(id: number) {
  await closeEmployerJob(id);
  await load();
}

function goEdit(id: number) {
  router.push(`/employer/jobs/${id}/edit`);
}

function goApplications(id: number) {
  router.push(`/employer/jobs/${id}/applications`);
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>我的岗位</h1>
    <div class="toolbar">
      <select v-model="status" @change="page = 1; load()">
        <option value="">全部状态</option>
        <option value="PENDING">待审核</option>
        <option value="APPROVED">已通过</option>
        <option value="REJECTED">已拒绝</option>
        <option value="CLOSED">已关闭</option>
      </select>
      <RouterLink to="/employer/jobs/create" class="create">发布岗位</RouterLink>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <table v-if="!loading && list.length" class="table">
      <thead>
        <tr>
          <th>标题</th>
          <th>状态</th>
          <th>工作地点</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="job in list" :key="job.id">
          <td>{{ job.title }}</td>
          <td>{{ statusLabelMap[job.status] }}</td>
          <td>{{ job.location }}</td>
          <td class="actions">
            <button @click="goApplications(job.id)">申请管理</button>
            <button v-if="job.status === 'PENDING' || job.status === 'REJECTED'" @click="goEdit(job.id)">编辑</button>
            <button v-if="job.status === 'APPROVED'" @click="handleClose(job.id)">关闭</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">暂无岗位记录</p>

    <div class="pager">
      <button :disabled="page <= 1" @click="page -= 1; load()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button :disabled="page >= totalPages" @click="page += 1; load()">下一页</button>
    </div>
  </section>
</template>

<style scoped>
.page { display: grid; gap: 12px; }
.toolbar { display: flex; gap: 8px; align-items: center; }
select, .create, button { border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 10px; background: #fff; text-decoration: none; color: #111827; }
.table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; }
th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
.actions { display: flex; gap: 8px; }
.pager { display: flex; gap: 10px; align-items: center; }
.error { color: #dc2626; }
</style>
