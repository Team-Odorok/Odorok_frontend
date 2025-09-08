import { createRouter, createWebHistory } from 'vue-router'
import CourseSearchView from '../views/CourseSearchView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/course-search'
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
