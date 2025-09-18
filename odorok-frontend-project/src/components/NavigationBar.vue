<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- 로고/브랜드 -->
      <div class="navbar-brand">
        <router-link to="/" class="brand-link">
          <span class="brand-text">오도록</span>
        </router-link>
      </div>

      <!-- 메뉴 아이템들 (왼쪽 정렬) -->
      <div class="navbar-menu">
        <router-link to="/course-search" class="nav-link">
          코스 검색
        </router-link>
        <router-link to="/community" class="nav-link">
          커뮤니티
        </router-link>
        <router-link to="/diaries" class="nav-link">
          나의 오도록
        </router-link>
        <router-link to="/mypage" class="nav-link">
          마이페이지
        </router-link>
      </div>

      <!-- 로그인 버튼 (오른쪽 정렬) -->
      <div class="navbar-auth">
        <template v-if="isLoggedIn">
          <button @click="showAttendance = true" class="attendance-btn">
            출석
          </button>
          <router-link to="/mypage" class="user-info user-link">{{ userNickname }}</router-link>
          <button @click="handleLogout" class="logout-btn">
            로그아웃
          </button>
        </template>
        <template v-else>
          <router-link to="/login" class="login-btn">
            로그인
          </router-link>
        </template>
      </div>
    </div>
  </nav>

  <!-- 출석 모달 -->
  <AttendanceModel
    :visible="showAttendance"
    @close="showAttendance = false"
  />
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { isLoggedIn, logout, getAccessToken } from '@/services/authService'
import AttendanceModel from './AttendanceModel.vue'

export default {
  name: 'NavigationBar',
  components: {
    AttendanceModel
  },
  setup() {
    const router = useRouter()
    const userNickname = ref('')
    const loginState = ref(isLoggedIn())
    const showAttendance = ref(false)
    
    // 로그인 상태 확인 (반응형)
    const loginStatus = computed(() => loginState.value)
    
    // 사용자 정보 가져오기
    const getUserInfo = () => {
      const token = getAccessToken()
      if (token) {
        try {
          // JWT 토큰에서 사용자 정보 추출
          const payload = JSON.parse(atob(token.split('.')[1]))
          // 닉네임 우선, 없으면 username, 그것도 없으면 '사용자'
          userNickname.value = payload.nickname || payload.username || '사용자'
          console.log('사용자 정보 업데이트:', userNickname.value)
        } catch (error) {
          console.error('토큰 파싱 오류:', error)
          userNickname.value = '사용자'
        }
      } else {
        userNickname.value = ''
      }
    }
    
    // 로그인 상태 업데이트
    const updateLoginState = () => {
      const newLoginState = isLoggedIn()
      if (newLoginState !== loginState.value) {
        loginState.value = newLoginState
        console.log('로그인 상태 변경:', newLoginState)
        getUserInfo()
      }
    }
    
    // localStorage 변화 감지
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken') {
        updateLoginState()
      }
    }
    
    // 로그아웃 처리
    const handleLogout = () => {
      logout()
      loginState.value = false
      userNickname.value = ''
      // 로그아웃 상태 변화 이벤트 발생
      window.dispatchEvent(new CustomEvent('loginStateChanged'))
      router.push('/')
    }
    
    // 로그인 상태 변화 감지
    watch(loginState, (newValue) => {
      console.log('로그인 상태 변화 감지:', newValue)
      getUserInfo()
    })
    
    // 커스텀 이벤트 핸들러
    const handleLoginStateChanged = () => {
      console.log('로그인 상태 변화 이벤트 수신')
      updateLoginState()
    }
    
    onMounted(() => {
      getUserInfo()
      // localStorage 변화 감지 이벤트 리스너 추가
      window.addEventListener('storage', handleStorageChange)
      // 커스텀 로그인 상태 변화 이벤트 리스너 추가
      window.addEventListener('loginStateChanged', handleLoginStateChanged)
      
      // 주기적으로 로그인 상태 확인 (다른 탭에서 로그인/로그아웃한 경우 대비)
      const interval = setInterval(updateLoginState, 1000)
      
      // 컴포넌트 언마운트 시 정리
      onUnmounted(() => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('loginStateChanged', handleLoginStateChanged)
        clearInterval(interval)
      })
    })
    
    return {
      isLoggedIn: loginStatus,
      userNickname,
      showAttendance,
      handleLogout
    }
  }
}
</script>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

/* 브랜드/로고 */
.navbar-brand {
  flex-shrink: 0;
}

.brand-link {
  text-decoration: none;
  color: #667eea;
  font-weight: bold;
  font-size: 1.5rem;
}

.brand-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 메뉴 아이템들 */
.navbar-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1;
  justify-content: flex-start;
  margin-left: 2rem;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
  font-size: 0.9rem;
}

.nav-link:hover {
  color: #667eea;
  background: #f8f9fa;
}

.nav-link.router-link-active {
  color: #667eea;
  background: #f0f2ff;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #667eea;
  border-radius: 1px;
}

/* 인증 관련 */
.navbar-auth {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.user-info {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.user-link {
  text-decoration: none;
  color: #666;
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-link:hover {
  color: #667eea;
  background: #f0f2ff;
  border-color: #667eea;
  transform: translateY(-1px);
}

.login-btn, .logout-btn, .attendance-btn {
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
}

.login-btn {
  background: #667eea;
  color: white;
}

.login-btn:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.logout-btn {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #e9ecef;
}

.logout-btn:hover {
  background: #e9ecef;
  color: #333;
}

.attendance-btn {
  background: #28a745;
  color: white;
}

.attendance-btn:hover {
  background: #218838;
  transform: translateY(-1px);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0 15px;
    height: 50px;
  }
  
  .navbar-menu {
    gap: 1rem;
    margin-left: 1rem;
  }
  
  .nav-link {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
  
  .brand-text {
    font-size: 1.3rem;
  }
  
  .user-info {
    font-size: 0.8rem;
    padding: 6px 12px;
  }
  
  .user-link {
    font-size: 0.8rem;
    padding: 6px 12px;
  }
}

@media (max-width: 600px) {
  .navbar-menu {
    gap: 0.5rem;
    margin-left: 0.5rem;
  }
  
  .nav-link {
    padding: 4px 8px;
    font-size: 0.8rem;
  }
  
  .login-btn, .logout-btn, .attendance-btn {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}
</style>
