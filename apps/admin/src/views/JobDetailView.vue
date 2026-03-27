<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAdminJob, reviewAdminJob } from '@/api/jobs';
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

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const actionLoading = ref(false);
const error = ref('');
const reviewError = ref('');
const success = ref('');
const detail = ref<AdminJobItem | null>(null);
const rejectReason = ref('');
const isPending = computed(() => detail.value?.status === 'PENDING');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    detail.value = await getAdminJob(Number(route.params.id));
  } catch {
    error.value = '加载岗位详情失败';
  } finally {
    loading.value = false;
  }
}

async function handleApprove() {
  if (!detail.value) return;
  actionLoading.value = true;
  reviewError.value = '';
  success.value = '';
  try {
    detail.value = await reviewAdminJob(detail.value.id, { action: 'approve' });
    success.value = '已审核通过';
  } catch {
    reviewError.value = '审核通过失败';
  } finally {
    actionLoading.value = false;
  }
}

async function handleReject() {
  if (!detail.value) return;
  if (!rejectReason.value.trim()) {
    reviewError.value = '请填写拒绝原因';
    return;
  }
  actionLoading.value = true;
  reviewError.value = '';
  success.value = '';
  try {
    detail.value = await reviewAdminJob(detail.value.id, { action: 'reject', reason: rejectReason.value.trim() });
    success.value = '已审核拒绝';
  } catch {
    reviewError.value = '审核拒绝失败';
  } finally {
    actionLoading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <button class="back" @click="router.push('/jobs')">返回岗位列表</button>
    <p v-if="loading">加载中...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <article v-if="detail" class="card">
      <h1>{{ detail.title }}</h1>
      <p>状态：{{ statusLabelMap[detail.status] }}</p>
      <p>类型：{{ typeLabelMap[detail.type] }}</p>
      <p>工作地点：{{ detail.location }}</p>
      <p>薪资：{{ detail.salary }}（{{ salaryTypeLabelMap[detail.salaryType] }}）</p>
      <p>招募人数：{{ detail.headcount }}</p>
      <p>开始日期：{{ String(detail.startDate).slice(0, 10) }}</p>
      <p>结束日期：{{ String(detail.endDate).slice(0, 10) }}</p>
      <p>截止日期：{{ String(detail.deadline).slice(0, 10) }}</p>
      <p>岗位描述：{{ detail.description }}</p>
      <p>岗位要求：{{ detail.requirement || '无' }}</p>
      <p v-if="detail.rejectReason">驳回原因：{{ detail.rejectReason }}</p>

      <section class="sub">
        <h3>雇主信息</h3>
        <p>用户名：{{ detail.employer?.username ?? '-' }}</p>
        <p>手机号：{{ detail.employer?.phone ?? '-' }}</p>
        <p>企业名称：{{ detail.employer?.employerProfile?.companyName ?? '-' }}</p>
        <p>联系人：{{ detail.employer?.employerProfile?.contactName ?? '-' }}</p>
      </section>

      <section v-if="isPending" class="review">
        <h3>审核操作</h3>
        <textarea v-model="rejectReason" rows="3" placeholder="拒绝时请填写原因"></textarea>
        <p v-if="reviewError" class="error">{{ reviewError }}</p>
        <p v-if="success" class="success">{{ success }}</p>
        <div class="actions">
          <button :disabled="actionLoading" @click="handleApprove">通过</button>
          <button :disabled="actionLoading" class="danger" @click="handleReject">拒绝</button>
        </div>
      </section>
    </article>
  </section>
</template>

<style scoped>
.page { display: grid; gap: 12px; }
.back { width: fit-content; border: 1px solid #d1d5db; background: #fff; border-radius: 6px; padding: 6px 10px; }
.card { display: grid; gap: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
.sub, .review { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e5e7eb; display: grid; gap: 6px; }
textarea { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; }
.actions { display: flex; gap: 10px; }
button { border: 1px solid #2563eb; background: #2563eb; color: #fff; border-radius: 6px; padding: 6px 12px; }
button.danger { background: #ef4444; border-color: #ef4444; }
.error { color: #dc2626; }
.success { color: #16a34a; }
</style>
