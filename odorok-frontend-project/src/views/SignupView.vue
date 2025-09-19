<template>
  <div class="signup-container">
    <div class="signup-card">
      <h2>회원가입</h2>
      <form @submit.prevent="handleSignup">
        <div class="form-group">
          <label for="email">이메일</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            placeholder="이메일을 입력하세요"
          />
        </div>
        
        <div class="form-group">
          <label for="password">비밀번호</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            placeholder="비밀번호를 입력하세요"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">비밀번호 확인</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            required 
            placeholder="비밀번호를 다시 입력하세요"
          />
        </div>
        
        <div class="form-group">
          <label for="nickname">닉네임</label>
          <input 
            type="text" 
            id="nickname" 
            v-model="nickname" 
            required 
            placeholder="닉네임을 입력하세요"
            maxlength="20"
          />
        </div>
        
        <button type="submit" :disabled="loading || !isFormValid" class="signup-btn">
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        <p v-if="success" class="success-message">{{ success }}</p>
      </form>
      
      <div class="login-link">
        <p>이미 계정이 있으신가요? <router-link to="/login">로그인</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { signup } from '@/services/authService'

export default {
  name: 'SignupView',
  setup() {
    const router = useRouter()
    
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const nickname = ref('')
    const loading = ref(false)
    const error = ref('')
    const success = ref('')
    
    // 폼 유효성 검사
    const isFormValid = computed(() => {
      return email.value && 
             password.value && 
             confirmPassword.value && 
             nickname.value &&
             password.value === confirmPassword.value
    })
    
    const handleSignup = async () => {
      if (!isFormValid.value) {
        error.value = '모든 필드를 올바르게 입력해주세요.'
        return
      }
      
      if (password.value !== confirmPassword.value) {
        error.value = '비밀번호가 일치하지 않습니다.'
        return
      }
      
      loading.value = true
      error.value = ''
      success.value = ''
      
      try {
        await signup(email.value, password.value, nickname.value)
        success.value = '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.'
        
        // 2초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/login')
        }, 2000)
        
      } catch (err) {
        if (err.response) {
          if (err.response.status === 400) {
            error.value = '입력한 정보를 다시 확인해주세요.'
          } else if (err.response.status === 409) {
            error.value = '이미 사용 중인 이메일입니다.'
          } else if (err.response.status >= 500) {
            error.value = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          } else {
            error.value = `회원가입 실패: ${err.response.status} ${err.response.statusText}`
          }
        } else if (err.request) {
          error.value = '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.'
        } else {
          error.value = `회원가입 에러: ${err.message}`
        }
      } finally {
        loading.value = false
      }
    }
    
    return {
      email,
      password,
      confirmPassword,
      nickname,
      loading,
      error,
      success,
      isFormValid,
      handleSignup
    }
  }
}
</script>

<style scoped>
.signup-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FDF9F1;
  padding: 20px;
}

.signup-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.signup-card h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 2rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:invalid {
  border-color: #e74c3c;
}

.signup-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: 10px;
}

.signup-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.signup-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin-top: 15px;
  font-size: 0.9rem;
  background: #fdf2f2;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.success-message {
  color: #10b981;
  text-align: center;
  margin-top: 15px;
  font-size: 0.9rem;
  background: #f0fdf4;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
}

.login-link {
  text-align: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e1e5e9;
}

.login-link p {
  color: #666;
  margin: 0;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .signup-container {
    padding: 10px;
  }
  
  .signup-card {
    padding: 30px 20px;
  }
  
  .signup-card h2 {
    font-size: 1.5rem;
  }
}
</style>
