<template>
  <div class="app">
    <NavigationBar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import NavigationBar from './components/NavigationBar.vue'
import { handleKakaoLoginCallback } from './services/authService'

const router = useRouter()

// 앱 시작 시 카카오 로그인 콜백 처리
onMounted(async () => {
  const isKakaoLoginSuccess = await handleKakaoLoginCallback()
  if (isKakaoLoginSuccess) {
    // 카카오 로그인 성공 시 메인 페이지로 이동
    router.push('/')
    // 네비게이션 바에 로그인 상태 변화 알림
    window.dispatchEvent(new CustomEvent('loginStateChanged'))
  }
})
</script>


<style>
/* 전역 CSS 리셋 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

#app {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 60px; /* 네비게이션 바 높이만큼 패딩 추가 */
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

/* nav 스타일 제거 - NavigationBar 컴포넌트에서 관리 */

</style>
