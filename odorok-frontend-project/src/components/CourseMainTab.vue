<template>
  <div class="main-tab-page">
    <h2>추천코스 리스트</h2>
    
    <!-- 메인 TOP 섹션: 별점/리뷰 상위 5개 (카드형, 클릭 시 디테일 포커스) -->
    <section class="card top3wrap" style="margin: 12px 0;">
      <div class="top3grid">
        <div class="topcol">
          <div class="tophead">별점 TOP 5</div>
          <ul class="toplist">
            <li v-for="(c,idx) in topStars" :key="`s-`+ (c.courseId||c.id||idx)" class="toprow" @click="selectTopCourse(c)">
              <span class="rank">{{ idx+1 }}</span>
              <span class="name" :title="c.courseName || c.gilName">{{ c.courseName || c.gilName }}</span>
              <span class="metric">⭐ {{ c.avgStars }}</span>
            </li>
          </ul>
        </div>
        <div class="topcol">
          <div class="tophead">리뷰 TOP 5</div>
          <ul class="toplist">
            <li v-for="(c,idx) in topReviewCount" :key="`r-`+ (c.courseId||c.id||idx)" class="toprow" @click="selectTopCourse(c)">
              <span class="rank">{{ idx+1 }}</span>
              <span class="name" :title="c.courseName || c.gilName">{{ c.courseName || c.gilName }}</span>
              <span class="metric">📝 {{ c.reviewCount }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
    
    <!-- 로딩 상태 -->
    <div v-if="loading" style="text-align: center; padding: 20px;">
      <p>코스 상세 정보를 불러오는 중...</p>
    </div>
    
    <!-- 디테일 섹션 -->
    <div class="detail-section">
      <section class="detail-host">
        <div v-if="selectedCourse" class="detail-section">
          <div class="detail-header card">
            <div class="title">{{ selectedCourse.name }}</div>
            <div class="meta">
              <span class="chip level">거리 {{ selectedCourse.distance }}km</span>
              <span class="chip level">난이도 {{ selectedCourse.difficulty }}</span>
              <span class="chip level">예상 {{ selectedCourse.reqTime }}</span>
              <span class="chip rating">⭐ {{ selectedCourse.rating }}</span>
            </div>
            <div class="actions">
              <button class="btn outline" @click="goNearby">주변 명소 보기</button>
              <button class="btn success" @click="showScheduleModal = true">방문 예정 등록</button>
              <button class="btn" @click="handleStartCourse" :disabled="startingCourse || !selectedCourse">코스 시작</button>
              <button class="btn" @click="handleEndCourse" :disabled="endingCourse || !selectedCourse">코스 종료</button>
              <button class="btn" @click="fetchCourseDistance" :disabled="distanceLoading || !selectedCourse">거리 확인</button>
            </div>
            <p v-if="actionMessage" class="action-message">{{ actionMessage }}</p>
          </div>

          <!-- 핵심 정보 요약 -->
          <div class="facts" v-if="detailTab==='info'">
            <div class="fact">
              <div class="k">코스거리</div>
              <div class="v">{{ selectedCourse.distance }}km</div>
            </div>
            <div class="fact">
              <div class="k">난이도</div>
              <div class="v">{{ selectedCourse.difficulty }}</div>
            </div>
            <div class="fact">
              <div class="k">예상소요</div>
              <div class="v">{{ selectedCourse.reqTime }}</div>
            </div>
            <div class="fact">
              <div class="k">평균별점</div>
              <div class="v">{{ selectedCourse.rating }}</div>
            </div>
          </div>

          <!-- 주변 명소 버튼 -->
          <div v-if="$parent.selected === 'all'" style="display: flex; gap: 16px; margin: 24px 0 0 0; width: 100%; justify-content: flex-start;">
            <button @click="fetchAttractions"
                    :disabled="loadingAttractions"
                    style="padding:8px 18px; background:#447cff; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size:1.1rem;">
              {{ loadingAttractions ? '명소를 불러오는 중...' : '주변 명소 보기 (2km 이내)' }}
            </button>
          </div>

          <!-- 명소 목록 -->
          <div v-if="attractions.length > 0" style="width: 100%;">
            <h3>주변 명소 ({{ attractions.length }}개)</h3>
            <ul style="list-style: none; padding: 0; max-height: 200px; overflow-y: auto;">
              <li v-for="attraction in attractions" :key="attraction.attractionId"
                  style="padding: 8px; margin-bottom: 4px; border: 1px solid #eee; border-radius: 4px;">
                <strong>{{ attraction.title }}</strong>
                <div style="font-size: 12px; color: #666;">{{ attraction.addr1 }}</div>
                <div v-if="attraction.tel" style="font-size: 12px; color: #303E69;">☎ {{ attraction.tel }}</div>
              </li>
            </ul>
          </div>

          <!-- 디테일 탭 -->
          <div class="tabbar">
            <button class="tab" :class="{active: detailTab==='info'}" @click="detailTab='info'">기본 정보</button>
            <button class="tab" :class="{active: detailTab==='review'}" @click="detailTab='review'">리뷰</button>
          </div>

          <div v-show="detailTab==='info'" class="detail-grid">
            <div class="left card">
              <h3 class="section-title">코스 설명</h3>
              <div v-if="courseDetail && courseDetail.contents" class="desc">{{ courseDetail.contents }}</div>
            </div>
            <div class="right card">
              <h3 class="section-title">경로 미리보기</h3>
              <div v-if="courseDetail && courseDetail.coords && courseDetail.coords.length > 0" class="map-panel">
                <KakaoMap :pathPoints="courseDetail.coords" :courseId="selectedCourse.id" :attractions="attractionsWithEndPoint" :showAttractionMarkers="true" />
              </div>
            </div>
          </div>

          <!-- 리뷰 컴포넌트 -->
          <div v-show="detailTab==='review'" class="review card">
            <CourseReviewComponent v-if="selectedCourse" :courseId="selectedCourse.id" />
          </div>

          <ScheduleRegistrationModal
            :visible="showScheduleModal"
            :course="selectedCourse"
            @close="showScheduleModal = false"
            @schedule-registered="handleScheduleRegistered"
          />
        </div>
        <div v-else class="empty card state">위의 TOP 코스에서 코스를 선택해 주세요.</div>
      </section>
    </div>
  </div>
</template>

<script>
import KakaoMap from './KakaoMap.vue'
import courseApi from '../api/courseApi.js'
import CourseReviewComponent from './CourseReviewComponent.vue'
import ScheduleRegistrationModal from './ScheduleRegistrationModal.vue'

export default {
  name: 'CourseMainTab',
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
      loadingAttractions: false,
      showScheduleModal: false,
      detailTab: 'info',
      topStars: [],
      topReviewCount: [],
      startingCourse: false,
      endingCourse: false,
      distanceLoading: false,
      distanceInfo: null,
      actionMessage: ''
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
  methods: {
    async fetchTop() {
      try {
        const res = await courseApi.getTopCourses()
        const body = res?.data || res
        this.topStars = body?.topStars || []
        this.topReviewCount = body?.topReviewCount || []
      } catch (error) {
        console.error('메인 TOP 섹션 로드 실패:', error)
        this.topStars = []
        this.topReviewCount = []
      }
    },
    selectTopCourse(raw) {
      const id = raw.courseId || raw.courseIdx || raw.id
      const name = raw.courseName || raw.gilName || raw.name
      if (!id) return
      this.selectedCourse = {
        id: id,
        name: name,
        distance: raw.distance || 0,
        difficulty: raw.level || '보통',
        reqTime: raw.reqTime || '정보없음',
        rating: raw.avgStars || 0
      }
      this.detailTab = 'info'
      this.fetchCourseDetail(this.selectedCourse.id)
      requestAnimationFrame(() => {
        const host = document.querySelector('.detail-host')
        if (host) host.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    async fetchCourseDetail(courseId) {
      if (!courseId) return
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
    async fetchAttractions() {
      if (!this.selectedCourse) return
      this.loadingAttractions = true
      try {
        const courseId = this.selectedCourse.id || this.selectedCourse.courseId
        const contentTypeId = this.selectedCourse.contentTypeId || 12
        
        const response = await courseApi.getNearbyAttractions(
          courseId,
          contentTypeId
        )
        if (response && response.status === 'success' && response.data && response.data.items) {
          this.attractions = response.data.items
        } else if (response && response.data && Array.isArray(response.data)) {
          this.attractions = response.data
        } else {
          this.attractions = []
        }
      } catch (error) {
        console.error('주변 명소 조회 실패:', error)
        this.attractions = []
      } finally {
        this.loadingAttractions = false
      }
    },
    async handleStartCourse() {
      if (!this.selectedCourse || this.startingCourse) return
      const courseId = this.selectedCourse.id || this.selectedCourse.courseId
      if (!courseId) {
        this.actionMessage = '코스 정보가 없어 시작할 수 없습니다.'
        return
      }
      this.startingCourse = true
      this.actionMessage = ''
      try {
        await courseApi.startCourse(courseId)
        this.actionMessage = '코스 시작 요청을 완료했습니다.'
      } catch (error) {
        console.error('코스 시작 실패:', error)
        this.actionMessage = '코스 시작에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      } finally {
        this.startingCourse = false
      }
    },
    async handleEndCourse() {
      if (!this.selectedCourse || this.endingCourse) return
      const courseId = this.selectedCourse.id || this.selectedCourse.courseId
      if (!courseId) {
        this.actionMessage = '코스 정보가 없어 종료할 수 없습니다.'
        return
      }
      this.endingCourse = true
      this.actionMessage = ''
      try {
        await courseApi.endCourse(courseId)
        this.actionMessage = '코스 종료 요청을 완료했습니다.'
      } catch (error) {
        console.error('코스 종료 실패:', error)
        this.actionMessage = '코스 종료에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      } finally {
        this.endingCourse = false
      }
    },
    async fetchCourseDistance() {
      if (!this.selectedCourse || this.distanceLoading) return
      const courseId = this.selectedCourse.id || this.selectedCourse.courseId
      if (!courseId) {
        this.actionMessage = '코스 정보가 없어 거리를 확인할 수 없습니다.'
        return
      }
      this.distanceLoading = true
      this.actionMessage = ''
      try {
        const response = await courseApi.getCourseDistance(courseId)
        const body = response?.data || response
        const distanceValue = body?.distance ?? body?.data?.distance ?? body
        if (typeof distanceValue === 'number') {
          this.actionMessage = `현재 이동 거리: ${distanceValue.toLocaleString()}m`
        } else if (distanceValue?.message) {
          this.actionMessage = distanceValue.message
        } else {
          this.actionMessage = '거리를 확인했습니다.'
        }
        this.distanceInfo = distanceValue
      } catch (error) {
        console.error('코스 거리 확인 실패:', error)
        this.actionMessage = '거리를 확인하는 중 문제가 발생했습니다.'
      } finally {
        this.distanceLoading = false
      }
    },
    handleScheduleRegistered() {
      console.log('방문 예정이 등록되었습니다.')
    }
  },
  mounted() {
    this.fetchTop()
  }
}
</script>

<style scoped>
/* 페이지 래퍼 */
.main-tab-page { max-width: 1200px; margin: 0 auto; }

/* 카드 공통 */
.card { background: #fff; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.08); padding: 16px; }

/* 리스트 */
.course-item { transition: transform .12s ease, box-shadow .12s ease; cursor: pointer; padding: 12px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 6px; }
.course-item:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,.08); }
.course-item.selected { background-color: #e3f2fd; border-color: #303E69 !important; }
.course-item.row { display:flex; align-items:center; justify-content: space-between; gap: 12px; }
.course-item .col.name { font-weight: 700; }
.course-item .col.name .muted { color: #888; font-weight: 400; }
.course-item .col.tags { display:flex; gap: 8px; }
.chip { display:inline-flex; align-items:center; gap:6px; border:1px solid #e1e8ed; background:#f8f9fa; padding:4px 10px; border-radius:999px; font-size:12px; color:#555; }
.chip.rating { background:#fff7e6; border-color:#ffe8b3; color:#ad6800; }
.chip.level { background:#eef7ff; border-color:#cfe7ff; color:#1d4ed8; }

/* 페이저 */
.pager button { padding: 8px 14px; border-radius: 6px; }

/* 상세 섹션 */
.detail-section { max-width: 1120px; margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
.detail-header { display:flex; flex-direction: column; gap: 10px; }
.detail-header .title { font-size: 22px; font-weight: 800; }
.detail-header .meta { display:flex; gap: 8px; flex-wrap: wrap; }
.actions { display:flex; gap: 8px; flex-wrap: wrap; }
.action-message { margin-top: 6px; color: #1d4ed8; font-size: 0.95rem; font-weight: 600; }
.btn { padding:8px 12px; border:1px solid #dee2e6; background:#fff; border-radius:6px; cursor:pointer; }
.btn.outline { background:#fff; }
.btn.success { background:#f6fff9; border-color:#d1f1de; }
.detail-grid { display:grid; grid-template-columns: 1.1fr 1fr; gap: 16px; }
.map-panel { height: 420px; border:1px solid #e9ecef; border-radius:8px; overflow:hidden; }
.desc { white-space: pre-wrap; line-height: 1.6; color:#333; }
.review { margin-top: 8px; }

/* 2열 레이아웃 고정 높이 + 내부 스크롤 */
.two-col { display: grid; grid-template-columns: 360px 1fr; gap: 16px; align-items: start; }
.list-pane { padding: 12px; max-height: 520px; overflow: hidden; display: flex; flex-direction: column; }
.list-pane .list { flex: 1; overflow: auto; }
.state { text-align: center; color: #666; padding: 12px; }
.pager { display: flex; justify-content: center; align-items: center; gap: 10px; padding-top: 10px; }
.btn { padding: 8px 12px; border: 1px solid #dee2e6; background: #fff; border-radius: 6px; cursor: pointer; }
.cnt { color: #666; font-size: 12px; }
.detail-host { max-height: 520px; overflow: auto; }

@media (max-width: 980px) {
  .two-col { grid-template-columns: 1fr; }
  .detail-host, .list-pane { max-height: none; }
}

/* 코스 핵심 정보 요약 */
.facts { display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.fact { background:#fff; border:1px solid #e9ecef; border-radius:10px; padding:12px; text-align:center; }
.fact .k { font-size:12px; color:#666; }
.fact .v { font-size:18px; font-weight:800; color:#222; }
.section-title { margin:0 0 8px 0; font-size:14px; color:#666; }

/* TOP3 카드 */
.top3grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; align-items: start; }
.topcol { display: flex; flex-direction: column; }
.tophead { font-weight:800; margin-bottom:6px; padding-bottom: 8px; border-bottom: 2px solid #e9ecef; }
.toplist { list-style:none; padding:0; margin:0; flex: 1; }
.toprow { 
  display:grid; 
  grid-template-columns: 30px 1fr auto; 
  align-items:center; 
  min-height: 40px; 
  padding: 8px 0;
  border-bottom:1px solid #eee; 
  cursor:pointer; 
}
.toprow:hover { background:#f8f9fa; }
.toprow .rank { font-weight:800; color:#999; text-align:center; font-size: 14px; }
.toprow .name { 
  overflow:hidden; 
  text-overflow:ellipsis; 
  white-space:nowrap; 
  font-size: 13px;
  line-height: 1.4;
}
.toprow .metric { color:#555; font-weight:700; font-size: 12px; }
.tabbar { display:flex; gap:8px; margin:8px 0; }
.tab { padding: 6px 10px; border:1px solid #e1e8ed; background:#fff; border-radius:999px; cursor:pointer; font-size:12px; }
.tab.active { background:#eef7ff; border-color:#cfe7ff; color:#1d4ed8; }

li:hover {
  background-color: #f8f9fa;
  border-color: #303E69 !important;
}

li.selected {
  background-color: #e3f2fd;
  border-color: #303E69 !important;
}

button:disabled {
  background: #6c757d !important;
  cursor: not-allowed;
}
</style>
