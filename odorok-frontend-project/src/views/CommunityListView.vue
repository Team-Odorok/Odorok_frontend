<template>
  <div class="community-container">
    <div class="community-header">
      <h1>커뮤니티</h1>
      <p>다른 사용자들과 여행 경험을 공유해보세요</p>
    </div>
    
    <div class="community-content">
      <CategoryTab @category-changed="handleCategoryChange" />
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
import CategoryTab from '@/components/CategoryTab.vue'
import ArticleList from '@/components/ArticleList.vue'
import Pagination from '@/components/pagination.vue'
import WriteButton from '@/components/WriteButton.vue'
import { communityApi } from '@/api/communityApi'

export default {
  name: "CommunityListView",
  components: {
    CategoryTab,
    ArticleList,
    Pagination,
    WriteButton
  },
  setup() {
    const router = useRouter()
    
    const articles = ref([])
    const loading = ref(false)
    const error = ref(null)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const selectedCategory = ref(null)
    const sortBy = ref('createdAt')
    const searchTitle = ref('')

    // 게시글 목록 조회 (API 명세에 맞춤)
    const fetchArticles = async (pageNum = 1, category = null, sort = 'createdAt', title = '') => {
      loading.value = true
      error.value = null
      
      try {
        const params = { pageNum, sort }
        if (category) params.category = category
        if (title) params.title = title
        
        const response = await communityApi.getArticles(params)
        
        if (response.status === 'success') {
          articles.value = response.data || []
          currentPage.value = pageNum
          // totalPages는 API 응답에 따라 설정
          totalPages.value = Math.ceil(articles.value.length / 10) || 1
        } else {
          error.value = response.message || '게시글을 불러오는데 실패했습니다.'
        }
      } catch (err) {
        console.error('게시글 목록 조회 실패:', err)
        error.value = '게시글을 불러오는데 실패했습니다.'
        articles.value = []
      } finally {
        loading.value = false
      }
    }

    // 카테고리 변경 처리
    const handleCategoryChange = (category) => {
      selectedCategory.value = category
      fetchArticles(1, category, sortBy.value, searchTitle.value)
    }

    // 페이지 변경 처리
    const handlePageChange = (page) => {
      fetchArticles(page, selectedCategory.value, sortBy.value, searchTitle.value)
    }

    // 게시글 클릭 처리
    const handleArticleClick = (article) => {
      router.push(`/community/${article.id}`)
    }

    // 글쓰기 페이지로 이동
    const goToWrite = () => {
      router.push('/community/write')
    }

    // 다시 시도
    const handleRetry = () => {
      fetchArticles(currentPage.value, selectedCategory.value, sortBy.value, searchTitle.value)
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
      handleCategoryChange,
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