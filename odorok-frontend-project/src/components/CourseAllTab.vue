<template>
  <div>
    <h2>전체코스 리스트</h2>
    
    <!-- 로딩 상태 -->
    <div v-if="loading" style="text-align: center; padding: 20px;">
      <p>코스 상세 정보를 불러오는 중...</p>
    </div>
    
    <!-- 코스 목록 -->
    <div class="listwrap card">
      <ul v-if="displayedCourses.length > 0" class="list">
        <li v-for="course in displayedCourses" :key="course.id" class="item" @click="selectCourse(course)"
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
      <div v-else class="state">코스 데이터가 없습니다.</div>
      
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
              <button class="btn outline" @click="goToNearbyAttractions">주변 명소 보기</button>
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
            <button @click="goToNearbyAttractions" :disabled="loadingAttractions" 
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import KakaoMap from './KakaoMap.vue'
import courseApi from '../api/courseApi.js'
import CourseReviewComponent from './CourseReviewComponent.vue'
import ScheduleRegistrationModal from './ScheduleRegistrationModal.vue'

export default {
  name: 'CourseAllTab',
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
  setup(props) {
    const router = useRouter()
    
    // 반응형 데이터
    const selectedCourse = ref(null)
    const courseDetail = ref(null)
    const attractions = ref([])
    const loading = ref(false)
    const loadingAttractions = ref(false)
    const showScheduleModal = ref(false)
    const detailTab = ref('info')
    const startingCourse = ref(false)
    const endingCourse = ref(false)
    const distanceLoading = ref(false)
    const distanceInfo = ref(null)
    const actionMessage = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalPages = ref(1)
    const allCourses = ref([])

    // computed
    const displayedCourses = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return allCourses.value.slice(start, end)
    })

    const attractionsWithEndPoint = computed(() => {
      if (!courseDetail.value || !courseDetail.value.coords || courseDetail.value.coords.length === 0) return attractions.value;
      const endCoord = courseDetail.value.coords[courseDetail.value.coords.length - 1];
      return [
        ...attractions.value,
        {
          attractionId: 'END',
          title: '종점',
          latitude: endCoord.latitude,
          longitude: endCoord.longitude,
          isEndPoint: true
        }
      ];
    })

    // watch
    watch(selectedCourse, (newCourse) => {
      if (newCourse && newCourse.id) {
        fetchCourseDetail(newCourse.id);
      } else {
        courseDetail.value = null;
        attractions.value = [];
      }
    })

    watch(() => props.coursesProp, (newCourses) => {
      allCourses.value = [...newCourses]
      totalPages.value = Math.ceil(allCourses.value.length / pageSize.value)
      currentPage.value = 1
    }, { immediate: true })

    // methods
    const selectCourse = (course) => {
      selectedCourse.value = course;
    }

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

    const handleStartCourse = () => {
      if (!selectedCourse.value) return;
      startingCourse.value = true;
      actionMessage.value = '코스 시작 중...';
      
      courseApi.startCourse(selectedCourse.value.id)
        .then(() => {
          actionMessage.value = '코스가 시작되었습니다!';
          setTimeout(() => actionMessage.value = '', 3000);
        })
        .catch(error => {
          console.error('코스 시작 실패:', error);
          actionMessage.value = '코스 시작에 실패했습니다.';
          setTimeout(() => actionMessage.value = '', 3000);
        })
        .finally(() => {
          startingCourse.value = false;
        });
    }

    const handleEndCourse = () => {
      if (!selectedCourse.value) return;
      endingCourse.value = true;
      actionMessage.value = '코스 종료 중...';
      
      courseApi.endCourse(selectedCourse.value.id)
        .then(() => {
          actionMessage.value = '코스가 종료되었습니다!';
          setTimeout(() => actionMessage.value = '', 3000);
        })
        .catch(error => {
          console.error('코스 종료 실패:', error);
          actionMessage.value = '코스 종료에 실패했습니다.';
          setTimeout(() => actionMessage.value = '', 3000);
        })
        .finally(() => {
          endingCourse.value = false;
        });
    }

    const fetchCourseDistance = async () => {
      if (!selectedCourse.value) return;
      distanceLoading.value = true;
      actionMessage.value = '거리 계산 중...';
      
      try {
        const response = await courseApi.getCourseDistance(selectedCourse.value.id);
        distanceInfo.value = response;
        actionMessage.value = `실제 거리: ${response.distance}km`;
        setTimeout(() => actionMessage.value = '', 5000);
      } catch (error) {
        console.error('거리 조회 실패:', error);
        actionMessage.value = '거리 조회에 실패했습니다.';
        setTimeout(() => actionMessage.value = '', 3000);
      } finally {
        distanceLoading.value = false;
      }
    }

    const handleScheduleRegistered = () => {
      showScheduleModal.value = false;
      actionMessage.value = '방문 예정이 등록되었습니다!';
      setTimeout(() => actionMessage.value = '', 3000);
    }

    const fetchCourseDetail = async (courseId) => {
      loading.value = true;
      try {
        const response = await courseApi.getCourseDetail(courseId);
        console.log('코스 상세 API 응답:', response);
        if (response && response.status === 'success' && response.data) {
          courseDetail.value = response.data;
        } else if (response && response.data) {
          courseDetail.value = response.data;
        } else {
          courseDetail.value = null;
        }
        console.log('로드된 코스 상세:', courseDetail.value);
      } catch (error) {
        console.error('코스 상세 정보 조회 실패:', error);
        courseDetail.value = null;
      } finally {
        loading.value = false;
      }
    }

    const goToNearbyAttractions = () => {
      if (!selectedCourse.value || !courseDetail.value?.coords?.length) {
        alert('코스를 먼저 선택해주세요')
        return
      }
      router.push({
        name: 'NearbyAttractions',
        query: {
          courseId: selectedCourse.value.id,
          courseName: selectedCourse.value.name,
          coords: JSON.stringify(courseDetail.value.coords)
        }
      })
    }

    return {
      selectedCourse,
      courseDetail,
      attractions,
      loading,
      loadingAttractions,
      showScheduleModal,
      detailTab,
      startingCourse,
      endingCourse,
      distanceLoading,
      distanceInfo,
      actionMessage,
      currentPage,
      pageSize,
      totalPages,
      allCourses,
      displayedCourses,
      attractionsWithEndPoint,
      selectCourse,
      prevPage,
      nextPage,
      handleStartCourse,
      handleEndCourse,
      fetchCourseDistance,
      handleScheduleRegistered,
      fetchCourseDetail,
      goToNearbyAttractions
    }
  }
}
</script>

<style scoped>
/* 기본 스타일 */
.listwrap { margin-bottom: 20px; }
.list { list-style: none; padding: 0; margin: 0; }
.item { 
  padding: 16px; 
  margin-bottom: 8px; 
  border: 1px solid #e9ecef; 
  border-radius: 8px; 
  cursor: pointer; 
  transition: all 0.2s;
  background: #fff;
}
.item:hover { 
  background: #f8f9fa; 
  border-color: #303E69; 
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.item.selected { 
  background: #f6f9ff; 
  border-color: #98c1ff; 
  box-shadow: 0 2px 8px rgba(0,123,255,0.2);
}
.row { 
  display: flex; 
  align-items: baseline; 
  justify-content: space-between; 
  gap: 8px; 
  margin-bottom: 8px;
}
.title { 
  font-weight: 700; 
  font-size: 1.1rem;
  color: #333;
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap; 
  flex: 1;
}
.meta { 
  color: #666; 
  font-size: 0.9rem; 
  font-weight: 500;
}
.chips { 
  display: flex; 
  gap: 6px; 
  flex-wrap: wrap; 
}
.chip { 
  display: inline-flex; 
  align-items: center; 
  padding: 4px 10px; 
  border: 1px solid #e9ecef; 
  border-radius: 999px; 
  background: #f8f9fa; 
  font-size: 12px; 
  color: #555; 
}
.chip.rating { 
  background: #fff3e0; 
  color: #f57c00; 
  border-color: #ffcc02;
}

.state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 1.1rem;
}

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
</style>