<template>
  <div class="diary-detail-container">
    <!-- 뒤로가기 버튼 -->
    <div class="back-button">
      <button @click="goBack" class="back-btn">
        ← 목록으로 돌아가기
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>일지를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error">
      <div class="error-icon">⚠️</div>
      <h3>일지를 불러올 수 없습니다</h3>
      <p>{{ error }}</p>
      <button @click="fetchDiaryDetail" class="retry-btn">다시 시도</button>
    </div>

    <!-- 일지 상세 내용 -->
    <div v-else-if="diary" class="diary-content">
      <!-- 일지 헤더 -->
      <div class="diary-header">
        <h1 class="diary-title">{{ diary.title }}</h1>
        <div class="diary-meta">
          <span class="course-name">{{ diary.courseName }}</span>
          <span class="visited-date">방문일: {{ formatDate(diary.visitedAt) }}</span>
          <span class="created-date">작성일: {{ formatDate(diary.createdAt) }}</span>
        </div>
      </div>

      <!-- 이미지 갤러리 -->
      <div v-if="diary.imgs && diary.imgs.length > 0" class="image-gallery">
        <h3>여행 사진</h3>
        <div class="image-grid">
          <div 
            v-for="(image, index) in diary.imgs" 
            :key="index" 
            class="image-item"
            @click="openImageModal(image, index)"
          >
            <img :src="image" :alt="`${diary.title} 이미지 ${index + 1}`" />
          </div>
        </div>
      </div>

      <!-- 일지 내용 -->
      <div class="diary-body">
        <h3>일지 내용</h3>
        <div class="content-text">
          {{ diary.content }}
        </div>
      </div>

      <!-- 액션 버튼 -->
      <div class="action-buttons">
        <button @click="deleteDiary" class="delete-btn">삭제하기</button>
      </div>
    </div>

    <!-- 이미지 모달 -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeImageModal">×</button>
        <img :src="selectedImage" :alt="`${diary?.title} 이미지`" />
        <div class="image-nav">
          <button 
            @click="prevImage" 
            :disabled="currentImageIndex === 0"
            class="nav-btn"
          >
            ‹
          </button>
          <span class="image-counter">{{ currentImageIndex + 1 }} / {{ diary?.imgs?.length }}</span>
          <button 
            @click="nextImage" 
            :disabled="currentImageIndex === (diary?.imgs?.length - 1)"
            class="nav-btn"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDiaryDetail } from '@/services/diaryService.js'

export default {
  name: 'DiaryDetailView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const diary = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const showImageModal = ref(false)
    const selectedImage = ref('')
    const currentImageIndex = ref(0)

    // 목업 데이터 (백엔드 연동 전까지 사용)
    const mockDiary = {
      id: 1,
      title: "제주도 여행",
      content: "제주도에 처음 방문했습니다. 아름다운 해변과 맛있는 음식들, 그리고 친절한 현지인들을 만나서 정말 즐거운 시간을 보냈습니다. 특히 성산일출봉에서 본 일출은 평생 잊을 수 없는 장면이었습니다. 다음에 또 방문하고 싶은 곳이에요!",
      imgs: [
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
      ],
      userId: 1,
      courseName: "제주도 성산일출봉 코스",
      visitedAt: "2025-05-17 00:00:00",
      createdAt: "2025-05-17 00:00:00"
    }

    // 일지 상세 조회
    const fetchDiaryDetail = async () => {
      const diaryId = route.params.diaryId
      if (!diaryId) {
        error.value = '일지 ID가 없습니다.'
        return
      }

      loading.value = true
      error.value = null

      try {
        // 실제 API 호출 (백엔드 준비되면 주석 해제)
        // const response = await getDiaryDetail(diaryId)
        // diary.value = response.data.diary
        
        // 목업 데이터 사용 (백엔드 연동 전까지)
        await new Promise(resolve => setTimeout(resolve, 1000)) // 로딩 시뮬레이션
        
        // API 에러 시뮬레이션 (테스트용)
        // throw new Error('API 서버에 연결할 수 없습니다.')
        
        diary.value = mockDiary
      } catch (err) {
        error.value = err.message || '일지를 불러오는데 실패했습니다.'
        console.error('Error fetching diary detail:', err)
      } finally {
        loading.value = false
      }
    }

    // 날짜 포맷팅
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    // 뒤로가기
    const goBack = () => {
      router.back()
    }



    // 일지 삭제
    const deleteDiary = () => {
      if (confirm('정말로 이 일지를 삭제하시겠습니까?')) {
        console.log('Delete diary:', diary.value.id)
        // TODO: 일지 삭제 API 호출
        // deleteDiary(diary.value.id).then(() => {
        //   router.push('/diaries')
        // })
      }
    }

    // 이미지 모달 관련
    const openImageModal = (image, index) => {
      selectedImage.value = image
      currentImageIndex.value = index
      showImageModal.value = true
    }

    const closeImageModal = () => {
      showImageModal.value = false
    }

    const prevImage = () => {
      if (currentImageIndex.value > 0) {
        currentImageIndex.value--
        selectedImage.value = diary.value.imgs[currentImageIndex.value]
      }
    }

    const nextImage = () => {
      if (currentImageIndex.value < diary.value.imgs.length - 1) {
        currentImageIndex.value++
        selectedImage.value = diary.value.imgs[currentImageIndex.value]
      }
    }

    onMounted(() => {
      fetchDiaryDetail()
    })

    return {
      diary,
      loading,
      error,
      showImageModal,
      selectedImage,
      currentImageIndex,
      fetchDiaryDetail,
      formatDate,
      goBack,
      deleteDiary,
      openImageModal,
      closeImageModal,
      prevImage,
      nextImage
    }
  }
}
</script>

<style scoped>
.diary-detail-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.back-button {
  margin-bottom: 30px;
}

.back-btn {
  background: none;
  border: none;
  color: #007bff;
  font-size: 1rem;
  cursor: pointer;
  padding: 10px 0;
  transition: color 0.3s ease;
}

.back-btn:hover {
  color: #0056b3;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 60px 20px;
  color: #dc3545;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.error h3 {
  margin-bottom: 10px;
  color: #dc3545;
}

.retry-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 15px;
}

.retry-btn:hover {
  background: #c82333;
}

.diary-content {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.diary-header {
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.diary-title {
  font-size: 2.5rem;
  margin-bottom: 15px;
  font-weight: 600;
}

.diary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.course-name {
  font-weight: 600;
}

.image-gallery {
  padding: 30px;
  border-bottom: 1px solid #e9ecef;
}

.image-gallery h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 1.3rem;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.image-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.image-item:hover {
  transform: scale(1.05);
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.diary-body {
  padding: 30px;
}

.diary-body h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 1.3rem;
}

.content-text {
  line-height: 1.8;
  color: #555;
  font-size: 1.1rem;
  white-space: pre-wrap;
}

.action-buttons {
  padding: 20px 30px;
  background: #f8f9fa;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.edit-btn, .delete-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.edit-btn {
  background: #007bff;
  color: white;
}

.edit-btn:hover {
  background: #0056b3;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}

/* 이미지 모달 */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  z-index: 1001;
}

.modal-content img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.image-nav {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 5px 15px;
  border-radius: 5px;
  transition: background 0.3s ease;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-counter {
  color: white;
  font-size: 1rem;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .diary-detail-container {
    padding: 15px;
  }
  
  .diary-title {
    font-size: 2rem;
  }
  
  .diary-meta {
    flex-direction: column;
    gap: 10px;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .edit-btn, .delete-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .diary-header {
    padding: 20px;
  }
  
  .diary-title {
    font-size: 1.5rem;
  }
  
  .image-gallery, .diary-body {
    padding: 20px;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style> 