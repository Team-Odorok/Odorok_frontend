<template>
  <div class="diary-list-container">
    <div class="diary-header">
      <h1>나의 오도록</h1>
      <p class="diary-subtitle">소중한 순간들이 담긴 나만의 여행 이야기를 만들어 드릴게요</p>
    </div>

    <!-- 필터 및 액션 섹션 -->
    <div class="filter-action-section">
      <div class="year-selector">
        <label for="yearSelect">연도 선택:</label>
        <select 
          id="yearSelect" 
          v-model="selectedYear" 
          @change="onYearChange"
          class="year-dropdown"
        >
          <option value="">전체 연도</option>
          <option 
            v-for="year in availableYears" 
            :key="year" 
            :value="year"
          >
            {{ year }}년
          </option>
        </select>
      </div>
      
      <div class="action-buttons">
        <button 
          @click="createDiary" 
          :disabled="creatingDiary"
          class="create-diary-btn"
        >
          {{ creatingDiary ? '권한 확인 중...' : '새 일지 작성' }}
        </button>
        <button 
          @click="showPurchaseModal = true"
          class="purchase-btn"
        >
          일지 생성권 구매
        </button>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>일지 목록을 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchDiaries" class="retry-btn">다시 시도</button>
    </div>

    <!-- 일지 목록 -->
    <div v-else class="diary-content">
      <!-- 월별 그룹핑된 목록 -->
      <div v-if="monthlyDiaries.length > 0" class="monthly-diaries">
        <div 
          v-for="monthGroup in paginatedMonthlyDiaries" 
          :key="`${monthGroup.year}-${monthGroup.month}`" 
          class="month-group"
        >
          <h2 class="month-title">{{ monthGroup.year }}년 {{ monthGroup.month }}월</h2>
          
          <div class="diary-grid">
            <!-- 월별 합본 카드 -->
            <div class="month-summary-card" @click="viewMonthSummary(monthGroup)">
              <div class="summary-content">
                <div class="summary-header">
                  <h3>{{ monthGroup.year }}년<br>{{ monthGroup.month }}월의 오도록</h3>
                  <span class="diary-count">{{ monthGroup.diaries.length }}개의 일지</span>
                </div>
                <div class="summary-preview">
                  <div class="book-preview">
                    <div 
                      v-for="(diary, index) in monthGroup.diaries.slice(0, 3)" 
              :key="diary.id" 
                      class="book-page"
                    >
                      <span class="page-title">{{ diary.title }}</span>
                    </div>
                    <div v-if="monthGroup.diaries.length > 3" class="more-pages">
                      +{{ monthGroup.diaries.length - 3 }}개 더
                    </div>
                  </div>
          </div>
        </div>
      </div>

            <!-- 개별 일지 카드들 -->
        <DiaryCard 
              v-for="diary in monthGroup.diaries" 
          :key="diary.id" 
          :diary="diary"
          @click="viewDiary(diary)"
        />
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-if="!loading && !error && monthlyDiaries.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>아직 작성된 일지가 없습니다</h3>
        <p>첫 번째 여행 일지를 작성해보세요!</p>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div v-if="monthlyDiaries.length > 0" class="pagination">
      <button 
        @click="prevPage" 
        :disabled="currentPage === 1"
        class="page-btn prev-btn"
      >
        이전
      </button>
      
      <div class="page-info">
        <span class="current-page">{{ currentPage }}</span>
        <span class="page-separator">/</span>
        <span class="total-pages">{{ totalPages }}</span>
      </div>
      
      <button 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
        class="page-btn next-btn"
      >
        다음
      </button>
    </div>

    <!-- 일지 상세 모달 -->
    <div v-if="showDiaryModal" class="diary-modal" @click="closeDiaryModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeDiaryModal">×</button>
        
        <!-- 일지 상세 내용 -->
        <div v-if="selectedDiary" class="diary-detail">
          <div class="diary-header">
            <h1 class="diary-title">{{ selectedDiary.title }}</h1>
            <div class="diary-meta">
              <span class="course-name">{{ selectedDiary.courseName }}</span>
              <span class="visited-date">방문일: {{ formatDate(selectedDiary.visitedAt) }}</span>
              <span class="created-date">작성일: {{ formatDate(selectedDiary.createdAt) }}</span>
            </div>
          </div>

          <!-- 이미지 갤러리 -->
          <div v-if="selectedDiary.imgs && selectedDiary.imgs.length > 0" class="image-gallery">
            <div class="image-grid">
              <div 
                v-for="(image, index) in selectedDiary.imgs" 
                :key="index" 
                class="image-item"
                @click="openImageModal(image, index)"
              >
                <img :src="image" :alt="`${selectedDiary.title} 이미지 ${index + 1}`" />
              </div>
            </div>
          </div>

          <!-- 일지 내용 -->
          <div class="diary-body">
            <div class="content-card">
              <div class="content-text" v-html="convertMarkdownToHtml(selectedDiary.content)">
              </div>
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="action-buttons">
            <button @click="deleteDiary" class="delete-btn">삭제하기</button>
          </div>
        </div>

        <!-- 월별 합본 모달 -->
        <div v-if="selectedMonthGroup" class="month-summary-modal">
          <div class="month-header">
            <h1>{{ selectedMonthGroup.year }}년 {{ selectedMonthGroup.month }}월의 오도록</h1>
            <p>{{ selectedMonthGroup.diaries.length }}개의 일지</p>
          </div>

          <div class="month-content">
            <!-- 현재 일지 상세 보기 -->
            <div v-if="currentMonthDiary" class="current-diary-detail">
              <div class="diary-header">
                <h1 class="diary-title">{{ currentMonthDiary.title }}</h1>
                <div class="diary-meta">
                  <span class="course-name">{{ currentMonthDiary.courseName }}</span>
                  <span class="visited-date">방문일: {{ formatDate(currentMonthDiary.visitedAt) }}</span>
                  <span class="created-date">작성일: {{ formatDate(currentMonthDiary.createdAt) }}</span>
                </div>
              </div>

              <!-- 이미지 갤러리 -->
              <div v-if="currentMonthDiary.imgs && currentMonthDiary.imgs.length > 0" class="image-gallery">
                <div class="image-grid">
                  <div 
                    v-for="(image, index) in currentMonthDiary.imgs" 
                    :key="index" 
                    class="image-item"
                    @click="openImageModal(image, index)"
                  >
                    <img :src="image" :alt="`${currentMonthDiary.title} 이미지 ${index + 1}`" />
                  </div>
                </div>
              </div>

              <!-- 일지 내용 -->
              <div class="diary-body">
                <div class="content-card">
                  <div class="content-text" v-html="convertMarkdownToHtml(currentMonthDiary.content)">
                  </div>
                </div>
              </div>

              <!-- 액션 버튼 -->
              <div class="action-buttons">
                <button @click="editDiary" class="edit-btn">수정하기</button>
                <button @click="deleteDiary" class="delete-btn">삭제하기</button>
              </div>
            </div>

            <!-- 월별 페이지네이션 -->
            <div class="month-pagination">
              <button 
                @click="prevMonthDiary" 
                :disabled="currentMonthDiaryIndex === 0"
                class="month-page-btn"
              >
                이전
              </button>
              
              <div class="month-page-info">
                <span class="current-month-page">{{ currentMonthDiaryIndex + 1 }}</span>
                <span class="month-page-separator">/</span>
                <span class="total-month-pages">{{ selectedMonthGroup.diaries.length }}</span>
              </div>
              
              <button 
                @click="nextMonthDiary" 
                :disabled="currentMonthDiaryIndex === selectedMonthGroup.diaries.length - 1"
                class="month-page-btn"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 이미지 모달 -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeImageModal">×</button>
        <img :src="selectedImage" :alt="`${selectedDiary?.title} 이미지`" />
        <div class="image-nav">
          <button 
            @click="prevImage" 
            :disabled="currentImageIndex === 0"
            class="nav-btn"
          >
            ‹
          </button>
          <span class="image-counter">{{ currentImageIndex + 1 }} / {{ selectedDiary?.imgs?.length }}</span>
          <button 
            @click="nextImage" 
            :disabled="currentImageIndex === (selectedDiary?.imgs?.length - 1)"
            class="nav-btn"
          >
            ›
          </button>
        </div>
      </div>
    </div>

    <!-- 일지 생성권 구매 모달 -->
    <div v-if="showPurchaseModal" class="purchase-modal" @click="closePurchaseModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closePurchaseModal">×</button>
        
        <div class="purchase-content">
          <h2>일지 생성권 구매</h2>
          <p class="purchase-description">일지를 작성하기 위한 생성권을 구매하세요.</p>
          
          <div class="quantity-selector">
            <label for="quantity">구매 수량:</label>
            <select id="quantity" v-model="purchaseQuantity" class="quantity-dropdown">
              <option value="1">1개</option>
              <option value="3">3개</option>
              <option value="5">5개</option>
              <option value="10">10개</option>
            </select>
          </div>
          
          <div class="purchase-summary">
            <p>구매할 생성권: <strong>{{ purchaseQuantity }}개</strong></p>
          </div>
          
          <div class="purchase-actions">
            <button @click="closePurchaseModal" class="cancel-purchase-btn">취소</button>
            <button @click="confirmPurchase" :disabled="purchasing" class="confirm-purchase-btn">
              {{ purchasing ? '구매 중...' : '구매하기' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 토스트 알림 -->
    <Toast 
      :show="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="closeToast"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DiaryCard from '@/components/DiaryCard.vue'
import Toast from '@/components/Toast.vue'
import { getDiaryList, getDiaryDetail, getDiaryPermissions, deleteDiary as deleteDiaryAPI, purchaseDiaryCreateItems } from '@/services/diaryService'
import { marked } from 'marked'

export default {
  name: 'DiaryListView',
  components: {
    DiaryCard,
    Toast
  },
  setup() {
    const router = useRouter()
    const diaries = ref([])
    const loading = ref(false)
    const error = ref(null)
    const selectedYear = ref('')
    const currentPage = ref(1)
    const itemsPerPage = ref(5) // 한 페이지당 표시할 월 그룹 수
    const creatingDiary = ref(false) // 일지 생성 권한 확인 중 상태
    
    // 토스트 관련 상태
    const showToast = ref(false)
    const toastMessage = ref('')
    const toastType = ref('info')
    
    // 모달 관련 상태
    const showDiaryModal = ref(false)
    const selectedDiary = ref(null)
    const selectedMonthGroup = ref(null)
    const showImageModal = ref(false)
    const selectedImage = ref('')
    const currentImageIndex = ref(0)
    
    // 월별 합본 모달 관련 상태
    const currentMonthDiaryIndex = ref(0)
    const currentMonthDiary = ref(null)
    
    // 구매 모달 관련 상태
    const showPurchaseModal = ref(false)
    const purchaseQuantity = ref(1)
    const purchasing = ref(false)

    // 사용 가능한 연도 목록
    const availableYears = computed(() => {
      const years = new Set()
      diaries.value.forEach(diary => {
        try {
          // visitedAt을 우선적으로 사용 (실제 방문 날짜)
          const dateField = diary.visitedAt || diary.createdAt
          if (!dateField) return
          
          const date = new Date(dateField)
          
          // 날짜가 유효한지 확인
          if (isNaN(date.getTime())) {
            console.warn('유효하지 않은 날짜:', dateField)
            return
          }
          
          const year = date.getFullYear()
          years.add(year)
        } catch (error) {
          console.error('연도 추출 중 오류:', error, diary)
        }
      })
      return Array.from(years).sort((a, b) => b - a) // 최신 연도부터 정렬
    })

    // 월별로 그룹핑하는 함수
    const groupDiariesByMonth = (diaryList) => {
      const grouped = {}
      diaryList.forEach(diary => {
        try {
          // visitedAt을 우선적으로 사용 (실제 방문 날짜)
          const dateField = diary.visitedAt || diary.createdAt
          if (!dateField) {
            console.warn('날짜 필드가 없는 다이어리:', diary)
            return
          }
          
          const date = new Date(dateField)
          
          // 날짜가 유효한지 확인
          if (isNaN(date.getTime())) {
            console.warn('유효하지 않은 날짜:', dateField, diary)
            return
          }
          
          const year = date.getFullYear()
          const month = date.getMonth() + 1
          const key = `${year}-${month.toString().padStart(2, '0')}`
          
          if (!grouped[key]) {
            grouped[key] = {
              year: year,
              month: month,
              diaries: []
            }
          }
          grouped[key].diaries.push(diary)
        } catch (error) {
          console.error('그룹핑 중 오류:', error, diary)
        }
      })
      
      // 각 월 그룹 내에서 일지를 방문일 기준으로 정렬
      Object.values(grouped).forEach(group => {
        group.diaries.sort((a, b) => {
          try {
            const dateA = new Date(a.visitedAt || a.createdAt)
            const dateB = new Date(b.visitedAt || b.createdAt)
            return dateB - dateA
          } catch (error) {
            console.error('정렬 중 오류:', error)
            return 0
          }
        })
      })
      
      return Object.values(grouped).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
    }

    // 필터링된 월별 일지
    const monthlyDiaries = computed(() => {
      let filteredDiaries = diaries.value
      
      if (selectedYear.value) {
        filteredDiaries = diaries.value.filter(diary => {
          try {
            // visitedAt을 우선적으로 사용 (실제 방문 날짜)
            const dateField = diary.visitedAt || diary.createdAt
            if (!dateField) return false
            
            const date = new Date(dateField)
            const year = date.getFullYear()
            
            // 날짜가 유효한지 확인
            if (isNaN(date.getTime())) return false
            
            return year.toString() === String(selectedYear.value)
          } catch (error) {
            console.error('날짜 파싱 오류:', error, diary)
            return false
          }
        })
        console.log(`연도 ${selectedYear.value} 필터링 결과:`, filteredDiaries.length, '개')
      }
      
      const grouped = groupDiariesByMonth(filteredDiaries)
      return grouped
    })

    // 페이지네이션 관련 계산
    const totalPages = computed(() => {
      return Math.ceil(monthlyDiaries.value.length / itemsPerPage.value)
    })

    const paginatedMonthlyDiaries = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return monthlyDiaries.value.slice(start, end)
    })



    // 날짜 포맷팅
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric'
      })
    }

    // 연도 변경 핸들러
    const onYearChange = () => {
      currentPage.value = 1 // 연도 변경 시 첫 페이지로 이동
    }

    // 페이지네이션 핸들러
    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
      }
    }

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
      }
    }

    // 일지 생성
    const createDiary = async () => {
      creatingDiary.value = true // 권한 확인 중 상태로 변경
      try {
        // 권한 확인
        const permissionResponse = await getDiaryPermissions()
        
        if (permissionResponse.canCreateDiary) {
          // 권한이 있으면 스타일 설정 페이지로 이동
          router.push('/diaries/create/style')
        } else {
          // 권한이 없으면 토스트 메시지 표시
          showToastMessage('일지 생성권이 없습니다.', 'error')
          console.warn('일지 생성 권한 없음:', permissionResponse)
        }
      } catch (err) {
        showToastMessage(err.message || '일지 생성 권한을 확인할 수 없습니다.', 'error')
        console.error('Error checking diary permissions:', err)
      } finally {
        creatingDiary.value = false // 권한 확인 완료 상태로 변경
      }
    }

    // 토스트 메시지 표시
    const showToastMessage = (message, type = 'info') => {
      toastMessage.value = message
      toastType.value = type
      showToast.value = true
      
      // 3초 후 자동으로 닫기
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }

    // 토스트 닫기
    const closeToast = () => {
      showToast.value = false
    }

    // 월별 합본 보기
    const viewMonthSummary = async (monthGroup) => {
      selectedMonthGroup.value = monthGroup
      selectedDiary.value = null
      currentMonthDiaryIndex.value = 0
      
      // 첫 번째 일지의 상세 정보 가져오기
      try {
        const diaryDetail = await getDiaryDetail(monthGroup.diaries[0].id)
        currentMonthDiary.value = diaryDetail.data || diaryDetail
      } catch (error) {
        console.error('Failed to fetch diary detail:', error)
        currentMonthDiary.value = monthGroup.diaries[0]
      }
      
      showDiaryModal.value = true
    }

    // 월별 일지 네비게이션
    const prevMonthDiary = async () => {
      if (currentMonthDiaryIndex.value > 0) {
        currentMonthDiaryIndex.value--
        const diary = selectedMonthGroup.value.diaries[currentMonthDiaryIndex.value]
        
        try {
          const diaryDetail = await getDiaryDetail(diary.id)
          currentMonthDiary.value = diaryDetail.data || diaryDetail
        } catch (error) {
          console.error('Failed to fetch diary detail:', error)
          currentMonthDiary.value = diary
        }
      }
    }

    const nextMonthDiary = async () => {
      if (currentMonthDiaryIndex.value < selectedMonthGroup.value.diaries.length - 1) {
        currentMonthDiaryIndex.value++
        const diary = selectedMonthGroup.value.diaries[currentMonthDiaryIndex.value]
        
        try {
          const diaryDetail = await getDiaryDetail(diary.id)
          currentMonthDiary.value = diaryDetail.data || diaryDetail
        } catch (error) {
          console.error('Failed to fetch diary detail:', error)
          currentMonthDiary.value = diary
        }
      }
    }

    // 일지 상세보기 (모달)
    const viewDiary = async (diary) => {
      try {
        const diaryDetail = await getDiaryDetail(diary.id)
        console.log('=== 일지 상세 조회 응답 디버깅 ===')
        console.log('diaryDetail:', diaryDetail)
        console.log('diaryDetail.data:', diaryDetail.data)
        console.log('diaryDetail.title:', diaryDetail.title)
        console.log('diaryDetail.content:', diaryDetail.content)
        
        // API 응답 구조에 따라 데이터 설정
        selectedDiary.value = diaryDetail.data || diaryDetail
      } catch (error) {
        console.error('Failed to fetch diary detail:', error)
        selectedDiary.value = diary
      }
      
      selectedMonthGroup.value = null
      showDiaryModal.value = true
    }

    // 모달에서 일지 보기
    const viewDiaryInModal = async (diary) => {
      try {
        const diaryDetail = await getDiaryDetail(diary.id)
        selectedDiary.value = diaryDetail.data || diaryDetail
      } catch (error) {
        console.error('Failed to fetch diary detail:', error)
        selectedDiary.value = diary
      }
      
      selectedMonthGroup.value = null
    }

    // 모달 닫기
    const closeDiaryModal = () => {
      showDiaryModal.value = false
      selectedDiary.value = null
      selectedMonthGroup.value = null
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
        selectedImage.value = selectedDiary.value.imgs[currentImageIndex.value]
      }
    }

    const nextImage = () => {
      if (currentImageIndex.value < selectedDiary.value.imgs.length - 1) {
        currentImageIndex.value++
        selectedImage.value = selectedDiary.value.imgs[currentImageIndex.value]
      }
    }

    // 마크다운을 HTML로 변환
    const convertMarkdownToHtml = (markdown) => {
      if (!markdown) return ''
      return marked(markdown)
    }



    const deleteDiary = async () => {
      // API 응답 구조에 맞게 data 필드에서 diaryId 찾기
      const diaryData = selectedDiary.value?.data || selectedDiary.value
      const diaryId = diaryData?.id || diaryData?.diaryId
      
      if (!diaryId) {
        alert('삭제할 일지 정보가 없습니다.')
        return
      }

      const title = diaryData?.title || '제목 없음'
      const confirmMessage = `정말로 "${title}" 일지를 삭제하시겠습니까?\n\n삭제된 일지는 복구할 수 없습니다.`
      
      if (confirm(confirmMessage)) {
        try {
          await deleteDiaryAPI(diaryId)
          
          // 삭제 성공 시 모달 닫고 목록 새로고침
          closeDiaryModal()
          showToastMessage('일지가 성공적으로 삭제되었습니다.', 'success')
          
          // 일지 목록 새로고침
          await fetchDiaries()
        } catch (err) {
          console.error('일지 삭제 실패:', err)
          showToastMessage(err.message || '일지 삭제에 실패했습니다.', 'error')
        }
      }
    }

    // 구매 모달 닫기
    const closePurchaseModal = () => {
      showPurchaseModal.value = false
      purchaseQuantity.value = 1
    }

    // 일지 생성권 구매 확인
    const confirmPurchase = async () => {
      if (!purchaseQuantity.value || purchaseQuantity.value < 1) {
        showToastMessage('구매 수량을 선택해주세요.', 'error')
        return
      }

      const confirmMessage = `일지 생성권 ${purchaseQuantity.value}개를 구매하시겠습니까?`
      
      if (confirm(confirmMessage)) {
        purchasing.value = true
        
        try {
          console.log('일지 생성권 구매 시도 - quantity:', purchaseQuantity.value)
          await purchaseDiaryCreateItems(purchaseQuantity.value)
          
          // 구매 성공
          closePurchaseModal()
          showToastMessage(`일지 생성권 ${purchaseQuantity.value}개가 성공적으로 구매되었습니다!`, 'success')
          
        } catch (err) {
          console.error('일지 생성권 구매 실패:', err)
          showToastMessage(err.message || '일지 생성권 구매에 실패했습니다.', 'error')
        } finally {
          purchasing.value = false
        }
      }
    }

    // 일지 목록 가져오기
    const fetchDiaries = async () => {
      loading.value = true
      error.value = null
      
      try {
        const response = await getDiaryList('year')
        console.log('API 응답:', response)
        
        // API 응답 구조에 따라 다이어리 목록 추출
        if (response && response.data) {
          // response.data가 객체인 경우 (연도별 그룹핑)
          if (typeof response.data === 'object' && !Array.isArray(response.data)) {
            diaries.value = Object.values(response.data).flat()
          } else if (Array.isArray(response.data)) {
            // response.data가 배열인 경우
            diaries.value = response.data
          } else {
            diaries.value = []
          }
        } else if (Array.isArray(response)) {
          // response 자체가 배열인 경우
          diaries.value = response
        } else {
          diaries.value = []
        }
        
        console.log('다이어리 목록 로드 완료:', diaries.value.length, '개')
      } catch (err) {
        error.value = err.message || '일지 목록을 불러오는데 실패했습니다.'
        console.error('Error fetching diaries:', err)
        diaries.value = []
      } finally {
        loading.value = false
      }
    }



    onMounted(() => {
      fetchDiaries()
    })

    return {
      diaries,
      loading,
      error,
      selectedYear,
      availableYears,
      monthlyDiaries,
      currentPage,
      totalPages,
      paginatedMonthlyDiaries,
      showDiaryModal,
      selectedDiary,
      selectedMonthGroup,
      currentMonthDiary,
      currentMonthDiaryIndex,
      showImageModal,
      selectedImage,
      currentImageIndex,
      creatingDiary,
      showToast,
      toastMessage,
      toastType,
      onYearChange,
      prevPage,
      nextPage,
      createDiary,
      viewMonthSummary,
      viewDiary,
      viewDiaryInModal,
      closeDiaryModal,
      prevMonthDiary,
      nextMonthDiary,
      openImageModal,
      closeImageModal,
      prevImage,
      nextImage,
      deleteDiary,
      fetchDiaries,
      formatDate,
      showToastMessage,
      closeToast,
      // 구매 관련
      showPurchaseModal,
      purchaseQuantity,
      purchasing,
      closePurchaseModal,
      confirmPurchase,
      // 마크다운 변환
      convertMarkdownToHtml
    }
  }
}
</script>

<style scoped>
.diary-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 26px;
}

.diary-header {
  text-align: left;
  margin-bottom: 40px;
}

.diary-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.diary-subtitle {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
}

/* 필터 및 액션 섹션 */
.filter-action-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 15px;
}

.action-buttons {
  display: flex;
  gap: 20px;
}

.year-selector label {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
}

.year-dropdown {
  padding: 10px 35px 10px 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  min-width: 140px;
}

.year-dropdown:hover {
  border-color: #303E69;
}

.year-dropdown:focus {
  outline: none;
  border-color: #303E69;
}

.year-dropdown option:hover {
  background-color: #e9ecef;
  color: #333;
}

.year-dropdown option:checked {
  background-color: #e9ecef;
  color: #333;
}


.create-diary-btn {
  background: #384F45;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  font-weight: 600;
}

.create-diary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(56, 79, 69, 0.3);
}

.create-diary-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #303E69;
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
  padding: 40px 20px;
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
  min-height: 400px;
}

.monthly-diaries {
  margin-bottom: 40px;
}

.month-group {
  margin-bottom: 50px;
}

.month-title {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ADC8B7;
}

.month-summary-card {
  background: linear-gradient(135deg, #B96664 0%, #41687A 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 200px;
}

.month-summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.summary-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.summary-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.summary-header h3 {
  font-size: 1.2rem;
  margin-bottom: 5px;
  font-weight: bold;
  font-family: 'MaruBuri', serif;
}

.diary-count {
  font-size: 0.9rem;
  opacity: 0.9;
}

.summary-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-preview {
  width: 100%;
  max-width: 180px;
}

.book-page {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 5px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.page-title {
  font-size: 0.8rem;
  font-weight: 500;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-pages {
  text-align: center;
  font-size: 0.8rem;
  opacity: 0.7;
  font-style: italic;
}

.month-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding: 15px 0;
  background: #f8f9fa;
  border-radius: 8px;
}

.month-page-btn {
  background: #303E69;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s ease;
}

.month-page-btn:hover:not(:disabled) {
  background: #1e2a4a;
}

.month-page-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.month-page-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.current-month-page {
  color: #303E69;
}

.month-page-separator {
  color: #6c757d;
}

.total-month-pages {
  color: #495057;
}

/* 월별 합본 모달 */
.month-summary-modal {
  padding: 30px;
}

.month-header {
  text-align: left;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e9ecef;
}

.month-header h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 10px;
}

.month-header p {
  color: #666;
  font-size: 1.1rem;
}

.month-content {
  min-height: 400px;
}

.current-diary-detail {
  margin-bottom: 30px;
  overflow-y: auto;
  flex: 1;
}

.current-diary-detail .diary-header {
  background: linear-gradient(135deg, #B96664 0%, #41687A 100%);
  color: white;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.current-diary-detail .diary-title {
  font-size: 2rem;
  margin-bottom: 15px;
  font-weight: bold;
  text-align: left;
  font-family: 'MaruBuri', serif;
}

.current-diary-detail .diary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 0.9rem;
  opacity: 0.9;
  font-family: 'MaruBuri', serif;
}

.current-diary-detail .course-name {
  font-weight: 600;
  font-family: 'MaruBuri', serif;
}

.current-diary-detail .image-gallery {
  margin-bottom: 25px;
}

.current-diary-detail .image-gallery h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2rem;
}

.current-diary-detail .image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.current-diary-detail .image-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.current-diary-detail .image-item:hover {
  transform: scale(1.05);
}

.current-diary-detail .image-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.current-diary-detail .diary-body {
  margin-bottom: 25px;
}

.current-diary-detail .diary-body h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2rem;
}

.current-diary-detail .content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 25px;
  margin: 0 auto;
  max-width: 700px;
  border: 1px solid #e9ecef;
}

.current-diary-detail .content-text {
  line-height: 1.8;
  color: #555;
  font-size: 1rem;
  white-space: pre-wrap;
  font-family: 'MaruBuri', serif;
}

/* 월별 합본 모달 마크다운 스타일링 - 일반 텍스트와 일관된 여백 */
.current-diary-detail .content-text h1,
.current-diary-detail .content-text h2,
.current-diary-detail .content-text h3,
.current-diary-detail .content-text h4,
.current-diary-detail .content-text h5,
.current-diary-detail .content-text h6 {
  color: #333;
  margin: 0;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.8;
}

.current-diary-detail .content-text h1 {
  font-size: 1.8rem;
  border-bottom: 2px solid #303E69;
  padding-bottom: 0.3em;
  margin-bottom: 0.8em;
}

.current-diary-detail .content-text h2 {
  font-size: 1.4rem;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.2em;
  margin-bottom: 0.6em;
}

.current-diary-detail .content-text h3 {
  font-size: 1.2rem;
  margin-bottom: 0.4em;
}

.current-diary-detail .content-text p {
  margin: 0;
  margin-bottom: 0.5em;
  line-height: 1.8;
}

.current-diary-detail .content-text ul,
.current-diary-detail .content-text ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.current-diary-detail .content-text li {
  margin: 0;
  margin-bottom: 0.2em;
  line-height: 1.8;
}

.current-diary-detail .content-text blockquote {
  border-left: 4px solid #303E69;
  padding-left: 1em;
  margin: 0.5em 0;
  color: #666;
  font-style: italic;
  line-height: 1.8;
}

.current-diary-detail .content-text code {
  background: #f8f9fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.current-diary-detail .content-text pre {
  background: #f8f9fa;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
  margin: 1em 0;
}

.current-diary-detail .content-text pre code {
  background: none;
  padding: 0;
}

.current-diary-detail .content-text a {
  color: #303E69;
  text-decoration: none;
}

.current-diary-detail .content-text a:hover {
  text-decoration: underline;
}

.current-diary-detail .content-text strong {
  font-weight: 600;
  color: #333;
}

.current-diary-detail .content-text em {
  font-style: italic;
}

.current-diary-detail .action-buttons {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.current-diary-detail .edit-btn, .current-diary-detail .delete-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.current-diary-detail .edit-btn {
  background: #303E69;
  color: white;
}

.current-diary-detail .edit-btn:hover {
  background: #1e2a4a;
}

.current-diary-detail .delete-btn {
  background: #dc3545;
  color: white;
}

.current-diary-detail .delete-btn:hover {
  background: #c82333;
}

.diary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #6c757d;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #495057;
}

.empty-state p {
  margin-bottom: 30px;
}

.create-btn {
  background: #303E69;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.create-btn:hover:not(:disabled) {
  background: #1e2a4a;
}

.create-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
  padding: 20px 0;
}

.page-btn {
  background: #303E69;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #1e2a4a;
}

.page-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.current-page {
  color: #303E69;
}

.page-separator {
  color: #6c757d;
}

.total-pages {
  color: #495057;
}

/* 모달 스타일 */
.diary-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.diary-modal .modal-content {
  background: white;
  border-radius: 12px;
  max-width: 90%;
  max-height: 90%;
  overflow: hidden;
  position: relative;
  width: 800px;
  display: flex;
  flex-direction: column;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #666;
  z-index: 1001;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.modal-close:hover {
  color: #333;
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 일지 상세 모달 */
.diary-detail {
  padding: 30px;
  overflow-y: auto;
  flex: 1;
}

.diary-detail .diary-header {
  background: linear-gradient(135deg, #B96664 0%, #41687A 100%);
  color: white;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.diary-detail .diary-title {
  font-size: 2rem;
  margin-bottom: 15px;
  font-weight: bold;
  text-align: left;
  font-family: 'MaruBuri', serif;
}

.diary-detail .diary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 0.9rem;
  opacity: 0.9;
  font-family: 'MaruBuri', serif;
}

.diary-detail .course-name {
  font-weight: 600;
  font-family: 'MaruBuri', serif;
}

.diary-detail .image-gallery {
  margin-bottom: 25px;
}

.diary-detail .image-gallery h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2rem;
}

.diary-detail .image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.diary-detail .image-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.diary-detail .image-item:hover {
  transform: scale(1.05);
}

.diary-detail .image-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.diary-detail .diary-body {
  margin-bottom: 25px;
}

.diary-detail .diary-body h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2rem;
}

.diary-detail .content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 25px;
  margin: 0 auto;
  max-width: 700px;
  border: 1px solid #e9ecef;
}

.diary-detail .content-text {
  line-height: 1.8;
  color: #555;
  font-size: 1rem;
  white-space: pre-wrap;
  font-family: 'MaruBuri', serif;
}

/* 마크다운 스타일링 - 일반 텍스트와 일관된 여백 */
.diary-detail .content-text h1,
.diary-detail .content-text h2,
.diary-detail .content-text h3,
.diary-detail .content-text h4,
.diary-detail .content-text h5,
.diary-detail .content-text h6 {
  color: #333;
  margin: 0;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.8;
}

.diary-detail .content-text h1 {
  font-size: 1.8rem;
  border-bottom: 2px solid #303E69;
  padding-bottom: 0.3em;
  margin-bottom: 0.8em;
}

.diary-detail .content-text h2 {
  font-size: 1.4rem;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.2em;
  margin-bottom: 0.6em;
}

.diary-detail .content-text h3 {
  font-size: 1.2rem;
  margin-bottom: 0.4em;
}

.diary-detail .content-text p {
  margin: 0;
  margin-bottom: 0.5em;
  line-height: 1.8;
}

.diary-detail .content-text ul,
.diary-detail .content-text ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.diary-detail .content-text li {
  margin: 0;
  margin-bottom: 0.2em;
  line-height: 1.8;
}

.diary-detail .content-text blockquote {
  border-left: 4px solid #303E69;
  padding-left: 1em;
  margin: 0.5em 0;
  color: #666;
  font-style: italic;
  line-height: 1.8;
}

.diary-detail .content-text code {
  background: #f8f9fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.diary-detail .content-text pre {
  background: #f8f9fa;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
  margin: 1em 0;
}

.diary-detail .content-text pre code {
  background: none;
  padding: 0;
}

.diary-detail .content-text a {
  color: #303E69;
  text-decoration: none;
}

.diary-detail .content-text a:hover {
  text-decoration: underline;
}

.diary-detail .content-text strong {
  font-weight: 600;
  color: #333;
}

.diary-detail .content-text em {
  font-style: italic;
}

.diary-detail .action-buttons {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.diary-detail .edit-btn, .diary-detail .delete-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.diary-detail .edit-btn {
  background: #303E69;
  color: white;
}

.diary-detail .edit-btn:hover {
  background: #1e2a4a;
}

.diary-detail .delete-btn {
  background: #dc3545;
  color: white;
}

.diary-detail .delete-btn:hover {
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
  z-index: 2000;
}

.image-modal .modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.image-modal .modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  z-index: 2001;
}

.image-modal .modal-content img {
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
  .diary-list-container {
    padding: 15px;
  }
  
  .diary-header h1 {
    font-size: 2rem;
  }
  
  .filter-action-section {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .year-selector {
    justify-content: center;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .month-title {
    font-size: 1.5rem;
  }
  
  .month-pagination {
    flex-direction: column;
    gap: 15px;
  }
  
  .summary-content {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .book-preview {
    max-width: 100px;
  }
  
  .diary-modal .modal-content {
    width: 95%;
    max-height: 95%;
  }
  
  .diary-detail .content-card,
  .current-diary-detail .content-card {
    padding: 20px;
    margin: 0 10px;
  }
  
  .diary-detail .content-text h1,
  .current-diary-detail .content-text h1 {
    font-size: 1.5rem;
    margin-bottom: 0.6em;
  }
  
  .diary-detail .content-text h2,
  .current-diary-detail .content-text h2 {
    font-size: 1.3rem;
    margin-bottom: 0.5em;
  }
  
  .diary-detail .content-text h3,
  .current-diary-detail .content-text h3 {
    font-size: 1.1rem;
    margin-bottom: 0.3em;
  }
  
  .diary-book {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
  }
  
  .diary-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .diary-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  

  
  .diary-modal .modal-content {
    width: 98%;
    max-height: 98%;
  }
  
  .diary-detail {
    padding: 20px;
  }
  
  .month-summary-card {
    padding: 15px;
    min-height: 180px;
  }
  
  .summary-header h3 {
    font-size: 1rem;
  }
  
  .current-diary-detail .diary-title {
    font-size: 1.5rem;
  }
  
  .current-diary-detail .diary-meta {
    flex-direction: column;
    gap: 10px;
  }
}

/* 구매 버튼 스타일 */
.purchase-btn {
  background: #303E69;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.purchase-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(48, 62, 105, 0.3);
}

.purchase-btn:active {
  transform: translateY(0);
}

/* 구매 모달 스타일 */
.purchase-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.purchase-modal .modal-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.purchase-modal .modal-close {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  transition: color 0.3s ease;
}

.purchase-modal .modal-close:hover {
  color: #333;
}

.purchase-content h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.8rem;
  text-align: center;
}

.purchase-description {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  font-size: 1rem;
}

.quantity-selector {
  margin-bottom: 25px;
}

.quantity-selector label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #333;
}

.quantity-dropdown {
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.quantity-dropdown:focus {
  outline: none;
  border-color: #303E69;
}

.purchase-summary {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
  text-align: center;
}

.purchase-summary p {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.purchase-summary strong {
  color: #303E69;
  font-size: 1.2rem;
}

.purchase-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.cancel-purchase-btn,
.confirm-purchase-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.cancel-purchase-btn {
  background: #6c757d;
  color: white;
}

.cancel-purchase-btn:hover {
  background: #5a6268;
}

.confirm-purchase-btn {
  background: linear-gradient(135deg, #303E69 0%, #1e2a4a 100%);
  color: white;
}

.confirm-purchase-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.confirm-purchase-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style> 