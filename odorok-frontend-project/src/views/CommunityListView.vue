<template>
  <div class="community-container">
    <div class="community-header">
      <h1>커뮤니티</h1>
      <p>다른 사용자들과 여행 경험을 공유해보세요</p>
    </div>
    
    <div class="community-content">
      <ArticleList :articles="articles" :loading="loading" :error="error" @article-clicked="handleArticleClick" />
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ArticleList from '@/components/ArticleList.vue'
import Pagination from '@/components/pagination.vue'
import WriteButton from '@/components/WriteButton.vue'
import { communityApi } from '@/api/communityApi'

export default {
  name: "CommunityListView",
  components: { ArticleList, Pagination, WriteButton },
  setup() {
    const router = useRouter()
    
    const articles = ref([])
    const loading = ref(false)
    const error = ref(null)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const sortBy = ref('createdAt') // 스펙: createdAt | likeCount | viewCount

    // ArticleSearchCondition (문서 스펙) 상태
    const pageNum = ref(1)           // 이동하려는 페이지(1부터)
    const currentPageNum = ref(1)    // 현재 화면 페이지(1부터)
    const pageSize = ref(10)
    const diseaseId = ref(null)
    // 커서들(최초 요청은 모두 null)
    const firstId = ref(null)
    const lastId = ref(null)
    const firstLike = ref(null)
    const lastLike = ref(null)
    const firstView = ref(null)
    const lastView = ref(null)

    // 게시글 목록 조회 (API 명세에 맞춤)
    const fetchArticles = async (toPage = 1) => {
      loading.value = true
      error.value = null
      
      try {
        // 문서 스펙에 맞춰 전송
        pageNum.value = toPage
        // 문서에 명시된 최소 파라미터만 우선 전송
        const params = {
          pageNum: pageNum.value,
          currentPageNum: currentPageNum.value,
          sort: sortBy.value
        }
        const res = await communityApi.getArticles(params)

        // 응답 파싱(유연하게)
        const body = res?.data || res
        const list = body?.articles || body?.items || body?.list || []
        articles.value = Array.isArray(list) ? list : []
        // 커서/페이지 값 저장(있을 때만)
        firstId.value = body?.firstId ?? firstId.value
        lastId.value = body?.lastId ?? lastId.value
        firstLike.value = body?.firstLike ?? firstLike.value
        lastLike.value = body?.lastLike ?? lastLike.value
        firstView.value = body?.firstView ?? firstView.value
        lastView.value = body?.lastView ?? lastView.value
        const endPage = body?.endPage || 1
        totalPages.value = endPage
        currentPage.value = toPage
      } catch (err) {
        console.error('게시글 목록 조회 실패:', err)
        error.value = '게시글을 불러오는데 실패했습니다.'
        articles.value = []
      } finally {
        loading.value = false
      }
    }

    // 카테고리 변경 처리
    // 페이지 변경 처리
    const handlePageChange = (page) => {
      // 단순 페이지 이동: 커서 초기화하고 pageNum만 변경
      firstId.value = lastId.value = firstLike.value = lastLike.value = firstView.value = lastView.value = null
      fetchArticles(page)
    }

    // 게시글 클릭 처리
    const handleArticleClick = (article) => {
  const id = String(article?.id ?? article?.articleId ?? article?.articleIdx);
  if (!id) { console.warn('게시글 id 없음:', article); return; }
  router.push({ name: 'CommunityDetail', params: { id } });
};

    // 글쓰기 페이지로 이동
    const goToWrite = () => {
      router.push('/community/write')
    }

    // 다시 시도
    const handleRetry = () => {
      fetchArticles(currentPage.value)
    }

    onMounted(() => {
      fetchArticles()
    })

    return {
      articles,
      loading,
      error,
      currentPage,
      totalPages,
      sortBy,
      handlePageChange,
      handleArticleClick,
      goToWrite,
      handleRetry
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
  text-align: center;
  margin-bottom: 40px;
}

.community-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.community-header p {
  font-size: 1.1rem;
  color: #666;
}

.community-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>