<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getDashboard, type DashboardData } from '@/api/dashboard';

const loading = ref(false);
const error = ref('');
const data = ref<DashboardData | null>(null);

const maxUserCount = () => Math.max(1, ...(data.value?.chart.users.counts ?? [0]));
const maxJobCount = () => Math.max(1, ...(data.value?.chart.jobs.counts ?? [0]));

async function load() {
  loading.value = true;
  error.value = '';
  try {
    data.value = await getDashboard();
  } catch {
    error.value = '加载仪表盘数据失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>仪表盘</h1>
    <p v-if="loading">加载中...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="data && !loading">
      <div class="cards">
        <article class="card">
          <h3>用户总数</h3>
          <p>{{ data.users.total }}</p>
        </article>
        <article class="card">
          <h3>岗位总数</h3>
          <p>{{ data.jobs.total }}</p>
        </article>
        <article class="card">
          <h3>申请总数</h3>
          <p>{{ data.applications.total }}</p>
        </article>
      </div>

      <div class="cards">
        <article class="card">
          <h3>学生</h3>
          <p>{{ data.users.students }}</p>
        </article>
        <article class="card">
          <h3>雇主</h3>
          <p>{{ data.users.employers }}</p>
        </article>
        <article class="card">
          <h3>待审核岗位</h3>
          <p>{{ data.jobs.pending }}</p>
        </article>
      </div>

      <div class="charts">
        <article class="chart-card">
          <h3>近 7 天新增用户</h3>
          <div class="bars">
            <div v-for="(count, idx) in data.chart.users.counts" :key="`u-${idx}`" class="bar-item">
              <div class="bar" :style="{ height: `${(count / maxUserCount()) * 100}%` }"></div>
              <small>{{ data.chart.users.dates[idx] }}</small>
              <strong>{{ count }}</strong>
            </div>
          </div>
        </article>

        <article class="chart-card">
          <h3>近 7 天新增岗位</h3>
          <div class="bars">
            <div v-for="(count, idx) in data.chart.jobs.counts" :key="`j-${idx}`" class="bar-item">
              <div class="bar green" :style="{ height: `${(count / maxJobCount()) * 100}%` }"></div>
              <small>{{ data.chart.jobs.dates[idx] }}</small>
              <strong>{{ count }}</strong>
            </div>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 14px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
}
.card h3 {
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 8px;
}
.card p {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}
.charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.chart-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
}
.bars {
  height: 200px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  align-items: end;
  margin-top: 8px;
}
.bar-item {
  display: grid;
  justify-items: center;
  gap: 4px;
}
.bar {
  width: 100%;
  background: #2563eb;
  border-radius: 6px 6px 0 0;
  min-height: 2px;
}
.bar.green {
  background: #16a34a;
}
small {
  font-size: 11px;
  color: #6b7280;
}
strong {
  font-size: 11px;
  color: #111827;
}
.error {
  color: #dc2626;
}
@media (max-width: 1000px) {
  .cards,
  .charts {
    grid-template-columns: 1fr;
  }
}
</style>
