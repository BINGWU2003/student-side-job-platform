<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getEmployerJob, updateEmployerJob } from '@/api/jobs';
import { updateJobSchema } from '@student-side-job-platform/shared-schemas';

type JobType = 'PROMOTION' | 'TUTORING' | 'EVENT' | 'CATERING' | 'OTHER';
type SalaryType = 'HOURLY' | 'TOTAL';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const error = ref('');

const form = reactive({
  title: '',
  type: 'OTHER' as JobType,
  description: '',
  location: '',
  salary: 0,
  salaryType: 'TOTAL' as SalaryType,
  headcount: 1,
  startDate: '',
  endDate: '',
  deadline: '',
  requirement: '',
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const job = await getEmployerJob(Number(route.params.id));
    Object.assign(form, {
      title: job.title,
      type: job.type,
      description: job.description,
      location: job.location,
      salary: job.salary,
      salaryType: job.salaryType,
      headcount: job.headcount,
      startDate: String(job.startDate).slice(0, 10),
      endDate: String(job.endDate).slice(0, 10),
      deadline: String(job.deadline).slice(0, 10),
      requirement: job.requirement ?? '',
    });
  } catch {
    error.value = '加载岗位失败';
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  const parsed = updateJobSchema.safeParse({ ...form, requirement: form.requirement || undefined });
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? '表单参数不合法';
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    await updateEmployerJob(Number(route.params.id), parsed.data as Record<string, unknown>);
    router.push('/employer/jobs');
  } catch {
    error.value = '更新岗位失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>编辑岗位</h1>
    <p v-if="loading">加载中...</p>
    <form class="form" @submit.prevent="handleSubmit">
      <label>
        标题
        <input v-model="form.title" placeholder="岗位名称" />
      </label>
      <label>
        类型
        <select v-model="form.type">
          <option value="PROMOTION">促销导购</option>
          <option value="TUTORING">家教辅导</option>
          <option value="EVENT">活动策划</option>
          <option value="CATERING">餐饮服务</option>
          <option value="OTHER">其他</option>
        </select>
      </label>
      <label>
        简介
        <textarea v-model="form.description" placeholder="岗位描述" />
      </label>
      <label>
        工作地点
        <input v-model="form.location" placeholder="工作地点" />
      </label>
      <label>
        薪资
        <input v-model.number="form.salary" type="number" min="1" />
      </label>
      <label>
        薪资类型
        <select v-model="form.salaryType">
          <option value="HOURLY">时薪</option>
          <option value="TOTAL">总薪</option>
        </select>
      </label>
      <label>
        招募人数
        <input v-model.number="form.headcount" type="number" min="1" />
      </label>
      <label>
        开始日期
        <input v-model="form.startDate" type="date" />
      </label>
      <label>
        结束日期
        <input v-model="form.endDate" type="date" />
      </label>
      <label>
        截止日期
        <input v-model="form.deadline" type="date" />
      </label>
      <label>
        岗位要求
        <textarea v-model="form.requirement" placeholder="可选" />
      </label>

      <p v-if="error" class="error">{{ error }}</p>
      <button :disabled="loading">{{ loading ? '保存中...' : '保存' }}</button>
    </form>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 12px;
}
.form {
  display: grid;
  gap: 10px;
  max-width: 680px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
}
label {
  display: grid;
  gap: 4px;
  font-size: 13px;
  color: #334155;
}
input,
textarea,
select {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px;
  font: inherit;
}
button {
  width: 140px;
  padding: 8px;
  border: 0;
  border-radius: 8px;
  background: #0f172a;
  color: #fff;
}
.error {
  color: #dc2626;
}
</style>
