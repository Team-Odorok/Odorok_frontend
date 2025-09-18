<template>
  <div class="diary-card" @click="$emit('click')">
    <div class="card-image">
      <div class="image-placeholder">
        <span class="placeholder-icon">📸</span>
      </div>
    </div>
    
    <div class="card-content">
      <h3 class="card-title">{{ diary.title }}</h3>
      
      <div class="card-dates">
        <div class="date-item">
          <span class="date-label">방문일:</span>
          <span class="date-value">{{ formatDate(diary.visitedAt) }}</span>
        </div>
        <div class="date-item">
          <span class="date-label">작성일:</span>
          <span class="date-value">{{ formatDateTime(diary.createdAt) }}</span>
        </div>
      </div>
      
      <!-- 카드 클릭으로 일지 상세 보기 가능 -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'DiaryCard',
  props: {
    diary: {
      type: Object,
      required: true
    }
  },
  emits: ['click'],
  setup(props, { emit }) {
    // 날짜 포맷팅 함수
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    // 날짜 포맷팅 함수 (시간 제외)
    const formatDateTime = (dateTimeString) => {
      const date = new Date(dateTimeString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    return {
      formatDate,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.diary-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.diary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #007bff;
}

.card-image {
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.placeholder-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.card-content {
  padding: 16px;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 2.6em; /* 2줄 높이 고정 (1.3 * 2) */
}

.card-dates {
  margin-bottom: 16px;
}

.date-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 0.85rem;
  flex-wrap: wrap;
}

.date-item:last-child {
  margin-bottom: 0;
}

.date-label {
  color: #6c757d;
  font-weight: 500;
  margin-right: 8px;
  flex-shrink: 0;
}

.date-value {
  color: #495057;
  font-weight: 400;
  word-break: keep-all;
}

/* 카드 클릭으로 일지 상세 보기 가능 */

/* 반응형 디자인 */
@media (max-width: 768px) {
  .card-content {
    padding: 12px;
  }
  
  .card-title {
    font-size: 1rem;
    min-height: 2.6em; /* 2줄 높이 고정 */
  }
  
  .date-item {
    font-size: 0.8rem;
    flex-wrap: wrap;
  }
  
  .date-label {
    margin-right: 6px;
  }
}

@media (max-width: 480px) {
  .card-image {
    height: 100px;
  }
  
  .card-content {
    padding: 10px;
  }
  
  .card-title {
    font-size: 0.9rem;
    margin-bottom: 8px;
    min-height: 2.6em; /* 2줄 높이 고정 */
  }
  
  .card-dates {
    margin-bottom: 12px;
  }
  
  .date-item {
    font-size: 0.75rem;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }
  
  .date-label {
    margin-right: 4px;
  }
}
</style> 