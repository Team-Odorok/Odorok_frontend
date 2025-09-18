<template>
  <div class="home-container">
    <!-- 헤더 섹션 -->
    <header class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">오도록</h1>
        <p class="hero-subtitle">당신의 여행 이야기를 기록하고 공유하세요</p>
        <div class="hero-buttons">
          <router-link to="/diaries" class="btn btn-primary">
            일지 보기
          </router-link>
          <router-link to="/diaries/create/style" class="btn btn-secondary">
            일지 작성
          </router-link>
        </div>
      </div>
      <div class="hero-image">
        <div class="hero-placeholder">
          🗺️
        </div>
      </div>
    </header>

    <!-- 기능 소개 섹션 -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">주요 기능</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">📝</div>
            <h3>AI 일지 작성</h3>
            <p>AI와 대화하며 자동으로 여행 일지를 작성할 수 있습니다.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🗺️</div>
            <h3>코스 검색</h3>
            <p>다양한 여행 코스를 검색하고 추천받을 수 있습니다.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">👥</div>
            <h3>커뮤니티</h3>
            <p>다른 사용자들과 여행 경험을 공유하고 소통할 수 있습니다.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📍</div>
            <h3>주변 관광지</h3>
            <p>현재 위치 주변의 관광지와 맛집을 찾아보세요.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 통계 섹션 -->
    <section class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ totalDiaries }}</div>
            <div class="stat-label">작성된 일지</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ totalUsers }}</div>
            <div class="stat-label">활성 사용자</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ totalCourses }}</div>
            <div class="stat-label">등록된 코스</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 최근 일지 섹션 -->
    <section class="recent-diaries-section">
      <div class="container">
        <h2 class="section-title">최근 작성된 일지</h2>
        <div class="diaries-grid" v-if="recentDiaries.length > 0">
          <div 
            v-for="diary in recentDiaries" 
            :key="diary.id"
            class="diary-card"
            @click="goToDiary(diary.id)"
          >
            <div class="diary-image">
              <img v-if="diary.thumbnail" :src="diary.thumbnail" :alt="diary.title" />
              <div v-else class="diary-placeholder">📖</div>
            </div>
            <div class="diary-content">
              <h3 class="diary-title">{{ diary.title }}</h3>
              <p class="diary-preview">{{ diary.preview }}</p>
              <div class="diary-meta">
                <span class="diary-author">{{ diary.author }}</span>
                <span class="diary-date">{{ formatDate(diary.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-diaries">
          <p>아직 작성된 일지가 없습니다.</p>
          <router-link to="/diaries/create/style" class="btn btn-primary">
            첫 일지 작성하기
          </router-link>
        </div>
      </div>
    </section>

    <!-- CTA 섹션 -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>지금 시작해보세요!</h2>
          <p>여행의 소중한 순간들을 기록하고 공유해보세요.</p>
          <router-link to="/diaries/create/style" class="btn btn-large">
            일지 작성 시작하기
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'HomeView',
  setup() {
    const router = useRouter()
    
    // 통계 데이터
    const totalDiaries = ref(0)
    const totalUsers = ref(0)
    const totalCourses = ref(0)
    
    // 최근 일지 데이터
    const recentDiaries = ref([])
    
    // 일지 상세 페이지로 이동
    const goToDiary = (diaryId) => {
      router.push(`/diaries/${diaryId}`)
    }
    
    // 날짜 포맷팅
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    
    // 데이터 로드
    const loadData = async () => {
      try {
        // TODO: 실제 API 호출로 데이터 로드
        // 임시 데이터
        totalDiaries.value = 156
        totalUsers.value = 89
        totalCourses.value = 24
        
        recentDiaries.value = [
          {
            id: 1,
            title: '제주도 한라산 등반기',
            preview: '한라산 정상까지의 힘든 등반 과정과 아름다운 풍경을 기록했습니다...',
            author: '김여행',
            createdAt: new Date().toISOString(),
            thumbnail: null
          },
          {
            id: 2,
            title: '부산 해운대 바다 이야기',
            preview: '부산 해운대에서의 즐거운 시간들과 맛있는 해산물 이야기...',
            author: '박바다',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            thumbnail: null
          },
          {
            id: 3,
            title: '서울 한강 피크닉',
            preview: '한강에서의 평화로운 피크닉과 야경의 아름다움...',
            author: '이한강',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            thumbnail: null
          }
        ]
      } catch (error) {
        console.error('데이터 로드 실패:', error)
      }
    }
    
    onMounted(() => {
      loadData()
    })
    
    return {
      totalDiaries,
      totalUsers,
      totalCourses,
      recentDiaries,
      goToDiary,
      formatDate
    }
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-sizing: border-box;
}

/* 헤더 섹션 */
.hero-section {
  display: flex;
  align-items: center;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  color: white;
  width: 100%;
  box-sizing: border-box;
}

.hero-content {
  flex: 1;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-family: 'NanumMyeongjo', serif;
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.hero-subtitle {
  font-family: 'NanumMyeongjo', serif;
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-placeholder {
  font-size: 8rem;
  opacity: 0.3;
}

/* 버튼 스타일 */
.btn {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
  transform: translateY(-2px);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: white;
  color: #667eea;
  transform: translateY(-2px);
}

.btn-large {
  padding: 16px 32px;
  font-size: 1.1rem;
}

/* 컨테이너 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}

/* 섹션 공통 스타일 */
section {
  padding: 80px 20px;
  width: 100%;
  box-sizing: border-box;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: #333;
}

/* 기능 섹션 */
.features-section {
  background: white;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  border-radius: 12px;
  background: #f8f9fa;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

/* 통계 섹션 */
.stats-section {
  background: #f8f9fa;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  text-align: center;
}

.stat-item {
  padding: 2rem;
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1.1rem;
  color: #666;
}

/* 최근 일지 섹션 */
.recent-diaries-section {
  background: white;
}

.diaries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.diary-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.diary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.diary-image {
  height: 200px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.diary-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.diary-placeholder {
  font-size: 3rem;
  opacity: 0.5;
}

.diary-content {
  padding: 1.5rem;
}

.diary-title {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.diary-preview {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.diary-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #999;
}

.no-diaries {
  text-align: center;
  padding: 3rem;
  color: #666;
}

/* CTA 섹션 */
.cta-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.cta-content h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.cta-content p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .diaries-grid {
    grid-template-columns: 1fr;
  }
}
</style>
