<template>
  <div class="section">
    <div class="head">
      <h2>지역별 코스</h2>
      <div class="filters">
        <label class="label" for="sidoSelect">시도</label>
        <select id="sidoSelect" v-model="selectedSido" @change="onSidoChange" class="select">
          <option value="">전체</option>
          <option v-for="sido in sidoList" :key="sido.sidoCode" :value="sido.sidoCode">{{ sido.name }}</option>
        </select>
        <label class="label" for="sigunguSelect">시군구</label>
        <select id="sigunguSelect" v-model="selectedSigungu" @change="searchByRegion" class="select">
          <option value="">전체</option>
          <option v-for="sigungu in sigunguList" :key="sigungu.sigunguCode" :value="sigungu.sigunguCode">{{ sigungu.name }}</option>
        </select>
        <button class="btn" @click="searchByRegion" :disabled="loading">{{ loading ? '검색 중...' : '검색' }}</button>
      </div>
    </div>

    <!-- 상단 리스트 -->
    <div class="listwrap card">
      <div v-if="loading" class="state">코스 데이터를 불러오는 중...</div>
      <div v-else-if="userRegionLoading" class="state">사용자 지역 추천 코스를 불러오는 중...</div>
      <ul v-else-if="regionCourses.length > 0" class="list">
        <li v-for="course in regionCourses" :key="course.id" class="item" @click="selectCourse(course)"
            :class="{ selected: selectedCourse && selectedCourse.id === course.id }">
          <div class="row">
            <div class="title">{{ course.name }}</div>
            <div class="meta">{{ course.distance }}km</div>
          </div>
          <div class="chips">
            <span class="chip">난이도 {{ course.difficulty }}</span>
            <span class="chip rating">⭐ {{ course.rating }}</span>
          </div>
        </li>
      </ul>
      <div v-else class="state">해당 지역의 코스 데이터가 없습니다.</div>
    </div>

    <!-- 하단 디테일 -->
    <div class="detail card" v-if="selectedCourse">
      <div class="detail-head">
        <div class="name">{{ selectedCourse.name }}</div>
        <div class="chips">
          <span class="chip">거리 {{ selectedCourse.distance }}km</span>
          <span class="chip">난이도 {{ selectedCourse.difficulty }}</span>
          <span class="chip">예상 {{ selectedCourse.reqTime }}</span>
          <span class="chip rating">⭐ {{ selectedCourse.rating }}</span>
        </div>
        <div class="actions">
          <button class="btn outline" @click="goNearby" :disabled="!courseDetail || !courseDetail.coords || !courseDetail.coords.length">주변 명소 보기</button>
          <button class="btn success" @click="showScheduleModal = true">방문 예정 등록</button>
        </div>
      </div>
      <div class="grid">
        <div class="left">
          <div v-if="courseDetail && courseDetail.contents" class="desc">{{ courseDetail.contents }}</div>
        </div>
        <div class="right">
          <div v-if="courseDetail && courseDetail.coords && courseDetail.coords.length > 0" class="map-panel">
            <KakaoMap :pathPoints="courseDetail.coords" :courseId="selectedCourse.id" :attractions="attractionsWithEndPoint" />
          </div>
        </div>
      </div>
      <div class="review">
        <CourseReviewComponent v-if="selectedCourse" :courseId="selectedCourse.id" />
      </div>
      <ScheduleRegistrationModal :visible="showScheduleModal" :course="selectedCourse" @close="showScheduleModal = false" @schedule-registered="handleScheduleRegistered" />
    </div>
  </div>
</template>

<script>
import KakaoMap from './KakaoMap.vue'
import courseApi from '../api/courseApi.js'
import CourseReviewComponent from './CourseReviewComponent.vue'
import ScheduleRegistrationModal from './ScheduleRegistrationModal.vue'
import { getAuthUser } from '@/services/authService.js'

export default {
  name: 'CourseRegionTab',
  components: { 
    KakaoMap, 
    CourseReviewComponent, 
    ScheduleRegistrationModal 
  },
  props: {
    coursesProp: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      selectedCourse: null,
      courseDetail: null,
      attractions: [],
      loading: false,
      selectedSido: '',
      selectedSigungu: '',
      regionCourses: [],
      sidoList: [],
      sigunguList: [],
      showScheduleModal: false,
      userRegionLoading: false
    }
  },
  computed: {
    attractionsWithEndPoint() {
      if (!this.courseDetail || !this.courseDetail.coords || this.courseDetail.coords.length === 0) return this.attractions
      const endCoord = this.courseDetail.coords[this.courseDetail.coords.length - 1]
      return [
        ...this.attractions,
        {
          attractionId: 'END',
          title: '도착점',
          latitude: endCoord.latitude,
          longitude: endCoord.longitude,
          isEndPoint: true
        }
      ]
    }
  },
  watch: {
    selectedCourse(newCourse) {
      if (newCourse && newCourse.id) {
        this.fetchCourseDetail(newCourse.id)
      } else {
        this.courseDetail = null
        this.attractions = []
      }
    }
  },
  async mounted() {
    await this.loadSidos()
    await this.loadUserRegionCourses()
  },
  methods: {
    selectCourse(course) {
      this.selectedCourse = course
    },

    normalizeCourseData(rawData) {
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
    },

    async loadSidos() {
      try {
        const response = await courseApi.getSidos()
        if (response && response.status === 'success' && response.data && response.data.items) {
          this.sidoList = response.data.items
        } else if (response && response.data && Array.isArray(response.data)) {
          this.sidoList = response.data
        }
      } catch (error) {
        console.error('시도 목록 조회 실패:', error)
        this.sidoList = []
      }
    },

    async loadUserRegionCourses() {
      this.userRegionLoading = true
      try {
        const authUser = getAuthUser()
        const email = authUser?.email || authUser?.sub
        if (!email) {
          this.userRegionLoading = false
          return
        }
        const response = await courseApi.getUserRegionCourses(email)
        const body = response?.data || response
        if (body?.status === 'success' && body?.data?.courses) {
          this.regionCourses = this.normalizeCourseData(body.data.courses)
        } else if (Array.isArray(body?.courses)) {
          this.regionCourses = this.normalizeCourseData(body.courses)
        } else if (Array.isArray(body)) {
          this.regionCourses = this.normalizeCourseData(body)
        }
      } catch (error) {
        console.error('사용자 지역 코스 조회 실패:', error)
      } finally {
        this.userRegionLoading = false
      }
    },

    async onSidoChange() {
      this.selectedSigungu = ''
      this.sigunguList = []
      this.regionCourses = []

      if (this.selectedSido) {
        try {
          const response = await courseApi.getSigungus(this.selectedSido)
          if (response && response.status === 'success' && response.data && response.data.items) {
            this.sigunguList = response.data.items
          } else if (response && response.data && Array.isArray(response.data)) {
            this.sigunguList = response.data
          } else {
            this.sigunguList = []
          }
        } catch (error) {
          console.error('시군구 목록 조회 실패:', error)
          this.sigunguList = []
        }
      }
    },

    async searchByRegion() {
      if (!this.selectedSido) {
        this.regionCourses = []
        return
      }

      this.loading = true
      try {
        const response = await courseApi.searchByRegion(
          this.selectedSido,
          this.selectedSigungu || null,
          null,
          0,
          100
        )

        if (response && response.status === 'success' && response.data && response.data.items) {
          this.regionCourses = this.normalizeCourseData(response.data.items)
        } else if (response && response.data && Array.isArray(response.data)) {
          this.regionCourses = this.normalizeCourseData(response.data)
        } else {
          this.regionCourses = []
        }
      } catch (error) {
        console.error('지역별 코스 검색 실패:', error)
        this.regionCourses = []
      } finally {
        this.loading = false
      }
    },

    handleScheduleRegistered() {
      console.log('방문 예정이 등록되었습니다.')
    },

    async fetchCourseDetail(courseId) {
      this.loading = true
      try {
        const response = await courseApi.getCourseDetail(courseId)
        if (response && response.status === 'success' && response.data) {
          this.courseDetail = response.data
        } else if (response && response.data) {
          this.courseDetail = response.data
        } else {
          this.courseDetail = null
        }
      } catch (error) {
        console.error('코스 상세 정보 조회 실패:', error)
        this.courseDetail = null
      } finally {
        this.loading = false
      }
    },

    goNearby() {
      if (!this.selectedCourse || !this.courseDetail?.coords?.length) {
        alert('코스를 먼저 선택하세요.')
        return
      }
      this.$router.push({
        name: 'NearbyAttractions',
        query: {
          courseId: this.selectedCourse.id,
          courseName: this.selectedCourse.name,
          sidoCode: this.selectedCourse.sidoCode || 1,
          sigunguCode: this.selectedCourse.sigunguCode || 1,
          coords: JSON.stringify(this.courseDetail.coords)
        }
      })
    }
  }
}
</script>

<style scoped>
.section { max-width: 1100px; margin: 0 auto; padding: 8px 12px; }
.head { display:flex; align-items:center; justify-content: space-between; margin-bottom: 10px; }
.filters { display:flex; gap:8px; align-items:center; }
.label { font-size:12px; color:#666; }
.select { padding:8px; border:1px solid #dee2e6; border-radius:6px; background:#fff; }
.btn { padding:8px 12px; border:1px solid #dee2e6; background:#fff; border-radius:6px; cursor:pointer; }
.btn.outline { background:#fff; }
.btn.success { background:#f6fff9; border-color:#d1f1de; }

.card { background:#fff; border:1px solid #e9ecef; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.04); }
.listwrap { padding:12px; }
.state { padding:12px; color:#666; text-align:center; }
.list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px; }
.item { padding:12px; border:1px solid #e9ecef; border-radius:8px; cursor:pointer; transition: box-shadow .12s, transform .12s; }
.item:hover { box-shadow:0 4px 12px rgba(0,0,0,.06); transform: translateY(-1px); }
.item.selected { background:#f6f9ff; border-color:#98c1ff; }
.row { display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
.title { font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.meta { color:#888; font-size:12px; }
.chips { display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
.chip { display:inline-flex; align-items:center; padding:4px 10px; border:1px solid #e9ecef; border-radius:999px; background:#f8f9fa; font-size:12px; color:#555; }
.chip.rating { background:#fff; }

.detail { padding:16px; margin-top:12px; }
.detail-head { display:flex; flex-direction:column; gap:10px; margin-bottom:8px; }
.detail-head .name { font-size:20px; font-weight:800; }
.actions { display:flex; gap:8px; flex-wrap:wrap; }
.grid { display:grid; grid-template-columns: 1.1fr 1fr; gap:16px; align-items:start; }
.map-panel { height:360px; border:1px solid #e9ecef; border-radius:8px; overflow:hidden; }
.desc { line-height:1.6; color:#333; white-space:pre-wrap; }
.review { margin-top:12px; }

@media (max-width: 960px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
