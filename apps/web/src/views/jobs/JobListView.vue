<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getJobList } from '@/api/jobs';
import { useAuthStore } from '@/stores/auth';
import type { JobItem, JobType, SalaryType } from '@student-side-job-platform/shared-types';

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

const authStore = useAuthStore();
const loading = ref(false);
const error = ref('');
const list = ref<JobItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const type = ref<JobType | ''>('');
const location = ref('');
const sort = ref<'latest' | 'oldest'>('latest');

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
const isStudent = computed(() => authStore.role === 'STUDENT');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getJobList({
      page: page.value,
      pageSize,
      sort: sort.value,
      type: type.value || undefined,
      location: location.value || undefined,
    });
    list.value = data.list;
    total.value = data.total;
  } catch {
    error.value = '加载岗位列表失败';
  } finally {
    loading.value = false;
  }
}

function prevPage() {
  if (page.value <= 1) return;
  page.value -= 1;
  void load();
}

function nextPage() {
  if (page.value >= totalPages.value) return;
  page.value += 1;
  void load();
}

function applyFilters() {
  page.value = 1;
  void load();
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>岗位列表</h1>

    <div class="filters">
      <select v-model="type" @change="applyFilters">
        <option value="">全部类型</option>
        <option value="PROMOTION">促销导购</option>
        <option value="TUTORING">家教辅导</option>
        <option value="EVENT">活动策划</option>
        <option value="CATERING">餐饮服务</option>
        <option value="OTHER">其他</option>
      </select>
      <input v-model="location" placeholder="工作地点" @keyup.enter="applyFilters" />
      <select v-model="sort" @change="applyFilters">
        <option value="latest">最新发布</option>
        <option value="oldest">最早发布</option>
      </select>
      <button @click="applyFilters">搜索</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <div v-else class="cards">
      <article v-for="job in list" :key="job.id" class="card">
        <h3>
          <RouterLink :to="`/jobs/${job.id}`">{{ job.title }}</RouterLink>
        </h3>
        <p>{{ job.location }} · {{ typeLabelMap[job.type] }}</p>
        <p>薪资：{{ job.salary }}（{{ salaryTypeLabelMap[job.salaryType] }}）</p>
        <p>招募人数：{{ job.headcount }}</p>
        <RouterLink :to="`/jobs/${job.id}`" class="link">查看详情</RouterLink>
      </article>
      <p v-if="!list.length">没有找到岗位</p>
    </div>

    <div class="pager">
      <button :disabled="page <= 1" @click="prevPage">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button :disabled="page >= totalPages" @click="nextPage">下一页</button>
    </div>

    <p v-if="isStudent" class="hint">提示：学生登录后可申请和收藏岗位</p>
  </section>
</template>

<style scoped>
.page { display: grid; gap: 14px; }
.filters { display: flex; gap: 8px; flex-wrap: wrap; }
input, select, button { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; }
button { background: #0f172a; color: #fff; border-color: #0f172a; cursor: pointer; }
.cards { display: grid; gap: 10px; }
.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
.link { color: #2563eb; text-decoration: none; }
.pager { display: flex; align-items: center; gap: 10px; }
.hint { color: #64748b; font-size: 13px; }
.error { color: #dc2626; }
</style>
