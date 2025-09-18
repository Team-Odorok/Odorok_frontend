<template>
  <RouterView />
  
  <!-- 로그인 상태일 때만 표시되는 버튼들 -->
  <div v-if="isUserLoggedIn" class="floating-buttons">
    <button
      class="floating-btn attendance-btn"
      @click="showAttendance = true"
      title="출석 체크"
    >
      📅
    </button>
    <button
      class="floating-btn logout-btn"
      @click="handleLogout"
      title="로그아웃"
    >
      🚪
    </button>
  </div>

  <!-- 디버깅용 로그인 상태 표시 -->
  <div class="debug-info" v-if="showDebug">
    <div class="debug-panel">
      <h4>🔍 로그인 상태 디버깅</h4>
      <p><strong>로그인 상태:</strong> {{ isUserLoggedIn ? '✅ 로그인됨' : '❌ 로그인 안됨' }}</p>
      <p><strong>토큰:</strong> {{ token ? '✅ 있음' : '❌ 없음' }}</p>
      <p><strong>토큰 내용:</strong> {{ tokenPreview }}</p>
      <p><strong>현재 경로:</strong> {{ currentPath }}</p>
      <button @click="showDebug = false" class="close-debug">닫기</button>
    </div>
  </div>
  
  <!-- 디버그 버튼 -->
  <button 
    v-if="!showDebug" 
    @click="showDebug = true" 
    class="debug-btn"
    title="로그인 상태 확인"
  >
    🔍
  </button>

  <AttendanceModel
    :visible="showAttendance"
    @close="showAttendance = false"
  />

  <!-- Toast 알림 -->
  <Toast
    :show="toast.show"
    :message="toast.message"
    :type="toast.type"
    :duration="toast.duration"
    @close="toast.show = false"
  />
</template>

<script setup>
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import AttendanceModel from './components/AttendanceModel.vue'
import Toast from './components/Toast.vue'
import { errorHandler } from './utils/errorHandler.js'
import { isLoggedIn, logout, getAccessToken } from './services/authService.js'

const router = useRouter()
const route = useRoute()
const showAttendance = ref(false)
const showDebug = ref(false)
const toast = ref({
  show: false,
  message: '',
  type: 'info',
  duration: 3000
})

// 로그인 상태 확인
const isUserLoggedIn = computed(() => isLoggedIn())
const token = computed(() => getAccessToken())
const currentPath = computed(() => route.path)

// 토큰 미리보기 (보안을 위해 일부만 표시)
const tokenPreview = computed(() => {
  const tokenValue = token.value
  if (!tokenValue) return '토큰 없음'
  return tokenValue.length > 20 ? `${tokenValue.substring(0, 20)}...` : tokenValue
})

// Toast 콜백 등록
const showToast = (message, type, duration) => {
  toast.value = {
    show: true,
    message,
    type,
    duration
  }
}

// 로그아웃 처리
const handleLogout = () => {
  logout()
  showToast('로그아웃되었습니다.', 'success')
  router.push('/login')
}

onMounted(() => {
  errorHandler.registerToastCallback(showToast)
})
</script>


<style scoped>

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

/* 플로팅 버튼 스타일 */
.floating-buttons {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.floating-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.attendance-btn {
  background: #3498db;
  color: white;
}

.attendance-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.logout-btn {
  background: #e74c3c;
  color: white;
}

.logout-btn:hover {
  background: #c0392b;
  transform: translateY(-2px);
}

/* 디버그 패널 스타일 */
.debug-info {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1200;
}

.debug-panel {
  background: white;
  border: 2px solid #3498db;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 300px;
  font-size: 0.9rem;
}

.debug-panel h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1rem;
}

.debug-panel p {
  margin: 5px 0;
  color: #34495e;
}

.debug-panel strong {
  color: #2c3e50;
}

.close-debug {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-top: 10px;
}

.debug-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #f39c12;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  z-index: 1100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.debug-btn:hover {
  background: #e67e22;
  transform: scale(1.1);
}

</style>
