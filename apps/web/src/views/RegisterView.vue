<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '@/api/auth';
import { registerSchema } from '@student-side-job-platform/shared-schemas';

const role = ref<'STUDENT' | 'EMPLOYER'>('STUDENT');
const username = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const realName = ref('');
const studentNo = ref('');
const school = ref('');
const major = ref('');
const companyName = ref('');
const contactName = ref('');
const description = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);

const router = useRouter();
const isStudent = computed(() => role.value === 'STUDENT');

async function handleSubmit() {
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的新密码不一致';
    return;
  }

  const payload = isStudent.value
    ? {
        role: 'STUDENT' as const,
        username: username.value,
        phone: phone.value,
        password: password.value,
        realName: realName.value || undefined,
        studentNo: studentNo.value || undefined,
        school: school.value || undefined,
        major: major.value || undefined,
      }
    : {
        role: 'EMPLOYER' as const,
        username: username.value,
        phone: phone.value,
        password: password.value,
        companyName: companyName.value || undefined,
        contactName: contactName.value || undefined,
        description: description.value || undefined,
      };

  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? '表单参数不合法';
    return;
  }

  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    await register(parsed.data);
    success.value = '注册成功，正在跳转登录页...';
    setTimeout(() => {
      router.push('/login');
    }, 900);
  } catch {
    error.value = '注册失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="card">
    <h1>创建账号</h1>
    <form @submit.prevent="handleSubmit">
      <select v-model="role">
        <option value="STUDENT">学生</option>
        <option value="EMPLOYER">雇主</option>
      </select>
      <input v-model="username" placeholder="用户名" autocomplete="username" />
      <input v-model="phone" placeholder="手机号（11位）" autocomplete="tel" />
      <input v-model="password" type="password" placeholder="密码" autocomplete="new-password" />
      <input v-model="confirmPassword" type="password" placeholder="确认密码" autocomplete="new-password" />

      <template v-if="isStudent">
        <input v-model="realName" placeholder="姓名（选填）" />
        <input v-model="studentNo" placeholder="学号（选填）" />
        <input v-model="school" placeholder="学校（选填）" />
        <input v-model="major" placeholder="专业（选填）" />
      </template>

      <template v-else>
        <input v-model="companyName" placeholder="企业/组织名称（选填）" />
        <input v-model="contactName" placeholder="联系人（选填）" />
        <textarea v-model="description" placeholder="企业/组织简介（选填）" />
      </template>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
      <button :disabled="loading">{{ loading ? '提交中...' : '注册' }}</button>
    </form>
  </div>
</template>

<style scoped>
.card { width: 460px; padding: 24px; background: #fff; border-radius: 10px; box-shadow: 0 8px 30px rgba(15,23,42,.08); }
form { display: grid; gap: 10px; }
input, select, textarea { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; font: inherit; }
button { background: #0f172a; color: #fff; border: 0; border-radius: 8px; padding: 10px; cursor: pointer; }
.error { color: #dc2626; font-size: 13px; }
.success { color: #16a34a; font-size: 13px; }
</style>
