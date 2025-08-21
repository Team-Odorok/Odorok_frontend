<template>
    <div class="course-review">
      <h3>코스 리뷰</h3>
      
      <!-- 탭 전환 -->
      <div class="review-tabs">
        <button 
          @click="activeTab = 'reviews'" 
          :class="{ active: activeTab === 'reviews' }"
          class="tab-btn"
        >
          리뷰 보이기
        </button>
        <button 
          @click="activeTab = 'photos'" 
          :class="{ active: activeTab === 'photos' }"
          class="tab-btn"
        >
          사진 보이기
        </button>
      </div>
      
      <!-- 리뷰 소팅 -->
      <div class="review-sorting">
        <select v-model="sortBy" @change="loadReviews">
          <option value="visitedAt,desc">최신순</option>
          <option value="stars,desc">별점 높은 순</option>
          <option value="stars,asc">별점 낮은 순</option>
        </select>
      </div>
      
      <!-- 리뷰 보이기 탭 -->
      <div v-if="activeTab === 'reviews'" class="review-content">
        <div v-if="loading" class="loading">리뷰를 불러오는 중...</div>
        <div v-else-if="reviews.length === 0" class="no-reviews">아직 리뷰가 없습니다.</div>
        <div v-else class="review-list">
          <div v-for="review in reviews" :key="review.id" class="review-item">
            <div class="review-header">
              <span class="reviewer">{{ review.nickname }}</span>
              <span class="rating">⭐ {{ review.stars }}/5</span>
              <span class="date">{{ formatDate(review.visitedAt) }}</span>
            </div>
            <div class="review-text">{{ review.review }}</div>
          </div>
        </div>
      </div>
      
      <!-- 사진 보이기 탭 -->
      <div v-if="activeTab === 'photos'" class="photo-content">
        <div class="photo-placeholder">
          <p>사진 기능은 추후 구현 예정입니다.</p>
          <p>리뷰에 첨부된 사진들이 여기에 표시됩니다.</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import courseApi from '../api/courseApi.js'
  
  export default {
    name: 'CourseReviewComponent',
    props: {
      courseId: {
        type: [String, Number],
        required: true
      }
    },
    data() {
      return {
        activeTab: 'reviews',
        reviews: [],
        loading: false,
        sortBy: 'visitedAt,desc'
      }
    },
    async mounted() {
      await this.loadReviews()
    },
    methods: {
      async loadReviews() {
        this.loading = true
        try {
          const response = await courseApi.getCourseReviews(this.courseId, 0, 20, this.sortBy)
          if (response && response.status === 'success' && response.data && response.data.items) {
            this.reviews = response.data.items
          } else {
            this.reviews = []
          }
        } catch (error) {
          console.error('리뷰 로드 실패:', error)
          this.reviews = []
        } finally {
          this.loading = false
        }
      },
      
      formatDate(dateString) {
        const date = new Date(dateString)
        return date.toLocaleDateString('ko-KR')
      }
    }
  }
  </script>
  
  <style scoped>
  .course-review {
    margin-top: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
  }
  
  .review-tabs {
    display: flex;
    margin-bottom: 15px;
    border-bottom: 1px solid #ddd;
  }
  
  .tab-btn {
    padding: 10px 20px;
    border: none;
    background: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }
  
  .tab-btn.active {
    border-bottom-color: #007bff;
    color: #007bff;
    font-weight: bold;
  }
  
  .review-sorting {
    margin-bottom: 15px;
  }
  
  .review-sorting select {
    padding: 5px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .review-list {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .review-item {
    padding: 15px;
    border-bottom: 1px solid #eee;
    margin-bottom: 10px;
  }
  
  .review-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.9rem;
    color: #666;
  }
  
  .reviewer {
    font-weight: bold;
    color: #333;
  }
  
  .review-text {
    line-height: 1.5;
  }
  
  .photo-placeholder {
    text-align: center;
    padding: 40px;
    color: #666;
    background: #f8f9fa;
    border-radius: 6px;
  }
  
  .loading, .no-reviews {
    text-align: center;
    padding: 20px;
    color: #666;
  }
  </style>