import { createRouter, createWebHistory } from 'vue-router'
import DiaryListView from '@/views/DiaryListView.vue'
import DiaryDetailView from '@/views/DiaryDetailView.vue'
import DiaryCreateStyleView from '@/views/DiaryCreateStyleView.vue'
import DiaryCreateChatView from '@/views/DiaryCreateChatView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'diaries',
      component: DiaryListView,
    },
    {
      path: '/diaries/:diaryId',
      name: 'diary-detail',
      component: DiaryDetailView,
    },
    {
      path: '/diaries/create/style',
      name: 'diary-create-style',
      component: DiaryCreateStyleView,
    },
    {
      path: '/diaries/create/chat/:visitedCourseId/:style',
      name: 'diary-create-chat',
      component: DiaryCreateChatView,
    },
  ],
})

export default router
