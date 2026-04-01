<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getAdminUsers, updateAdminUserStatus } from '@/api/users';
import type { Role, UserInfo, UserStatus } from '@student-side-job-platform/shared-types';

const roleLabelMap: Record<Role, string> = {
  ADMIN: '管理员',
  EMPLOYER: '雇主',
  STUDENT: '学生',
};
const statusLabelMap: Record<UserStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '禁用',
};

const loading = ref(false);
const error = ref('');
const success = ref('');
const list = ref<UserInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const role = ref<Role | ''>('');
const status = ref<UserStatus | ''>('');
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getAdminUsers({
      page: page.value,
      pageSize,
      role: role.value || undefined,
      status: status.value || undefined,
    });
    list.value = data.list;
    total.value = data.total;
  } catch {
    error.value = '加载用户列表失败';
  } finally {
    loading.value = false;
  }
}

async function toggleStatus(item: UserInfo) {
  const nextStatus: UserStatus = item.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  error.value = '';
  success.value = '';
  try {
    await updateAdminUserStatus(item.id, nextStatus);
    success.value = nextStatus === 'DISABLED' ? '用户已禁用' : '用户已启用';
    await load();
  } catch {
    error.value = '更新用户状态失败';
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>用户管理</h1>

    <div class="toolbar">
      <select
        v-model="role"
        @change="
          page = 1;
          load();
        "
      >
        <option value="">全部角色</option>
        <option value="STUDENT">学生</option>
        <option value="EMPLOYER">雇主</option>
        <option value="ADMIN">管理员</option>
      </select>
      <select
        v-model="status"
        @change="
          page = 1;
          load();
        "
      >
        <option value="">全部状态</option>
        <option value="ACTIVE">启用</option>
        <option value="DISABLED">禁用</option>
      </select>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>
    <p v-if="loading">加载中...</p>

    <table v-if="!loading && list.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>用户名</th>
          <th>手机号</th>
          <th>角色</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>#{{ item.id }}</td>
          <td>{{ item.username }}</td>
          <td>{{ item.phone }}</td>
          <td>{{ roleLabelMap[item.role] }}</td>
          <td>{{ statusLabelMap[item.status] }}</td>
          <td class="actions">
            <RouterLink :to="`/users/${item.id}`">详情</RouterLink>
            <button @click="toggleStatus(item)">
              {{ item.status === 'ACTIVE' ? '禁用' : '启用' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">暂无用户数据</p>

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
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.pager {
  display: flex;
  gap: 12px;
  align-items: center;
}
.error {
  color: #dc2626;
}
.success {
  color: #16a34a;
}
</style>
