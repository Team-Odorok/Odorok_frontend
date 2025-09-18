import axios from 'axios'

const DEFAULT_BASE_URL = 'https://odorok.duckdns.org/api'
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/,'')

const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: false,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*'
  }
})

// CSRF 토큰 확보 함수 (작동하는 API 경로 사용)
const ensureCsrfCookie = async () => {
  try {
    const hasXsrfCookie = () => /(?:^|; )XSRF-TOKEN=/.test(document.cookie)
    if (hasXsrfCookie()) return
    
    // 작동하는 API 경로들로 CSRF 토큰 확보 시도
    const csrfPaths = [
      '/diaries/available-course',  // ✅ 작동 확인됨
      '/courses/user-region'        // ✅ 작동 확인됨
    ]
    
    for (const path of csrfPaths) {
      try {
        await axios.get(`${API_BASE_URL}${path}`, {
          withCredentials: false,
          headers: { 
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
        if (hasXsrfCookie()) return
      } catch (_) {
        // 다음 후보 시도
      }
    }
  } catch (_) {
    // CSRF 토큰 확보 실패해도 요청은 계속 진행
  }
}

authClient.interceptors.request.use(
  config => {
    // FormData일 경우 Content-Type 제거
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    // Authorization 토큰 추가
    const token = localStorage.getItem('accessToken')
    if (token && !config.url?.includes('/auth/login')) {
      config.headers.Authorization = 'Bearer ' + token
    }

    // 디버깅용 요청 로그
    console.log('🔍 요청 디버깅:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      withCredentials: config.withCredentials,
      token: token ? `${token.substring(0, 20)}...` : '없음'
    })

    return config
  },
  error => Promise.reject(error)
)

authClient.interceptors.response.use(
  response => response,
  error => {
    // 디버깅용 응답 에러 로그
    console.log('❌ 응답 에러 디버깅:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.response?.headers,
      data: error.response?.data,
      requestHeaders: error.config?.headers
    })

    if (error.response?.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      console.warn('인증이 만료되었습니다. 로그아웃 처리합니다.')
      localStorage.removeItem('accessToken')
      
      // 현재 페이지가 로그인 페이지가 아닌 경우에만 로그인 페이지로 리다이렉트
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.status, error.response?.statusText)
    }

    return Promise.reject(error)
  }
)

export default authClient
