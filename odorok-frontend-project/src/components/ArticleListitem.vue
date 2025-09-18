<template>
  <div class="article-item" @click="handleClick">
    <div class="article-header">
      <div class="article-info">
        <h3 class="article-title">{{ article.title }}</h3>
        <div class="article-meta">
          <span class="author">{{ article.author || article.nickname || '' }}</span>
          <span class="date">{{ formatDate(article.createdAt) }}</span>
          <span class="category">{{ getCategoryName(article.category) }}</span>
        </div>
      </div>
      <div class="article-stats">
        <div class="stat">
          <span class="icon">❤️</span>
          <span class="count">{{ Number(article.likeCount || 0) }}</span>
        </div>
        <div class="stat">
          <span class="icon">💬</span>
          <span class="count">{{ commentCount }}</span>
        </div>
      </div>
    </div>
    
    <div class="article-content">
      <p v-if="truncateContent(article.content)">{{ truncateContent(article.content) }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "ArticleListItem",
  props: {
    article: {
      type: Object,
      required: true
    }
  },
  emits: ['click'],
  computed: {
    commentCount() {
      // 다양한 댓글 갯수 필드 확인
      const commentCount = this.article.commentCount || 
                          this.article.comments?.length || 
                          this.article.comment?.length || 
                          this.article.replyCount || 
                          this.article.replies?.length || 
                          0
      
      console.log(`🔍 게시글 ${this.article.id} 댓글 갯수:`, {
        commentCount: this.article.commentCount,
        comments: this.article.comments?.length,
        comment: this.article.comment?.length,
        replyCount: this.article.replyCount,
        replies: this.article.replies?.length,
        최종결과: commentCount
      })
      
      return Number(commentCount)
    }
  },
  methods: {
    handleClick() {
      this.$emit('click', this.article)
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString('ko-KR')
    },
    truncateContent(content) {
      const text = content || this.article.summary || ''
      return text.length > 100 ? text.substring(0, 100) + '...' : text
    },
    getCategoryName(category) {
      const categories = {
        'travel': '여행',
        'food': '맛집',
        'culture': '문화',
        'shopping': '쇼핑',
        'all': '전체'
      }
      return categories[category] || category
    }
  }
}
</script>

<style scoped>
.article-item {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.article-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.article-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.article-meta {
  display: flex;
  gap: 12px;
  font-size: 0.9rem;
  color: #666;
}

.author {
  font-weight: 500;
  color: #3498db;
}

.category {
  background: #f8f9fa;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.article-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: #666;
}

.icon {
  font-size: 1rem;
}

.count {
  font-weight: 500;
}

.article-content {
  color: #555;
  line-height: 1.5;
}
</style>