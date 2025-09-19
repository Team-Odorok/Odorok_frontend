<template>
  <div class="login-container">
    <div class="login-card">
      <h1>로그인</h1>
      <p class="subtitle">오도록 서비스에 로그인하세요</p>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">이메일</label>
          <input
            id="username"
            v-model="username"
            type="email"
            placeholder="wonjun@mail.com"
            autocomplete="username"
            required
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="password">비밀번호</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="123"
            autocomplete="current-password"
            required
            class="form-input"
          />
        </div>
        
        <button 
          type="submit" 
          :disabled="loading"
          class="login-btn"
        >
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>
      
      <!-- 소셜 로그인 섹션 -->
      <div class="social-login">
        <div class="divider">
        </div>
        <button 
          @click="handleKakaoLogin"
          class="kakao-login-btn"
        >
          <img src="/kakao-icon.png" alt="카카오톡" class="kakao-icon" />
          카카오로 로그인
        </button>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div class="signup-link">
        <p>계정이 없으신가요? <router-link to="/signup">회원가입</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/services/authService'
import authClient from '@/services/authClient'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    const username = ref('wonjun@mail.com')
    const password = ref('123')
    const loading = ref(false)
    const error = ref('')
    
    // 현재 API URL과 스웨거 URL 계산
    const currentApiUrl = computed(() => authClient.defaults.baseURL)
    const swaggerUrl = computed(() => `${currentApiUrl.value}/api/swagger-ui/index.html`)
    
    const handleLogin = async () => {
      loading.value = true
      error.value = ''
      
      try {
        await login(username.value, password.value)
        console.log('로그인 성공! 메인 페이지로 이동합니다.')
        // 네비게이션 바에 로그인 상태 변화 알림
        window.dispatchEvent(new CustomEvent('loginStateChanged'))
        router.push('/')
      } catch (err) {
        console.error('로그인 에러:', err)
        
        // 에러 상태에 따른 구체적인 메시지 제공
        if (err.response?.status === 403) {
          error.value = '서버 접근이 거부되었습니다. 서버 설정을 확인해주세요.'
        } else if (err.response?.status === 401) {
          error.value = '이메일 또는 비밀번호가 올바르지 않습니다.'
        } else if (err.response?.status === 404) {
          error.value = '로그인 엔드포인트를 찾을 수 없습니다.'
        } else if (err.response?.status === 500) {
          error.value = '서버 내부 오류가 발생했습니다.'
        } else if (err.code === 'ERR_NETWORK') {
          error.value = '네트워크 연결을 확인해주세요.'
        } else {
          error.value = err.message || '로그인에 실패했습니다.'
        }
      } finally {
        loading.value = false
      }
    }
    
    const handleKakaoLogin = () => {
      console.log('카카오 로그인 버튼 클릭됨')
      // 카카오 로그인 URL로 리다이렉트
      window.location.href = 'https://odorok.duckdns.org/api/auth/oauth2/login/kakao'
    }
    
    
    return {
      username,
      password,
      loading,
      error,
      swaggerUrl,
      handleLogin,
      handleKakaoLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FDF9F1;
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-card h1 {
  text-align: center;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.login-btn { 
  background: #4F3A36;
  color: white;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}


.swagger-link {
  margin-top: 15px;
}

.swagger-btn {
  display: inline-block;
  background: #17a2b8;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  text-decoration: none;
  transition: background-color 0.3s;
}

.swagger-btn:hover {
  background: #138496;
  color: white;
  text-decoration: none;
}

.login-btn:hover:not(:disabled) {
  background: #C15345;
}

.login-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  margin-top: 20px;
  padding: 12px;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  text-align: center;
}

.demo-info {
  margin-top: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.demo-info h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.demo-info p {
  margin: 5px 0;
  color: #666;
}

.signup-link {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e1e5e9;
}

.signup-link p {
  color: #666;
  margin: 0;
}

.signup-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.signup-link a:hover {
  text-decoration: underline;
}

/* 소셜 로그인 스타일 */
.social-login {
  margin-top: 30px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e1e5e9;
}

.divider span {
  background: white;
  padding: 0 15px;
  color: #666;
  font-size: 14px;
}

.kakao-login-btn {
  width: 100%;
  background: #FEE500;
  color: #000;
  border: none;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background-color 0.3s;
}

.kakao-login-btn:hover {
  background: #FDD835;
}

.kakao-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}
</style> 