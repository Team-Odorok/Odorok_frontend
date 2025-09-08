<template>
  <div class="main-tab-page">
    <h2>추천코스 리스트</h2>
    
    <!-- 메인 TOP 섹션: 별점/방문/리뷰 상위 5개 (카드형, 클릭 시 디테일 포커스) -->
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
          <div class="tophead">방문 TOP 5</div>
          <ul class="toplist">
            <li v-for="(c,idx) in topVisited" :key="`v-`+ (c.courseId||c.id||idx)" class="toprow" @click="selectTopCourse(c)">
              <span class="rank">{{ idx+1 }}</span>
              <span class="name" :title="c.courseName || c.gilName">{{ c.courseName || c.gilName }}</span>
              <span class="metric">👣 {{ c.visitationCount }}</span>
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
    
    <!-- 2열 레이아웃: 좌 리스트 / 우 디테일 -->
    <div class="two-col">
      <aside class="list-pane card">
        <ul v-if="pagedCourses.length > 0" class="list" style="list-style: none; padding: 0; margin: 0;">
          <li v-for="course in pagedCourses" :key="course.id" @click="selectCourse(course)" class="course-item row"
              :class="{ 'selected': selectedCourse && selectedCourse.id === course.id }">
            <div class="col name">{{ course.name }} <span class="muted">({{ course.distance }}km)</span></div>
            <div class="col tags">
              <span class="chip level">난이도: {{ course.difficulty }}</span>
              <span class="chip rating">⭐ {{ course.rating }}</span>
            </div>
          </li>
        </ul>
        <div v-else class="state">코스 데이터가 없습니다.</div>
        <div v-if="totalPages > 1" class="pager">
          <button class="btn" @click="prevPage" :disabled="currentPage === 1">이전</button>
          <span class="cnt">{{ currentPage }} / {{ totalPages }}</span>
          <button class="btn" @click="nextPage" :disabled="currentPage === totalPages">다음</button>
        </div>
      </aside>
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
            </div>
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
              {{ loadingAttractions ? '명소 불러오는 중...' : '주변 명소 보기 (2km 이내)' }}
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
                <div v-if="attraction.tel" style="font-size: 12px; color: #007bff;">📞 {{ attraction.tel }}</div>
              </li>
            </ul>
          </div>

          <!-- 지도/설명 2열 -->
          <div class="tabbar">
            <button class="tab" :class="{active: detailTab==='info'}" @click="detailTab='info'">정보</button>
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

          <!-- 코스 리뷰 컴포넌트 -->
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
        <div v-else class="empty card state">왼쪽에서 코스를 선택하세요.</div>
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
      currentPage: 1,
      pageSize: 5,
      loading: false,
      loadingAttractions: false,
      showScheduleModal: false, // 예정 등록 모달 표시 여부
      detailTab: 'info',
      // 메인 TOP 섹션 데이터
      topStars: [],
      topVisited: [],
      topReviewCount: []
    }
  },
  computed: {
    sortedByDistance() {
      let sorted = [...this.coursesProp];
      return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    },
    pagedCourses() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.sortedByDistance.slice(start, start + this.pageSize);
    },
    totalPages() {
      return Math.ceil(this.sortedByDistance.length / this.pageSize)
    },
    attractionsWithEndPoint() {
      if (!this.courseDetail || !this.courseDetail.coords || this.courseDetail.coords.length === 0) return this.attractions;
      const endCoord = this.courseDetail.coords[this.courseDetail.coords.length - 1];
      return [
        ...this.attractions,
        {
          attractionId: 'END',
          title: '도착점',
          latitude: endCoord.latitude,
          longitude: endCoord.longitude,
          isEndPoint: true
        }
      ];
    }
  },
  watch: {
    selectedCourse(newCourse) {
      if (newCourse && newCourse.id) {
        this.fetchCourseDetail(newCourse.id);
      } else {
        this.courseDetail = null;
        this.attractions = [];
      }
    }
  },
  created() {
    this.fetchTop()
  },
  methods: {
    async fetchTop() {
      try {
        // 이메일(optional) 토큰에서 획득
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        let email = ''
        try {
          if (token) {
            const payload = JSON.parse(decodeURIComponent(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')))
            email = payload.email || payload.username || ''
          }
        } catch (_) {}
        const res = await courseApi.getTopCourses(email)
        const body = res?.data || res
        this.topStars = body?.topStars || []
        this.topVisited = body?.topVisited || []
        this.topReviewCount = body?.topReviewCount || []
      } catch (e) {
        console.error('메인 TOP 섹션 로드 실패:', e)
        this.topStars = []
        this.topVisited = []
        this.topReviewCount = []
      }
    },
    selectCourse(course) {
      this.selectedCourse = course;
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    selectTopCourse(raw) {
      const id = raw.courseId || raw.courseIdx || raw.id
      const name = raw.courseName || raw.gilName || raw.name
      if (!id) return
      // 리스트에서 같은 id 찾아 선택
      const found = this.pagedCourses.find(c => (c.courseId||c.id) === id) || { id, name }
      this.selectedCourse = {
        id: found.id || id,
        name: found.name || name,
        distance: found.distance || raw.distance || 0,
        difficulty: found.difficulty || raw.level || '보통',
        reqTime: found.reqTime || raw.reqTime || '정보없음',
        rating: found.rating || raw.avgStars || 0
      }
      this.detailTab = 'info'
      this.fetchCourseDetail(this.selectedCourse.id)
      // 디테일 영역으로 스크롤
      requestAnimationFrame(() => {
        const host = document.querySelector('.detail-host')
        if (host) host.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
    goNearby() {
      if (!this.selectedCourse || !this.courseDetail?.coords?.length) {
        alert('코스를 먼저 선택하세요.')
        return
      }
      this.$router.push({
        path: '/nearby-attractions',
        query: {
          courseId: this.selectedCourse.id,
          courseName: this.selectedCourse.name,
          sidoCode: this.selectedCourse.sidoCode || 1,
          sigunguCode: this.selectedCourse.sigunguCode || 1,
          coords: JSON.stringify(this.courseDetail.coords) // 지도 경로 전달
        }
      })
    },
    async fetchCourseDetail(courseId) {
      this.loading = true;
      try {
        const response = await courseApi.getCourseDetail(courseId);
        if (response && response.status === 'success' && response.data) {
          this.courseDetail = response.data;
        } else if (response && response.data) {
          // 백엔드 응답 구조가 다른 경우
          this.courseDetail = response.data;
        } else {
          this.courseDetail = null;
        }
      } catch (error) {
        console.error('코스 상세 정보 조회 실패:', error);
        this.courseDetail = null;
      } finally {
        this.loading = false;
      }
    },
    async fetchAttractions() {
      if (!this.selectedCourse) return;
      
      this.loadingAttractions = true;
      try {
        const params = {
          sidoCode: this.selectedCourse.sidoCode || 1,
          sigunguCode: this.selectedCourse.sigunguCode || 1,
          contentTypeId: this.selectedCourse.contentTypeId || 21
        };
        
        const response = await courseApi.getNearbyAttractions(
          params.sidoCode, 
          params.sigunguCode, 
          params.contentTypeId
        );
        
        if (response && response.status === 'success' && response.data && response.data.items) {
          this.attractions = response.data.items;
        } else if (response && response.data && Array.isArray(response.data)) {
          this.attractions = response.data;
        } else {
          this.attractions = [];
        }
      } catch (error) {
        console.error('주변 명소 조회 실패:', error);
        this.attractions = [];
      } finally {
        this.loadingAttractions = false;
      }
    },
    
    handleScheduleRegistered() {
      console.log('방문 예정이 등록되었습니다.')
      // 여기에 추가 로직을 넣을 수 있습니다
    }
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
.course-item.selected { background-color: #e3f2fd; border-color: #007bff !important; }
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
.top3grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.tophead { font-weight:800; margin-bottom:6px; }
.toplist { list-style:none; padding:0; margin:0; }
.toprow { display:grid; grid-template-columns: 30px 1fr auto; align-items:center; height: 36px; border-bottom:1px solid #eee; cursor:pointer; }
.toprow:hover { background:#f8f9fa; }
.toprow .rank { font-weight:800; color:#999; text-align:center; }
.toprow .name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.toprow .metric { color:#555; font-weight:700; }
.tabbar { display:flex; gap:8px; margin:8px 0; }
.tab { padding: 6px 10px; border:1px solid #e1e8ed; background:#fff; border-radius:999px; cursor:pointer; font-size:12px; }
.tab.active { background:#eef7ff; border-color:#cfe7ff; color:#1d4ed8; }

li:hover {
  background-color: #f8f9fa;
  border-color: #007bff !important;
}

li.selected {
  background-color: #e3f2fd;
  border-color: #007bff !important;
}

button:disabled {
  background: #6c757d !important;
  cursor: not-allowed;
}
</style> 