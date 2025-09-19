<template>
  <div class="review-section">
    <div class="section-header">
      <h3>방문완료 후기</h3>
      <button 
        v-if="!loading" 
        @click="refreshReviews" 
        class="refresh-btn"
        :disabled="refreshing"
      >
        {{ refreshing ? '새로고침 중...' : '새로고침' }}
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>후기를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-state">
      <p>❌ 후기를 불러올 수 없습니다: {{ error }}</p>
      <button @click="refreshReviews" class="retry-btn">다시 시도</button>
    </div>

    <!-- 후기 목록 -->
    <div v-else-if="reviews && reviews.length > 0" class="reviews-list">
      <div class="reviews-grid">
        <div 
          v-for="review in reviews" 
          :key="review.reviewId || review.id"
          class="review-card"
        >
          <div class="review-header">
            <h4 class="course-name">{{ review.courseName || review.gilName || '코스명 없음' }}</h4>
            <div class="review-rating">
              <span class="stars">⭐ {{ review.rating || 0 }}</span>
            </div>
          </div>
          
          <div class="review-content">
            <p class="review-text">{{ review.content || '후기 내용이 없습니다.' }}</p>
          </div>

          <div class="review-meta">
            <span class="review-date">{{ formatDate(review.createdAt || review.visitedAt) }}</span>
            <div class="review-actions">
              <button 
                @click="editReview(review)" 
                class="edit-btn"
                :disabled="loading"
              >
                수정
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="prevPage" 
          :disabled="currentPage <= 1"
          class="page-btn"
        >
          이전
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="nextPage" 
          :disabled="currentPage >= totalPages"
          class="page-btn"
        >
          다음
        </button>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📝</div>
      <h4>아직 작성한 후기가 없습니다</h4>
      <p>코스를 방문하고 후기를 작성해보세요!</p>
      <button @click="goToVisitedCourses" class="write-btn">방문한 코스 보기</button>
    </div>

    <!-- 후기 작성/수정 모달 -->
    <div v-if="showReviewModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingReview ? '후기 수정' : '후기 작성' }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>코스명</label>
            <input 
              v-model="reviewForm.courseName" 
              type="text" 
              readonly
              class="form-input readonly"
            />
          </div>
          
          <div class="form-group">
            <label>평점 <span class="required">*</span></label>
            <div class="rating-input">
              <button 
                v-for="star in 5" 
                :key="star"
                @click="reviewForm.rating = star"
                class="star-btn"
                :class="{ active: star <= reviewForm.rating }"
              >
                ⭐
              </button>
              <span class="rating-text">{{ reviewForm.rating }}/5</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>후기 내용 <span class="required">*</span></label>
            <textarea 
              v-model="reviewForm.content" 
              placeholder="방문 경험을 자유롭게 작성해주세요..."
              class="form-textarea"
              rows="4"
              maxlength="500"
            ></textarea>
            <div class="char-count">{{ reviewForm.content.length }}/500</div>
          </div>
          
          <div class="form-group">
            <label>사진 첨부</label>
            <div class="image-upload">
              <input 
                ref="imageInput"
                type="file" 
                accept="image/*"
                @change="handleImageUpload"
                class="file-input"
                id="review-image"
              />
              <label for="review-image" class="upload-btn">
                <span class="upload-icon">📷</span>
                <span class="upload-text">사진 선택</span>
              </label>
              <div v-if="reviewForm.image" class="image-preview">
                <img :src="reviewForm.image" alt="미리보기" />
                <button @click="removeImage" class="remove-image-btn">×</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModal" class="cancel-btn">취소</button>
          <button 
            @click="saveReview" 
            class="save-btn"
            :disabled="!reviewForm.rating || !reviewForm.content.trim()"
          >
            {{ editingReview ? '수정' : '작성' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getVisitedCourses, upsertVisitedCourseReview } from '../services/visitedCourseService.js'

export default {
  name: 'ReviewSection',
  props: {
    refreshing: {
      type: Boolean,
      default: false
    }
  },
  emits: ['refresh'],
  setup(props, { emit }) {
    const router = useRouter()
    const reviews = ref([])
    const loading = ref(false)
    const error = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(6)
    const totalPages = ref(1)
    
    // 모달 관련
    const showReviewModal = ref(false)
    const editingReview = ref(null)
    const reviewForm = ref({
      courseName: '',
      rating: 0,
      content: '',
      visitedCourseId: null,
      image: null,
      imageFile: null
    })
    const imageInput = ref(null)

    // 후기 데이터 로드
    const loadReviews = async () => {
      loading.value = true
      error.value = null
      
      try {
        console.log('📝 후기 조회 시도...')
        
        // 방문한 코스에서 후기가 있는 것들만 필터링
        const response = await getVisitedCourses()
        console.log('✅ 방문한 코스 조회 성공:', response)
        
        if (response && response.data && Array.isArray(response.data.reviewList)) {
          const reviewList = response.data.reviewList
          console.log('🔍 reviewList 항목 수:', reviewList.length)
          // 컴포넌트가 기대하는 필드로 매핑
          reviews.value = reviewList.map(item => ({
            id: item.courseId,
            visitedCourseId: item.courseId,
            courseId: item.courseId,
            courseName: item.courseName,
            rating: item.stars || 0,
            content: item.review || '',
            createdAt: item.createdAt || item.visitedAt || null
          }))
          totalPages.value = 1
        } else {
          console.warn('reviewList가 없거나 배열이 아닙니다. 응답:', response?.data)
          reviews.value = []
          totalPages.value = 1
        }
        
      } catch (err) {
        console.error('❌ 후기 조회 실패:', err)
        error.value = err.message || '후기를 불러오는데 실패했습니다.'
        reviews.value = []
      } finally {
        loading.value = false
      }
    }

    // 새로고침
    const refreshReviews = () => {
      emit('refresh')
      loadReviews()
    }

    // 날짜 포맷팅
    const formatDate = (dateString) => {
      if (!dateString) return '날짜 없음'
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      } catch {
        return '날짜 없음'
      }
    }

    // 후기 수정
    const editReview = (review) => {
      editingReview.value = review
      reviewForm.value = {
        courseName: review.courseName || review.gilName || '',
        rating: review.rating || 0,
        content: review.content || '',
        visitedCourseId: review.visitedCourseId || review.id
      }
      showReviewModal.value = true
    }

    // 삭제 기능 비활성화 (요청에 따라 제거)

    // 후기 저장
    const saveReview = async () => {
      if (!reviewForm.value.rating || !reviewForm.value.content.trim()) {
        alert('평점과 후기 내용을 모두 입력해주세요.')
        return
      }
      
      try {
        console.log('🔍 후기 저장 시 reviewForm:', reviewForm.value)
        console.log('🔍 visitedCourseId:', reviewForm.value.visitedCourseId)
        console.log('🔍 visitedCourseId 타입:', typeof reviewForm.value.visitedCourseId)
        console.log('🔍 visitedCourseId 값들:', {
          visitedCourseId: reviewForm.value.visitedCourseId,
          courseId: reviewForm.value.courseId,
          id: reviewForm.value.id
        })
        
        // 실제 방문한 코스 ID 찾기
        const courseId = reviewForm.value.visitedCourseId || reviewForm.value.courseId || reviewForm.value.id
        console.log('🔍 사용할 courseId:', courseId)
        
        // ID가 없으면 에러
        if (!courseId) {
          console.error('❌ 방문한 코스 ID를 찾을 수 없습니다.')
          console.log('🔍 reviewForm 전체 데이터:', JSON.stringify(reviewForm.value, null, 2))
          alert('방문한 코스 정보를 찾을 수 없습니다. 페이지를 새로고침해주세요.')
          return
        }
        
        
        const reviewData = {
          rating: reviewForm.value.rating,
          content: reviewForm.value.content.trim(),
          imageFile: reviewForm.value.imageFile
        }
        
        const result = await upsertVisitedCourseReview(courseId, reviewData)
        
        console.log('🔍 후기 작성 결과:', result)
        
        alert(editingReview.value ? '후기가 수정되었습니다.' : '후기가 작성되었습니다.')
        closeModal()
        
        // 후기 작성 성공 시 임시로 후기 목록에 추가
        console.log('🔍 result 체크:', result, 'status:', result?.status)
        if (result && result.status === 'success') {
          console.log('✅ 후기 작성 성공 - 임시로 후기 목록에 추가')
          const newReview = {
            id: reviewForm.value.visitedCourseId,
            visitedCourseId: reviewForm.value.visitedCourseId,
            courseName: reviewForm.value.courseName,
            gilName: reviewForm.value.courseName,
            rating: reviewForm.value.rating,
            content: reviewForm.value.content,
            createdAt: new Date().toISOString(),
            visitedAt: new Date().toISOString(),
            review: {
              content: reviewForm.value.content,
              rating: reviewForm.value.rating,
              createdAt: new Date().toISOString()
            }
          }
          
          // 기존 후기 목록에 추가 (중복 방지)
          const existingIndex = reviews.value.findIndex(r => (r.id === newReview.id) || (r.visitedCourseId === newReview.visitedCourseId))
          if (existingIndex >= 0) {
            reviews.value[existingIndex] = newReview
            console.log('✅ 기존 후기 업데이트:', existingIndex)
          } else {
            reviews.value.unshift(newReview)
            console.log('✅ 새 후기 추가:', reviews.value.length)
          }
          
          console.log('✅ 임시 후기 추가 완료:', newReview)
          console.log('✅ 현재 후기 목록 개수:', reviews.value.length)
        } else {
          console.log('❌ 임시 후기 추가 실패 - result 조건 불만족:', result)
        }
        
        // 후기 목록 새로고침 (더 긴 지연 후 - 서버 동기화 시간 확보)
        setTimeout(async () => {
          console.log('🔄 후기 목록 새로고침 시작 (지연 후)')
          await loadReviews()
        }, 3000)
        
        // 부모 컴포넌트(VisitedCoursesSection)에도 새로고침 알림 (더 긴 지연 후)
        setTimeout(() => {
          console.log('🔄 방문한 코스 새로고침 이벤트 전송 (지연 후)')
          window.dispatchEvent(new CustomEvent('refreshVisitedCourses'))
        }, 4000)
      } catch (err) {
        console.error('후기 저장 실패:', err)
        alert('후기 저장에 실패했습니다.')
      }
    }

    // 이미지 업로드 처리
    const handleImageUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        // 파일 크기 체크 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
          alert('파일 크기는 5MB 이하여야 합니다.')
          return
        }
        
        // 파일 타입 체크
        if (!file.type.startsWith('image/')) {
          alert('이미지 파일만 업로드 가능합니다.')
          return
        }
        
        // 미리보기용 URL 생성
        const reader = new FileReader()
        reader.onload = (e) => {
          reviewForm.value.image = e.target.result
          reviewForm.value.imageFile = file
        }
        reader.readAsDataURL(file)
      }
    }
    
    // 이미지 제거
    const removeImage = () => {
      reviewForm.value.image = null
      reviewForm.value.imageFile = null
      if (imageInput.value) {
        imageInput.value.value = ''
      }
    }

    // 모달 닫기
    const closeModal = () => {
      showReviewModal.value = false
      editingReview.value = null
      reviewForm.value = {
        courseName: '',
        rating: 0,
        content: '',
        visitedCourseId: null,
        image: null,
        imageFile: null
      }
      removeImage()
    }

    // 방문한 코스로 이동
    const goToVisitedCourses = () => {
      // 방문한 코스 섹션으로 스크롤
      const visitedSection = document.querySelector('.visited-courses-section')
      if (visitedSection) {
        visitedSection.scrollIntoView({ behavior: 'smooth' })
      }
    }

    // 페이지네이션
    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
        loadReviews()
      }
    }

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
        loadReviews()
      }
    }

    onMounted(() => {
      console.log('📝 ReviewSection 마운트됨 - 데이터 로드 시작')
      loadReviews()
      
      // 외부에서 후기 작성 모달 열기 이벤트 리스너
      const handleOpenReviewModal = (event) => {
        console.log('🔍 후기 모달 이벤트 수신:', event.detail)
        const { course, mode } = event.detail
        if (course && mode === 'write') {
          console.log('✅ 후기 작성 모달 열기:', course)
          console.log('🔍 course 객체의 모든 키들:', Object.keys(course))
          console.log('🔍 course 객체의 ID 관련 필드들:', {
            id: course.id,
            visitedCourseId: course.visitedCourseId,
            courseId: course.courseId,
            visitedId: course.visitedId,
            visited_course_id: course.visited_course_id
          })
          
          // 모든 가능한 ID 필드 확인
          const courseId = course.visitedCourseId || course.visitedId || course.visited_course_id || course.id || course.courseId
          console.log('🔍 선택된 courseId:', courseId)
          
          reviewForm.value = {
            courseName: course.courseName || course.gilName || '',
            rating: 0,
            content: '',
            visitedCourseId: courseId,
            courseId: course.courseId,
            id: course.id,
            image: null,
            imageFile: null
          }
          showReviewModal.value = true
          console.log('✅ 모달 상태 변경:', showReviewModal.value)
          console.log('✅ 설정된 reviewForm:', reviewForm.value)
        }
      }
      
      window.addEventListener('openReviewModal', handleOpenReviewModal)
      
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        window.removeEventListener('openReviewModal', handleOpenReviewModal)
      }
    })

    return {
      reviews,
      loading,
      error,
      currentPage,
      totalPages,
      showReviewModal,
      editingReview,
      reviewForm,
      imageInput,
      loadReviews,
      refreshReviews,
      formatDate,
      editReview,
      saveReview,
      closeModal,
      goToVisitedCourses,
      prevPage,
      nextPage,
      handleImageUpload,
      removeImage
    }
  }
}
</script>

<style scoped>
.review-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.refresh-btn {
  background: #303E69;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #1e2a4a;
}

.refresh-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #303E69;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state p {
  color: #dc3545;
  margin-bottom: 16px;
}

.retry-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.empty-state .empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h4 {
  color: #666;
  margin-bottom: 8px;
}

.empty-state p {
  color: #999;
  margin-bottom: 20px;
}

.write-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.review-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.review-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #303E69;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.course-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 8px;
}

.review-rating .stars {
  color: #ffc107;
  font-weight: 600;
  font-size: 14px;
}

.review-content {
  margin-bottom: 12px;
}

.review-text {
  margin: 0;
  color: #555;
  line-height: 1.5;
  font-size: 14px;
}

.review-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-date {
  font-size: 12px;
  color: #666;
}

.review-actions {
  display: flex;
  gap: 8px;
}

.edit-btn, .delete-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.edit-btn {
  background: #303E69;
  color: white;
}

.edit-btn:hover:not(:disabled) {
  background: #1e2a4a;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: #c82333;
}

.edit-btn:disabled, .delete-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.page-btn {
  background: #303E69;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.page-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.required {
  color: #e74c3c;
  margin-left: 4px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #303E69;
  box-shadow: 0 0 0 3px rgba(48, 62, 105, 0.1);
}

.form-input.readonly {
  background: #f8f9fa;
  color: #666;
  cursor: not-allowed;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.rating-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  opacity: 0.3;
  transition: all 0.2s;
  padding: 4px;
  border-radius: 4px;
}

.star-btn.active {
  opacity: 1;
  transform: scale(1.1);
}

.star-btn:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.rating-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  margin-left: 8px;
}

/* 이미지 업로드 스타일 */
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-input {
  display: none;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8f9fa;
}

.upload-btn:hover {
  border-color: #303E69;
  background: #f0f2ff;
}

.upload-icon {
  font-size: 20px;
}

.upload-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.image-preview {
  position: relative;
  display: inline-block;
  max-width: 200px;
}

.image-preview img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.remove-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 0 0 16px 16px;
}

.cancel-btn, .save-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  min-width: 80px;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

@media (max-width: 768px) {
  .reviews-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style>
 