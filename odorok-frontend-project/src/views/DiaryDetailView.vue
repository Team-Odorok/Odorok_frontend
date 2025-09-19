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
        <div class="content-card">
          <div class="content-text" v-html="convertMarkdownToHtml(diary.content)">
          </div>
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
import { getDiaryDetail, deleteDiary as deleteDiaryAPI } from '@/services/diaryService'
import { marked } from 'marked'

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
        const response = await getDiaryDetail(diaryId)
        console.log('=== DiaryDetailView 일지 상세 조회 응답 디버깅 ===')
        console.log('response:', response)
        console.log('response.data:', response.data)
        console.log('response.title:', response.title)
        console.log('response.content:', response.content)
        
        // API 응답 구조에 따라 데이터 설정
        diary.value = response.data || response
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
    const deleteDiary = async () => {
      console.log('=== 일지 삭제 디버깅 (DetailView) ===')
      console.log('diary.value:', diary.value)
      console.log('diary.value?.data:', diary.value?.data)
      console.log('diary.value?.data?.id:', diary.value?.data?.id)
      console.log('diary.value?.data?.diaryId:', diary.value?.data?.diaryId)
      console.log('route.params.diaryId:', route.params.diaryId)
      
      // API 응답 구조에 맞게 data 필드에서 diaryId 찾기
      const diaryData = diary.value?.data || diary.value
      const diaryId = diaryData?.id || diaryData?.diaryId || route.params.diaryId
      
      if (!diaryId) {
        console.error('일지 ID를 찾을 수 없습니다.')
        alert('삭제할 일지 정보가 없습니다.')
        return
      }

      const title = diaryData?.title || '제목 없음'
      const confirmMessage = `정말로 "${title}" 일지를 삭제하시겠습니까?\n\n삭제된 일지는 복구할 수 없습니다.`
      
      if (confirm(confirmMessage)) {
        try {
          console.log('일지 삭제 시도 - diaryId:', diaryId)
          await deleteDiaryAPI(diaryId)
          
          alert('일지가 성공적으로 삭제되었습니다.')
          router.push('/diaries')
        } catch (err) {
          console.error('일지 삭제 실패:', err)
          alert(err.message || '일지 삭제에 실패했습니다.')
        }
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

    // 마크다운을 HTML로 변환
    const convertMarkdownToHtml = (markdown) => {
      if (!markdown) return ''
      return marked(markdown)
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
      nextImage,
      convertMarkdownToHtml
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
  font-family: 'MaruBuri', serif;
}

.course-name {
  font-weight: 600;
  font-family: 'MaruBuri', serif;
}

.image-gallery {
  padding: 30px;
  border-bottom: 1px solid #e9ecef;
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

.content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin: 0 auto;
  max-width: 800px;
  border: 1px solid #e9ecef;
}

.content-text {
  line-height: 1.8;
  color: #555;
  font-size: 1.1rem;
  white-space: pre-wrap;
}

/* 마크다운 스타일링 - 일반 텍스트와 일관된 여백 */
.content-text h1,
.content-text h2,
.content-text h3,
.content-text h4,
.content-text h5,
.content-text h6 {
  color: #333;
  margin: 0;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.8;
}

.content-text h1 {
  font-size: 2rem;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.3em;
  margin-bottom: 0.8em;
}

.content-text h2 {
  font-size: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.2em;
  margin-bottom: 0.6em;
}

.content-text h3 {
  font-size: 1.3rem;
  margin-bottom: 0.4em;
}

.content-text p {
  margin: 0;
  margin-bottom: 0.5em;
  line-height: 1.8;
}

.content-text ul,
.content-text ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.content-text li {
  margin: 0;
  margin-bottom: 0.2em;
  line-height: 1.8;
}

.content-text blockquote {
  border-left: 4px solid #007bff;
  padding-left: 1em;
  margin: 0.5em 0;
  color: #666;
  font-style: italic;
  line-height: 1.8;
}

.content-text code {
  background: #f8f9fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.content-text pre {
  background: #f8f9fa;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
  margin: 1em 0;
}

.content-text pre code {
  background: none;
  padding: 0;
}

.content-text a {
  color: #007bff;
  text-decoration: none;
}

.content-text a:hover {
  text-decoration: underline;
}

.content-text strong {
  font-weight: 600;
  color: #333;
}

.content-text em {
  font-style: italic;
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
  
  .content-card {
    padding: 20px;
    margin: 0 10px;
  }
  
  .content-text h1 {
    font-size: 1.5rem;
    margin-bottom: 0.6em;
  }
  
  .content-text h2 {
    font-size: 1.3rem;
    margin-bottom: 0.5em;
  }
  
  .content-text h3 {
    font-size: 1.1rem;
    margin-bottom: 0.3em;
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