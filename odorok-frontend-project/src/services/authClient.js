// 인증 관련 Axios 인스턴스 생성 및 공통 설정 담당 (인증 전용 axios 인스턴스)

import axios from 'axios'

// 인증 전용 Axios 인스턴스
const authClient = axios.create({
  baseURL: 'https://odorok.duckdns.org/api',
  timeout: 30000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*'

  }
})

// 요청 인터셉터 - 토큰 자동 추가
authClient.interceptors.request.use(
  config => {
    // FormData를 사용할 때는 Content-Type을 자동으로 설정
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'] // 브라우저가 자동으로 multipart/form-data 설정
    }
    
    // 토큰이 있으면 헤더에 추가 (로그인 요청 제외)
    const token = localStorage.getItem('accessToken')
    if (token && !config.url?.includes('/login')) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 에러 처리
authClient.interceptors.response.use(
  response => response,
  error => {
    // 에러 로그는 필요한 경우에만 출력
    if (error.response?.status >= 500) {
      console.error('서버 오류:', error.response?.status, error.response?.statusText)
    }
    
    return Promise.reject(error)
  }
)

export default authClient
