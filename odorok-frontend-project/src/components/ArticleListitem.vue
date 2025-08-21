<template>
  <div class="article-item" @click="handleClick">
    <div class="article-header">
      <div class="article-info">
        <h3 class="article-title">{{ article.title }}</h3>
        <div class="article-meta">
          <span class="author">{{ article.author }}</span>
          <span class="date">{{ formatDate(article.createdAt) }}</span>
          <span class="category">{{ getCategoryName(article.category) }}</span>
        </div>
      </div>
      <div class="article-stats">
        <div class="stat">
          <span class="icon">❤️</span>
          <span class="count">{{ article.likeCount }}</span>
        </div>
        <div class="stat">
          <span class="icon">💬</span>
          <span class="count">{{ article.commentCount }}</span>
        </div>
      </div>
    </div>
    
    <div class="article-content">
      <p>{{ truncateContent(article.content) }}</p>
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
  methods: {
    handleClick() {
      this.$emit('click', this.article)
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR')
    },
    truncateContent(content) {
      return content.length > 100 ? content.substring(0, 100) + '...' : content
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