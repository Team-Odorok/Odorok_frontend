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
              <div class="diary-text" v-html="convertMarkdownToHtml(selectedDiary.content)">
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
              @click="openRegenerateForm"
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
                <div v-if="message.role === 'assistant'" v-html="convertMarkdownToHtml(message.content)"></div>
                <p v-else>{{ message.content }}</p>
              </div>
            </div>
          </div>
          
          <!-- AI가 답변을 준비하는 중일 때 표시 (일지 생성 중이 아닐 때만) -->
          <div v-if="isProcessing && !isGeneratingDiary" class="message assistant ai-typing">
            <div class="message-content">
              <div class="ai-avatar">
                🤖
              </div>
              <div class="message-text">
                <div class="typing-indicator">
                  <span>AI가 답변을 준비하고 있습니다</span>
                  <div class="typing-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 입력창 -->
      <div class="chat-input">
        <div class="input-container">
          <textarea
            ref="messageInput"
            v-model="userInput"
            @keydown.enter.prevent="sendMessage"
            placeholder="답변을 입력해주세요..."
            class="message-input"
            :disabled="isProcessing"
            rows="3"
          ></textarea>
          <div class="button-group">
            <button 
              @click="sendMessage" 
              :disabled="!userInput.trim() || isProcessing"
              class="send-btn"
            >
              <span v-if="!isProcessing">전송</span>
              <span v-else class="sending">처리중...</span>
            </button>
            <button 
              @click="endChatAndGenerate" 
              :disabled="isProcessing || isGeneratingDiary"
              class="end-chat-btn"
            >
              <span v-if="!isGeneratingDiary">대화 종료 & 1차 생성</span>
              <span v-else>일지 생성 중...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 재생성 폼 -->
    <div ref="regenerateFormContainer">
      <RegenerateForm
        :is-visible="showRegenerateForm"
        :is-regenerating="isRegenerating"
        @close="cancelRegenerate"
        @confirm="handleRegenerateDiary"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { startDiaryGeneration, submitAnswer, saveDiary, regenerateDiary as regenerateDiaryAPI, getAvailableCourses } from '@/services/diaryService.js'
import { marked } from 'marked'
import RegenerateForm from '@/components/RegenerateForm.vue'

export default {
  name: 'DiaryCreateChatView',
  components: {
    RegenerateForm
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const loading = ref(false)
    const error = ref(null)
    const isCompleted = ref(false)
    const isProcessing = ref(false)
    const isGeneratingDiary = ref(false) // 일지 생성 중 상태
    const userInput = ref('')
    const chatMessages = ref([])
    const chatWindow = ref(null)
    const messageInput = ref(null)
    const regenerateFormContainer = ref(null)
    
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

    // 마크다운을 HTML로 변환하는 함수
    const convertMarkdownToHtml = (markdownText) => {
      if (!markdownText) return ''
      
      try {
        // marked 옵션 설정
        marked.setOptions({
          breaks: true, // 줄바꿈을 <br>로 변환
          gfm: true,    // GitHub Flavored Markdown 지원
        })
        
        return marked(markdownText)
      } catch (error) {
        console.error('마크다운 변환 오류:', error)
        return markdownText // 변환 실패 시 원본 텍스트 반환
      }
    }

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

    // 입력창에 포커스
    const focusInput = async () => {
      await nextTick()
      
      // 약간의 지연을 추가하여 DOM 업데이트가 완전히 완료되도록 함
      setTimeout(() => {
        if (messageInput.value) {
          messageInput.value.focus()
        }
      }, 100)
    }

    // 재생성 폼으로 스크롤
    const scrollToRegenerateForm = async () => {
      await nextTick()
      
      // 약간의 지연을 추가하여 DOM 업데이트가 완전히 완료되도록 함
      setTimeout(() => {
        if (regenerateFormContainer.value) {
          regenerateFormContainer.value.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      }, 100)
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
          courseMap[course.id] = course.courseName || course.name || `코스 ${course.id}`
        })
        courseNames.value = courseMap
        console.log('코스명 매핑:', courseMap)
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
        // 채팅 시작 후 입력창에 포커스
        await focusInput()
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
      
      // AI가 답변을 준비하는 중일 때도 스크롤을 아래로 이동
      await scrollToBottom()
      
      try {
        // 실제 API 호출
        const chatLog = chatMessages.value.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
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
          diaryTitle.value = `${courseNames.value[visitedCourseId] || `코스 ${visitedCourseId}`} 방문 일지`
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
        // AI 응답 완료 후 입력창에 포커스 (finally 블록에서 실행)
        await focusInput()
      }
    }

    // 대화 종료 및 1차 생성
    const endChatAndGenerate = async () => {
      if (isProcessing.value || isGeneratingDiary.value) return
      
      // 확인 대화상자
      const confirmed = confirm('대화를 종료하고 1차 일지를 생성하시겠습니까?')
      if (!confirmed) return
      
      isGeneratingDiary.value = true
      
      try {
        // 현재까지의 대화 내용으로 일지 생성 요청
        const chatLog = chatMessages.value.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }))
        
        console.log('대화 종료 - 전체 대화 내역:', chatLog)
        console.log('대화 종료 - chatLog 길이:', chatLog.length)
        
        // 전체 대화 내역으로 일지 생성 요청 (regenerateDiary API 사용)
        const response = await regenerateDiaryAPI('대화를 종료하고 일지를 생성해주세요.', chatLog)
        
        console.log('대화 종료 응답:', response)
        console.log('응답 데이터:', response.data)
        
        if (response.data && response.data.content) {
          console.log('content 타입:', typeof response.data.content)
          console.log('content 값:', response.data.content)
          
          if (Array.isArray(response.data.content)) {
            console.log('content는 배열, 길이:', response.data.content.length)
            const newContent = response.data.content[response.data.content.length - 1]
            console.log('마지막 일지 내용:', newContent)
            
            generatedDiaries.value = [{
              content: newContent
            }]
          } else {
            console.log('content는 배열이 아님, 직접 사용')
            generatedDiaries.value = [{
              content: response.data.content
            }]
          }
        } else {
          console.log('응답 구조가 예상과 다름, 전체 응답 사용')
          console.log('response.data:', response.data)
          console.log('response.content:', response.content)
          
          generatedDiaries.value = [{
            content: response.data?.content || response.content || '대화 내용을 바탕으로 일지를 생성했습니다.'
          }]
        }
        
        // 방문 코스명으로 제목 초기화
        diaryTitle.value = `${courseNames.value[visitedCourseId] || `코스 ${visitedCourseId}`} 방문 일지`
        console.log('일지 제목:', diaryTitle.value)
        isCompleted.value = true
        showCompletionNotification.value = true
        setTimeout(() => {
          showCompletionNotification.value = false
        }, 5000)
        
        await scrollToBottom()
      } catch (err) {
        console.error('Error ending chat:', err)
        // 에러가 발생해도 강제로 완료 처리
        generatedDiaries.value = [{
          title: '생성된 일지',
          content: '대화 내용을 바탕으로 일지를 생성했습니다.'
        }]
        diaryTitle.value = `${courseNames.value[visitedCourseId] || `코스 ${visitedCourseId}`} 방문 일지`
        isCompleted.value = true
        showCompletionNotification.value = true
        setTimeout(() => {
          showCompletionNotification.value = false
        }, 5000)
      } finally {
        isGeneratingDiary.value = false
      }
    }

    // 일지 선택
    const selectDiary = (index) => {
      selectedDiaryIndex.value = index
      showRegenerateForm.value = false
    }

    // 재생성 폼 열기
    const openRegenerateForm = async () => {
      showRegenerateForm.value = true
      await scrollToRegenerateForm()
    }

    // 재생성 취소
    const cancelRegenerate = () => {
      showRegenerateForm.value = false
    }

    // 일지 재생성
    const handleRegenerateDiary = async (feedbackText = '') => {
      if (isRegenerating.value) return
      
      isRegenerating.value = true
      
      // AI가 답변을 준비하는 중일 때도 스크롤을 아래로 이동
      await scrollToBottom()
      
      try {
        // 실제 API 호출
        const chatLog = chatMessages.value.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }))
        
        console.log('현재 chatMessages:', chatMessages.value)
        console.log('변환된 chatLog:', chatLog)
        console.log('chatLog 길이:', chatLog.length)
        console.log('일지 재생성 요청:', { feedback: feedbackText, chatLog })
        const response = await regenerateDiaryAPI(feedbackText, chatLog)
        console.log('일지 재생성 응답:', response)
        console.log('응답 데이터 타입:', typeof response.data)
        console.log('응답 데이터:', response.data)
        
        if (response.data && response.data.content) {
          console.log('content 타입:', typeof response.data.content)
          console.log('content 값:', response.data.content)
          
          if (Array.isArray(response.data.content)) {
            console.log('content는 배열, 길이:', response.data.content.length)
            const newContent = response.data.content[response.data.content.length - 1]
            console.log('마지막 일지 내용:', newContent)
            
            generatedDiaries.value.push({
              content: newContent
            })
            selectedDiaryIndex.value = generatedDiaries.value.length - 1
          } else {
            console.log('content는 배열이 아님, 직접 사용')
            generatedDiaries.value.push({
              content: response.data.content
            })
            selectedDiaryIndex.value = generatedDiaries.value.length - 1
          }
        } else {
          console.log('응답 구조가 예상과 다름, 전체 응답 사용')
          console.log('response.data:', response.data)
          console.log('response.content:', response.content)
          
          generatedDiaries.value.push({
            content: response.data?.content || response.content || '재생성된 일지'
          })
          selectedDiaryIndex.value = generatedDiaries.value.length - 1
        }
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
      if (!visitedCourseId) {
        error.value = '방문 코스 ID가 없습니다. 다시 시작해주세요.'
        console.error('visitedCourseId가 없습니다:', visitedCourseId)
        return
      }
      
      try {
        // 실제 API 호출
        const imageFiles = attachedImages.value.map(img => img.file)
        console.log('일지 저장 시도 - visitedCourseId:', visitedCourseId)
        const response = await saveDiary(diaryTitle.value, selectedDiary.value.content, imageFiles, visitedCourseId)
        
        if (response.status === 'CREATED') {
          // 저장 성공 후 일지 목록으로 이동
          const imageCount = attachedImages.value.length
          const message = imageCount > 0 
            ? `일지와 ${imageCount}장의 사진이 성공적으로 저장되었습니다!`
            : '일지가 성공적으로 저장되었습니다!'
          
          console.log('일지 저장 성공! diaryId:', response.data?.diaryId)
          alert(message)
          router.push('/')
        } else {
          console.log('예상치 못한 응답 상태:', response.status)
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
      isGeneratingDiary,
      userInput,
      chatMessages,
      chatWindow,
      messageInput,
      regenerateFormContainer,
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
      endChatAndGenerate,
      focusInput,
      scrollToRegenerateForm,
      selectDiary,
      openRegenerateForm,
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
      // 마크다운 변환 함수
      convertMarkdownToHtml,
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

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.end-chat-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.3s ease;
  min-width: 80px;
  white-space: nowrap;
}

.end-chat-btn:hover:not(:disabled) {
  background: #1e7e34;
}

.end-chat-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
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
  
  .button-group {
    flex-direction: row;
    justify-content: flex-end;
    gap: 10px;
  }
  
  .send-btn {
    min-width: 60px;
  }
  
  .end-chat-btn {
    min-width: 100px;
    font-size: 0.8rem;
    padding: 8px 12px;
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

/* 마크다운 스타일링 */
.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3),
.message-text :deep(h4),
.message-text :deep(h5),
.message-text :deep(h6) {
  margin: 16px 0 8px 0;
  font-weight: 600;
  color: #333;
}

.message-text :deep(h1) { font-size: 1.5rem; }
.message-text :deep(h2) { font-size: 1.3rem; }
.message-text :deep(h3) { font-size: 1.2rem; }
.message-text :deep(h4) { font-size: 1.1rem; }
.message-text :deep(h5) { font-size: 1rem; }
.message-text :deep(h6) { font-size: 0.9rem; }

.message-text :deep(p) {
  margin: 8px 0;
  line-height: 1.6;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.message-text :deep(li) {
  margin: 4px 0;
  line-height: 1.5;
}

.message-text :deep(strong) {
  font-weight: 600;
  color: #333;
}

.message-text :deep(em) {
  font-style: italic;
}

.message-text :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.message-text :deep(pre) {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
}

.message-text :deep(blockquote) {
  border-left: 4px solid #ddd;
  margin: 12px 0;
  padding-left: 16px;
  color: #666;
  font-style: italic;
}

.message-text :deep(hr) {
  border: none;
  border-top: 1px solid #ddd;
  margin: 16px 0;
}

.message-text :deep(a) {
  color: #007bff;
  text-decoration: none;
}

.message-text :deep(a:hover) {
  text-decoration: underline;
}

/* 일지 내용 마크다운 스타일링 */
.diary-text :deep(h1),
.diary-text :deep(h2),
.diary-text :deep(h3),
.diary-text :deep(h4),
.diary-text :deep(h5),
.diary-text :deep(h6) {
  margin: 16px 0 8px 0;
  font-weight: 600;
  color: #333;
}

.diary-text :deep(h1) { font-size: 1.5rem; }
.diary-text :deep(h2) { font-size: 1.3rem; }
.diary-text :deep(h3) { font-size: 1.2rem; }
.diary-text :deep(h4) { font-size: 1.1rem; }
.diary-text :deep(h5) { font-size: 1rem; }
.diary-text :deep(h6) { font-size: 0.9rem; }

.diary-text :deep(p) {
  margin: 8px 0;
  line-height: 1.6;
}

.diary-text :deep(ul),
.diary-text :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.diary-text :deep(li) {
  margin: 4px 0;
  line-height: 1.5;
}

.diary-text :deep(strong) {
  font-weight: 600;
  color: #333;
}

.diary-text :deep(em) {
  font-style: italic;
}

.diary-text :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.diary-text :deep(pre) {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

.diary-text :deep(pre code) {
  background: none;
  padding: 0;
}

.diary-text :deep(blockquote) {
  border-left: 4px solid #ddd;
  margin: 12px 0;
  padding-left: 16px;
  color: #666;
  font-style: italic;
}

.diary-text :deep(hr) {
  border: none;
  border-top: 1px solid #ddd;
  margin: 16px 0;
}

.diary-text :deep(a) {
  color: #007bff;
  text-decoration: none;
}

.diary-text :deep(a:hover) {
  text-decoration: underline;
}

/* AI 타이핑 인디케이터 스타일 */
.ai-typing {
  opacity: 0.8;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-style: italic;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots .dot {
  width: 6px;
  height: 6px;
  background-color: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
</style> 