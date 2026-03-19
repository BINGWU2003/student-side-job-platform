<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  type Book,
  type CreateBookRequest,
} from '@/api/books';
import { createBookSchema, updateBookSchema } from '@bingwu-my-monorepo/shared-schemas';

// ─── 列表状态 ───────────────────────────────────────────
const list = ref<Book[]>([]);
const total = ref(0);
const loading = ref(false);

const query = reactive({ page: 1, pageSize: 10, title: '', author: '' });

async function fetchList() {
  loading.value = true;
  try {
    const params = {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.title ? { title: query.title } : {}),
      ...(query.author ? { author: query.author } : {}),
    };
    const data = await getBooks(params);
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  fetchList();
}

function handleReset() {
  query.title = '';
  query.author = '';
  query.page = 1;
  fetchList();
}

function prevPage() {
  if (query.page > 1) {
    query.page--;
    fetchList();
  }
}

function nextPage() {
  if (query.page * query.pageSize < total.value) {
    query.page++;
    fetchList();
  }
}

onMounted(fetchList);

// ─── 弹窗状态 ───────────────────────────────────────────
const showModal = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const formError = ref('');
const formLoading = ref(false);

const form = reactive<CreateBookRequest & { id?: number }>({
  title: '',
  author: '',
  isbn: '',
  description: '',
  price: null,
  publishedAt: null,
});

function openCreate() {
  isEdit.value = false;
  editId.value = null;
  form.title = '';
  form.author = '';
  form.isbn = '';
  form.description = '';
  form.price = null;
  form.publishedAt = null;
  formError.value = '';
  showModal.value = true;
}

function openEdit(book: Book) {
  isEdit.value = true;
  editId.value = book.id;
  form.title = book.title;
  form.author = book.author;
  form.isbn = book.isbn ?? '';
  form.description = book.description ?? '';
  form.price = book.price != null ? Number(book.price) : null;
  form.publishedAt = book.publishedAt ? book.publishedAt.slice(0, 10) : null;
  formError.value = '';
  showModal.value = true;
}

async function handleSubmit() {
  const raw = {
    title: form.title.trim(),
    author: form.author.trim(),
    isbn: form.isbn?.trim() || undefined,
    description: form.description?.trim() || undefined,
    price: form.price != null ? Number(form.price) : null,
    publishedAt: form.publishedAt || null,
  };

  if (isEdit.value) {
    const r = updateBookSchema.safeParse(raw);
    if (!r.success) {
      formError.value = r.error.issues[0]?.message ?? '参数错误';
      return;
    }
  } else {
    const r = createBookSchema.safeParse(raw);
    if (!r.success) {
      formError.value = r.error.issues[0]?.message ?? '参数错误';
      return;
    }
  }

  formLoading.value = true;
  formError.value = '';
  try {
    if (isEdit.value && editId.value != null) {
      await updateBook(editId.value, raw);
    } else {
      await createBook(raw as CreateBookRequest);
    }
    showModal.value = false;
    fetchList();
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    formError.value = msg ?? '操作失败，请稍后重试';
  } finally {
    formLoading.value = false;
  }
}

// ─── 删除 ───────────────────────────────────────────────
const deleteTarget = ref<Book | null>(null);
const deleteLoading = ref(false);

function confirmDelete(book: Book) {
  deleteTarget.value = book;
}

async function handleDelete() {
  if (!deleteTarget.value) return;
  deleteLoading.value = true;
  try {
    await deleteBook(deleteTarget.value.id);
    deleteTarget.value = null;
    if (list.value.length === 1 && query.page > 1) query.page--;
    fetchList();
  } finally {
    deleteLoading.value = false;
  }
}
</script>

<template>
  <div class="books-page">
    <div class="page-header">
      <h2>书籍管理</h2>
      <button class="btn-primary" @click="openCreate">+ 新增书籍</button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input v-model="query.title" placeholder="书名" @keyup.enter="handleSearch" />
      <input v-model="query.author" placeholder="作者" @keyup.enter="handleSearch" />
      <button class="btn-primary" @click="handleSearch">搜索</button>
      <button class="btn-default" @click="handleReset">重置</button>
    </div>

    <!-- 表格 -->
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>书名</th>
            <th>作者</th>
            <th>ISBN</th>
            <th>价格</th>
            <th>出版日期</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="center">加载中...</td>
          </tr>
          <tr v-else-if="list.length === 0">
            <td colspan="8" class="center">暂无数据</td>
          </tr>
          <tr v-for="book in list" :key="book.id">
            <td>{{ book.id }}</td>
            <td>{{ book.title }}</td>
            <td>{{ book.author }}</td>
            <td>{{ book.isbn ?? '-' }}</td>
            <td>{{ book.price != null ? `¥${book.price}` : '-' }}</td>
            <td>{{ book.publishedAt ? book.publishedAt.slice(0, 10) : '-' }}</td>
            <td>{{ book.createdAt.slice(0, 10) }}</td>
            <td class="actions">
              <button class="btn-link" @click="openEdit(book)">编辑</button>
              <button class="btn-link danger" @click="confirmDelete(book)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <span>共 {{ total }} 条</span>
      <button :disabled="query.page <= 1" @click="prevPage">上一页</button>
      <span>第 {{ query.page }} 页</span>
      <button :disabled="query.page * query.pageSize >= total" @click="nextPage">下一页</button>
    </div>
  </div>

  <!-- 新增/编辑弹窗 -->
  <div v-if="showModal" class="modal-mask" @click.self="showModal = false">
    <div class="modal">
      <div class="modal-header">
        <span>{{ isEdit ? '编辑书籍' : '新增书籍' }}</span>
        <button class="close-btn" @click="showModal = false">✕</button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label>
            书名
            <em>*</em>
          </label>
          <input v-model="form.title" placeholder="请输入书名" />
        </div>
        <div class="field">
          <label>
            作者
            <em>*</em>
          </label>
          <input v-model="form.author" placeholder="请输入作者" />
        </div>
        <div class="field">
          <label>ISBN</label>
          <input v-model="form.isbn" placeholder="可选" />
        </div>
        <div class="field">
          <label>价格</label>
          <input v-model.number="form.price" type="number" step="0.01" placeholder="可选" />
        </div>
        <div class="field">
          <label>出版日期</label>
          <input v-model="form.publishedAt" type="date" />
        </div>
        <div class="field">
          <label>简介</label>
          <textarea v-model="form.description" rows="3" placeholder="可选"></textarea>
        </div>
        <p v-if="formError" class="error">{{ formError }}</p>
        <div class="modal-footer">
          <button type="button" class="btn-default" @click="showModal = false">取消</button>
          <button type="submit" class="btn-primary" :disabled="formLoading">
            {{ formLoading ? '提交中...' : '确定' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- 删除确认弹窗 -->
  <div v-if="deleteTarget" class="modal-mask" @click.self="deleteTarget = null">
    <div class="modal modal-sm">
      <div class="modal-header">
        <span>确认删除</span>
        <button class="close-btn" @click="deleteTarget = null">✕</button>
      </div>
      <p class="confirm-text">确定删除《{{ deleteTarget.title }}》吗？此操作不可恢复。</p>
      <div class="modal-footer">
        <button class="btn-default" @click="deleteTarget = null">取消</button>
        <button class="btn-danger" :disabled="deleteLoading" @click="handleDelete">
          {{ deleteLoading ? '删除中...' : '确认删除' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.books-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.search-bar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.search-bar input {
  padding: 0.4rem 0.75rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 0.875rem;
  width: 160px;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th {
  background: #fafafa;
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
  white-space: nowrap;
  color: #555;
}

td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
}

tr:last-child td {
  border-bottom: none;
}

td.center {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #666;
}

.pagination button {
  padding: 0.3rem 0.75rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.875rem;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 通用按钮 */
.btn-primary {
  padding: 0.4rem 1rem;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-default {
  padding: 0.4rem 1rem;
  background: #fff;
  color: #555;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-danger {
  padding: 0.4rem 1rem;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-link {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  padding: 0;
  font-size: 0.875rem;
}

.btn-link.danger {
  color: #ff4d4f;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 480px;
  max-width: calc(100vw - 2rem);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.modal-sm {
  width: 360px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #999;
  padding: 0;
}

form {
  padding: 1.25rem;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  color: #555;
}

.field label em {
  color: #ff4d4f;
  font-style: normal;
  margin-left: 2px;
}

.field input,
.field textarea {
  width: 100%;
  padding: 0.45rem 0.75rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.field textarea {
  resize: vertical;
}

.error {
  color: #ff4d4f;
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.confirm-text {
  padding: 1rem 1.25rem;
  margin: 0;
  color: #555;
}
</style>
