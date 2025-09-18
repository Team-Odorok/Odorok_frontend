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

export const signup = async (email, password, nickname) => {
  try {
    const response = await authClient.post('/auth/signup', {
      email,
      password,
      nickname
    })

    console.log('Signup succeeded:', response)
    return response
  } catch (error) {
    console.error('Signup failed:', error.response?.status, error.response?.statusText)
    throw error
  }
}

// 카카오 로그인 후 URL 파라미터에서 토큰 처리
export const handleKakaoLoginCallback = () => {
  // 현재 URL이 백엔드 API 엔드포인트인 경우 처리
  if (window.location.pathname.includes('/api/auth/oauth2/kakao')) {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (code) {
      // 프론트엔드 앱으로 리다이렉트
      window.location.href = `/?code=${code}`
      return false
    }
  }
  
  const urlParams = new URLSearchParams(window.location.search)
  
  // 다양한 토큰 파라미터 이름 지원
  const token = urlParams.get('token') || 
                urlParams.get('accessToken') || 
                urlParams.get('access_token') ||
                urlParams.get('jwt') ||
                urlParams.get('authorization')
  
  if (token) {
    // Bearer 접두사가 있다면 제거
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token
    
    localStorage.setItem('accessToken', cleanToken)
    
    // URL에서 토큰 파라미터 제거
    const url = new URL(window.location)
    url.searchParams.delete('token')
    url.searchParams.delete('accessToken')
    url.searchParams.delete('access_token')
    url.searchParams.delete('jwt')
    url.searchParams.delete('authorization')
    window.history.replaceState({}, document.title, url.pathname)
    
    return true
  }
  
  // URL에 code 파라미터가 있는 경우 (카카오 OAuth code)
  const code = urlParams.get('code')
  if (code) {
    // 먼저 URL에 토큰이 이미 있는지 확인 (백엔드에서 직접 토큰을 URL에 포함시킨 경우)
    const existingToken = urlParams.get('token') || 
                         urlParams.get('accessToken') || 
                         urlParams.get('access_token') ||
                         urlParams.get('jwt') ||
                         urlParams.get('authorization')
    
    if (existingToken) {
      const cleanToken = existingToken.startsWith('Bearer ') ? existingToken.substring(7) : existingToken
      localStorage.setItem('accessToken', cleanToken)
      
      // URL에서 모든 파라미터 제거
      const url = new URL(window.location)
      url.searchParams.delete('code')
      url.searchParams.delete('token')
      url.searchParams.delete('accessToken')
      url.searchParams.delete('access_token')
      url.searchParams.delete('jwt')
      url.searchParams.delete('authorization')
      window.history.replaceState({}, document.title, url.pathname)
      
      return true
    }
    
    // 백엔드에서 code를 JWT 토큰으로 교환하는 API 호출
    return exchangeCodeForToken(code)
  }
  
  return false
}

// 카카오 OAuth code를 JWT 토큰으로 교환
const exchangeCodeForToken = async (code) => {
  try {
    // 방법 1: GET 요청으로 직접 토큰 받기 (더 간단한 방법)
    const getResponse = await fetch(`https://odorok.duckdns.org/api/auth/oauth2/kakao?code=${code}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    })
    
    if (getResponse.ok) {
      const data = await getResponse.json()
      const token = data.accessToken || data.token || data.access_token
      
      if (token) {
        localStorage.setItem('accessToken', token)
        
        // URL에서 code 파라미터 제거
        const url = new URL(window.location)
        url.searchParams.delete('code')
        window.history.replaceState({}, document.title, url.pathname)
        
        return true
      }
    }
    
    // 방법 2: POST 요청으로 code를 토큰으로 교환
    const postResponse = await fetch('https://odorok.duckdns.org/api/auth/oauth2/kakao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: code })
    })
    
    if (postResponse.ok) {
      const data = await postResponse.json()
      const token = data.accessToken || data.token || data.access_token
      
      if (token) {
        localStorage.setItem('accessToken', token)
        
        // URL에서 code 파라미터 제거
        const url = new URL(window.location)
        url.searchParams.delete('code')
        window.history.replaceState({}, document.title, url.pathname)
        
        return true
      }
    }
    
    return false
    
  } catch (error) {
    return false
  }
}
export const refreshAccessToken = async () => {
  try {
    const response = await authClient.get('/auth/refresh-token')
    handleLoginResponse(response)
    return response
  } catch (error) {
    console.error('Token refresh failed:', error.response?.status, error.response?.statusText)
    throw error
  }
}

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)
    const jsonPayload = decodeURIComponent(Array.from(decoded).map(c => {
      const code = c.charCodeAt(0).toString(16).padStart(2, '0')
      return `%${code}`
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.warn('Failed to decode JWT payload:', error)
    return null
  }
}

export const getAuthUser = () => {
  const token = getAccessToken()
  return decodeJwtPayload(token)
}
