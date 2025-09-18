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
        <div v-if="loadingPhotos" class="loading">사진을 불러오는 중...</div>
        <div v-else-if="photos.length === 0" class="no-photos">아직 사진이 없습니다.</div>
        <div v-else class="photo-grid">
          <div v-for="photo in photos" :key="photo.id" class="photo-item" @click="openPhotoModal(photo)">
            <img :src="photo.url" :alt="photo.caption || '리뷰 사진'" class="photo-thumbnail" />
            <div class="photo-overlay">
              <span class="photo-caption">{{ photo.caption || '리뷰 사진' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 사진 모달 -->
      <div v-if="selectedPhoto" class="photo-modal" @click="closePhotoModal">
        <div class="photo-modal-content" @click.stop>
          <button class="close-btn" @click="closePhotoModal">&times;</button>
          <img :src="selectedPhoto.url" :alt="selectedPhoto.caption || '리뷰 사진'" class="photo-full" />
          <div class="photo-info">
            <p class="photo-caption">{{ selectedPhoto.caption || '리뷰 사진' }}</p>
            <p class="photo-date">{{ formatDate(selectedPhoto.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import courseApi from '../api/courseApi.js'
  import { handleApiError } from '../utils/errorHandler.js'
  
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
        photos: [],
        loading: false,
        loadingPhotos: false,
        sortBy: 'visitedAt,desc',
        selectedPhoto: null
      }
    },
    async mounted() {
      await this.loadReviews()
    },
    watch: {
      activeTab(newTab) {
        if (newTab === 'photos' && this.photos.length === 0) {
          this.loadPhotos()
        }
      }
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
          handleApiError(error, '리뷰 로드')
          this.reviews = []
        } finally {
          this.loading = false
        }
      },
      
      async loadPhotos() {
        this.loadingPhotos = true
        try {
          // 리뷰에서 사진 정보 추출 (실제 API가 있다면 별도 엔드포인트 사용)
          const response = await courseApi.getCourseReviews(this.courseId, 0, 50, this.sortBy)
          if (response && response.status === 'success' && response.data && response.data.items) {
            // 리뷰에서 사진 정보 추출
            this.photos = []
            response.data.items.forEach(review => {
              if (review.images && review.images.length > 0) {
                review.images.forEach((image, index) => {
                  this.photos.push({
                    id: `${review.id}_${index}`,
                    url: image.url || image,
                    caption: image.caption || `${review.nickname}님의 리뷰 사진`,
                    createdAt: review.visitedAt || review.createdAt,
                    reviewId: review.id
                  })
                })
              }
            })
          } else {
            this.photos = []
          }
        } catch (error) {
          handleApiError(error, '사진 로드')
          this.photos = []
        } finally {
          this.loadingPhotos = false
        }
      },
      
      openPhotoModal(photo) {
        this.selectedPhoto = photo
      },
      
      closePhotoModal() {
        this.selectedPhoto = null
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
  
  .loading, .no-reviews, .no-photos {
    text-align: center;
    padding: 20px;
    color: #666;
  }
  
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .photo-item {
    position: relative;
    cursor: pointer;
    border-radius: 8px;
    overflow: hidden;
    aspect-ratio: 1;
  }
  
  .photo-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .photo-item:hover .photo-thumbnail {
    transform: scale(1.05);
  }
  
  .photo-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    color: white;
    padding: 10px;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }
  
  .photo-item:hover .photo-overlay {
    transform: translateY(0);
  }
  
  .photo-caption {
    font-size: 0.8rem;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .photo-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .photo-modal-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
    background: white;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .close-btn {
    position: absolute;
    top: 10px;
    right: 15px;
    background: rgba(0,0,0,0.5);
    color: white;
    border: none;
    font-size: 24px;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
  }
  
  .photo-full {
    max-width: 100%;
    max-height: 70vh;
    display: block;
  }
  
  .photo-info {
    padding: 15px;
    background: white;
  }
  
  .photo-info .photo-caption {
    font-size: 1rem;
    color: #333;
    margin: 0 0 5px 0;
  }
  
  .photo-date {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
  }
  </style>