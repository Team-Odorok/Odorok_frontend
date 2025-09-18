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
import { isLoggedIn, logout } from '@/services/authService'

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
      path: '/diaries',
      name: 'diaries',
      component: DiaryListView,
      meta: { requiresAuth: true }
    },
    {
      path: '/diaries/:diaryId',
      name: 'diary-detail',
      component: DiaryDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/diaries/create/style',
      name: 'diary-create-style',
      component: DiaryCreateStyleView,
      meta: { requiresAuth: true }
    },
    {
      path: '/diaries/create/chat/:visitedCourseId/:style',
      name: 'diary-create-chat',
      component: DiaryCreateChatView,
      meta: { requiresAuth: true }
    },
    {
      path: '/course-search',
      name: 'CourseSearch',
      component: CourseSearchView,
      meta: { requiresAuth: true }
    },
    {
      path: '/community',
      name: 'Community',
      component: () => import('../views/CommunityListView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/community/write',
      name: 'CommunityWrite',
      component: () => import('../views/CommunityWriteView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/community/:id',
      name: 'CommunityDetail',
      component: () => import('../views/CommunityDetailView.vue'),
      meta: { requiresAuth: true }
    },
    { path: '/nearby-attractions', name: 'NearbyAttractions', component: () => import('../views/NearbyAttractionsView.vue') },
    {
      path: '/mypage',
      name: 'mypage',
      component: MyPageView,
      meta: { requiresAuth: true }
    },
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

// 라우터 가드 - 로그인 상태 확인
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = isLoggedIn()

  if (requiresAuth && !isAuthenticated) {
    // 로그인이 필요한 페이지인데 로그인하지 않은 경우
    console.log('로그인이 필요합니다. 로그인 페이지로 이동합니다.')
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    // 이미 로그인한 상태에서 로그인 페이지로 가려는 경우
    console.log('이미 로그인되어 있습니다. 메인 페이지로 이동합니다.')
    next('/course-search')
  } else {
    next()
  }
})

export default router
