<template>
  <div class="visited-courses-section">
    <div class="section-header">
      <h3>🏃‍♂️ 방문한 코스</h3>
      <button 
        v-if="!loading" 
        @click="refreshVisitedCourses" 
        class="refresh-btn"
        :disabled="refreshing"
      >
        {{ refreshing ? '새로고침 중...' : '새로고침' }}
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>방문한 코스를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-state">
      <p>❌ 방문한 코스를 불러올 수 없습니다: {{ error }}</p>
      <button @click="refreshVisitedCourses" class="retry-btn">다시 시도</button>
    </div>

    <!-- 방문한 코스 목록 -->
    <div v-else-if="visitedCourses && visitedCourses.length > 0" class="courses-list">
      <div class="courses-grid">
        <div 
          v-for="course in visitedCourses" 
          :key="course.visitedCourseId || course.id"
          class="course-card"
        >
          <div class="course-header">
            <h4 class="course-name">{{ course.courseName || course.gilName || '코스명 없음' }}</h4>
            <span class="visit-date">{{ formatDate(course.visitedAt || course.createdAt) }}</span>
          </div>
          
          <div class="course-info">
            <div class="info-item">
              <span class="label">거리:</span>
              <span class="value">{{ course.distance || 0 }}km</span>
            </div>
            <div class="info-item">
              <span class="label">난이도:</span>
              <span class="value">{{ course.difficulty || course.level || '보통' }}</span>
            </div>
            <div class="info-item">
              <span class="label">소요시간:</span>
              <span class="value">{{ course.reqTime || '정보없음' }}</span>
            </div>
          </div>

          <div class="course-actions">
            <div class="rating">
              <span class="stars">⭐ {{ course.rating || 0 }}</span>
            </div>
            <div class="action-buttons">
              <button 
                @click="viewCourseDetail(course)" 
                class="detail-btn"
              >
                상세보기
              </button>
              <button 
                v-if="!course.review || !course.review.content"
                @click="writeReview(course)" 
                class="write-review-btn"
              >
                후기 작성
              </button>
              <button 
                v-else
                @click="viewReview(course)" 
                class="view-review-btn"
              >
                후기 보기
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
      <div class="empty-icon">🚶‍♂️</div>
      <h4>아직 방문한 코스가 없습니다</h4>
      <p>코스를 방문하고 기록을 남겨보세요!</p>
      <button @click="goToCourseSearch" class="explore-btn">코스 둘러보기</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getVisitedCourses } from '../services/visitedCourseService.js'

export default {
  name: 'VisitedCoursesSection',
  props: {
    refreshing: {
      type: Boolean,
      default: false
    }
  },
  emits: ['refresh'],
  setup(props, { emit }) {
    const router = useRouter()
    const visitedCourses = ref([])
    const loading = ref(false)
    const error = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(6)
    const totalPages = ref(1)

    // 방문한 코스 데이터 로드
    const loadVisitedCourses = async () => {
      loading.value = true
      error.value = null
      
      try {
        console.log('🏃‍♂️ 방문한 코스 조회 시도...')
        
        const response = await getVisitedCourses()
        console.log('✅ 방문한 코스 조회 성공:', response)
        
        if (response && response.data) {
          // 새로운 응답 형식: reviewList 사용
          const courses = response.data.reviewList || response.data.visitedCourses || response.data.coursesList || response.data.items || response.data || []
          
          // 새로운 형식에 맞춰 데이터 변환
          visitedCourses.value = courses.map(course => ({
            id: course.courseId || course.id || course.visitedCourseId,
            visitedCourseId: course.courseId || course.visitedCourseId || course.id,
            courseId: course.courseId || course.id,
            courseName: course.courseName || course.gilName || '알 수 없는 코스',
            hasReview: true,
            reviewObject: {
              rating: course.stars || course.rating || 0,
              content: course.review || course.content || ''
            }
          }))
          
          totalPages.value = response.data.totalPages || 1
          console.log('🔍 방문한 코스 데이터:', visitedCourses.value.length, '개')
        } else if (Array.isArray(response)) {
          visitedCourses.value = response
          totalPages.value = 1
        } else {
          visitedCourses.value = []
          totalPages.value = 1
        }
        
      } catch (err) {
        console.error('❌ 방문한 코스 조회 실패:', err)
        error.value = err.message || '방문한 코스를 불러오는데 실패했습니다.'
        visitedCourses.value = []
      } finally {
        loading.value = false
      }
    }

    // 새로고침
    const refreshVisitedCourses = () => {
      emit('refresh')
      loadVisitedCourses()
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

    // 상태 클래스 반환
    const getStatusClass = (status) => {
      switch (status) {
        case 'COMPLETED': return 'completed'
        case 'IN_PROGRESS': return 'in-progress'
        case 'PLANNED': return 'planned'
        default: return 'unknown'
      }
    }

    // 상태 텍스트 반환
    const getStatusText = (status) => {
      switch (status) {
        case 'COMPLETED': return '완료'
        case 'IN_PROGRESS': return '진행중'
        case 'PLANNED': return '예정'
        default: return '알 수 없음'
      }
    }

    // 코스 상세 보기
    const viewCourseDetail = (course) => {
      const courseId = course.courseId || course.visitedCourseId || course.id
      if (courseId) {
        router.push(`/visited-courses/${courseId}`)
      }
    }

    // 후기 작성
    const writeReview = (course) => {
      console.log('🔍 후기 작성 버튼 클릭:', course)
      // 후기 섹션으로 스크롤하고 후기 작성 모달 열기
      const reviewSection = document.querySelector('.review-section')
      console.log('🔍 후기 섹션 찾기:', reviewSection)
      if (reviewSection) {
        reviewSection.scrollIntoView({ behavior: 'smooth' })
        // 후기 섹션에 이벤트 전달
        setTimeout(() => {
          console.log('🔍 이벤트 전송:', { course, mode: 'write' })
          window.dispatchEvent(new CustomEvent('openReviewModal', { 
            detail: { 
              course: course,
              mode: 'write'
            } 
          }))
        }, 500)
      } else {
        console.error('❌ 후기 섹션을 찾을 수 없습니다')
      }
    }

    // 후기 보기
    const viewReview = (course) => {
      // 후기 섹션으로 스크롤
      const reviewSection = document.querySelector('.review-section')
      if (reviewSection) {
        reviewSection.scrollIntoView({ behavior: 'smooth' })
      }
    }

    // 코스 검색으로 이동
    const goToCourseSearch = () => {
      router.push('/courses')
    }

    // 페이지네이션
    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
        loadVisitedCourses()
      }
    }

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
        loadVisitedCourses()
      }
    }

    onMounted(() => {
      console.log('🏃‍♂️ VisitedCoursesSection 마운트됨 - 데이터 로드 시작')
      loadVisitedCourses()
      
      // 후기 작성 후 새로고침 이벤트 리스너
      const handleRefresh = () => {
        console.log('🔄 방문한 코스 새로고침 이벤트 수신')
        loadVisitedCourses()
      }
      
      window.addEventListener('refreshVisitedCourses', handleRefresh)
      
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        window.removeEventListener('refreshVisitedCourses', handleRefresh)
      }
    })

    return {
      visitedCourses,
      loading,
      error,
      currentPage,
      totalPages,
      loadVisitedCourses,
      refreshVisitedCourses,
      formatDate,
      getStatusClass,
      getStatusText,
      viewCourseDetail,
      writeReview,
      viewReview,
      goToCourseSearch,
      prevPage,
      nextPage
    }
  }
}
</script>

<style scoped>
.visited-courses-section {
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
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #0056b3;
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
  border-top: 4px solid #007bff;
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

.explore-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.course-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #007bff;
}

.course-header {
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

.visit-date {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.course-info {
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 14px;
}

.info-item .label {
  color: #666;
  font-weight: 500;
}

.info-item .value {
  color: #333;
  font-weight: 600;
}

.course-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rating .stars {
  color: #ffc107;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.detail-btn, .write-review-btn, .view-review-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.detail-btn {
  background: #6c757d;
  color: white;
}

.detail-btn:hover {
  background: #5a6268;
}

.write-review-btn {
  background: #28a745;
  color: white;
}

.write-review-btn:hover {
  background: #218838;
}

.view-review-btn {
  background: #007bff;
  color: white;
}

.view-review-btn:hover {
  background: #0056b3;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.in-progress {
  background: #fff3cd;
  color: #856404;
}

.status-badge.planned {
  background: #cce5ff;
  color: #004085;
}

.status-badge.unknown {
  background: #f8d7da;
  color: #721c24;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.page-btn {
  background: #007bff;
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

@media (max-width: 768px) {
  .courses-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>
