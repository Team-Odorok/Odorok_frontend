<template>
  <div class="nearby-attractions-container">
    <!-- 헤더 영역 -->
    <div class="header-section">
      <div class="header-component">
        <h1>주변명소 보기</h1>
        <p>{{ courseName }} 코스 주변의 명소들을 확인해보세요</p>
      </div>
      <div class="navigation-component">
        <button @click="goBack" class="back-button">← 코스로 돌아가기</button>
      </div>
    </div>

    <!-- 메인 콘텐츠 영역 -->
    <div class="main-content">
      <!-- 왼쪽: 지도 영역 -->
      <div class="map-section">
        <div class="map-container">
          <KakaoMap 
            :pathPoints="courseCoords" 
            :courseId="courseId" 
            :attractions="filteredAttractions"
            :showAttractionMarkers="true"
            :highlightAttractionId="selectedAttraction && (selectedAttraction.attractionId || selectedAttraction.attrationId)"
            :height="560"
            @attraction-selected="onAttractionSelected"
          />
        </div>
      </div>

      <!-- 오른쪽: 명소 상세 정보 영역 -->
      <div class="attractions-section">
        <!-- 컨텐츠 타입 필터 -->
        <div class="filter-section">
          <h3>명소 종류 선택</h3>
          <div class="content-type-filters">
            <button 
              v-for="type in contentTypes" 
              :key="type.contentTypeId"
              @click="selectContentType(type.contentTypeId)"
              :class="{ active: selectedContentType === type.contentTypeId }"
              class="filter-button"
            >
              {{ type.name }}
            </button>
          </div>
        </div>

        <!-- 선택된 명소 상세 정보 -->
        <div v-if="selectedAttraction" class="attraction-detail">
          <h3>선택된 명소 정보</h3>
          
          <!-- 명소 이름 -->
          <div class="detail-item">
            <h4>명소 이름</h4>
            <p>{{ selectedAttraction.title }}</p>
          </div>

          <!-- 명소 종류 -->
          <div class="detail-item">
            <h4>명소 종류</h4>
            <p>{{ getContentTypeName(selectedAttraction.contentTypeId) }}</p>
          </div>

          <!-- 명소 사진 -->
          <div v-if="selectedAttraction.firstImage1" class="detail-item">
            <h4>명소 사진</h4>
            <img :src="selectedAttraction.firstImage1" :alt="selectedAttraction.title" class="attraction-image" />
          </div>

          <!-- 전화번호 -->
          <div v-if="selectedAttraction.tel" class="detail-item">
            <h4>전화번호</h4>
            <p>📞 {{ selectedAttraction.tel }}</p>
          </div>

          <!-- 홈페이지 -->
          <div v-if="selectedAttraction.homepage" class="detail-item">
            <h4>홈페이지</h4>
            <a :href="selectedAttraction.homepage" target="_blank" class="homepage-link">
              🌐 홈페이지 방문하기
            </a>
          </div>

          <!-- 주소 -->
          <div v-if="selectedAttraction.addr1" class="detail-item">
            <h4>주소</h4>
            <p>{{ selectedAttraction.addr1 }}</p>
            <p v-if="selectedAttraction.addr2">{{ selectedAttraction.addr2 }}</p>
          </div>

          <!-- 상세 설명 -->
          <div v-if="attractionDetail && attractionDetail.overview" class="detail-item">
            <h4>상세 설명</h4>
            <p>{{ attractionDetail.overview }}</p>
          </div>

          <!-- 명소 등록 버튼 -->
          <div class="detail-item">
            <button 
              @click="registerAttraction" 
              class="register-btn"
              :disabled="registering"
            >
              {{ registering ? '등록 중...' : '이 명소를 방문 예정으로 등록' }}
            </button>
          </div>
        </div>

        <!-- 명소 목록 -->
        <div v-else class="attractions-list">
          <h3>주변 명소 목록 ({{ filteredAttractions.length }}개)</h3>
          <div v-if="loading" class="loading">
            명소 정보를 불러오는 중...
          </div>
          <div v-else-if="error" class="error">
            {{ error }}
          </div>
          <div v-else-if="filteredAttractions.length === 0" class="no-attractions">
            선택한 종류의 명소가 없습니다.
          </div>
          <div v-else class="attraction-items">
            <div 
              v-for="attraction in filteredAttractions" 
              :key="attraction.attractionId"
              @click="selectAttraction(attraction)"
              class="attraction-item"
              :class="{ selected: selectedAttraction && selectedAttraction.attractionId === attraction.attractionId }"
            >
              <div class="attraction-info">
                <h4>{{ attraction.title }}</h4>
                <p class="attraction-type">{{ getContentTypeName(attraction.contentTypeId) }}</p>
                <p class="attraction-address">{{ attraction.addr1 }}</p>
                <p v-if="attraction.tel" class="attraction-phone">📞 {{ attraction.tel }}</p>
              </div>
              <div v-if="attraction.firstImage1" class="attraction-thumbnail">
                <img :src="attraction.firstImage1" :alt="attraction.title" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import KakaoMap from '../components/KakaoMap.vue'
import courseApi from '../api/courseApi.js'

export default {
  name: 'NearbyAttractionsView',
  components: { KakaoMap },
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const courseId = ref(route.query.courseId || route.params.courseId)
    const courseName = ref(route.query.courseName || route.params.courseName || '선택된 코스')
    const courseCoords = ref([])
    const attractions = ref([])
    const contentTypes = ref([])
    const selectedContentType = ref(12) // 기본값: 관광지
    const selectedAttraction = ref(null)
    const attractionDetail = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const registering = ref(false)

    // URL 쿼리에서 데이터 파싱
    const parseQueryData = () => {
      try {
        if (route.query.coords) {
          courseCoords.value = JSON.parse(route.query.coords)
        }
      } catch (e) {
        console.error('좌표 데이터 파싱 실패:', e)
      }
    }

    // 컨텐츠 타입 조회 - 하드코딩된 기본 타입만 사용
    const loadContentTypes = () => {
      contentTypes.value = [
        { contentTypeId: 12, name: '관광지' },
        { contentTypeId: 14, name: '문화시설' },
        { contentTypeId: 15, name: '축제공연행사' },
        { contentTypeId: 25, name: '여행코스' },
        { contentTypeId: 28, name: '레포츠' },
        { contentTypeId: 32, name: '숙박' },
        { contentTypeId: 38, name: '쇼핑' },
        { contentTypeId: 39, name: '음식점' }
      ]
    }

    // 주변 명소 조회
    const loadAttractions = async () => {
      loading.value = true
      error.value = null
      
      try {
        console.log('주변명소 조회 파라미터:', { courseId: courseId.value })
        
        // 여러 컨텐츠 타입을 한번에 조회
        const contentTypeIds = [12, 14, 15, 25, 28, 32, 38, 39] // 관광지, 문화시설, 축제공연행사, 여행코스, 레포츠, 숙박, 쇼핑, 음식점
        let allAttractions = []
        
        for (const contentTypeId of contentTypeIds) {
          try {
            const response = await courseApi.getNearbyAttractions(courseId.value, contentTypeId)
            console.log(`컨텐츠 타입 ${contentTypeId} 응답:`, response)
            
            if (response && response.status === 'success' && response.data && response.data.items) {
              // 각 명소에 contentTypeId 추가
              const attractionsWithType = response.data.items.map(attraction => ({
                ...attraction,
                contentTypeId: contentTypeId
              }))
              allAttractions = [...allAttractions, ...attractionsWithType]
            }
          } catch (err) {
            console.error(`컨텐츠 타입 ${contentTypeId} 조회 실패:`, err)
          }
        }
        
        attractions.value = allAttractions
        console.log('총 로드된 명소 수:', attractions.value.length)
        
        // 모든 attractionId 출력
        console.log('=== 사용 가능한 attractionId 목록 ===')
        allAttractions.forEach((attraction, index) => {
          console.log(`${index + 1}. ${attraction.title} - attractionId: ${attraction.attrationId}`)
        })
        console.log('================================')
        
        // 첫 번째 명소의 전체 데이터 구조 확인
        if (allAttractions.length > 0) {
          console.log('첫 번째 명소 전체 데이터:', allAttractions[0])
        }
        
        if (attractions.value.length === 0) {
          error.value = '해당 지역에 주변 명소가 없습니다.'
        }
        
      } catch (err) {
        console.error('주변 명소 조회 실패:', err)
        error.value = '주변 명소 정보를 불러오는데 실패했습니다.'
        attractions.value = []
      } finally {
        loading.value = false
      }
    }

    // 필터링된 명소 목록 (선택된 타입만 표시)
    const filteredAttractions = computed(() => {
      if (!attractions.value || attractions.value.length === 0) {
        return []
      }
      
      const filtered = attractions.value.filter(attraction => 
        attraction.contentTypeId === selectedContentType.value
      )
      
      console.log(`컨텐츠 타입 ${selectedContentType.value} 필터링 결과:`, filtered.length, '개')
      return filtered
    })

    // 컨텐츠 타입 이름 가져오기
    const getContentTypeName = (contentTypeId) => {
      const defaultTypes = {
        12: '관광지',
        14: '문화시설', 
        15: '축제공연행사',
        25: '여행코스',
        28: '레포츠',
        32: '숙박',
        38: '쇼핑',
        39: '음식점'
      }
      
      return defaultTypes[contentTypeId] || '기타'
    }

    // 명소 선택
    const selectAttraction = async (attraction) => {
      console.log('attraction', attraction.attrationId)
      
      selectedAttraction.value = attraction
      attractionDetail.value = null
      
      // 명소 상세 정보 조회
      try {
        const response = await courseApi.getAttractionDetail(attraction.attrationId)
        if (response && response.status === 'success' && response.data) {
          attractionDetail.value = response.data
        } else {
          console.warn('명소 상세 정보가 없습니다:', attraction.title)
        }
      } catch (error) {
        console.error('명소 상세 정보 조회 실패:', error)
        console.log('기본 명소 정보로 표시합니다:', attraction.title)
      }
    }

    // 지도에서 명소 클릭 시 호출
    const onAttractionSelected = async (attraction) => {
      console.log('지도에서 명소 선택됨:', attraction)
      await selectAttraction(attraction)
    }

    // 컨텐츠 타입 선택
    const selectContentType = (contentTypeId) => {
      selectedContentType.value = contentTypeId
      selectedAttraction.value = null
      attractionDetail.value = null
      // API 재호출 제거 - computed로 필터링만 처리
    }

    // 명소 방문 예정 등록
    const registerAttraction = async () => {
      if (!selectedAttraction.value) {
        alert('등록할 명소를 선택해주세요.')
        return
      }

      registering.value = true
      try {
        // 현재 날짜를 기본값으로 설정
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 7) // 일주일 후로 설정
        
        // 명소 ID 추출 (여러 가능한 필드명 확인)
        const attractionId = selectedAttraction.value.attractionId || 
                           selectedAttraction.value.attrationId || 
                           selectedAttraction.value.contentId ||
                           selectedAttraction.value.id
        
        console.log('🔍 선택된 명소:', selectedAttraction.value)
        console.log('🔍 추출된 명소 ID:', attractionId)
        console.log('🔍 코스 ID:', courseId.value)
        
        if (!attractionId || attractionId === 0) {
          alert('명소 ID를 찾을 수 없습니다. 명소 정보를 확인해주세요.')
          console.error('명소 ID 추출 실패:', selectedAttraction.value)
          return
        }

        if (!courseId.value || courseId.value === 0) {
          alert('코스 ID를 찾을 수 없습니다. 코스 정보를 확인해주세요.')
          console.error('코스 ID 추출 실패:', courseId.value)
          return
        }

        // 스케줄 등록 (명소만 등록)
        await courseApi.registerSchedule(
          Number(courseId.value),
          dueDate.toISOString(),
          [Number(attractionId)]
        )
        
        alert('명소가 방문 예정으로 등록되었습니다!')
        
        // 등록 성공 후 선택된 명소 유지 (페이지에 남아있도록)
        // selectedAttraction은 그대로 유지됨
      } catch (error) {
        console.error('명소 등록 실패:', error)
        alert('명소 등록에 실패했습니다.')
      } finally {
        registering.value = false
      }
    }

    // 뒤로 가기
    const goBack = () => {
      router.go(-1)
    }

    onMounted(() => {
      parseQueryData()
      loadContentTypes() // 동기 함수로 변경
      loadAttractions()
    })

    return {
      courseId,
      courseName,
      courseCoords,
      attractions,
      contentTypes,
      selectedContentType,
      selectedAttraction,
      attractionDetail,
      filteredAttractions,
      loading,
      error,
      registering,
      getContentTypeName,
      selectAttraction,
      onAttractionSelected,
      selectContentType,
      registerAttraction,
      goBack
    }
  }
}
</script>

<style scoped>
.nearby-attractions-container {
  min-height: 100vh;
  background-color: #fafafa;
  width: 100%;
}

.header-section {
  background: #fff;
  color: #222;
  padding: 20px;
  width: 100%;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.header-component h1 {
  margin: 0 0 6px 0;
  font-size: 1.6rem;
}

.header-component p {
  margin: 0;
  color: #666;
}

.navigation-component {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

.back-button {
  background: #fff;
  color: #333;
  border: 1px solid #e1e8ed;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: #f6f8fa;
}

.main-content {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
  padding: 16px;
  width: 100%;
  height: calc(100vh - 110px);
  box-sizing: border-box;
}

.map-section {
  min-height: 560px;
  height: 100%;
}

.map-container {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  height: 100%;
  width: 100%;
}

.attractions-section {
  min-width: 360px;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 16px;
  color: #222;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-section {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.filter-section h3 {
  margin: 0 0 10px 0;
  color: #222;
}

.content-type-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-button {
  background: #fff;
  color: #333;
  border: 1px solid #e1e8ed;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.filter-button:hover {
  background: #f6f8fa;
}

.filter-button.active {
  background: #eef7ff;
  border-color: #cfe7ff;
  color: #1d4ed8;
}


.attraction-detail {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.attraction-detail h3 {
  margin: 0 0 12px 0;
  color: #222;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-item h4 {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 0.9rem;
}

.detail-item p {
  margin: 0;
  line-height: 1.4;
}

.attraction-image {
  width: 100%;
  max-width: 300px;
  border-radius: 8px;
  margin-top: 5px;
}


.homepage-link {
  color: #1d4ed8;
  text-decoration: none;
  display: inline-block;
  margin-top: 5px;
}

.homepage-link:hover {
  text-decoration: underline;
}

.attractions-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.attractions-list h3 {
  margin: 0 0 12px 0;
  color: #222;
  flex-shrink: 0;
}


.loading, .error, .no-attractions {
  text-align: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  flex-shrink: 0;
}

.error {
  color: #c92a2a;
}

.attraction-items {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}


.attraction-item {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  gap: 12px;
}


.attraction-item:hover {
  background: #f8f9fa;
}


.attraction-item.selected {
  border: 2px solid #98c1ff;
  background: #f6f9ff;
}

.attraction-info {
  flex: 1;
}


.attraction-info h4 {
  margin: 0 0 5px 0;
  color: #222;
  font-size: 1rem;
}


.attraction-type {
  margin: 0 0 3px 0;
  color: #1d4ed8;
  font-size: 0.8rem;
}


.attraction-address {
  margin: 0 0 3px 0;
  color: #666;
  font-size: 0.8rem;
}


.attraction-phone {
  margin: 0;
  color: #2b8a3e;
  font-size: 0.8rem;
}

.attraction-thumbnail {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.attraction-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .map-section {
    min-height: 420px;
    height: 420px;
  }
  
  .attractions-section {
    min-width: auto;
    height: auto;
  }
}

/* 명소 등록 버튼 스타일 */
.register-btn {
  background: #1d4ed8;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  margin-top: 16px;
}

.register-btn:hover:not(:disabled) {
  background: #1e40af;
  transform: translateY(-1px);
}

.register-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}
</style> 