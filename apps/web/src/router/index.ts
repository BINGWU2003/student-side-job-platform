import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: DefaultLayout, children: [{ path: '', name: 'home', component: () => import('@/views/HomeView.vue') }] },
    { path: '/login', component: AuthLayout, children: [{ path: '', name: 'login', component: () => import('@/views/LoginView.vue') }] },
    { path: '/register', component: AuthLayout, children: [{ path: '', name: 'register', component: () => import('@/views/RegisterView.vue') }] },
    { path: '/announcements', component: DefaultLayout, children: [{ path: '', name: 'announcements', component: () => import('@/views/AnnouncementListView.vue') }] },
    { path: '/announcements/:id', component: DefaultLayout, children: [{ path: '', name: 'announcement-detail', component: () => import('@/views/AnnouncementDetailView.vue') }] },
    { path: '/jobs', component: DefaultLayout, children: [{ path: '', name: 'jobs', component: () => import('@/views/jobs/JobListView.vue') }] },
    { path: '/jobs/:id', component: DefaultLayout, children: [{ path: '', name: 'job-detail', component: () => import('@/views/jobs/JobDetailView.vue') }] },

    { path: '/my/applications', component: DefaultLayout, meta: { requiresAuth: true, role: 'STUDENT' }, children: [{ path: '', name: 'my-applications', component: () => import('@/views/student/ApplicationListView.vue') }] },
    { path: '/my/favorites', component: DefaultLayout, meta: { requiresAuth: true, role: 'STUDENT' }, children: [{ path: '', name: 'my-favorites', component: () => import('@/views/student/FavoriteListView.vue') }] },
    { path: '/my/complaints', component: DefaultLayout, meta: { requiresAuth: true, role: 'STUDENT' }, children: [{ path: '', name: 'my-complaints', component: () => import('@/views/student/ComplaintListView.vue') }] },

    { path: '/employer/jobs', component: DefaultLayout, meta: { requiresAuth: true, role: 'EMPLOYER' }, children: [{ path: '', name: 'employer-jobs', component: () => import('@/views/employer/JobListView.vue') }] },
    { path: '/employer/jobs/create', component: DefaultLayout, meta: { requiresAuth: true, role: 'EMPLOYER' }, children: [{ path: '', name: 'employer-job-create', component: () => import('@/views/employer/JobCreateView.vue') }] },
    { path: '/employer/jobs/:id/edit', component: DefaultLayout, meta: { requiresAuth: true, role: 'EMPLOYER' }, children: [{ path: '', name: 'employer-job-edit', component: () => import('@/views/employer/JobEditView.vue') }] },
    { path: '/employer/jobs/:id/applications', component: DefaultLayout, meta: { requiresAuth: true, role: 'EMPLOYER' }, children: [{ path: '', name: 'employer-job-applications', component: () => import('@/views/employer/JobApplicationsView.vue') }] },

    { path: '/my/profile', component: DefaultLayout, meta: { requiresAuth: true }, children: [{ path: '', name: 'my-profile', component: () => import('@/views/ProfileView.vue') }] },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { name: 'login' };
  }

  if ((to.name === 'login' || to.name === 'register') && authStore.isLoggedIn) {
    return { name: 'home' };
  }

  const requiredRole = to.meta.role as 'STUDENT' | 'EMPLOYER' | undefined;
  if (requiredRole && authStore.role !== requiredRole) {
    return { name: 'home' };
  }

  return true;
});

export default router;
