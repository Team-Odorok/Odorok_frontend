import axios from 'axios'

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL
if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL이 설정되지 않았습니다.')
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
    const res = await api.get('/attendances', { params: { year, month } })
    return res.data
  },
  // 오늘 출석 생성
  createToday: async () => {
    const res = await api.post('/attendances')
    return res.data
  }
}

export default attendanceApi


