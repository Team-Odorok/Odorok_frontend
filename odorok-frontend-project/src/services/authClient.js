// 인증 관련 Axios 인스턴스 생성 및 공통 설정 담당 (인증 전용 axios 인스턴스)

import axios from 'axios'

// 인증 전용 Axios 인스턴스
const authClient = axios.create({
  baseURL: 'http://18.208.139.237:8080', // 올바른 서버 주소로 변경
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터 - 토큰 자동 추가
authClient.interceptors.request.use(
  config => {
    // FormData를 사용할 때는 Content-Type을 자동으로 설정
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'] // 브라우저가 자동으로 multipart/form-data 설정
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 에러 처리
authClient.interceptors.response.use(
  response => response, // 전체 응답을 반환하도록 수정
  error => {
    console.error('Auth API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    })
    
    if (error.response?.status === 401) {
      console.error('인증 실패 - 잘못된 사용자 정보')
    } else if (error.response?.status === 403) {
      console.error('접근 권한 없음')
    }
    
    return Promise.reject(error)
  }
)

export default authClient
