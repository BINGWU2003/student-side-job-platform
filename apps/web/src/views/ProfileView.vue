<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { getMe, updateMe, updatePassword } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const loading = ref(false);
const error = ref('');
const success = ref('');

const profileForm = reactive({
  username: '',
  phone: '',
  realName: '',
  studentNo: '',
  school: '',
  major: '',
  companyName: '',
  contactName: '',
  description: '',
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const isStudent = computed(() => authStore.role === 'STUDENT');
const isEmployer = computed(() => authStore.role === 'EMPLOYER');

function fillFromUser() {
  const user = authStore.user;
  if (!user) return;
  profileForm.username = user.username;
  profileForm.phone = user.phone;
  profileForm.realName = user.studentProfile?.realName ?? '';
  profileForm.studentNo = user.studentProfile?.studentNo ?? '';
  profileForm.school = user.studentProfile?.school ?? '';
  profileForm.major = user.studentProfile?.major ?? '';
  profileForm.companyName = user.employerProfile?.companyName ?? '';
  profileForm.contactName = user.employerProfile?.contactName ?? '';
  profileForm.description = user.employerProfile?.description ?? '';
}

async function loadMe() {
  loading.value = true;
  error.value = '';
  try {
    const me = await getMe();
    authStore.setUser(me);
    fillFromUser();
  } catch {
    error.value = '加载个人资料失败';
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  error.value = '';
  success.value = '';
  try {
    const payload: Record<string, unknown> = {
      username: profileForm.username,
      phone: profileForm.phone,
    };

    if (isStudent.value) {
      payload.realName = profileForm.realName || undefined;
      payload.studentNo = profileForm.studentNo || undefined;
      payload.school = profileForm.school || undefined;
      payload.major = profileForm.major || undefined;
    }

    if (isEmployer.value) {
      payload.companyName = profileForm.companyName || undefined;
      payload.contactName = profileForm.contactName || undefined;
      payload.description = profileForm.description || undefined;
    }

    const user = await updateMe(payload);
    authStore.setUser(user);
    success.value = '个人资料已更新';
  } catch {
    error.value = '更新个人资料失败';
  }
}

async function savePassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    error.value = '请填写完整的密码信息';
    return;
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    error.value = '两次输入的新密码不一致';
    return;
  }

  error.value = '';
  success.value = '';
  try {
    await updatePassword(passwordForm.oldPassword, passwordForm.newPassword, passwordForm.confirmPassword);
    success.value = '密码更新成功';
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  } catch {
    error.value = '更新密码失败';
  }
}

onMounted(() => {
  fillFromUser();
  void loadMe();
});
</script>

<template>
  <section class="page">
    <h1>个人中心</h1>
    <p v-if="loading">加载中...</p>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>

    <div class="grid">
      <article class="card">
        <h2>基本资料</h2>
        <div class="form">
          <label>
            用户名
            <input v-model="profileForm.username" />
          </label>
          <label>
            手机号
            <input v-model="profileForm.phone" />
          </label>

          <template v-if="isStudent">
            <label>姓名<input v-model="profileForm.realName" /></label>
            <label>学号<input v-model="profileForm.studentNo" /></label>
            <label>学校<input v-model="profileForm.school" /></label>
            <label>专业<input v-model="profileForm.major" /></label>
          </template>

          <template v-if="isEmployer">
            <label>企业/组织<input v-model="profileForm.companyName" /></label>
            <label>联系人<input v-model="profileForm.contactName" /></label>
            <label>简介<textarea v-model="profileForm.description" /></label>
          </template>

          <button @click="saveProfile">保存资料</button>
        </div>
      </article>

      <article class="card">
        <h2>修改密码</h2>
        <div class="form">
          <label>当前密码<input v-model="passwordForm.oldPassword" type="password" /></label>
          <label>新密码<input v-model="passwordForm.newPassword" type="password" /></label>
          <label>确认新密码<input v-model="passwordForm.confirmPassword" type="password" /></label>
          <button @click="savePassword">更新密码</button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.page { display: grid; gap: 12px; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
.form { display: grid; gap: 8px; }
label { display: grid; gap: 4px; font-size: 13px; color: #334155; }
input, textarea { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; font: inherit; }
button { width: fit-content; border: 1px solid #0f172a; background: #0f172a; color: #fff; border-radius: 8px; padding: 8px 12px; }
.error { color: #dc2626; }
.success { color: #16a34a; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
</style>
