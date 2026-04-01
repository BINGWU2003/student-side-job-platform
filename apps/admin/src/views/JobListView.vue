<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getAdminJobs } from '@/api/jobs';
import type { AdminJobItem } from '@/api/jobs';
import type { JobStatus, JobType, SalaryType } from '@student-side-job-platform/shared-types';

const statusLabelMap: Record<JobStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  CLOSED: '已关闭',
};
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

const loading = ref(false);
const error = ref('');
const list = ref<AdminJobItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const status = ref<JobStatus | ''>('');
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getAdminJobs({
      page: page.value,
      pageSize,
      status: status.value || undefined,
    });
    list.value = data.list;
    total.value = data.total;
  } catch {
    error.value = '加载岗位列表失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>岗位管理</h1>

    <div class="toolbar">
      <select
        v-model="status"
        @change="
          page = 1;
          load();
        "
      >
        <option value="">全部状态</option>
        <option value="PENDING">待审核</option>
        <option value="APPROVED">已通过</option>
        <option value="REJECTED">已拒绝</option>
        <option value="CLOSED">已关闭</option>
      </select>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <table v-if="!loading && list.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>标题</th>
          <th>雇主</th>
          <th>类型</th>
          <th>薪资</th>
          <th>状态</th>
          <th>工作地点</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>#{{ item.id }}</td>
          <td>{{ item.title }}</td>
          <td>{{ item.employer?.username ?? '-' }}</td>
          <td>{{ typeLabelMap[item.type] }}</td>
          <td>{{ item.salary }}（{{ salaryTypeLabelMap[item.salaryType] }}）</td>
          <td>{{ statusLabelMap[item.status] }}</td>
          <td>{{ item.location }}</td>
          <td>
            <RouterLink :to="`/jobs/${item.id}`">
              详情{{ item.status === 'PENDING' ? '/审核' : '' }}
            </RouterLink>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">暂无岗位数据</p>

    <div class="pager">
      <button
        :disabled="page <= 1"
        @click="
          page -= 1;
          load();
        "
      >
        上一页
      </button>
      <span>第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条</span>
      <button
        :disabled="page >= totalPages"
        @click="
          page += 1;
          load();
        "
      >
        下一页
      </button>
    </div>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 12px;
}
.toolbar {
  display: flex;
  gap: 10px;
}
select,
button {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 10px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e5e7eb;
}
th,
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
}
.pager {
  display: flex;
  gap: 12px;
  align-items: center;
}
.error {
  color: #dc2626;
}
</style>
