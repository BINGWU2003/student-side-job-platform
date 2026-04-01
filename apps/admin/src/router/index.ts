import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AdminLayout from '../layouts/AdminLayout.vue';
import AuthLayout from '../layouts/AuthLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'login',
          component: () => import('../views/LoginView.vue'),
        },
      ],
    },
    {
      path: '/',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
        { path: 'jobs', name: 'jobs', component: () => import('../views/JobListView.vue') },
        {
          path: 'jobs/:id',
          name: 'job-detail',
          component: () => import('../views/JobDetailView.vue'),
        },
        { path: 'users', name: 'users', component: () => import('../views/UserListView.vue') },
        {
          path: 'users/:id',
          name: 'user-detail',
          component: () => import('../views/UserDetailView.vue'),
        },
        {
          path: 'announcements',
          name: 'announcements',
          component: () => import('../views/AnnouncementView.vue'),
        },
        {
          path: 'complaints',
          name: 'complaints',
          component: () => import('../views/ComplaintView.vue'),
        },
        { path: 'logs', name: 'logs', component: () => import('../views/LogView.vue') },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.path === '/login' && authStore.isLoggedIn && authStore.user?.role === 'ADMIN') {
    return { name: 'dashboard' };
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { name: 'login' };
  }

  if (to.meta.requiresAuth && authStore.user?.role !== 'ADMIN') {
    authStore.logout();
    return { name: 'login' };
  }

  return true;
});

export default router;
