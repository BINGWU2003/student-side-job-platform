<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getMyFavorites, removeFavorite } from '@/api/favorites';

type Row = { id: number; jobId: number; createdAt: string; job?: { id: number; title: string; location: string; status: string } };

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
    const data = await getMyFavorites({ page: page.value, pageSize });
    list.value = data.list as unknown as Row[];
    total.value = data.total;
  } catch {
    error.value = '加载收藏列表失败';
  } finally {
    loading.value = false;
  }
}

async function handleRemoveFavorite(jobId: number) {
  await removeFavorite(jobId);
  await load();
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1>我的收藏</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <ul v-if="!loading && list.length" class="list">
      <li v-for="item in list" :key="item.id" class="card">
        <div>
          <RouterLink :to="`/jobs/${item.job?.id ?? item.jobId}`">{{ item.job?.title ?? `岗位 #${item.jobId}` }}</RouterLink>
          <p>{{ item.job?.location ?? '-' }} · {{ item.job?.status ?? '-' }}</p>
        </div>
        <button @click="handleRemoveFavorite(item.jobId)">取消收藏</button>
      </li>
    </ul>

    <p v-else-if="!loading">暂无收藏记录</p>

    <div class="pager">
      <button :disabled="page <= 1" @click="page -= 1; load()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button :disabled="page >= totalPages" @click="page += 1; load()">下一页</button>
    </div>
  </section>
</template>

<style scoped>
.page { display: grid; gap: 12px; }
.list { display: grid; gap: 10px; }
.card { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e2e8f0; background: #fff; border-radius: 10px; }
button { border: 1px solid #ef4444; color: #ef4444; background: #fff; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
.pager { display: flex; gap: 10px; align-items: center; }
.error { color: #dc2626; }
</style>
