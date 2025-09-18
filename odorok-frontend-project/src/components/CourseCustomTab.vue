<template>
  <div class="section">
    <h2 class="title">맞춤 코스</h2>
    <!-- 상단 리스트 -->
    <div class="listwrap card">
      <div v-if="loading" class="state">코스 데이터를 불러오는 중...</div>
      <ul v-else-if="displayedCourses.length > 0" class="list">
        <li v-for="course in displayedCourses" :key="course.id" class="item" @click="selectCourse(course)"
            :class="{ selected: selectedCourse && selectedCourse.id === course.id }">
          <div class="row">
            <div class="name">{{ course.name }}</div>
            <div class="meta">{{ course.distance }}km</div>
          </div>
          <div class="chips">
            <span class="chip">난이도 {{ course.difficulty }}</span>
            <span class="chip rating">⭐ {{ course.rating }}</span>
          </div>
        </li>
      </ul>
      <div v-else class="state">맞춤 코스 데이터가 없습니다.</div>
      
      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="pager">
        <button class="btn" @click="prevPage" :disabled="currentPage === 1">이전</button>
        <span class="cnt">{{ currentPage }} / {{ totalPages }}</span>
        <button class="btn" @click="nextPage" :disabled="currentPage === totalPages">다음</button>
      </div>
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
              <div class="k">별점</div>
              <div class="v">{{ selectedCourse.rating }}/5</div>
            </div>
          </div>

          <!-- 주변 명소 버튼 -->
          <div class="attractions-section">
            <button @click="goNearby" :disabled="loadingAttractions" 
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
                <div v-if="attraction.tel" style="font-size: 12px; color: #007bff;">☎ {{ attraction.tel }}</div>
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
        <div v-else class="empty card state">위의 코스에서 코스를 선택해 주세요.</div>
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
  name: 'CourseCustomTab',
  components: { 
    KakaoMap, 
    CourseReviewComponent, 
    ScheduleRegistrationModal 
  },
  props: {
    coursesProp: {
      type: Array,
      required: true
    },
    sortBy: {
      type: String,
      default: 'createdAt'
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
      startingCourse: false,
      endingCourse: false,
      distanceLoading: false,
      distanceInfo: null,
      actionMessage: '',
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      allCourses: []
    }
  },
  computed: {
    // 페이지네이션된 목록
    displayedCourses() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.allCourses.slice(start, end)
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
    },
    coursesProp: {
      handler(newCourses) {
        this.allCourses = [...newCourses]
        this.totalPages = Math.ceil(this.allCourses.length / this.pageSize)
        this.currentPage = 1
      },
      immediate: true
    },
    sortBy: {
      handler() {
        this.sortCourses()
      },
      immediate: true
    }
  },
  methods: {
    selectCourse(course) {
      this.selectedCourse = course;
    },
    sortCourses() {
      if (this.sortBy === 'rating,desc') {
        this.allCourses.sort((a,b)=> (b.rating||0)-(a.rating||0))
      } else if (this.sortBy === 'rating,asc') {
        this.allCourses.sort((a,b)=> (a.rating||0)-(b.rating||0))
      } else {
        // 기본 거리순
        this.allCourses.sort((a,b)=> (a.distance||0)-(b.distance||0))
      }
      this.totalPages = Math.ceil(this.allCourses.length / this.pageSize)
      this.currentPage = 1
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },
    handleStartCourse() {
      if (!this.selectedCourse) return;
      this.startingCourse = true;
      this.actionMessage = '코스 시작 중...';
      
      courseApi.startCourse(this.selectedCourse.id)
        .then(() => {
          this.actionMessage = '코스가 시작되었습니다!';
          setTimeout(() => this.actionMessage = '', 3000);
        })
        .catch(error => {
          console.error('코스 시작 실패:', error);
          this.actionMessage = '코스 시작에 실패했습니다.';
          setTimeout(() => this.actionMessage = '', 3000);
        })
        .finally(() => {
          this.startingCourse = false;
        });
    },
    handleEndCourse() {
      if (!this.selectedCourse) return;
      this.endingCourse = true;
      this.actionMessage = '코스 종료 중...';
      
      courseApi.endCourse(this.selectedCourse.id)
        .then(() => {
          this.actionMessage = '코스가 종료되었습니다!';
          setTimeout(() => this.actionMessage = '', 3000);
        })
        .catch(error => {
          console.error('코스 종료 실패:', error);
          this.actionMessage = '코스 종료에 실패했습니다.';
          setTimeout(() => this.actionMessage = '', 3000);
        })
        .finally(() => {
          this.endingCourse = false;
        });
    },
    async fetchCourseDistance() {
      if (!this.selectedCourse) return;
      this.distanceLoading = true;
      this.actionMessage = '거리 계산 중...';
      
      try {
        const response = await courseApi.getCourseDistance(this.selectedCourse.id);
        this.distanceInfo = response;
        this.actionMessage = `실제 거리: ${response.distance}km`;
        setTimeout(() => this.actionMessage = '', 5000);
      } catch (error) {
        console.error('거리 조회 실패:', error);
        this.actionMessage = '거리 조회에 실패했습니다.';
        setTimeout(() => this.actionMessage = '', 3000);
      } finally {
        this.distanceLoading = false;
      }
    },
    handleScheduleRegistered() {
      this.showScheduleModal = false;
      this.actionMessage = '방문 예정이 등록되었습니다!';
      setTimeout(() => this.actionMessage = '', 3000);
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
  }
}
}
</script>

<style scoped>
.section { max-width: 1100px; margin: 0 auto; padding: 8px 12px; }
.title { margin: 0 0 8px 0; }
.card { background:#fff; border:1px solid #e9ecef; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.04); }
.listwrap { padding: 12px; }
.state { padding:12px; color:#666; text-align:center; }
.list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px; }
.item { padding:12px; border:1px solid #e9ecef; border-radius:8px; cursor:pointer; transition: box-shadow .12s, transform .12s; }
.item:hover { box-shadow:0 4px 12px rgba(0,0,0,.06); transform: translateY(-1px); }
.item.selected { background:#f6f9ff; border-color:#98c1ff; }
.row { display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
.name { font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.meta { color:#888; font-size:12px; }
.chips { display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }

/* 메인 탭과 동일한 디테일 스타일 */
.detail-section {
  margin-top: 32px;
}

.detail-host {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-header {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.detail-header .title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 16px;
  color: white;
}

.detail-header .meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.detail-header .chip {
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.detail-header .actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-header .btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.detail-header .btn.outline {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 2px solid rgba(255,255,255,0.3);
}

.detail-header .btn.outline:hover {
  background: rgba(255,255,255,0.3);
}

.detail-header .btn.success {
  background: #28a745;
  color: white;
}

.detail-header .btn.success:hover {
  background: #218838;
}

.detail-header .btn:not(.outline):not(.success) {
  background: rgba(255,255,255,0.9);
  color: #333;
}

.detail-header .btn:not(.outline):not(.success):hover {
  background: white;
}

.detail-header .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-message {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255,255,255,0.2);
  border-radius: 8px;
  font-weight: 500;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 24px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.fact {
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.fact .k {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.fact .v {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.attractions-section {
  margin: 24px 0;
  text-align: center;
}

.tabbar {
  display: flex;
  gap: 4px;
  margin: 24px 0;
  background: #f8f9fa;
  padding: 4px;
  border-radius: 8px;
}

.tab {
  flex: 1;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  color: #666;
}

.tab.active {
  background: white;
  color: #007bff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 24px 0;
}

.detail-grid .left,
.detail-grid .right {
  padding: 20px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.desc {
  line-height: 1.6;
  color: #666;
  font-size: 0.95rem;
}

.map-panel {
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.review {
  margin-top: 24px;
  padding: 20px;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-header .actions {
    flex-direction: column;
  }
  
  .detail-header .btn {
    width: 100%;
  }
}
.chip { display:inline-flex; align-items:center; padding:4px 10px; border:1px solid #e9ecef; border-radius:999px; background:#f8f9fa; font-size:12px; color:#555; }
.chip.rating { background:#fff; }

.detail { padding:16px; margin-top:12px; }
.detail-head { display:flex; flex-direction:column; gap:10px; margin-bottom:8px; }

/* 페이지네이션 스타일 */
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.pager .btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.pager .btn:hover:not(:disabled) {
  background: #0056b3;
}

.pager .btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.pager .cnt {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}
.actions { display:flex; gap:8px; flex-wrap:wrap; }
.btn { padding:8px 12px; border:1px solid #dee2e6; background:#fff; border-radius:6px; cursor:pointer; }
.btn.outline { background:#fff; }
.btn.success { background:#f6fff9; border-color:#d1f1de; }
.grid { display:grid; grid-template-columns: 1.1fr 1fr; gap:16px; align-items:start; }
.map-panel { height:360px; border:1px solid #e9ecef; border-radius:8px; overflow:hidden; }
.desc { line-height:1.6; color:#333; white-space:pre-wrap; }
.review { margin-top:12px; }

@media (max-width: 960px) {
  .grid { grid-template-columns: 1fr; }
}
</style>