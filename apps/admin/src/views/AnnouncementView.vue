<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { createAdminAnnouncement, deleteAdminAnnouncement, getAdminAnnouncements, updateAdminAnnouncement } from '@/api/announcements';
import type { AnnouncementItem } from '@student-side-job-platform/shared-types';

const loading = ref(false);
const error = ref('');
const success = ref('');
const list = ref<AnnouncementItem[]>([]);
const showModal = ref(false);
const editing = ref<AnnouncementItem | null>(null);

const form = reactive({
  title: '',
  content: '',
  isPinned: false,
});

function resetForm() {
  form.title = '';
  form.content = '';
  form.isPinned = false;
}

function openCreate() {
  editing.value = null;
  resetForm();
  showModal.value = true;
}

function openEdit(item: AnnouncementItem) {
  editing.value = item;
  form.title = item.title;
  form.content = item.content;
  form.isPinned = item.isPinned;
  showModal.value = true;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    list.value = await getAdminAnnouncements();
  } catch {
    error.value = '加载公告列表失败';
  } finally {
    loading.value = false;
  }
}

async function submit() {
  error.value = '';
  success.value = '';
  if (!form.title.trim() || !form.content.trim()) {
    error.value = '标题和内容不能为空';
    return;
  }

  try {
    if (editing.value) {
      await updateAdminAnnouncement(editing.value.id, {
        title: form.title.trim(),
        content: form.content.trim(),
        isPinned: form.isPinned,
      });
      success.value = '公告已更新';
    } else {
      await createAdminAnnouncement({
        title: form.title.trim(),
        content: form.content.trim(),
        isPinned: form.isPinned,
      });
      success.value = '公告已创建';
    }

    showModal.value = false;
    await load();
  } catch {
    error.value = editing.value ? '更新公告失败' : '创建公告失败';
  }
}

async function remove(id: number) {
  error.value = '';
  success.value = '';
  try {
    await deleteAdminAnnouncement(id);
    success.value = '公告已删除';
    await load();
  } catch {
    error.value = '删除公告失败';
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <div class="head">
      <h1>公告管理</h1>
      <button @click="openCreate">新建公告</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>
    <p v-if="loading">加载中...</p>

    <table v-if="!loading && list.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>标题</th>
          <th>置顶</th>
          <th>更新时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>#{{ item.id }}</td>
          <td>{{ item.title }}</td>
          <td>{{ item.isPinned ? '是' : '否' }}</td>
          <td>{{ String(item.updatedAt).slice(0, 10) }}</td>
          <td class="actions">
            <button @click="openEdit(item)">编辑</button>
            <button class="danger" @click="remove(item.id)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">暂无公告</p>

    <div v-if="showModal" class="mask" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ editing ? '编辑公告' : '新建公告' }}</h3>
        <label>标题<input v-model="form.title" /></label>
        <label>内容<textarea v-model="form.content" rows="6"></textarea></label>
        <label><input v-model="form.isPinned" type="checkbox" /> 置顶</label>
        <div class="actions">
          <button @click="showModal = false">取消</button>
          <button @click="submit">保存</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page { display: grid; gap: 12px; }
.head { display: flex; justify-content: space-between; align-items: center; }
button { border: 1px solid #d1d5db; background: #fff; border-radius: 6px; padding: 6px 10px; }
.table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
.actions { display: flex; gap: 8px; }
.danger { color: #dc2626; border-color: #dc2626; }
.mask { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: grid; place-items: center; }
.modal { width: min(680px, calc(100vw - 24px)); background: #fff; border-radius: 10px; padding: 12px; display: grid; gap: 10px; }
label { display: grid; gap: 6px; }
input, textarea { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; font: inherit; }
.error { color: #dc2626; }
.success { color: #16a34a; }
</style>
