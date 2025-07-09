<template>
  <div class="diary-list-container">
    <div class="diary-header">
      <h1>나의 오도록</h1>
      <p class="diary-subtitle">여행 일지 목록</p>
    </div>

    <!-- 연도 선택 드롭다운 -->
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

    <!-- 일지 생성 버튼 -->
    <div class="create-diary-section">
      <button @click="createDiary" class="create-diary-btn">
        ✏️ 새 일지 작성
      </button>
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
                  <h3>{{ monthGroup.year }}년 {{ monthGroup.month }}월</h3>
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
        <button @click="createDiary" class="create-btn">일지 작성하기</button>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div v-if="monthlyDiaries.length > 0" class="pagination">
      <button 
        @click="prevPage" 
        :disabled="currentPage === 1"
        class="page-btn prev-btn"
      >
        ‹ 이전
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
        다음 ›
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
            <h3>여행 사진</h3>
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
            <h3>일지 내용</h3>
            <div class="content-text">
              {{ selectedDiary.content }}
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="action-buttons">
            <button @click="editDiary" class="edit-btn">수정하기</button>
            <button @click="deleteDiary" class="delete-btn">삭제하기</button>
          </div>
        </div>

        <!-- 월별 합본 모달 -->
        <div v-if="selectedMonthGroup" class="month-summary-modal">
          <div class="month-header">
            <h1>{{ selectedMonthGroup.year }}년 {{ selectedMonthGroup.month }}월</h1>
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
                <h3>여행 사진</h3>
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
                <h3>일지 내용</h3>
                <div class="content-text">
                  {{ currentMonthDiary.content }}
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
                ‹ 이전
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
                다음 ›
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
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DiaryCard from '@/components/DiaryCard.vue'
import { getDiaryList } from '@/services/diaryService.js'

export default {
  name: 'DiaryListView',
  components: {
    DiaryCard
  },
  setup() {
    const router = useRouter()
    const diaries = ref([])
    const loading = ref(false)
    const error = ref(null)
    const selectedYear = ref('')
    const currentPage = ref(1)
    const itemsPerPage = ref(3) // 한 페이지당 표시할 월 그룹 수
    
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

    // 목업 데이터 (백엔드 연동 전까지 사용)
    const mockDiaries = [
      {
        id: 1,
        title: "제주도 여행",
        visitedAt: "2025-05-17",
        createdAt: "2025-05-17 00:00:00"
      },
      {
        id: 2,
        title: "부산 해운대",
        visitedAt: "2025-05-16",
        createdAt: "2025-05-16 12:30:00"
      },
      {
        id: 3,
        title: "서울 남산타워",
        visitedAt: "2025-04-20",
        createdAt: "2025-04-20 15:45:00"
      },
      {
        id: 4,
        title: "경주 불국사",
        visitedAt: "2025-03-15",
        createdAt: "2025-03-15 09:20:00"
      },
      {
        id: 5,
        title: "강릉 커피거리",
        visitedAt: "2024-12-10",
        createdAt: "2024-12-10 14:30:00"
      },
      {
        id: 6,
        title: "여수 돌산공원",
        visitedAt: "2024-11-25",
        createdAt: "2024-11-25 11:15:00"
      },
      {
        id: 7,
        title: "전주 한옥마을",
        visitedAt: "2024-10-05",
        createdAt: "2024-10-05 16:40:00"
      },
      {
        id: 8,
        title: "속초 설악산",
        visitedAt: "2024-09-20",
        createdAt: "2024-09-20 08:30:00"
      },
      {
        id: 9,
        title: "부산 감천문화마을",
        visitedAt: "2024-08-15",
        createdAt: "2024-08-15 14:20:00"
      },
      {
        id: 10,
        title: "대구 팔공산",
        visitedAt: "2024-07-10",
        createdAt: "2024-07-10 09:30:00"
      }
    ]

    // 목업 데이터에 상세 정보 추가
    const mockDiaryDetails = {
      1: {
        id: 1,
        title: "제주도 여행",
        content: "제주도에 처음 방문했습니다. 아름다운 해변과 맛있는 음식들, 그리고 친절한 현지인들을 만나서 정말 즐거운 시간을 보냈습니다. 특히 성산일출봉에서 본 일출은 평생 잊을 수 없는 장면이었습니다.",
        imgs: [
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
        ],
        userId: 1,
        courseName: "제주도 성산일출봉 코스",
        visitedAt: "2025-05-17 00:00:00",
        createdAt: "2025-05-17 00:00:00"
      },
      2: {
        id: 2,
        title: "부산 해운대",
        content: "부산 해운대에서 멋진 해변을 구경했습니다. 바다의 푸른색과 하늘의 아름다움이 정말 인상적이었습니다.",
        imgs: [
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
        ],
        userId: 1,
        courseName: "부산 해운대 해변",
        visitedAt: "2025-05-16 00:00:00",
        createdAt: "2025-05-16 00:00:00"
      },
      3: {
        id: 3,
        title: "서울 남산타워",
        content: "서울 남산타워에서 서울의 야경을 감상했습니다. 도시의 불빛들이 마치 반짝이는 보석 같았습니다.",
        imgs: [
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
        ],
        userId: 1,
        courseName: "서울 남산타워",
        visitedAt: "2025-04-20 00:00:00",
        createdAt: "2025-04-20 00:00:00"
             }
     }

    // 사용 가능한 연도 목록
    const availableYears = computed(() => {
      const years = new Set()
      diaries.value.forEach(diary => {
        const year = new Date(diary.createdAt).getFullYear()
        years.add(year)
      })
      return Array.from(years).sort((a, b) => b - a) // 최신 연도부터 정렬
    })

    // 월별로 그룹핑하는 함수
    const groupDiariesByMonth = (diaryList) => {
      const grouped = {}
      diaryList.forEach(diary => {
        const date = new Date(diary.createdAt)
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
      })
      
      // 각 월 그룹 내에서 일지를 방문일 기준으로 정렬
      Object.values(grouped).forEach(group => {
        group.diaries.sort((a, b) => new Date(b.visitedAt) - new Date(a.visitedAt))
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
          const year = new Date(diary.createdAt).getFullYear()
          return year.toString() === selectedYear.value
        })
      }
      
      return groupDiariesByMonth(filteredDiaries)
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
    const createDiary = () => {
      router.push('/diaries/create/style')
    }

    // 월별 합본 보기
    const viewMonthSummary = (monthGroup) => {
      selectedMonthGroup.value = monthGroup
      selectedDiary.value = null
      currentMonthDiaryIndex.value = 0
      currentMonthDiary.value = mockDiaryDetails[monthGroup.diaries[0].id] || monthGroup.diaries[0]
      showDiaryModal.value = true
    }

    // 월별 일지 네비게이션
    const prevMonthDiary = () => {
      if (currentMonthDiaryIndex.value > 0) {
        currentMonthDiaryIndex.value--
        const diary = selectedMonthGroup.value.diaries[currentMonthDiaryIndex.value]
        currentMonthDiary.value = mockDiaryDetails[diary.id] || diary
      }
    }

    const nextMonthDiary = () => {
      if (currentMonthDiaryIndex.value < selectedMonthGroup.value.diaries.length - 1) {
        currentMonthDiaryIndex.value++
        const diary = selectedMonthGroup.value.diaries[currentMonthDiaryIndex.value]
        currentMonthDiary.value = mockDiaryDetails[diary.id] || diary
      }
    }

    // 일지 상세보기 (모달)
    const viewDiary = (diary) => {
      // 목업 데이터에서 상세 정보 가져오기
      const diaryDetail = mockDiaryDetails[diary.id] || diary
      selectedDiary.value = diaryDetail
      selectedMonthGroup.value = null
      showDiaryModal.value = true
    }

    // 모달에서 일지 보기
    const viewDiaryInModal = (diary) => {
      const diaryDetail = mockDiaryDetails[diary.id] || diary
      selectedDiary.value = diaryDetail
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

    // 일지 수정/삭제
    const editDiary = () => {
      console.log('Edit diary:', selectedDiary.value?.id)
      // TODO: 일지 수정 페이지로 이동
    }

    const deleteDiary = () => {
      if (confirm('정말로 이 일지를 삭제하시겠습니까?')) {
        console.log('Delete diary:', selectedDiary.value?.id)
        // TODO: 일지 삭제 API 호출
        closeDiaryModal()
      }
    }

    // 일지 목록 가져오기
    const fetchDiaries = async () => {
      loading.value = true
      error.value = null
      
      try {
        // 실제 API 호출 (백엔드 준비되면 주석 해제)
        // const response = await getDiaryList('year')
        // 
        // if (response.data) {
        //   diaries.value = Object.values(response.data).flat()
        // }
        
        // 목업 데이터 사용 (백엔드 연동 전까지)
        await new Promise(resolve => setTimeout(resolve, 1000)) // 로딩 시뮬레이션
        
        // API 에러 시뮬레이션 (테스트용)
        // throw new Error('API 서버에 연결할 수 없습니다.')
        
        diaries.value = mockDiaries
      } catch (err) {
        error.value = err.message || '일지 목록을 불러오는데 실패했습니다.'
        console.error('Error fetching diaries:', err)
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
      editDiary,
      deleteDiary,
      fetchDiaries,
      formatDate
    }
  }
}
</script>

<style scoped>
.diary-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.diary-header {
  text-align: center;
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

.year-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  gap: 15px;
}

.year-selector label {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
}

.year-dropdown {
  padding: 10px 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.year-dropdown:focus {
  outline: none;
  border-color: #007bff;
}

.create-diary-section {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.create-diary-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  font-weight: 600;
}

.create-diary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
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
  border-bottom: 2px solid #e9ecef;
}

.month-summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.month-summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.summary-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.summary-header {
  text-align: center;
}

.summary-header h3 {
  font-size: 1.2rem;
  margin-bottom: 5px;
  font-weight: 600;
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
  max-width: 120px;
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
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s ease;
}

.month-page-btn:hover:not(:disabled) {
  background: #0056b3;
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
  color: #007bff;
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
  text-align: center;
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
}

.current-diary-detail .diary-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.current-diary-detail .diary-title {
  font-size: 2rem;
  margin-bottom: 15px;
  font-weight: 600;
}

.current-diary-detail .diary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.current-diary-detail .course-name {
  font-weight: 600;
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

.current-diary-detail .content-text {
  line-height: 1.8;
  color: #555;
  font-size: 1rem;
  white-space: pre-wrap;
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
  background: #007bff;
  color: white;
}

.current-diary-detail .edit-btn:hover {
  background: #0056b3;
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
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.create-btn:hover {
  background: #0056b3;
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
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #0056b3;
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
  color: #007bff;
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
  overflow-y: auto;
  position: relative;
  width: 800px;
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  z-index: 1001;
}

.modal-close:hover {
  color: #333;
}

/* 일지 상세 모달 */
.diary-detail {
  padding: 30px;
}

.diary-detail .diary-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.diary-detail .diary-title {
  font-size: 2rem;
  margin-bottom: 15px;
  font-weight: 600;
}

.diary-detail .diary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.diary-detail .course-name {
  font-weight: 600;
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

.diary-detail .content-text {
  line-height: 1.8;
  color: #555;
  font-size: 1rem;
  white-space: pre-wrap;
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
  background: #007bff;
  color: white;
}

.diary-detail .edit-btn:hover {
  background: #0056b3;
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
  
  .year-selector {
    flex-direction: column;
    gap: 10px;
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
    height: 180px;
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
</style> 