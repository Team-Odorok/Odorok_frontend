import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import DiaryListView from '@/views/DiaryListView.vue'
import DiaryDetailView from '@/views/DiaryDetailView.vue'
import DiaryCreateStyleView from '@/views/DiaryCreateStyleView.vue'
import DiaryCreateChatView from '@/views/DiaryCreateChatView.vue'
import LoginView from '@/views/LoginView.vue'
import SignupView from '@/views/SignupView.vue'
import MyPageView from '@/views/MyPageView.vue'
import CourseSearchView from '../views/CourseSearchView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
    },
    {
      path: '/mypage',
      name: 'mypage',
      component: MyPageView,
    },
    {
      path: '/diaries',
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
    {
      path: '/course-search',
      name: 'CourseSearch',
      component: CourseSearchView,
    },
    {
      path: '/community',
      name: 'Community',
      component: () => import('../views/CommunityListView.vue')
    },
    {
      path: '/community/write',
      name: 'CommunityWrite',
      component: () => import('../views/CommunityWriteView.vue')
    },
    {
      path: '/community/:id',
      name: 'CommunityDetail',
      component: () => import('../views/CommunityDetailView.vue')
    },
    { path: '/nearby-attractions', name: 'NearbyAttractions', component: () => import('../views/NearbyAttractionsView.vue') },
    {
      path: '/nearby-attractions/:courseId',
      name: 'nearby-attractions',
      component: () => import('../views/NearbyAttractionsView.vue'),
      beforeEnter: (to, from, next) => {
        // URL에서 coords 파라미터가 있으면 제거
        if (to.query.coords) {
          const newQuery = { ...to.query }
          delete newQuery.coords
          
          next({
            name: 'nearby-attractions',
            params: to.params,
            query: newQuery,
            replace: true
          })
        } else {
          next()
        }
      }
    },
  ],
})

export default router
