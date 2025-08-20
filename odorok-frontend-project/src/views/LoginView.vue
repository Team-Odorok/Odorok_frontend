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
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div class="demo-info">
        <h3>데모 계정</h3>
        <p><strong>이메일:</strong> wonjun@mail.com</p>
        <p><strong>비밀번호:</strong> 123</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/services/authService'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    const username = ref('wonjun@mail.com')
    const password = ref('123')
    const loading = ref(false)
    const error = ref('')
    
    const handleLogin = async () => {
      loading.value = true
      error.value = ''
      
      try {
        await login(username.value, password.value)
        console.log('로그인 성공! 메인 페이지로 이동합니다.')
        router.push('/diaries')
      } catch (err) {
        error.value = err.message || '로그인에 실패했습니다.'
        console.error('로그인 에러:', err)
      } finally {
        loading.value = false
      }
    }
    
    return {
      username,
      password,
      loading,
      error,
      handleLogin
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: #667eea;
  color: white;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-btn:hover:not(:disabled) {
  background: #5a6fd8;
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
</style> 