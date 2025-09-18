<template>
  <div class="diary-create-style-container">
    <div class="style-header">
      <button @click="goBack" class="back-btn">
        ← 목록으로 돌아가기
      </button>
      <h1>일지 스타일 설정</h1>
      <p>AI가 생성할 일지의 스타일을 선택해주세요</p>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>방문 코스 정보를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error">
      <div class="error-icon">⚠️</div>
      <h3>일지 생성이 불가능합니다</h3>
      <p>{{ error }}</p>
      <button @click="checkPermissions" class="retry-btn">다시 시도</button>
    </div>

    <!-- 스타일 설정 폼 -->
    <div v-else class="style-content">
      <!-- 말투 선택 -->
      <div class="style-section">
        <h2>말투 선택</h2>
        <p class="section-description">AI가 사용할 말투를 선택해주세요</p>
        
        <div class="tone-options">
          <label 
            v-for="tone in toneOptions" 
            :key="tone.value"
            class="tone-option"
            :class="{ selected: selectedTone === tone.value }"
          >
            <input 
              type="radio" 
              :value="tone.value" 
              v-model="selectedTone"
              name="tone"
            >
            <div class="tone-content">
              <h3>{{ tone.label }}</h3>
              <p>{{ tone.description }}</p>
            </div>
          </label>
        </div>
      </div>

      <!-- 이모티콘 사용 여부 -->
      <div class="style-section">
        <h2>이모티콘 사용</h2>
        <p class="section-description">일지에 이모티콘을 포함할지 선택해주세요</p>
        
        <div class="emoticon-options">
          <label class="emoticon-option" :class="{ selected: useEmoticon }">
            <input 
              type="radio" 
              :value="true" 
              v-model="useEmoticon"
              name="emoticon"
            >
            <div class="emoticon-content">
              <span class="emoticon-icon">😊</span>
              <div class="emoticon-text">
                <h3>사용</h3>
                <p>일지에 이모티콘을 포함합니다</p>
              </div>
            </div>
          </label>
          
          <label class="emoticon-option" :class="{ selected: !useEmoticon }">
            <input 
              type="radio" 
              :value="false" 
              v-model="useEmoticon"
              name="emoticon"
            >
            <div class="emoticon-content">
              <span class="emoticon-icon">📝</span>
              <div class="emoticon-text">
                <h3>미사용</h3>
                <p>일지에 이모티콘을 포함하지 않습니다</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- 방문 코스 선택 -->
      <div class="style-section">
        <h2>방문한 코스 선택</h2>
        <p class="section-description">일지를 작성할 방문 코스를 선택해주세요</p>
        
        <div class="course-options">
          <label 
            v-for="course in visitedCourses" 
            :key="course.id"
            class="course-option"
            :class="{ selected: selectedCourse === course.id }"
          >
            <input 
              type="radio" 
              :value="course.id" 
              v-model="selectedCourse"
              name="course"
            >
            <div class="course-content">
              <h3>{{ getCourseName(course) }}</h3>
              <p class="course-date">{{ formatDate(course.visitedAt) }}</p>
              <p class="course-description">{{ getCourseDescription(course) }}</p>
            </div>
          </label>
          
          <!-- 방문한 코스가 없는 경우 안내 메시지 -->
          <div v-if="visitedCourses.length === 0" class="no-courses-message">
            <h3>방문한 코스가 없습니다</h3>
            <p>더 이상 일지를 작성할 수 있는 코스가 없습니다.</p>
            <p class="encouragement">새로운 코스를 완주해 보세요!</p>
          </div>
        </div>
      </div>

      <!-- 다음 버튼 -->
      <div class="action-buttons">
        <button 
          @click="startGeneration" 
          :disabled="!canProceed"
          class="next-btn"
        >
          다음 →
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDiaryPermissions, getAvailableCourses } from '@/services/diaryService'

export default {
  name: 'DiaryCreateStyleView',
  setup() {
    const router = useRouter()
    
    const loading = ref(false)
    const error = ref(null)
    const selectedTone = ref('')
    const useEmoticon = ref(true)
    const selectedCourse = ref(null)
    const visitedCourses = ref([])

    // 말투 옵션
    const toneOptions = [
      {
        value: 'formal',
        label: '사무적인',
        description: '정중하고 격식있는 말투로 작성됩니다'
      },
      {
        value: 'playful',
        label: '장난스러운',
        description: '재미있고 유쾌한 말투로 작성됩니다'
      },
      {
        value: 'gentle',
        label: '부드러운',
        description: '따뜻하고 부드러운 말투로 작성됩니다'
      },
      {
        value: 'childlike',
        label: '아이같은',
        description: '순수하고 귀여운 말투로 작성됩니다'
      },
      {
        value: 'mature',
        label: '어른스러운',
        description: '성숙하고 지혜로운 말투로 작성됩니다'
      },
      {
        value: 'historical',
        label: '사극풍의',
        description: '전통적이고 고풍스러운 말투로 작성됩니다'
      }
    ]

    // 진행 가능 여부 확인
    const canProceed = computed(() => {
      return selectedTone.value && selectedCourse.value !== null && visitedCourses.value.length > 0
    })

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

    // 코스 이름 가져오기
    const getCourseName = (course) => {
      if (!course) return '알 수 없는 코스'
      
      // courseName 필드 사용
      if (course.courseName) {
        return course.courseName
      }
      
      // 필드가 없으면 ID나 기본값 사용
      return course.id ? `코스 ${course.id}` : '알 수 없는 코스'
    }

    // 코스 설명 가져오기
    const getCourseDescription = (course) => {
      if (!course) return ''
      
      // 현재 API 응답에는 설명 필드가 없음
      return ''
    }

    // 뒤로가기
    const goBack = () => {
      router.back()
    }

    // 권한 확인
    const checkPermissions = async () => {
      loading.value = true
      error.value = null
      
      try {
        // 권한 확인
        const permissionResponse = await getDiaryPermissions()
        
        if (permissionResponse.canCreateDiary) {
          try {
            // 사용 가능한 코스 정보 가져오기
            const coursesResponse = await getAvailableCourses()
            visitedCourses.value = coursesResponse || []
          } catch (courseErr) {
            console.warn('코스 정보를 가져올 수 없습니다. 기본 코스로 진행합니다.', courseErr)
            // 코스 정보를 가져올 수 없어도 일지 생성은 가능하도록 함
            visitedCourses.value = []
          }
        } else {
          error.value = '일지 생성이 불가능합니다. 방문한 코스가 없거나 일지 생성 한도를 초과했습니다.'
        }
      } catch (err) {
        console.warn('권한 확인 실패. 기본 권한으로 진행합니다.', err)
        // 권한 확인 실패 시에도 일지 생성 시도
        visitedCourses.value = []
      } finally {
        loading.value = false
      }
    }

    // 일지 생성 시작
    const startGeneration = () => {
      if (!canProceed.value) return
      
      const style = `${selectedTone.value}${useEmoticon.value ? '_emoticon' : '_no_emoticon'}`
      
      // 일지 생성 채팅 페이지로 이동
      router.push({
        name: 'diary-create-chat',
        params: {
          visitedCourseId: selectedCourse.value,
          style: style
        }
      })
    }

    onMounted(() => {
      checkPermissions()
    })

    return {
      loading,
      error,
      selectedTone,
      useEmoticon,
      selectedCourse,
      visitedCourses,
      toneOptions,
      canProceed,
      formatDate,
      getCourseName,
      getCourseDescription,
      goBack,
      checkPermissions,
      startGeneration
    }
  }
}
</script>

<style scoped>
.diary-create-style-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.style-header {
  text-align: center;
  margin-bottom: 40px;
}

.back-btn {
  background: none;
  border: none;
  color: #007bff;
  font-size: 1rem;
  cursor: pointer;
  padding: 10px 0;
  margin-bottom: 20px;
  transition: color 0.3s ease;
}

.back-btn:hover {
  color: #0056b3;
}

.style-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.style-header p {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
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

.style-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.style-section {
  padding: 30px;
  border-bottom: 1px solid #e9ecef;
}

.style-section:last-child {
  border-bottom: none;
}

.style-section h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 10px;
}

.section-description {
  color: #666;
  margin-bottom: 25px;
}

/* 말투 선택 */
.tone-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
}

.tone-option {
  display: block;
  cursor: pointer;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
  background: white;
}

.tone-option:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.1);
}

.tone-option.selected {
  border-color: #007bff;
  background: #f8f9ff;
}

.tone-option input[type="radio"] {
  display: none;
}

.tone-content h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
}

.tone-content p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
}

/* 이모티콘 선택 */
.emoticon-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.emoticon-option {
  display: block;
  cursor: pointer;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
  background: white;
}

.emoticon-option:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.1);
}

.emoticon-option.selected {
  border-color: #007bff;
  background: #f8f9ff;
}

.emoticon-option input[type="radio"] {
  display: none;
}

.emoticon-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.emoticon-icon {
  font-size: 2rem;
}

.emoticon-text h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 5px;
  font-weight: 600;
}

.emoticon-text p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

/* 코스 선택 */
.course-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.course-option {
  display: block;
  cursor: pointer;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
  background: white;
}

.course-option:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.1);
}

.course-option.selected {
  border-color: #007bff;
  background: #f8f9ff;
}

.course-option input[type="radio"] {
  display: none;
}

.course-content h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
}

.course-date {
  color: #007bff;
  font-size: 0.9rem;
  margin-bottom: 8px;
  font-weight: 500;
}

.course-description {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
}

/* 방문한 코스가 없는 경우 안내 메시지 */
.no-courses-message {
  text-align: center;
  padding: 40px 20px;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  color: #6c757d;
}

.no-courses-message h3 {
  font-size: 1.3rem;
  color: #495057;
  margin-bottom: 15px;
  font-weight: 600;
}

.no-courses-message p {
  font-size: 1rem;
  margin-bottom: 10px;
  line-height: 1.5;
}

.encouragement {
  color: #007bff !important;
  font-weight: 600;
  font-size: 1.1rem !important;
  margin-top: 15px !important;
}

/* 액션 버튼 */
.action-buttons {
  padding: 30px;
  text-align: center;
  background: #f8f9fa;
}

.next-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 25px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  font-weight: 600;
}

.next-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.next-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .diary-create-style-container {
    padding: 15px;
  }
  
  .style-header h1 {
    font-size: 2rem;
  }
  
  .style-section {
    padding: 20px;
  }
  
  .tone-options,
  .emoticon-options,
  .course-options {
    grid-template-columns: 1fr;
  }
  
  .emoticon-content {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
  
  .no-courses-message {
    padding: 30px 15px;
  }
  
  .no-courses-message h3 {
    font-size: 1.2rem;
  }
  
  .no-courses-message p {
    font-size: 0.9rem;
  }
  
  .encouragement {
    font-size: 1rem !important;
  }
}

@media (max-width: 480px) {
  .style-header h1 {
    font-size: 1.5rem;
  }
  
  .style-section {
    padding: 15px;
  }
  
  .tone-option,
  .emoticon-option,
  .course-option {
    padding: 15px;
  }
  
  .no-courses-message {
    padding: 25px 10px;
  }
  
  .no-courses-message h3 {
    font-size: 1.1rem;
  }
  
  .no-courses-message p {
    font-size: 0.85rem;
  }
  
  .encouragement {
    font-size: 0.95rem !important;
  }
}
</style> 