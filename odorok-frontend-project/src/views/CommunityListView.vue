﻿<template>
    <div class="community-container">
      <div class="community-header">
        <div class="community-heading">
          <h1>커뮤니티</h1>
          <p>다른 사용자들과 경험을 나누고 정보를 공유해 보세요.</p>
        </div>
        <div class="community-filters">
          <label for="diseaseFilter">질환 분류</label>
          <select id="diseaseFilter" v-model="selectedDisease" @change="handleDiseaseChange">
            <option v-for="option in diseaseOptions" :key="option.value ?? 'all'" :value="option.value ?? ''">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
  
      <div class="community-content">
        <ArticleList
          :articles="articles"
          :loading="loading"
          :error="error"
          @article-clicked="handleArticleClick"
        />
        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          @page-changed="handlePageChange"
        />
        <WriteButton @write-clicked="goToWrite" />
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import ArticleList from '@/components/ArticleList.vue'
  import Pagination from '@/components/pagination.vue'
  import WriteButton from '@/components/WriteButton.vue'
  import { communityApi } from '@/api/communityApi'
  import { isLoggedIn } from '@/services/authService.js'
  
  const DISEASE_OPTIONS = [
    { label: '전체 보기', value: '' },
    { label: '고혈압', value: '1' },
    { label: '당뇨', value: '2' },
    { label: '허리디스크', value: '3' },
    { label: '관절염', value: '4' },
    { label: '고지혈증', value: '5' }
  ]
  
  const extractArticles = (payload) => {
    if (!payload) return []
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload.articles)) return payload.articles
    if (Array.isArray(payload.items)) return payload.items
    if (Array.isArray(payload.list)) return payload.list
    if (Array.isArray(payload.data?.items)) return payload.data.items
    if (Array.isArray(payload.data)) return payload.data
    return []
  }
  
  const resolveTotalPages = (payload) => {
    if (!payload) return 1
    const candidates = [
      payload.totalPages,
      payload.endPage,
      payload.page?.totalPages,
      payload.data?.totalPages
    ].filter((value) => Number.isFinite(Number(value)))
  
    const total = candidates.length > 0 ? Number(candidates[0]) : 1
    return total > 0 ? Math.ceil(total) : 1
  }
  
  export default {
    name: 'CommunityListView',
    components: { ArticleList, Pagination, WriteButton },
    setup() {
      const router = useRouter()
  
      const articles = ref([])
      const loading = ref(false)
      const error = ref(null)
      const currentPage = ref(1)
      const totalPages = ref(1)
      const sortBy = ref('createdAt')
      const selectedDisease = ref('') // 기본값: 전체 (메인 탭)
  
      const pageSize = ref(10)
      const currentPageNum = ref(1)
      const firstId = ref(null)
      const lastId = ref(null)
  
      // 로그인 상태 확인
      const userLoggedIn = computed(() => isLoggedIn())
      const firstLike = ref(null)
      const lastLike = ref(null)
      const firstView = ref(null)
      const lastView = ref(null)
  
      const applyArticleResponse = async (response) => {
        const body = response?.data ?? response
        const payload = body?.data ?? body
  
        console.log('🔍 서버 응답 구조:', response)
        console.log('🔍 payload:', payload)
        console.log('🔍 extractArticles 결과:', extractArticles(payload))
        console.log('🔍 resolveTotalPages 결과:', resolveTotalPages(payload))
        
        articles.value = extractArticles(payload)
        totalPages.value = resolveTotalPages(payload)
        
        // 각 게시글의 댓글 수 조회
        if (articles.value && articles.value.length > 0) {
          console.log('🔍 댓글 수 조회 시작...')
          for (let article of articles.value) {
            try {
              const articleId = article.id || article.articleId || article.articleIdx
              if (articleId) {
                const commentsResponse = await communityApi.getComments(articleId)
                const comments = commentsResponse?.data || commentsResponse || []
                article.commentCount = Array.isArray(comments) ? comments.length : 0
                console.log(`🔍 게시글 ${articleId} 댓글 수: ${article.commentCount}`)
              }
            } catch (error) {
              console.error(`게시글 ${article.id} 댓글 수 조회 실패:`, error)
              article.commentCount = 0
            }
          }
        }
        
        console.log('🔍 최종 articles.value:', articles.value)
        console.log('🔍 최종 totalPages.value:', totalPages.value)
  
        firstId.value = payload?.firstId ?? firstId.value
        lastId.value = payload?.lastId ?? lastId.value
        firstLike.value = payload?.firstLike ?? firstLike.value
        lastLike.value = payload?.lastLike ?? lastLike.value
        firstView.value = payload?.firstView ?? firstView.value
        lastView.value = payload?.lastView ?? lastView.value
      }
  
      const fetchArticles = async (toPage = 1) => {
        loading.value = true
        error.value = null
  
        try {
          currentPageNum.value = toPage
  
          const commonParams = {
            pageNum: toPage - 1,  // API는 0부터 시작
            currentPageNum: toPage - 1,
            pageSize: pageSize.value,  // 항상 10개
            sort: sortBy.value
            // firstId, lastId 등은 null로 보내거나 아예 제외
          }
  
          let response
          if (selectedDisease.value !== '') {
            const diseaseId = Number(selectedDisease.value)
            response = await communityApi.getArticlesByDisease({
              diseaseId,
              ...commonParams
            })
          } else {
            response = await communityApi.getArticles(commonParams)
          }
  
          await applyArticleResponse(response)
          currentPage.value = toPage
        } catch (err) {
          console.error('게시글 목록 조회 실패:', err)
          error.value = '게시글을 불러오는 중 문제가 발생했습니다.'
          articles.value = []
          totalPages.value = 1
        } finally {
          loading.value = false
        }
      }
  
      const handlePageChange = (page) => {
        firstId.value = lastId.value = firstLike.value = lastLike.value = firstView.value = lastView.value = null
        fetchArticles(page)
      }
  
      const handleArticleClick = (article) => {
        const id = String(article?.id ?? article?.articleId ?? article?.articleIdx ?? '')
        if (!id) {
          console.warn('게시글 id가 없습니다:', article)
          return
        }
        router.push({ name: 'CommunityDetail', params: { id } })
      }
  
      const goToWrite = () => {
        router.push('/community/write')
      }
  
      const handleDiseaseChange = () => {
        currentPage.value = 1
        firstId.value = lastId.value = firstLike.value = lastLike.value = firstView.value = lastView.value = null
        fetchArticles(1)
      }
  
      const handleRetry = () => {
        fetchArticles(currentPage.value)
      }
  
      // 게시글 목록 새로고침 (좋아요/댓글 액션 후 호출)
      const refreshArticles = () => {
        fetchArticles(currentPage.value)
      }
  
      onMounted(() => {
        // 로그인 상태 확인
        console.log('커뮤니티 페이지 로그인 상태:', userLoggedIn.value)
        fetchArticles()
      })
  
      return {
        articles,
        loading,
        error,
        currentPage,
        totalPages,
        sortBy,
        diseaseOptions: DISEASE_OPTIONS,
        selectedDisease,
        userLoggedIn,
        handlePageChange,
        handleArticleClick,
        goToWrite,
        handleDiseaseChange,
        handleRetry,
        refreshArticles
      }
    }
  }
  </script>
  
  <style scoped>
  .community-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .community-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .community-heading h1 {
    font-size: 2.5rem;
    color: #333;
    margin: 0 0 10px;
  }
  
  .community-heading p {
    font-size: 1.1rem;
    color: #666;
    margin: 0;
  }
  
  .community-filters {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 160px;
  }
  
  .community-filters label {
    font-size: 0.9rem;
    color: #555;
  }
  
  .community-filters select {
    padding: 8px 10px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 0.95rem;
  }
  
  .community-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  @media (max-width: 768px) {
    .community-header {
      flex-direction: column;
      align-items: stretch;
    }
  
    .community-filters {
      flex-direction: row;
      align-items: center;
    }
  
    .community-filters label {
      margin: 0;
    }
  }
  </style>