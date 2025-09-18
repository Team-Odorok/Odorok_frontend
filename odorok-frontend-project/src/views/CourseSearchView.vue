<template>
  <div style="display: flex; gap: 32px; align-items: flex-start;">
    <div style="flex:1; min-width: 350px; max-width: 500px;">
      <KakaoMap
        :pathPoints="selectedCourse && courseDetail && courseDetail.coords ? courseDetail.coords : []"
        :courseId="selectedCourse ? selectedCourse.id : 'all'"
        :attractions="attractionsWithEndPoint"
      />
    </div>
    <!-- 리스트/상세 영역 -->
    <div style="flex:2; min-width: 350px;">
      <div style="display:flex; align-items:center; gap:8px; justify-content:space-between;">
        <h1>코스검색</h1>
        <div style="display:flex; align-items:center; gap:8px;">
          <label style="font-size:14px; color:#666;">정렬</label>
          <select v-model="sortBy" @change="handleSortChange" style="padding:6px 8px; border:1px solid #dee2e6; border-radius:4px;">
            <option value="createdAt">최신순</option>
            <option value="rating,desc">별점 높은 순</option>
            <option value="rating,asc">별점 낮은 순</option>
          </select>
          <button @click="showAttendance = true" style="padding:6px 10px; border:1px solid #dee2e6; border-radius:4px; background:#fff; cursor:pointer;">출석 모달</button>
        </div>
      </div>
      
      <!-- 로딩 상태 표시 -->
      <div v-if="loading" style="text-align: center; padding: 20px;">
        <p>코스 데이터를 불러오는 중...</p>
      </div>
      
      <!-- 에러 상태 표시 -->
      <div v-else-if="error" style="text-align: center; padding: 20px; color: red;">
        <p>{{ error }}</p>
        <button @click="loadCourses" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
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
    <AttendanceModel :visible="showAttendance" @close="showAttendance=false" />
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
import AttendanceModel from '../components/AttendanceModel.vue'
import Pagination from '../components/pagination.vue'

const selected = ref('main')
const courses = ref([])
const selectedCourse = ref(null)
const courseDetail = ref(null)
const attractions = ref([])
const loading = ref(false)
const error = ref(null)
const sortBy = ref('createdAt')
const showAttendance = ref(false)
const diseaseId = ref(1)
const currentPage = ref(1)
const pageSize = ref(10)
const totalPagesCustom = ref(1)

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
    courses.value = list
    console.log('로드된 코스 수:', courses.value.length)
  } catch (err) {
    console.error('코스 데이터 불러오기 실패:', err)
    error.value = '코스 데이터를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.'
    
  } finally {
    loading.value = false
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
  loadCourses()
})

// 질병별 코스 로드(맞춤 탭 선택 시 호출)
async function loadDiseaseCourses(pageArg = 1) {
  if (selected.value !== 'custom') return
  currentPage.value = pageArg
  loading.value = true
  error.value = null
  try {
    const res = await courseApi.getDiseaseCourses(diseaseId.value, currentPage.value - 1, pageSize.value, sortBy.value)
    const body = res?.data || res
    const list = Array.isArray(body) ? body : (body?.items || [])
    courses.value = normalizeCourseData(list)
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
    console.error('맞춤(질병) 코스 로드 실패:', e)
    error.value = '맞춤 코스를 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
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
  if (val === 'custom') {
    loadDiseaseCourses(1)
  }
})
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
  background: #007bff;
  color: white;
  border-color: #007bff;
}

button:disabled {
  background: #6c757d;
  color: white;
  cursor: not-allowed;
}
</style> 