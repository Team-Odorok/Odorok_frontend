<template>
  <div class="course-search-container">
    <!-- 페이지 헤더 -->
    <div class="course-search-header">
      <div class="header-title">
        <h1>코스검색</h1>
        <p class="header-subtitle">다양한 여행 코스를 검색하고 맞춤 코스를 추천 받아 보세요</p>
      </div>
      <div class="header-controls">
        <label style="font-size:14px; color:#666;">정렬</label>
        <select v-model="sortBy" @change="handleSortChange" style="padding:6px 8px; border:1px solid #dee2e6; border-radius:4px;">
          <option value="createdAt">최신순</option>
          <option value="rating,desc">별점 높은 순</option>
          <option value="rating,asc">별점 낮은 순</option>
        </select>
      </div>
    </div>

    <div class="course-search-content">
      <div class="map-section">
        <KakaoMap
          :pathPoints="selectedCourse && courseDetail && courseDetail.coords ? courseDetail.coords : []"
          :courseId="selectedCourse ? selectedCourse.id : 'all'"
          :attractions="attractionsWithEndPoint"
        />
      </div>
      <!-- 리스트/상세 영역 -->
      <div class="list-section">
      
      <!-- 로딩 상태 표시 -->
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>코스 데이터를 불러오는 중...</p>
      </div>
      
      <!-- 에러 상태 표시 -->
      <div v-else-if="error" style="text-align: center; padding: 20px; color: red;">
        <p>{{ error }}</p>
        <button @click="loadCourses" style="margin-top: 10px; padding: 8px 16px; background: #303E69; color: white; border: none; border-radius: 4px; cursor: pointer;">
          다시 시도
        </button>
      </div>
      
      <!-- 정상 상태 -->
      <div v-else>
        <div style="margin-bottom: 16px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <button @click="selected = 'main'" :class="{ active: selected === 'main' }">메인</button>
          <button @click="selected = 'custom'" :class="{ active: selected === 'custom' }">맞춤</button>
          <button @click="selected = 'region'" :class="{ active: selected === 'region' }">지역</button>
          <button @click="selected = 'all'" :class="{ active: selected === 'all' }">전체</button>
          <template v-if="selected === 'custom'">
            <span style="margin-left:12px; color:#666;">질병</span>
            <select v-model="diseaseId" @change="onDiseaseChange" style="padding:6px 8px; border:1px solid #dee2e6; border-radius:4px;">
              <option :value="1">고혈압</option>
              <option :value="2">당뇨</option>
              <option :value="3">허리디스크</option>
              <option :value="4">관절염</option>
              <option :value="5">고지혈증</option>
            </select>
          </template>
        </div>
        
        <!-- 모든 코스 전달 -->
        <CourseMainTab v-if="selected === 'main'" :courses-prop="courses" />
        <CourseCustomTab v-if="selected === 'custom'" :courses-prop="courses" :sort-by="sortBy" />
        <CourseRegionTab v-if="selected === 'region'" :courses-prop="courses" />
        <CourseAllTab v-if="selected === 'all'" :courses-prop="courses" />

        <!-- 맞춤 탭 전용 페이지네이션 -->
        <Pagination
          v-if="selected === 'custom' && totalPagesCustom > 1"
          :current-page="currentPage"
          :total-pages="totalPagesCustom"
          @page-changed="onPageChangeCustom"
        />
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import courseApi from '../api/courseApi.js'
import KakaoMap from '../components/KakaoMap.vue'
import CourseMainTab from '../components/CourseMainTab.vue'
import CourseCustomTab from '../components/CourseCustomTab.vue'
import CourseRegionTab from '../components/CourseRegionTab.vue'
import CourseAllTab from '../components/CourseAllTab.vue'
import Pagination from '../components/pagination.vue'

const selected = ref('main')
const courses = ref([])
const selectedCourse = ref(null)
const courseDetail = ref(null)
const attractions = ref([])
const loading = ref(false)
const error = ref(null)
const sortBy = ref('createdAt')
const diseaseId = ref(1)
const currentPage = ref(1)
const pageSize = ref(10)
const totalPagesCustom = ref(1)
// 요청 레이스 방지용 ID
const mainRequestId = ref(0)
const customRequestId = ref(0)

// 데이터 정규화 함수
function normalizeCourseData(rawData) {
  if (!rawData || !Array.isArray(rawData)) return []
  
  return rawData.map(item => ({
    id: item.courseId || item.courseIdx || item.id,
    name: item.courseName || item.gilName || item.name,
    summary: item.gilName || item.summary || '',
    distance: item.distance || 0,
    difficulty: item.level || item.difficulty || '보통',
    reqTime: item.reqTime || '정보없음',
    rating: item.rating || 0,
    visited: item.visited || false,
    latitude: item.latitude || 0,
    longitude: item.longitude || 0,
    sidoCode: item.sidoCode || 1,
    sigunguCode: item.sigunguCode || 1,
    contentTypeId: item.contentTypeId || 21
  }))
}

async function loadCourses() {
  loading.value = true
  error.value = null
  
  try {
    const rid = ++mainRequestId.value
    const response = await courseApi.getAllCourses(0, 500)
    
    let list
    if (response && response.status === 'success' && response.data && response.data.items) {
      list = normalizeCourseData(response.data.items)
    } else if (response && response.data && Array.isArray(response.data)) {
      list = normalizeCourseData(response.data)
    } else {
      throw new Error('올바르지 않은 데이터 형식입니다.')
    }
    // 간단 정렬(백 정렬 파라미터 준비 전까지 프런트에서 보조)
    if (sortBy.value === 'rating,desc') list.sort((a,b)=> (b.rating||0)-(a.rating||0))
    else if (sortBy.value === 'rating,asc') list.sort((a,b)=> (a.rating||0)-(b.rating||0))
    if (selected.value !== 'main' || rid !== mainRequestId.value) return
    courses.value = list
    console.log('로드된 코스 수:', courses.value.length)
  } catch (err) {
    console.error('코스 데이터 불러오기 실패:', err)
    error.value = '코스 데이터를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.'
    
  } finally {
    if (selected.value === 'main') loading.value = false
  }
}

// attractionsWithEndPoint 계산 (도착점 추가)
const attractionsWithEndPoint = computed(() => {
  if (!courseDetail.value || !courseDetail.value.coords || courseDetail.value.coords.length === 0) return attractions.value;
  const endCoord = courseDetail.value.coords[courseDetail.value.coords.length - 1];
  return [
    ...attractions.value,
    {
      attractionId: 'END',
      title: '도착점',
      latitude: endCoord.latitude,
      longitude: endCoord.longitude,
      isEndPoint: true
    }
  ];
});

onMounted(() => {
  console.log('🚀 onMounted 실행, selected:', selected.value)
  // watch에서 이미 처리되지만, 확실하게 하기 위해 맞춤 탭도 여기서 호출
  if (selected.value === 'custom') {
    console.log('🔄 onMounted에서 맞춤 코스 로드 호출')
    loadDiseaseCourses(1)
  } else {
    console.log('🔄 onMounted에서 일반 코스 로드 호출')
    loadCourses()
  }
})

// 질병별 코스 로드(맞춤 탭 선택 시 호출)
async function loadDiseaseCourses(pageArg = 1) {
  console.log('🔄 loadDiseaseCourses 호출됨, selected:', selected.value, 'pageArg:', pageArg)
  if (selected.value !== 'custom') {
    console.log('❌ 맞춤 탭이 아니므로 종료')
    return
  }
  const rid = ++customRequestId.value
  currentPage.value = pageArg
  loading.value = true
  error.value = null
  try {
    console.log('📡 질병별 코스 API 호출 시작:', {
      diseaseId: diseaseId.value,
      page: currentPage.value - 1,
      size: pageSize.value,
      sortBy: sortBy.value
    })
    const res = await courseApi.getDiseaseCourses(diseaseId.value, currentPage.value - 1, pageSize.value, sortBy.value)
    console.log('📡 API 응답:', res)
    const body = res?.data || res
    const list = Array.isArray(body) ? body : (body?.items || [])
    if (selected.value !== 'custom' || rid !== customRequestId.value) return
    courses.value = normalizeCourseData(list)
    console.log('✅ 맞춤 코스 로드 완료, 개수:', courses.value.length)
    // 총 페이지 계산: 우선순위 totalPages -> totalElements/size -> length
    if (body && typeof body.totalPages === 'number') {
      totalPagesCustom.value = body.totalPages
    } else if (body && typeof body.totalElements === 'number') {
      const size = body.size || pageSize.value
      totalPagesCustom.value = Math.max(1, Math.ceil(body.totalElements / size))
    } else {
      totalPagesCustom.value = Math.max(1, Math.ceil(courses.value.length / pageSize.value))
    }
  } catch (e) {
    console.error('❌ 맞춤(질병) 코스 로드 실패:', e)
    error.value = '맞춤 코스를 불러오는데 실패했습니다.'
  } finally {
    if (selected.value === 'custom') loading.value = false
  }
}

// 정렬 변경 시 현재 탭에 맞게 재조회
function handleSortChange() {
  if (selected.value === 'custom') {
    loadDiseaseCourses(1)
  } else {
    loadCourses()
  }
}

function onDiseaseChange() {
  loadDiseaseCourses(1)
}

function onPageChangeCustom(nextPage) {
  loadDiseaseCourses(nextPage)
}

// 탭 전환 시 맞춤 탭이면 질병 코스 로드
watch(selected, (val) => {
  console.log('👀 selected 변경 감지:', val)
  if (val === 'custom') {
    console.log('✅ 맞춤 탭 선택됨, loadDiseaseCourses 호출')
    loadDiseaseCourses(1)
  } else {
    console.log('✅ 일반 탭 선택됨, loadCourses 호출')
    loadCourses()
  }
}, { immediate: false })
</script>

<style scoped>
button {
  margin-right: 8px;
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  background: #e9ecef;
}

button.active {
  background: #303E69;
  color: white;
  border-color: #303E69;
}

button:disabled {
  background: #6c757d;
  color: white;
  cursor: not-allowed;
}

/* 로딩 스피너 스타일 */
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

/* 컨테이너 스타일 - 다른 페이지와 일치 */
.course-search-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 26px;
}

/* 페이지 헤더 스타일 */
.course-search-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.header-title {
  flex: 1;
}

.course-search-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin: 0 0 10px 0;
}

.header-subtitle {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.course-search-content {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.map-section {
  flex: 1;
  min-width: 350px;
  max-width: 500px;
}

.list-section {
  flex: 2;
  min-width: 350px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .course-search-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .course-search-header h1 {
    font-size: 2rem;
  }
  
  .header-subtitle {
    font-size: 1rem;
  }
  
  .header-controls {
    justify-content: center;
  }
  
  .course-search-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .map-section,
  .list-section {
    min-width: auto;
    max-width: none;
  }
}
</style> 