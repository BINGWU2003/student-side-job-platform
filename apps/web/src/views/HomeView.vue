<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getAnnouncements } from '@/api/announcements';
import { getJobList } from '@/api/jobs';
import type { AnnouncementItem, JobItem, JobType } from '@student-side-job-platform/shared-types';

const typeLabelMap: Record<JobType, string> = {
  PROMOTION: '促销导购',
  TUTORING: '家教辅导',
  EVENT: '活动策划',
  CATERING: '餐饮服务',
  OTHER: '其他',
};

const loading = ref(false);
const error = ref('');
const announcements = ref<AnnouncementItem[]>([]);
const latestJobs = ref<JobItem[]>([]);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [a, j] = await Promise.all([
      getAnnouncements(),
      getJobList({ page: 1, pageSize: 6, sort: 'latest' }),
    ]);
    announcements.value = a;
    latestJobs.value = j.list;
  } catch {
    error.value = '加载首页数据失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="home">
    <header class="hero">
      <h1>校园兼职平台</h1>
      <p>面向学生与雇主的可信兼职平台，支持岗位浏览、申请、录用与评价全流程。</p>
      <div class="cta">
        <RouterLink to="/jobs">浏览岗位</RouterLink>
        <RouterLink to="/register">创建账号</RouterLink>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <section class="grid" v-else>
      <article class="panel">
        <div class="panel-head">
          <h2>最新公告</h2>
          <RouterLink to="/announcements">查看全部</RouterLink>
        </div>
        <ul class="list">
          <li v-for="item in announcements" :key="item.id">
            <RouterLink :to="`/announcements/${item.id}`">{{ item.title }}</RouterLink>
          </li>
          <li v-if="!announcements.length">暂无公告</li>
        </ul>
      </article>

      <article class="panel">
        <div class="panel-head">
          <h2>最新岗位</h2>
          <RouterLink to="/jobs">查看全部</RouterLink>
        </div>
        <ul class="list">
          <li v-for="job in latestJobs" :key="job.id">
            <RouterLink :to="`/jobs/${job.id}`">{{ job.title }}</RouterLink>
            <span class="meta">{{ job.location }} · {{ typeLabelMap[job.type] }}</span>
          </li>
          <li v-if="!latestJobs.length">暂无岗位</li>
        </ul>
      </article>
    </section>
  </section>
</template>

<style scoped>
.home { display: grid; gap: 18px; }
.hero { background: linear-gradient(120deg, #0f172a, #1e293b); color: #fff; border-radius: 14px; padding: 24px; }
.hero h1 { margin-bottom: 8px; }
.cta { margin-top: 12px; display: flex; gap: 10px; }
.cta a { color: #fff; text-decoration: none; border: 1px solid rgba(255,255,255,.35); border-radius: 8px; padding: 8px 12px; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.panel-head a { color: #2563eb; text-decoration: none; }
.list { display: grid; gap: 8px; }
.list li { list-style: none; }
.list a { color: #0f172a; text-decoration: none; }
.meta { display: block; color: #64748b; font-size: 12px; }
.error { color: #dc2626; }
@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
