// 다이어리 관련 API 호출 모듈
// 토큰은 axios 요청 인터셉터에서 자동으로 헤더에 붙음

import axios from 'axios'
// 아래 getAccessToken을 이용해 토큰을 가져옴
import { getAccessToken } from './authService'

// 일지 관련 API 서비스
const API_BASE_URL = 'https://odorok.duckdns.org/api'

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 쿠키 포함
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // FormData인 경우 Content-Type 헤더를 제거하여 axios가 자동으로 multipart/form-data로 설정하도록 함
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

export default apiClient

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  response => response.data, // 자동으로 data만 반환
  error => {
    if (error.response?.status === 401) {
      // TODO: 토큰 갱신 또는 로그인 페이지로 리다이렉트
    } else if (error.response?.status === 403) {
      // TODO: 권한 부족 처리
    }
    
    return Promise.reject(error)
  }
)

// 일지 목록 조회
export const getDiaryList = async (groupBy) => {
  try {
    const response = await apiClient.get(`/diaries?groupBy=${groupBy}`)
    return response
  } catch (error) {
    console.error('Failed to fetch diary list:', error)
    throw error
  }
}

// 일지 상세 조회
export const getDiaryDetail = async (diaryId) => {
  try {
    const response = await apiClient.get(`/diaries/${diaryId}`)
    
    // API 응답 구조에 따른 에러 처리
    if (response.status === 401) {
      throw new Error('인증이 필요합니다. 로그인을 다시 해주세요.')
    } else if (response.status === 403) {
      throw new Error('해당 일지에 접근할 수 없습니다.')
    } else if (response.status === 404) {
      throw new Error('해당 일지를 찾을 수 없습니다.')
    } else if (response.status === 500) {
      throw new Error('일지 조회 중 예외 발생')
    }
    
    return response
  } catch (error) {
    throw error
  }
}

// 일지 생성 (향후 구현)
export const createDiary = async (diaryData) => {
  try {
    const response = await apiClient.post('/diaries', diaryData)
    return response
  } catch (error) {
    console.error('Failed to create diary:', error)
    throw error
  }
}

// 일지 수정 (향후 구현)
export const updateDiary = async (diaryId, diaryData) => {
  try {
    const response = await apiClient.put(`/diaries/${diaryId}`, diaryData)
    return response
  } catch (error) {
    console.error('Failed to update diary:', error)
    throw error
  }
}

// 일지 삭제
export const deleteDiary = async (diaryId) => {
  try {
    const response = await apiClient.delete(`/diaries/${diaryId}`)
    
    // 성공 응답 처리
    if (response.status === 200 || response.status === 204) {
      return response
    }
    
    // API 응답 구조에 따른 에러 처리
    if (response.status === 401) {
      throw new Error('인증이 필요합니다. 로그인을 다시 해주세요.')
    } else if (response.status === 403) {
      throw new Error('해당 일지를 삭제할 권한이 없습니다. 본인이 작성한 일지만 삭제할 수 있습니다.')
    } else if (response.status === 404) {
      throw new Error('해당 일지를 찾을 수 없습니다.')
    } else if (response.status === 500) {
      throw new Error('서버 내부 오류가 발생했습니다.')
    }
    
    return response
  } catch (error) {
    throw error
  }
}

// 일지 생성 권한 조회
export const getDiaryPermissions = async () => {
  try {
    const endpoint = '/diaries/permission'
    const response = await apiClient.get(endpoint)
    
    // API 응답 구조에 따른 에러 처리
    if (response.status === 'UNAUTHORIZED') {
      throw new Error('AccessToken이 유효하지 않습니다.')
    } else if (response.status === 'INTERNAL_SERVER_ERROR') {
      throw new Error('일지 생성 가능 여부 조회 중 예외 발생')
    }
    
    // 성공 응답인 경우 data 필드에서 권한 정보 반환
    if (response.status === 'success' && response.data) {
      return response.data
    }
    
    return response
    
  } catch (error) {
    console.error('Failed to get diary permissions:', error)
    // 권한 확인 실패 시에도 기본적으로 일지 생성 허용
    return { canCreateDiary: true }
  }
}

// 일지 생성 시작
export const startDiaryGeneration = async (visitedCourseId, style) => {
  try {
    // 스웨거에서 확인한 정확한 엔드포인트 사용 (GET 요청)
    const endpoint = `/diaries/generation/${visitedCourseId}`
    
    console.log(`일지 생성 시도 중: ${endpoint}`)
    const params = style ? { style } : {}
    const response = await apiClient.get(endpoint, { params })
    console.log(`${endpoint} 성공:`, response)
    
    // API 응답 구조에 따른 에러 처리
    if (response.status === 'UNAUTHORIZED') {
      throw new Error('AccessToken이 유효하지 않습니다.')
    } else if (response.status === 'INTERNAL_SERVER_ERROR') {
      throw new Error('일지 생성 시작 중 예외 발생')
    }
    
    return response
  } catch (error) {
    console.error('Failed to start diary generation:', error)
    throw error
  }
}

// 답변 제출
export const submitAnswer = async (answer, chatLog) => {
  try {
    const requestData = {
      answer: answer,
      chatLog: chatLog
    }
    
    console.log('답변 제출 시도 중:', requestData)
    const response = await apiClient.post('/diaries/answers', requestData)
    console.log('답변 제출 성공:', response)
    
    // API 응답 구조에 따른 에러 처리
    if (response.status === 'BAD_REQUEST') {
      throw new Error('answer와 chatLog는 필수입니다.')
    } else if (response.status === 'UNAUTHORIZED') {
      throw new Error('AccessToken이 유효하지 않습니다.')
    } else if (response.status === 'INTERNAL_SERVER_ERROR') {
      throw new Error('일지 생성 대화 중 예외 발생')
    }
    
    return response
  } catch (error) {
    console.error('Failed to submit answer:', error)
    throw error
  }
}

// 일지 최종 저장
export const saveDiary = async (title, content, images = [], visitedCourseId = null) => {
  try {
    if (!visitedCourseId) {
      throw new Error('visitedCourseId는 필수입니다.')
    }
    
    // API 스펙에 맞게 FormData로 구성
    const formData = new FormData()
    
    // diary 객체를 JSON 문자열로 변환하여 FormData에 추가 (application/json)
    const diaryData = {
      vcourseId: parseInt(visitedCourseId),
      title: title,
      content: content
    }
    
    // diary 필드를 JSON 문자열로 추가 (application/json 타입)
    const diaryBlob = new Blob([JSON.stringify(diaryData)], { type: 'application/json' })
    formData.append('diary', diaryBlob)
    
    // 이미지 파일들을 FormData에 추가 (각각 타입 지정)
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        if (image instanceof File) {
          // 이미지 타입 지정
          const imageType = image.type || 'image/jpeg'
          const imageBlob = new Blob([image], { type: imageType })
          formData.append('images', imageBlob, image.name)
        }
      })
    }
    
    const response = await apiClient.post('/diaries', formData)
    
    // 성공 응답 처리
    if (response.status === 200 || response.status === 201) {
      return response
    }
    
    // API 응답 구조에 따른 에러 처리
    if (response.status === 400) {
      throw new Error('잘못된 요청입니다. title, content, vcourseId를 확인해주세요.')
    } else if (response.status === 401) {
      throw new Error('인증이 필요합니다. 로그인을 다시 해주세요.')
    } else if (response.status === 403) {
      throw new Error('접근 권한이 없습니다.')
    } else if (response.status === 404) {
      throw new Error('요청한 리소스를 찾을 수 없습니다.')
    } else if (response.status === 500) {
      throw new Error('서버 내부 오류가 발생했습니다.')
    }
    
    return response
  } catch (error) {
    throw error
  }
}

// 사용 가능한 코스 목록 조회
export const getAvailableCourses = async () => {
  try {
    const endpoint = '/diaries/available-course'
    const response = await apiClient.get(endpoint)
    
    // 응답 데이터 구조 확인 및 정규화
    if (response && response.data) {
      // 스웨거 응답 구조: { status: "success", message: "...", data: { response: [] } }
      if (response.data.response && Array.isArray(response.data.response)) {
        return response.data.response
      }
      // data가 배열인 경우 그대로 반환
      if (Array.isArray(response.data)) {
        return response.data
      }
      // data가 객체인 경우 values 추출
      if (typeof response.data === 'object') {
        const values = Object.values(response.data)
        return Array.isArray(values[0]) ? values.flat() : values
      }
    }
    
    return response
  } catch (error) {
    console.error('Failed to get available courses:', error)
    throw error
  }
}

// 일지 재생성 (regenerateDiary로도 export)
export const regenerateDiary = async (feedback = '', chatLog = []) => {
  try {
    const requestData = {
      feedback: feedback, // 사용자 추가 요구사항 (선택사항)
      chatLog: chatLog // 이전까지 대화 로그 (필수)
    }
    
    console.log('일지 재생성 API 요청:', requestData)
    console.log('요청 데이터 상세:')
    console.log('- feedback:', requestData.feedback)
    console.log('- chatLog 길이:', requestData.chatLog.length)
    console.log('- chatLog 내용:', requestData.chatLog)
    
    const response = await apiClient.post('/diaries/regeneration', requestData)
    console.log('일지 재생성 API 응답:', response)
    console.log('응답 상태:', response.status)
    console.log('응답 데이터:', response.data)
    
    // API 응답 구조에 따른 에러 처리
    if (response.status === 'BAD_REQUEST') {
      throw new Error('chatLog는 필수입니다.')
    } else if (response.status === 'UNAUTHORIZED') {
      throw new Error('AccessToken이 유효하지 않습니다.')
    } else if (response.status === 'INTERNAL_SERVER_ERROR') {
      throw new Error('일지 재생성 중 예외 발생')
    }
    
    return response
  } catch (error) {
    console.error('Failed to regenerate diary:', error)
    throw error
  }
}

// API 연결 테스트
export const testApiConnection = async () => {
  try {
    console.log('API 연결 테스트 시작...')
    console.log('서버 주소:', 'http://odorok.duckdns.org:8080')
    console.log('현재 토큰:', getAccessToken() ? '있음' : '없음')
    
    // GET 메서드만 사용하는 엔드포인트들 테스트
    const endpoints = [
      '/health',
      '/api/health',
      '/api/diaries',
      '/api/courses/available'
    ]
    
    for (const endpoint of endpoints) {
      try {
        console.log(`테스트 중: ${endpoint}`)
        const response = await axios.get(endpoint)
        console.log(`${endpoint} 연결 성공:`, response.status)
      } catch (error) {
        console.log(`${endpoint} 연결 실패:`, error.response?.status, error.response?.statusText)
      }
    }
    
    return '테스트 완료'
  } catch (error) {
    console.error('API 연결 테스트 실패:', error)
    throw error
  }
}

// 일지 생성권 구매
export const purchaseDiaryCreateItems = async (quantity) => {
  try {
    console.log(`일지 생성권 구매 시도 중: quantity=${quantity}`)
    
    const response = await apiClient.post(`/diaries/diary-create-items?quantity=${quantity}`)
    console.log('일지 생성권 구매 성공:', response)
    
    // API 응답 구조에 따른 에러 처리
    if (response.status === 'UNAUTHORIZED') {
      throw new Error('AccessToken이 유효하지 않습니다.')
    } else if (response.status === 'BAD_REQUEST') {
      throw new Error('잘못된 요청입니다. 수량을 확인해주세요.')
    } else if (response.status === 'FORBIDDEN') {
      throw new Error('일지 생성권 구매 권한이 없습니다.')
    } else if (response.status === 'INTERNAL_SERVER_ERROR') {
      throw new Error('일지 생성권 구매 중 예외 발생')
    }
    
    return response
  } catch (error) {
    console.error('Failed to purchase diary create items:', error)
    throw error
  }
} 