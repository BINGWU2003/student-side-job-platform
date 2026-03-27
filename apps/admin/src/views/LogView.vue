<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getAdminLogs } from '@/api/logs';
import type { AdminLogRow } from '@/api/logs';

const actionLabelMap: Record<string, string> = {
  APPROVE_JOB: '通过岗位审核',
  REJECT_JOB: '拒绝岗位审核',
  DISABLE_USER: '禁用用户',
  ENABLE_USER: '启用用户',
  RESOLVE_COMPLAINT: '处理投诉-已解决',
  DISMISS_COMPLAINT: '处理投诉-已驳回',
};

const loading = ref(false);
const error = ref('');
const list = ref<AdminLogRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const startDate = ref('');
const endDate = ref('');
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getAdminLogs({
      page: page.value,
      pageSize,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined,
    });
    list.value = data.list;
    total.value = data.total;
  } catch {
    error.value = '加载操作日志失败';
  } finally {
    loading.value = false;
  }
}

function applyFilter() {
  page.value = 1;
  void load();
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>操作日志</h1>

    <div class="toolbar">
      <label>
        开始日期
        <input v-model="startDate" type="date" />
      </label>
      <label>
        结束日期
        <input v-model="endDate" type="date" />
      </label>
      <button @click="applyFilter">筛选</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <table v-if="!loading && list.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>管理员</th>
          <th>操作</th>
          <th>目标</th>
          <th>备注</th>
          <th>时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>#{{ item.id }}</td>
          <td>{{ item.admin?.username || '-' }}</td>
          <td>{{ actionLabelMap[item.action] || item.action }}</td>
          <td>{{ item.targetType || '-' }} {{ item.targetId ? `#${item.targetId}` : '' }}</td>
          <td>{{ item.note || '-' }}</td>
          <td>{{ String(item.createdAt).replace('T', ' ').slice(0, 19) }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">暂无日志数据</p>

    <div class="pager">
      <button :disabled="page <= 1" @click="page -= 1; load()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条</span>
      <button :disabled="page >= totalPages" @click="page += 1; load()">下一页</button>
    </div>
  </section>
</template>

<style scoped>
.page { display: grid; gap: 12px; }
.toolbar { display: flex; gap: 12px; align-items: end; flex-wrap: wrap; }
label { display: grid; gap: 4px; font-size: 13px; color: #374151; }
input, button { border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 10px; }
.table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
.pager { display: flex; gap: 12px; align-items: center; }
.error { color: #dc2626; }
</style>
