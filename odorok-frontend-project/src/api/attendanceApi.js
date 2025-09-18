import axios from 'axios'

// 환경변수가 없으면 기본값 사용
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://odorok.duckdns.org:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 타임아웃을 30초로 증가
  withCredentials: true,
  headers: { 'Accept': 'application/json' }
})

// Authorization 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`)
    } else {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }
  return config
})

const attendanceApi = {
  // 월 단위 출석 조회
  getMonthly: async (year, month) => {
    try {
      const res = await api.get('/attendances', { params: { year, month } })
      return res.data
    } catch (error) {
      console.error('출석 월 조회 API 호출 실패:', error.message)
      throw error
    }
  },
  // 오늘 출석 생성
  createToday: async () => {
    try {
      const res = await api.post('/attendances')
      return res.data
    } catch (error) {
      console.error('출석 생성 API 호출 실패:', error.message)
      throw error
    }
  }
}

export default attendanceApi


