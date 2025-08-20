// 로그인, 로그아웃, 토큰 관리 등 인증 관련 비즈니스 로직 담당
import authClient from './authClient'

// 로그인 함수
export const login = async (username, password) => {
  try {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    // 로그인 요청 (백엔드가 응답에 accessToken을 포함해야 함)
    const response = await authClient.post('/login', formData)
    
    console.log('response 전체:', JSON.stringify(response, null, 2))
    console.log('response.data:', response.data)
    console.log('response.headers:', response.headers)
  
    // 토큰 추출 로직 수정
    // 1. 응답 헤더에서 Authorization 토큰 확인
    let token = response.headers?.authorization || response.headers?.Authorization
    
    // 2. 응답 데이터에서 토큰 확인
    if (!token && response.data) {
      token = response.data.accessToken || response.data.token || response.data.access_token
    }
    
    // 3. Bearer 접두사 제거
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7)
    }
    
    console.log('추출된 토큰:', token)
    
    if (token) {
      localStorage.setItem('accessToken', token)
      console.log('로그인 성공! 토큰 저장됨')
    } else {
      console.warn('로그인 성공했지만 토큰이 없습니다. 백엔드 응답 확인 필요')
      console.log('응답 헤더:', response.headers)
      console.log('응답 데이터:', response.data)
    }

    return response
  } catch (error) {
    console.error('로그인 실패:', error.response?.status)
    console.error('에러 상세 정보:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    })
    throw error
  }
}

// 로그아웃 함수
export const logout = () => {
  localStorage.removeItem('accessToken')
  console.log('토큰이 제거되었습니다.')
}

// 현재 로그인 상태 확인
export const isLoggedIn = () => {
  return !!localStorage.getItem('accessToken')
}

// 토큰 가져오기
export const getAccessToken = () => {
  return localStorage.getItem('accessToken')
} 