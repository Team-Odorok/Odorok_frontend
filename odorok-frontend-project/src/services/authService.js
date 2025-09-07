// 로그인, 로그아웃, 토큰 관리 등 인증 관련 비즈니스 로직 담당
import authClient from './authClient'

// 로그인 함수
export const login = async (username, password) => {
  try {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await authClient.post('/api/auth/login', formData)
    return handleLoginResponse(response)
    
  } catch (error) {
    console.error('로그인 실패:', error.response?.status, error.response?.statusText)
    throw error
  }
}

// 로그인 응답 처리 함수
const handleLoginResponse = (response) => {
  // 토큰 추출 로직
  let token = response.headers?.authorization || response.headers?.Authorization
  
  // Bearer 접두사 제거
  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7)
  }
  
  // 헤더에 토큰이 없으면 응답 데이터에서 확인
  if (!token && response.data) {
    token = response.data.accessToken || response.data.token || response.data.access_token
  }
  
  if (token) {
    localStorage.setItem('accessToken', token)
    console.log('로그인 성공! 토큰 저장됨')
  } else {
    console.warn('로그인 성공했지만 토큰이 없습니다.')
  }

  return response
}

// 로그아웃 함수
export const logout = () => {
  localStorage.removeItem('accessToken')
}

// 현재 로그인 상태 확인
export const isLoggedIn = () => {
  return !!localStorage.getItem('accessToken')
}

// 토큰 가져오기
export const getAccessToken = () => {
  return localStorage.getItem('accessToken')
}
