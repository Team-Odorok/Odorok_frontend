<template>
  <div class="diary-create-chat-container">
    <div class="chat-header">
      <button @click="goBack" class="back-btn">
        ← 스타일 설정으로 돌아가기
      </button>
      <h1>AI와 함께 일지 작성하기</h1>
      <p>AI가 여행에 대해 질문할 거예요. 답변해주시면 멋진 일지를 만들어드릴게요!</p>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>AI가 준비 중입니다...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error">
      <div class="error-icon">⚠️</div>
      <h3>일지 생성에 실패했습니다</h3>
      <p>{{ error }}</p>
      <button @click="startChat" class="retry-btn">다시 시도</button>
    </div>

          <!-- 일지 생성 완료 상태 -->
      <div v-else-if="isCompleted" class="diary-completion">
        <!-- 완료 알림 -->
        <div v-if="showCompletionNotification" class="completion-notification">
          <div class="notification-content">
            <div class="notification-icon">🎉</div>
            <div class="notification-text">
              <h3>{{ getCompletionTitle() }}</h3>
              <p>{{ getCompletionMessage() }}</p>
            </div>
            <button @click="closeNotification" class="notification-close">×</button>
          </div>
        </div>

        <!-- 일지 제목 -->
        <div class="diary-title-section">
          <div v-if="!isEditingTitle" class="title-display">
            <h2>{{ diaryTitle }}</h2>
            <button @click="startEditTitle" class="edit-title-btn">✏️</button>
          </div>
          <div v-else class="title-edit">
            <input
              v-model="editingTitle"
              @keydown.enter="saveTitle"
              @blur="saveTitle"
              class="title-input"
              placeholder="일지 제목을 입력하세요"
            />
            <button @click="saveTitle" class="save-title-btn">저장</button>
            <button @click="cancelEditTitle" class="cancel-title-btn">취소</button>
          </div>
        </div>

        <!-- 사진 첨부 섹션 -->
        <div class="image-section">
          <div class="image-section-header">
            <h4>📷 일지 사진 첨부</h4>
            <button @click="showImageUpload = true" class="add-image-btn">
              사진 추가
            </button>
          </div>

          <!-- 이미지 미리보기 -->
          <div v-if="attachedImages.length > 0" class="image-preview">
            <div class="image-grid">
              <div 
                v-for="(image, index) in attachedImages" 
                :key="index"
                class="image-preview-item"
              >
                <img :src="image.preview" :alt="`이미지 ${index + 1}`" />
                <button @click="removeImage(index)" class="remove-image-btn">×</button>
              </div>
            </div>
          </div>

          <!-- 이미지가 없을 때 안내 메시지 -->
          <div v-else class="no-images-message">
            <p>아직 첨부된 사진이 없습니다. "사진 추가" 버튼을 눌러 여행 사진을 첨부해보세요!</p>
          </div>

          <!-- 이미지 업로드 폼 -->
          <div v-if="showImageUpload" class="image-upload-form">
            <h4>사진 첨부</h4>
            <div class="image-upload-area">
              <input
                ref="imageInput"
                type="file"
                multiple
                accept="image/*"
                @change="handleImageUpload"
                class="image-input"
              />
              <div class="upload-placeholder">
                <span class="upload-icon">📷</span>
                <p>클릭하여 사진을 선택하거나 여기에 드래그하세요</p>
                <p class="upload-hint">여러 장의 사진을 선택할 수 있습니다</p>
              </div>
            </div>
            <div class="image-upload-actions">
              <button @click="cancelImageUpload" class="cancel-btn">취소</button>
              <button @click="confirmImageUpload" class="confirm-btn">확인</button>
            </div>
          </div>
        </div>

        <!-- 일지 탭 -->
        <div class="diary-tabs">
          <button 
            v-for="(diary, index) in generatedDiaries" 
            :key="index"
            @click="selectDiary(index)"
            class="tab-btn"
            :class="{ active: selectedDiaryIndex === index }"
          >
            {{ index + 1 }}차 일지
          </button>
        </div>

        <!-- 선택된 일지 내용 -->
        <div v-if="selectedDiary" class="selected-diary">
          <div class="diary-content">
            <div v-if="!isEditingContent" class="content-display">
              <div class="diary-text">
                {{ selectedDiary.content }}
              </div>
            </div>
            <div v-else class="content-edit">
              <textarea
                v-model="editingContent"
                class="content-input"
                placeholder="일지 내용을 입력하세요"
                rows="15"
              ></textarea>
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="diary-actions">
            <button 
              v-if="canRegenerate" 
              @click="showRegenerateForm = true"
              class="regenerate-btn"
            >
              재생성
            </button>
            <button 
              v-if="!isEditingContent" 
              @click="startEditContent" 
              class="edit-btn"
            >
              수정
            </button>
            <div v-else class="edit-actions">
              <button @click="saveContent" class="save-content-btn">수정완료</button>
              <button @click="cancelEditContent" class="cancel-content-btn">취소</button>
            </div>
            <button @click="handleSaveDiary" class="save-btn">
              저장
            </button>
          </div>

          <!-- 재생성 폼 -->
          <div v-if="showRegenerateForm" class="regenerate-form">
            <h4>재생성 피드백 (선택사항)</h4>
            <textarea
              v-model="feedback"
              placeholder="어떤 부분을 개선하고 싶으신가요? (선택사항)"
              class="feedback-input"
              rows="4"
            ></textarea>
            <div class="feedback-actions">
              <button @click="cancelRegenerate" class="cancel-btn">취소</button>
              <button @click="handleRegenerateDiary" class="confirm-btn">재생성 시작</button>
            </div>
          </div>
        </div>
      </div>

    <!-- 채팅 인터페이스 -->
    <div v-else class="chat-interface">
      <!-- 채팅창 -->
      <div class="chat-window" ref="chatWindow">
        <div class="chat-messages">
          <div 
            v-for="(message, index) in chatMessages" 
            :key="index"
            class="message"
            :class="message.role"
          >
            <div class="message-content">
              <div v-if="message.role === 'assistant'" class="ai-avatar">
                🤖
              </div>
              <div v-else-if="message.role === 'user'" class="user-avatar">
                👤
              </div>
              
              <div class="message-text">
                <p>{{ message.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 입력창 -->
      <div class="chat-input">
        <div class="input-container">
          <textarea
            v-model="userInput"
            @keydown.enter.prevent="sendMessage"
            placeholder="답변을 입력해주세요..."
            class="message-input"
            :disabled="isProcessing"
            rows="3"
          ></textarea>
          <button 
            @click="sendMessage" 
            :disabled="!userInput.trim() || isProcessing"
            class="send-btn"
          >
            <span v-if="!isProcessing">전송</span>
            <span v-else class="sending">처리중...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { startDiaryGeneration, submitAnswer, saveDiary, regenerateDiary as regenerateDiaryAPI, getAvailableCourses } from '@/services/diaryService.js'

export default {
  name: 'DiaryCreateChatView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const loading = ref(false)
    const error = ref(null)
    const isCompleted = ref(false)
    const isProcessing = ref(false)
    const userInput = ref('')
    const chatMessages = ref([])
    const chatWindow = ref(null)
    
    // 일지 재생성 관련 상태
    const generatedDiaries = ref([])
    const selectedDiaryIndex = ref(0)
    const showRegenerateForm = ref(false)
    const feedback = ref('')
    const isRegenerating = ref(false)
    
    // 이미지 업로드 관련 상태
    const showImageUpload = ref(false)
    const imageInput = ref(null)
    const selectedImages = ref([])
    const attachedImages = ref([]) // 공통으로 관리되는 첨부 이미지들
    
    // 제목/내용 수정 관련 상태
    const isEditingTitle = ref(false)
    const isEditingContent = ref(false)
    const editingTitle = ref('')
    const editingContent = ref('')
    const diaryTitle = ref('') // 일지 제목 (방문 코스명으로 초기화)
    
    // 완료 알림 관련 상태
    const showCompletionNotification = ref(false)
    
    const visitedCourseId = route.params.visitedCourseId
    const style = route.params.style

    // 선택된 일지
    const selectedDiary = computed(() => {
      return generatedDiaries.value[selectedDiaryIndex.value] || null
    })

    // 재생성 가능 여부
    const canRegenerate = computed(() => {
      return generatedDiaries.value.length < 3
    })

    // 방문 코스 정보
    const visitedCourses = ref([])
    const courseNames = ref({})

    // 스크롤을 맨 아래로 이동
    const scrollToBottom = async () => {
      await nextTick()
      if (chatWindow.value) {
        chatWindow.value.scrollTop = chatWindow.value.scrollHeight
      }
    }

    // 뒤로가기
    const goBack = () => {
      router.back()
    }

    // 방문 코스 정보 가져오기
    const fetchVisitedCourses = async () => {
      try {
        const response = await getAvailableCourses()
        visitedCourses.value = response || []
        
        // 코스명 매핑 생성
        const courseMap = {}
        visitedCourses.value.forEach(course => {
          courseMap[course.id] = course.name
        })
        courseNames.value = courseMap
      } catch (err) {
        console.error('Failed to fetch visited courses:', err)
        // 에러 시 기본값 설정
        courseNames.value = {
          1: "남파랑길 1코스",
          2: "제주 올레 7코스", 
          3: "서울 한강공원"
        }
      }
    }





    // 채팅 시작
    const startChat = async () => {
      loading.value = true
      error.value = null
      
      try {
        // 실제 API 호출
        const response = await startDiaryGeneration(visitedCourseId, style)
        
        if (response.data && response.data.content) {
          chatMessages.value.push({
            role: 'assistant',
            content: response.data.content
          })
        }
        
        await scrollToBottom()
      } catch (err) {
        error.value = err.message || '일지 생성을 시작할 수 없습니다.'
        console.error('Error starting chat:', err)
      } finally {
        loading.value = false
      }
    }

    // 메시지 전송
    const sendMessage = async () => {
      if (!userInput.value.trim() || isProcessing.value) return
      
      const message = userInput.value.trim()
      userInput.value = ''
      
      // 사용자 메시지 추가
      chatMessages.value.push({
        role: 'user',
        content: message
      })
      
      await scrollToBottom()
      
      // AI 응답 처리
      isProcessing.value = true
      
      try {
        // 실제 API 호출
        const chatLog = chatMessages.value.map(msg => ({
          sender: msg.role === 'assistant' ? 'ai' : 'user',
          message: msg.content
        }))
        
        const response = await submitAnswer(message, chatLog)
        
        if (response.status === 'IN_PROGRESS') {
          chatMessages.value.push({
            role: 'assistant',
            content: response.data.content
          })
        } else if (response.status === 'DONE') {
          // 일지 생성 완료
          generatedDiaries.value = [{
            title: response.data.content.title || '생성된 일지',
            content: response.data.content
          }]
          // 방문 코스명으로 제목 초기화
          diaryTitle.value = courseNames.value[visitedCourseId] || `코스 ${visitedCourseId}`
          isCompleted.value = true
          // 완료 알림 표시
          showCompletionNotification.value = true
          // 5초 후 자동으로 알림 숨김
          setTimeout(() => {
            showCompletionNotification.value = false
          }, 5000)
        }
        
        await scrollToBottom()
      } catch (err) {
        error.value = err.message || '메시지 전송에 실패했습니다.'
        console.error('Error sending message:', err)
      } finally {
        isProcessing.value = false
      }
    }

    // 일지 선택
    const selectDiary = (index) => {
      selectedDiaryIndex.value = index
      showRegenerateForm.value = false
    }

    // 재생성 취소
    const cancelRegenerate = () => {
      showRegenerateForm.value = false
      feedback.value = ''
    }

    // 일지 재생성
    const handleRegenerateDiary = async () => {
      if (isRegenerating.value) return
      
      isRegenerating.value = true
      
      try {
        // 실제 API 호출 (백엔드 준비되면 주석 해제)
        // const chatLog = chatMessages.value.map(msg => ({
        //   role: msg.role === 'assistant' ? 'ai' : 'user',
        //   content: msg.content
        // }))
        // 
        // const response = await regenerateDiaryAPI(feedback.value, chatLog)
        // 
        // if (response.data && response.data.content) {
        //   // API 응답의 content는 배열 형태 ["기존 일지들", "새 일지"]
        //   const newContent = response.data.content[response.data.content.length - 1] // 마지막 일지 내용
        //   
        //   generatedDiaries.value.push({
        //     content: newContent // 순수한 일지 내용만 저장
        //   })
        //   selectedDiaryIndex.value = generatedDiaries.value.length - 1
        // }
        
        // 목업 데이터 사용 (백엔드 연동 전까지)
        await new Promise(resolve => setTimeout(resolve, 3000)) // 재생성 시뮬레이션
        
        const newDiary = {
          content: `오늘은 남파랑길 1코스를 걸으며 정말 아름다운 시간을 보냈습니다. 

해운대 해변에서 시작한 이번 여행은 친구와 함께한 특별한 경험이었어요. 푸른 바다와 하얀 모래사장이 어우러진 풍경은 정말 환상적이었습니다.

특히 해안가를 따라 걷는 동안 마주한 석양은 평생 잊을 수 없는 장면이었어요. 붉은 노을이 바다 위로 떨어지는 모습을 보며 마음이 평온해지는 것을 느꼈습니다.

길을 따라 걷다가 발견한 작은 카페에서는 맛있는 커피와 함께 잠시 휴식을 취했는데, 그곳에서 마신 커피의 향이 아직도 기억에 남습니다.

이번 여행을 통해 자연의 아름다움과 함께하는 시간의 소중함을 다시 한번 깨달았습니다. 앞으로도 이런 특별한 순간들을 더 많이 만들어가고 싶어요.`
        }
        
        generatedDiaries.value.push(newDiary)
        selectedDiaryIndex.value = generatedDiaries.value.length - 1
        showRegenerateForm.value = false
        feedback.value = ''
        
        // 재생성 완료 알림 표시
        showCompletionNotification.value = true
        // 5초 후 자동으로 알림 숨김
        setTimeout(() => {
          showCompletionNotification.value = false
        }, 5000)
      } catch (err) {
        error.value = err.message || '일지 재생성에 실패했습니다.'
        console.error('Error regenerating diary:', err)
      } finally {
        isRegenerating.value = false
      }
    }

    // 완료 메시지 제목
    const getCompletionTitle = () => {
      const currentDiaryNumber = generatedDiaries.value.length
      if (currentDiaryNumber === 1) {
        return '1차 일지 생성이 완료되었습니다!'
      } else if (currentDiaryNumber === 2) {
        return '2차 일지 생성이 완료되었습니다!'
      } else {
        return '3차 일지 생성이 완료되었습니다!'
      }
    }

    // 완료 메시지 내용
    const getCompletionMessage = () => {
      const currentDiaryNumber = generatedDiaries.value.length
      if (currentDiaryNumber === 1) {
        return 'AI가 멋진 일지를 만들어드렸어요. 원하시면 재생성하거나 바로 저장할 수 있습니다.'
      } else if (currentDiaryNumber === 2) {
        return 'AI가 2차 일지를 만들어드렸어요. 마지막으로 한 번 더 재생성하거나 바로 저장할 수 있습니다.'
      } else {
        return 'AI가 3차 일지를 만들어드렸어요. 더 이상 재생성할 수 없으며, 원하는 일지를 선택하여 저장하세요.'
      }
    }

    // 이미지 업로드 처리
    const handleImageUpload = (event) => {
      const files = Array.from(event.target.files)
      selectedImages.value = files.map(file => ({
        file: file,
        preview: URL.createObjectURL(file),
        name: file.name
      }))
    }

    // 이미지 업로드 취소
    const cancelImageUpload = () => {
      showImageUpload.value = false
      selectedImages.value = []
      if (imageInput.value) {
        imageInput.value.value = ''
      }
    }

    // 이미지 업로드 확인
    const confirmImageUpload = () => {
      if (selectedImages.value.length > 0) {
        // 공통 이미지 배열에 새 이미지 추가
        attachedImages.value.push(...selectedImages.value)
        
        // 상태 초기화
        showImageUpload.value = false
        selectedImages.value = []
        if (imageInput.value) {
          imageInput.value.value = ''
        }
      }
    }

    // 이미지 제거
    const removeImage = (index) => {
      if (attachedImages.value[index]) {
        // URL 해제
        URL.revokeObjectURL(attachedImages.value[index].preview)
        attachedImages.value.splice(index, 1)
      }
    }

    // 제목 수정 시작
    const startEditTitle = () => {
      editingTitle.value = diaryTitle.value
      isEditingTitle.value = true
    }

    // 제목 저장
    const saveTitle = () => {
      if (editingTitle.value.trim()) {
        diaryTitle.value = editingTitle.value.trim()
      }
      isEditingTitle.value = false
    }

    // 제목 수정 취소
    const cancelEditTitle = () => {
      editingTitle.value = ''
      isEditingTitle.value = false
    }

    // 내용 수정 시작
    const startEditContent = () => {
      editingContent.value = selectedDiary.value.content
      isEditingContent.value = true
    }

    // 내용 저장
    const saveContent = () => {
      if (editingContent.value.trim()) {
        selectedDiary.value.content = editingContent.value.trim()
      }
      isEditingContent.value = false
    }

    // 내용 수정 취소
    const cancelEditContent = () => {
      editingContent.value = ''
      isEditingContent.value = false
    }

    // 알림 닫기
    const closeNotification = () => {
      showCompletionNotification.value = false
    }

    // 일지 저장
    const handleSaveDiary = async () => {
      if (!selectedDiary.value) return
      
      try {
        // 실제 API 호출
        const imageFiles = attachedImages.value.map(img => img.file)
        
        const diaryData = {
          title: diaryTitle.value,
          content: selectedDiary.value.content
        }
        
        const response = await saveDiary(diaryData, imageFiles)
        
        if (response.status === 'CREATED') {
          // 저장 성공 후 일지 목록으로 이동
          const imageCount = attachedImages.value.length
          const message = imageCount > 0 
            ? `일지와 ${imageCount}장의 사진이 성공적으로 저장되었습니다!`
            : '일지가 성공적으로 저장되었습니다!'
          
          alert(message)
          router.push('/')
        }
      } catch (err) {
        error.value = err.message || '일지 저장에 실패했습니다.'
        console.error('Error saving diary:', err)
      }
    }

    // 채팅 메시지 변경 시 스크롤
    watch(chatMessages, () => {
      scrollToBottom()
    }, { deep: true })

    onMounted(async () => {
      // 방문 코스 정보 가져오기
      await fetchVisitedCourses()
      // 채팅 메시지 초기화 후 시작
      chatMessages.value = []
      startChat()
    })

    return {
      loading,
      error,
      isCompleted,
      isProcessing,
      userInput,
      chatMessages,
      chatWindow,
      generatedDiaries,
      selectedDiaryIndex,
      selectedDiary,
      canRegenerate,
      showRegenerateForm,
      feedback,
      isRegenerating,
      showImageUpload,
      imageInput,
      selectedImages,
      attachedImages,
      goBack,
      startChat,
      sendMessage,
      selectDiary,
      cancelRegenerate,
      handleRegenerateDiary,
      getCompletionTitle,
      getCompletionMessage,
      handleImageUpload,
      cancelImageUpload,
      confirmImageUpload,
      removeImage,
      // 제목/내용 수정 관련 함수들
      isEditingTitle,
      isEditingContent,
      editingTitle,
      editingContent,
      diaryTitle,
      startEditTitle,
      saveTitle,
      cancelEditTitle,
      startEditContent,
      saveContent,
      cancelEditContent,
      handleSaveDiary,
      // 완료 알림 관련
      showCompletionNotification,
      closeNotification
    }
  }
}
</script>

<style scoped>
.diary-create-chat-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.chat-header {
  text-align: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.back-btn {
  background: none;
  border: none;
  color: #007bff;
  font-size: 1rem;
  cursor: pointer;
  padding: 10px 0;
  margin-bottom: 15px;
  transition: color 0.3s ease;
}

.back-btn:hover {
  color: #0056b3;
}

.chat-header h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 8px;
}

.chat-header p {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

.loading, .error, .completion {
  text-align: center;
  padding: 60px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .completion-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.error h3, .completion h3 {
  margin-bottom: 10px;
  font-size: 1.5rem;
}

.error h3 {
  color: #dc3545;
}

.completion h3 {
  color: #28a745;
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



.view-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  font-weight: 600;
}

.view-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

/* 일지 생성 완료 상태 */
.diary-completion {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 완료 알림 */
.completion-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  animation: slideDown 0.5s ease-out;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 15px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 20px 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(40, 167, 69, 0.3);
  min-width: 400px;
  max-width: 600px;
}

.notification-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.notification-text {
  flex: 1;
}

.notification-text h3 {
  margin: 0 0 5px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.notification-text p {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.9;
}

.notification-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.notification-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.completion-header {
  text-align: center;
  padding: 30px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.completion-header h3 {
  margin-bottom: 10px;
  font-size: 1.5rem;
  color: #28a745;
}

.completion-header p {
  color: #666;
  margin: 0;
}

/* 일지 제목 섹션 */
.diary-title-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.title-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.title-display h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
}

.edit-title-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.edit-title-btn:hover {
  background-color: #e9ecef;
}

.title-edit {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 30px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.title-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #3498db;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
}

.title-input:focus {
  outline: none;
  border-color: #2980b9;
}

.save-title-btn,
.cancel-title-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.save-title-btn {
  background-color: #27ae60;
  color: white;
}

.save-title-btn:hover {
  background-color: #229954;
}

.cancel-title-btn {
  background-color: #95a5a6;
  color: white;
}

.cancel-title-btn:hover {
  background-color: #7f8c8d;
}

/* 사진 첨부 섹션 */
.image-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 일지 탭 */
.diary-tabs {
  display: flex;
  gap: 10px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tab-btn {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  color: #666;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  border-color: #007bff;
  color: #007bff;
}

.tab-btn.active {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

/* 선택된 일지 */
.selected-diary {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.diary-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.diary-content h2 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
}

.diary-text {
  line-height: 1.8;
  color: #555;
  font-size: 1rem;
  white-space: pre-wrap;
}

.content-display {
  min-height: 200px;
}

.content-edit {
  min-height: 200px;
}

.content-input {
  width: 100%;
  min-height: 300px;
  padding: 16px;
  border: 2px solid #3498db;
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1.6;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s ease;
}

.content-input:focus {
  outline: none;
  border-color: #2980b9;
}

/* 액션 버튼 */
.diary-actions {
  padding: 20px 30px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.regenerate-btn, .save-btn, .edit-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.edit-btn {
  background: #6f42c1;
  color: white;
}

.edit-btn:hover {
  background: #5a32a3;
  transform: translateY(-1px);
}

.edit-actions {
  display: flex;
  gap: 10px;
}

.save-content-btn, .cancel-content-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background-color 0.2s;
}

.save-content-btn {
  background-color: #27ae60;
  color: white;
}

.save-content-btn:hover {
  background-color: #229954;
}

.cancel-content-btn {
  background-color: #95a5a6;
  color: white;
}

.cancel-content-btn:hover {
  background-color: #7f8c8d;
}

.regenerate-btn {
  background: #ffc107;
  color: #333;
}

.regenerate-btn:hover {
  background: #e0a800;
  transform: translateY(-1px);
}

.image-btn {
  background: #17a2b8;
  color: white;
}

.image-btn:hover {
  background: #138496;
  transform: translateY(-1px);
}

.save-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

/* 재생성 폼 */
.regenerate-form {
  padding: 20px 30px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.regenerate-form h4 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.1rem;
}

.feedback-input {
  width: 100%;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.95rem;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.feedback-input:focus {
  outline: none;
  border-color: #007bff;
}

.feedback-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 15px;
}

.cancel-btn, .confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.3s ease;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #5a6268;
}

.confirm-btn {
  background: #007bff;
  color: white;
}

.confirm-btn:hover {
  background: #0056b3;
}

/* 사진 첨부 섹션 스타일 (이미지 섹션과 공통) */
.image-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.image-section-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.add-image-btn {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.3s ease;
}

.add-image-btn:hover {
  background: #138496;
}

.no-images-message {
  padding: 40px 30px;
  text-align: center;
  color: #666;
}



/* 이미지 업로드 폼 */
.image-upload-form {
  padding: 20px 30px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.image-upload-form h4 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.1rem;
}

.image-upload-area {
  position: relative;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background: white;
  transition: border-color 0.3s ease;
  cursor: pointer;
}

.image-upload-area:hover {
  border-color: #007bff;
}

.image-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-placeholder {
  pointer-events: none;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  display: block;
}

.upload-placeholder p {
  margin: 5px 0;
  color: #666;
  font-size: 1rem;
}

.upload-hint {
  font-size: 0.9rem !important;
  color: #999 !important;
}

.image-upload-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 15px;
}

/* 이미지 미리보기 */
.image-preview {
  padding: 20px 30px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.image-preview h4 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.1rem;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.image-preview-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-preview-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.remove-image-btn:hover {
  background: rgba(220, 53, 69, 1);
}

.chat-interface {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-window {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message.assistant {
  justify-content: flex-start;
}

.message.user {
  justify-content: flex-end;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 70%;
}

.message.user .message-content {
  flex-direction: row-reverse;
}

.ai-avatar, .user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.ai-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.user-avatar {
  background: #007bff;
  color: white;
}

.message-text {
  background: white;
  padding: 12px 16px;
  border-radius: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message.user .message-text {
  background: #007bff;
  color: white;
}

.message-text p {
  margin: 0;
  line-height: 1.5;
  font-size: 0.95rem;
}

.chat-input {
  padding: 20px;
  background: white;
  border-top: 1px solid #e9ecef;
  flex-shrink: 0;
}

.input-container {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 0.95rem;
  resize: none;
  transition: border-color 0.3s ease;
  font-family: inherit;
}

.message-input:focus {
  outline: none;
  border-color: #007bff;
}

.message-input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.send-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: background 0.3s ease;
  min-width: 80px;
}

.send-btn:hover:not(:disabled) {
  background: #0056b3;
}

.send-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.sending {
  font-size: 0.8rem;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .completion-notification {
    top: 10px;
    left: 10px;
    right: 10px;
    transform: none;
  }
  
  .notification-content {
    min-width: auto;
    padding: 15px 20px;
  }
  
  .notification-text h3 {
    font-size: 1.1rem;
  }
  
  .notification-text p {
    font-size: 0.9rem;
  }
  
  .diary-create-chat-container {
    padding: 15px;
    height: 100vh;
  }
  
  .chat-header h1 {
    font-size: 1.5rem;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .ai-avatar, .user-avatar {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
  
  .message-text {
    padding: 10px 14px;
    font-size: 0.9rem;
  }
  
  .diary-tabs {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .tab-btn {
    padding: 8px 16px;
  }
  
  .title-display h2 {
    font-size: 1.3rem;
  }
  
  .title-input {
    font-size: 16px;
  }
  
  .diary-actions {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .regenerate-btn, .save-btn, .edit-btn {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
  
  .edit-actions {
    flex-wrap: wrap;
  }
  
  .sending {
    font-size: 0.8rem;
  }
  

  
  .diary-content {
    padding: 20px;
  }
  
  .diary-content h2 {
    font-size: 1.5rem;
  }
  
  .diary-actions {
    padding: 15px 20px;
    flex-direction: column;
    gap: 10px;
  }
  
  .regenerate-form {
    padding: 15px 20px;
  }
  
  .image-upload-form {
    padding: 15px 20px;
  }
  
  .image-preview {
    padding: 15px 20px;
  }
  

  
  .image-section-header {
    padding: 15px 20px;
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .no-images-message {
    padding: 30px 20px;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .chat-window {
    padding: 15px;
  }
  
  .chat-input {
    padding: 15px;
  }
  
  .input-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .send-btn {
    align-self: flex-end;
    min-width: 60px;
  }
  
  .completion-header {
    padding: 20px 15px;
  }
  
  .completion-header h3 {
    font-size: 1.3rem;
  }
  
  .diary-content {
    padding: 15px;
  }
  
  .diary-content h2 {
    font-size: 1.3rem;
  }
  
  .feedback-actions {
    flex-direction: column;
  }
  
  .image-upload-actions {
    flex-direction: column;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
  }
  
  .image-preview-item img {
    height: 80px;
  }
  
  .image-section-header {
    padding: 10px 15px;
  }
  
  .no-images-message {
    padding: 20px 15px;
  }
  
  .no-images-message p {
    font-size: 0.9rem;
  }
}
</style> 