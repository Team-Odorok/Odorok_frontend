<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- 로고/브랜드 -->
      <div class="navbar-brand">
              <router-link to="/" class="brand-link">
                <img src="/transparent-odorok.png" alt="오도록" class="brand-logo" />
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
          나의 활동
        </router-link>
      </div>

      <!-- 로그인 버튼 (오른쪽 정렬) -->
      <div class="navbar-auth">
        <template v-if="isLoggedIn">
          <button @click="showAttendance = true" class="attendance-btn">
            <img src="/white-stamp.png" alt="출석" class="stamp-icon" />
            <span class="attendance-tooltip">출석체크</span>
          </button>
          <router-link to="/mypage" class="user-info user-link">{{ userNickname }}님</router-link>
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
  background: #DDCDB5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
  font-family: 'NanumMyeongjo', serif;
}

.navbar-container {
  max-width: 100%;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 80px;
}

/* 브랜드/로고 */
.navbar-brand {
  flex-shrink: 0;
}

.brand-link {
  text-decoration: none;
  color: #C15345;
  font-family: 'NanumMyeongjoExtraBold', serif;
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.brand-text {
  font-family: 'NanumMyeongjoExtraBold', serif;
  color: #4F3A36;
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
  color: #B96664;
  font-weight: normal;
  padding: 12px 20px;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
  font-size: 1.1rem;
}

.nav-link:hover {
  color: #303E69;
  background: none;
}

.nav-link:hover::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background: #303E69;
  border-radius: 1px;
}

.nav-link.router-link-active {
  color: #303E69;
  background: none;
  font-weight: normal;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background: #303E69;
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
  color: #4F3A36;
  font-size: 1rem;
  font-weight: 500;
  padding: 0;
  background: none;
  border: none;
}

.user-link {
  text-decoration: none;
  color: #303E69;
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-link:hover {
  color: #303E69;
  background: none;
  border: none;
  text-decoration: underline;
}

.login-btn, .logout-btn, .attendance-btn {
  padding: 12px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.login-btn {
  background: #4F3A36;
  color: white;
}

.login-btn:hover {
  background: #C15345;
  transform: translateY(-1px);
}

.logout-btn {
  background: #4F3A36;
  color: white;
}

.logout-btn:hover {
  background: #6b5d47;
  color: white;
  transform: translateY(-1px);
}

.attendance-btn {
  background: #C15345;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  padding: 0;
  border: none;
  position: relative;
}

.stamp-icon {
  width: 20px;
  height: 20px;
}

.attendance-btn:hover {
  background: #a03d32;
  transform: translateY(-1px);
}

.attendance-tooltip {
  position: absolute;
  bottom: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
  pointer-events: none;
}

.attendance-tooltip::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid #333;
}

.attendance-btn:hover .attendance-tooltip {
  opacity: 1;
  visibility: visible;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0 15px;
    height: 70px;
  }
  
  .navbar-menu {
    gap: 1rem;
    margin-left: 1rem;
  }
  
  .nav-link {
    padding: 8px 14px;
    font-size: 1rem;
  }
  
  .brand-logo {
    width: 35px;
    height: 35px;
  }
  
  .brand-text {
    font-size: 1.7rem;
  }
  
  .user-info {
    font-size: 1rem;
    padding: 8px 14px;
  }
  
  .user-link {
    font-size: 1rem;
    padding: 8px 14px;
  }
}

@media (max-width: 600px) {
  .navbar-menu {
    gap: 0.5rem;
    margin-left: 0.5rem;
  }
  
  .nav-link {
    padding: 6px 10px;
    font-size: 0.9rem;
  }
  
  .login-btn, .logout-btn {
    padding: 8px 14px;
    font-size: 1rem;
  }
  
  .attendance-btn {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }
}
</style>
