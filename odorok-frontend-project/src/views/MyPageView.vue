<template>
  <div class="mypage-container">
    <!-- 기본정보 섹션 -->
    <BasicInfoSection 
      :profile-data="profileData"
      @image-error="handleImageError"
      @profile-updated="handleProfileUpdated"
    />

    <!-- 건강정보 섹션 -->
    <HealthInfoSection 
      :health-data="healthData"
      @edit-health="openHealthModal"
    />

    <!-- 활동내역 섹션 -->
    <ActivitySection 
      :activity-stats="activityStats"
      :refreshing="loading"
      @refresh="loadData"
    />

    <!-- 방문한 코스 섹션 -->
    <VisitedCoursesSection 
      :refreshing="loading"
      @refresh="loadData"
    />

    <!-- 방문완료 후기 섹션 -->
    <ReviewSection 
      :refreshing="loading"
      @refresh="loadData"
    />

    <!-- 건강정보 수정 모달 -->
    <HealthEditModal 
      v-if="showHealthModal"
      :health-data="healthData?.data"
      @close="closeHealthModal"
      @save="handleHealthSave"
    />

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>데이터를 불러오는 중...</p>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="error" class="error-message">
      <h3>⚠️ 일부 기능이 아직 구현되지 않았습니다</h3>
      <p>{{ error }}</p>
      <div class="status-info">
        <h4>📊 현재 상태:</h4>
        <ul>
          <li>✅ <strong>프로필 정보</strong>: 정상 작동</li>
          <li>✅ <strong>건강정보 조회</strong>: 정상 작동</li>
          <li>✅ <strong>방문한 코스</strong>: 정상 작동</li>
          <li>✅ <strong>방문완료 후기</strong>: 정상 작동</li>
          <li>❌ <strong>활동통계</strong>: 백엔드 API 미구현</li>
          <li>❌ <strong>건강정보 수정</strong>: 백엔드 API 미구현</li>
        </ul>
        <p class="note">💡 기본 정보는 정상적으로 표시되고 있습니다. 추가 기능은 백엔드 개발 완료 후 이용 가능합니다.</p>
      </div>
      <button @click="loadData" class="retry-btn">다시 시도</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { mypageService } from '@/services/mypageService.js'
import { handleApiError } from '@/utils/errorHandler.js'
import BasicInfoSection from '@/components/BasicInfoSection.vue'
import HealthInfoSection from '@/components/HealthInfoSection.vue'
import ActivitySection from '@/components/ActivitySection.vue'
import VisitedCoursesSection from '@/components/VisitedCoursesSection.vue'
import ReviewSection from '@/components/ReviewSection.vue'
import HealthEditModal from '@/components/HealthEditModal.vue'

export default {
  name: 'MyPageView',
  components: {
    BasicInfoSection,
    HealthInfoSection,
    ActivitySection,
    VisitedCoursesSection,
    ReviewSection,
    HealthEditModal
  },
  setup() {
    const loading = ref(false)
    const error = ref('')
    const profileData = ref(null)
    const healthData = ref(null)
    const activityStats = ref(null)
    const showHealthModal = ref(false)

    // 데이터 로드
    const loadData = async () => {
      loading.value = true
      error.value = ''
      
      console.log('🔍 마이페이지 데이터 로드 시작')
      console.log('현재 토큰:', localStorage.getItem('accessToken') ? '있음' : '없음')
      
      try {
        console.log('📡 API 호출 시작...')
        
        // 먼저 백엔드 연결 테스트
        await mypageService.testBackendEndpoints()
        
        // 각 API를 개별적으로 호출하여 어떤 것이 실패하는지 확인
        let profile, health, stats
        
        try {
          console.log('1️⃣ 프로필 조회 시도...')
          profile = await mypageService.getProfile()
          console.log('✅ 프로필 조회 성공:', profile)
        } catch (profileErr) {
          console.error('❌ 프로필 조회 실패:', profileErr)
          profile = null
        }
        
        try {
          console.log('2️⃣ 건강정보 조회 시도...')
          health = await mypageService.getUserHealth()
          console.log('✅ 건강정보 조회 성공:', health)
        } catch (healthErr) {
          console.error('❌ 건강정보 조회 실패:', healthErr)
          health = null
        }
        
        try {
          console.log('3️⃣ 활동 통계 조회 시도...')
          stats = await mypageService.getActivityStatistics()
          console.log('✅ 활동 통계 조회 성공:', stats)
        } catch (statsErr) {
          console.error('❌ 활동 통계 조회 실패:', statsErr)
          stats = null
        }
        
        // 데이터 설정
        profileData.value = profile
        healthData.value = health
        activityStats.value = stats
        
        console.log('📊 최종 데이터 상태:')
        console.log('- 프로필:', profileData.value)
        console.log('- 건강정보:', healthData.value)
        console.log('- 활동통계:', activityStats.value)
        
        // 모든 API가 실패한 경우에만 에러 처리
        if (!profile && !health && !stats) {
          throw new Error('모든 마이페이지 API 호출이 실패했습니다. 백엔드에 해당 엔드포인트가 구현되지 않았을 수 있습니다.')
        }
        
      } catch (err) {
        console.error('🚨 마이페이지 데이터 로드 실패:', err)
        handleApiError(err, '마이페이지 데이터 로드')
        
        if (err.response?.status === 403) {
          error.value = '접근 권한이 없습니다. 관리자에게 문의하세요.'
        } else if (err.response?.status === 401) {
          error.value = '인증이 만료되었습니다. 다시 로그인해주세요.'
        } else if (err.response?.status === 404) {
          error.value = '마이페이지 API가 구현되지 않았습니다.'
        } else {
          error.value = `데이터를 불러오는데 실패했습니다. (${err.response?.status || '알 수 없는 오류'})`
        }
      } finally {
        loading.value = false
        console.log('🏁 마이페이지 데이터 로드 완료')
      }
    }

    // 프로필 이미지 에러 처리
    const handleImageError = (event) => {
      // 기본 아바타 SVG로 교체
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA4MEMyMCA2NS42NDA2IDMyLjY0MDYgNTMgNDcgNTNINjNDNzcuMzU5NCA1MyA5MCA2NS42NDA2IDkwIDgwVjEwMEgyMFY4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
    }

    // 건강정보 모달 관련
    const openHealthModal = () => {
      showHealthModal.value = true
    }

    const closeHealthModal = () => {
      showHealthModal.value = false
    }

    const handleHealthSave = async (updatedData) => {
      try {
        await mypageService.updateUserHealth(updatedData)
        await loadData() // 데이터 새로고침
        closeHealthModal()
      } catch (err) {
        handleApiError(err, '건강정보 저장')
      }
    }

    // 프로필 업데이트 처리
    const handleProfileUpdated = async () => {
      await loadData() // 데이터 새로고침
    }

    onMounted(() => {
      loadData()
    })

    return {
      loading,
      error,
      profileData,
      healthData,
      activityStats,
      showHealthModal,
      loadData,
      handleImageError,
      openHealthModal,
      closeHealthModal,
      handleHealthSave,
      handleProfileUpdated
    }
  }
}
</script>

<style scoped>
.mypage-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 40px;
  color: #e74c3c;
  background: #fdf2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin: 20px 0;
}

.error-message h3 {
  color: #dc2626;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.status-info {
  background: white;
  padding: 20px;
  border-radius: 6px;
  margin: 20px 0;
  text-align: left;
  border: 1px solid #e5e7eb;
}

.status-info h4 {
  color: #374151;
  margin-bottom: 10px;
  font-size: 1rem;
}

.status-info ul {
  list-style: none;
  padding: 0;
  margin: 10px 0;
}

.status-info li {
  padding: 5px 0;
  color: #4b5563;
}

.status-info .note {
  background: #f0f9ff;
  padding: 10px;
  border-radius: 4px;
  color: #0369a1;
  font-size: 0.9rem;
  margin-top: 15px;
}

.retry-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 15px;
}

.retry-btn:hover {
  background: #c0392b;
}

@media (max-width: 768px) {
  .mypage-container {
    padding: 15px;
  }
}
</style>
