<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAdminUserDetail } from '@/api/users';
import type { AdminUserDetail } from '@/api/users';
import type { Role, UserStatus } from '@student-side-job-platform/shared-types';

const roleLabelMap: Record<Role, string> = {
  ADMIN: '管理员',
  EMPLOYER: '雇主',
  STUDENT: '学生',
};
const statusLabelMap: Record<UserStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '禁用',
};

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const error = ref('');
const detail = ref<AdminUserDetail | null>(null);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    detail.value = await getAdminUserDetail(Number(route.params.id));
  } catch {
    error.value = '加载用户详情失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <button class="back" @click="router.push('/users')">返回用户列表</button>
    <p v-if="loading">加载中...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <article v-if="detail" class="card">
      <h1>{{ detail.username }}</h1>
      <p>用户 ID：#{{ detail.id }}</p>
      <p>角色：{{ roleLabelMap[detail.role] }}</p>
      <p>状态：{{ statusLabelMap[detail.status] }}</p>
      <p>手机号：{{ detail.phone }}</p>
      <p>注册时间：{{ String(detail.createdAt).slice(0, 10) }}</p>

      <section v-if="detail.studentProfile" class="sub">
        <h3>学生资料</h3>
        <p>姓名：{{ detail.studentProfile.realName || '-' }}</p>
        <p>学号：{{ detail.studentProfile.studentNo || '-' }}</p>
        <p>学校：{{ detail.studentProfile.school || '-' }}</p>
        <p>专业：{{ detail.studentProfile.major || '-' }}</p>
      </section>

      <section v-if="detail.employerProfile" class="sub">
        <h3>雇主资料</h3>
        <p>企业名称：{{ detail.employerProfile.companyName || '-' }}</p>
        <p>联系人：{{ detail.employerProfile.contactName || '-' }}</p>
        <p>简介：{{ detail.employerProfile.description || '-' }}</p>
      </section>

      <section class="sub">
        <h3>收到的评价</h3>
        <table v-if="detail.reviews.length" class="table">
          <thead>
            <tr>
              <th>评分</th>
              <th>评价内容</th>
              <th>评价人</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in detail.reviews" :key="item.id">
              <td>{{ item.rating }}</td>
              <td>{{ item.comment || '-' }}</td>
              <td>{{ item.fromUser?.username || '-' }}</td>
              <td>{{ String(item.createdAt).slice(0, 10) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else>暂无评价</p>
      </section>
    </article>
  </section>
</template>

<style scoped>
.page { display: grid; gap: 12px; }
.back { width: fit-content; border: 1px solid #d1d5db; background: #fff; border-radius: 6px; padding: 6px 10px; }
.card { display: grid; gap: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
.sub { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e5e7eb; display: grid; gap: 6px; }
.table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; }
.error { color: #dc2626; }
</style>
