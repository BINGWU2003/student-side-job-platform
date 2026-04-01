<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { getAdminComplaints, handleAdminComplaint } from '@/api/complaints';
import type { AdminComplaintItem } from '@/api/complaints';
import type { CmplStatus, CmplType } from '@student-side-job-platform/shared-types';

const statusLabelMap: Record<CmplStatus, string> = {
  PENDING: '待处理',
  RESOLVED: '已解决',
  DISMISSED: '已驳回',
};
const typeLabelMap: Record<CmplType, string> = {
  FAKE_INFO: '虚假信息',
  ILLEGAL_CONTENT: '违法违规内容',
  OTHER: '其他',
};

const loading = ref(false);
const error = ref('');
const success = ref('');
const list = ref<AdminComplaintItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const status = ref<CmplStatus | ''>('');
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

const current = ref<AdminComplaintItem | null>(null);
const form = reactive<{ status: 'RESOLVED' | 'DISMISSED'; note: string; closeJob: boolean }>({
  status: 'RESOLVED',
  note: '',
  closeJob: false,
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getAdminComplaints({
      page: page.value,
      pageSize,
      status: status.value || undefined,
    });
    list.value = data.list;
    total.value = data.total;
  } catch {
    error.value = '加载投诉列表失败';
  } finally {
    loading.value = false;
  }
}

function openHandle(item: AdminComplaintItem) {
  current.value = item;
  form.status = 'RESOLVED';
  form.note = '';
  form.closeJob = false;
}

async function submitHandle() {
  if (!current.value) return;
  error.value = '';
  success.value = '';
  try {
    await handleAdminComplaint(current.value.id, {
      status: form.status,
      note: form.note.trim() || undefined,
      closeJob: form.closeJob,
    });
    success.value = '投诉处理成功';
    current.value = null;
    await load();
  } catch {
    error.value = '处理投诉失败';
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>投诉管理</h1>

    <div class="toolbar">
      <select
        v-model="status"
        @change="
          page = 1;
          load();
        "
      >
        <option value="">全部状态</option>
        <option value="PENDING">待处理</option>
        <option value="RESOLVED">已解决</option>
        <option value="DISMISSED">已驳回</option>
      </select>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>
    <p v-if="loading">加载中...</p>

    <table v-if="!loading && list.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>岗位</th>
          <th>投诉人</th>
          <th>类型</th>
          <th>状态</th>
          <th>处理备注</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>#{{ item.id }}</td>
          <td>{{ item.job?.title || '-' }}</td>
          <td>{{ item.student?.username || '-' }}</td>
          <td>{{ typeLabelMap[item.type] }}</td>
          <td>{{ statusLabelMap[item.status] }}</td>
          <td>{{ item.handleNote || '-' }}</td>
          <td>
            <button v-if="item.status === 'PENDING'" @click="openHandle(item)">处理</button>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">暂无投诉数据</p>

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

    <div v-if="current" class="mask" @click.self="current = null">
      <div class="modal">
        <h3>处理投诉 #{{ current.id }}</h3>
        <p>岗位：{{ current.job?.title || '-' }}</p>
        <p>描述：{{ current.description }}</p>

        <label>
          处理结果
          <select v-model="form.status">
            <option value="RESOLVED">已解决</option>
            <option value="DISMISSED">驳回投诉</option>
          </select>
        </label>
        <label>
          处理备注
          <textarea v-model="form.note" rows="4" placeholder="可选"></textarea>
        </label>
        <label>
          <input v-model="form.closeJob" type="checkbox" />
          同时关闭该岗位
        </label>

        <div class="actions">
          <button @click="current = null">取消</button>
          <button @click="submitHandle">确认处理</button>
        </div>
      </div>
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
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
}
.modal {
  width: min(680px, calc(100vw - 24px));
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  display: grid;
  gap: 10px;
}
label {
  display: grid;
  gap: 6px;
}
textarea {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px;
  font: inherit;
}
.actions {
  display: flex;
  gap: 8px;
}
.error {
  color: #dc2626;
}
.success {
  color: #16a34a;
}
</style>
