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

    <!-- 지역 리스트 -->
    <div class="listwrap card">
      <div v-if="loading" class="state">코스 데이터를 불러오는 중...</div>
      <ul v-else-if="displayedCourses.length > 0" class="list">
        <li v-for="course in displayedCourses" :key="course.id" class="item" @click="selectCourse(course)"  
            :class="{ selected: selectedCourse && selectedCourse.id === course.id }">
          <div class="row">
            <div class="title">{{ course.name }}</div>
            <div class="meta">{{ course.distance }}km</div>
          </div>
          <div class="chips">
            <span class="chip">난이도 {{ course.difficulty }}</span>
            <span class="chip rating">별점 {{ course.rating }}</span>
          </div>
        </li>
      </ul>
      <div v-else class="state">해당 지역의 코스 데이터가 없습니다.</div>
      
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
        <div v-else class="empty card state">위의 코스에서 코스를 선택해 주세요.</div>
      </section>
    </div>
  </div>
</template>

<script>
import KakaoMap from './KakaoMap.vue'
import courseApi from '../api/courseApi.js'
import { getAuthUser } from '@/services/authService.js'
import CourseReviewComponent from './CourseReviewComponent.vue'
import ScheduleRegistrationModal from './ScheduleRegistrationModal.vue'

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
      loadingAttractions: false,
      selectedSido: '',
      selectedSigungu: '',
      regionCourses: [],
      userRegionLoading: false,
      sidoList: [],
      sigunguList: [],
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
          title: '종점',
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
    regionCourses: {
      handler(newCourses) {
        this.allCourses = [...newCourses]
        this.totalPages = Math.ceil(this.allCourses.length / this.pageSize)
        this.currentPage = 1
      },
      immediate: true
    }
  },
  async mounted() {
    // 컴포넌트 로드 시 시도 목록 조회
    await this.loadSidos();
    await this.loadUserRegionCourses();
  },
  methods: {
    selectCourse(course) {
      this.selectedCourse = course;
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
    
    
    
    // 데이터 정규화 함수
    normalizeCourseData(rawData) {
      if (!rawData || !Array.isArray(rawData)) return [];
      
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
      }));
    },
    
    
    // 시도 목록 로드
    async loadSidos() {
      try {
        const response = await courseApi.getSidos();
        console.log('시도 API 응답:', response);
        if (response && response.status === 'success' && response.data && response.data.items) {
          this.sidoList = response.data.items;
        } else if (response && response.data && Array.isArray(response.data)) {
          this.sidoList = response.data;
        }
        console.log('로드된 시도 목록:', this.sidoList);
        // API 응답이 없으면 기본 시도 목록 설정
      } catch (error) {
        console.error('시도 목록 조회 실패:', error);
        // 에러 발생 시 기본 시도 목록 설정
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
      this.selectedSigungu = '';
      this.sigunguList = [];
      this.regionCourses = [];
      
      // 시도가 선택된 경우만 시군구 목록 조회
      if (this.selectedSido) {
        try {
          const response = await courseApi.getSigungus(this.selectedSido);
          console.log('시군구API 응답:', response);
          if (response && response.status === 'success' && response.data && response.data.items) {
            this.sigunguList = response.data.items;
          } else if (response && response.data && Array.isArray(response.data)) {
            this.sigunguList = response.data;
          } else {
            console.warn('시군구API 응답이 예상과 다릅니다:', response);
            this.sigunguList = [];
          }
          console.log('로드된 시군구 목록:', this.sigunguList);
        } catch (error) {
          console.error('시군구 목록 조회 실패:', error);
          this.sigunguList = [];
        }
      }
    },
    async searchByRegion() {
      console.log('searchByRegion 호출');
      console.log('selectedSido:', this.selectedSido);
      console.log('selectedSigungu:', this.selectedSigungu);
      
      if (!this.selectedSido) {
        console.log('시도가 선택되지 않음');
        this.regionCourses = [];
        return;
      }
      
      this.loading = true;
      try {
        const response = await courseApi.searchByRegion(
          this.selectedSido, 
          this.selectedSigungu || null, 
          null, 
          0, 
          100
        );
        
        console.log('지역별 코스 API 응답:', response);
        
        if (response && response.status === 'success' && response.data && response.data.items) {
          this.regionCourses = this.normalizeCourseData(response.data.items);
          console.log('로드된 지역별 코스:', this.regionCourses);
        } else if (response && response.data && Array.isArray(response.data)) {
          this.regionCourses = this.normalizeCourseData(response.data);
          console.log('로드된 지역별 코스 (배열):', this.regionCourses);
        } else {
          console.warn('지역별 코스 API 응답이 예상과 다릅니다:', response);
          this.regionCourses = [];
        }
      } catch (error) {
        console.error('지역별 코스 검색 실패:', error);
        this.regionCourses = [];
      } finally {
        this.loading = false;
      }
    },
    
    handleScheduleRegistered() {
      console.log('방문 예정이 등록되었습니다.')
      // 필요시 추가 로직을 구현하겠습니다
    },
    async fetchCourseDetail(courseId) {
      this.loading = true;
      try {
        const response = await courseApi.getCourseDetail(courseId);
        console.log('코스 상세 API 응답:', response);
        if (response && response.status === 'success' && response.data) {
          this.courseDetail = response.data;
        } else if (response && response.data) {
          // 직접적인 응답 구조가 다른 경우
          this.courseDetail = response.data;
        } else {
          this.courseDetail = null;
        }
        console.log('로드된 코스 상세:', this.courseDetail);
      } catch (error) {
        console.error('코스 상세 정보 조회 실패:', error);
        this.courseDetail = null;
      } finally {
        this.loading = false;
      }
    },

    goNearby() {
      if (!this.selectedCourse || !this.courseDetail?.coords?.length) {
        alert('코스를 먼저 선택해주세요')
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
  },

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
  background: #303E69;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.pager .btn:hover:not(:disabled) {
  background: #1e2a4a;
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

/* 디테일 섹션 스타일 */
.detail-section {
  margin-top: 20px;
}

.detail-host {
  width: 100%;
}

.detail-header {
  padding: 20px;
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.detail-header .title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
}

.detail-header .meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.detail-header .chip {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.detail-header .chip.level {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.detail-header .chip.rating {
  background: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffcc02;
}

.detail-header .actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.detail-header .btn {
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
  border: 1px solid #dee2e6;
  background: #fff;
  cursor: pointer;
}

.detail-header .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.detail-header .btn.outline {
  background: #fff;
  color: #303E69;
  border-color: #303E69;
}

.detail-header .btn.success {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.action-message {
  color: #28a745;
  font-weight: 500;
  margin: 8px 0 0 0;
  font-size: 0.9rem;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.fact {
  text-align: center;
}

.fact .k {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 4px;
}

.fact .v {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.attractions-section {
  margin-bottom: 20px;
  text-align: center;
}

.tabbar {
  display: flex;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 20px;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab.active {
  color: #303E69;
  border-bottom-color: #303E69;
}

.tab:hover {
  color: #303E69;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}

.desc {
  line-height: 1.6;
  color: #555;
}

.map-panel {
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.review {
  margin-top: 20px;
}

.empty {
  text-align: center;
  padding: 40px 20px;
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
  
  .facts {
    grid-template-columns: repeat(2, 1fr);
  }
}
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