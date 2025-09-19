<template>
  <div class="article-list">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>게시글을 불러오는 중...</p>
    </div>
    
    <!-- 에러 상태 -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="retry-button">다시 시도</button>
    </div>
    
    <!-- 게시글 목록 -->
    <div v-else-if="articles.length > 0" class="articles">
      <ArticleListItem 
        v-for="article in articles"
        :key="article.id"
        :article="article"
        @click="handleArticleClick(article)"
      />
    </div>
    
    <!-- 빈 상태 -->
    <div v-else class="empty">
      <p>게시글이 없습니다.</p>
    </div>
  </div>
</template>

<script>
import ArticleListItem from '@/components/ArticleListitem.vue'

export default {
  name: "ArticleList",
  components: {
    ArticleListItem
  },
  props: { 
    articles: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    }
  },
  emits: ['article-clicked', 'retry'],
  methods: {
    handleArticleClick(article) {
      this.$emit('article-clicked', article)
    }
  }
}
</script>

<style scoped>
.article-list {
  min-height: 400px;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #303E69;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #e74c3c;
}

.retry-button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #303E69;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background: #1e2a4a;
}

.articles {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>