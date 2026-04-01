<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getMyComplaints } from '@/api/complaints';

type Row = {
  id: number;
  type: string;
  status: string;
  description: string;
  handleNote?: string | null;
  createdAt: string;
  job?: { title?: string };
};

const loading = ref(false);
const error = ref('');
const list = ref<Row[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getMyComplaints({ page: page.value, pageSize });
    list.value = data.list as Row[];
    total.value = data.total;
  } catch {
    error.value = '加载投诉列表失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>我的投诉</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <table v-if="!loading && list.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>岗位</th>
          <th>类型</th>
          <th>状态</th>
          <th>处理备注</th>
          <th>创建时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>#{{ item.id }}</td>
          <td>{{ item.job?.title ?? '-' }}</td>
          <td>{{ item.type }}</td>
          <td>{{ item.status }}</td>
          <td>{{ item.handleNote ?? '-' }}</td>
          <td>{{ String(item.createdAt).slice(0, 10) }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">暂无投诉记录</p>

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
      <span>第 {{ page }} / {{ totalPages }} 页</span>
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
.table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e2e8f0;
}
th,
td {
  border-bottom: 1px solid #e2e8f0;
  padding: 10px;
  text-align: left;
}
.pager {
  display: flex;
  gap: 10px;
  align-items: center;
}
.error {
  color: #dc2626;
}
</style>
