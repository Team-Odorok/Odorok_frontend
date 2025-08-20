// 다이어리 관련 API 호출 모듈
// 토큰은 axios 요청 인터셉터에서 자동으로 헤더에 붙음

import axios from 'axios'
// 아래 getAccessToken을 이용해 토큰을 가져옴
import { getAccessToken } from './authService'

// 일지 관련 API 서비스
const API_BASE_URL = 'http://18.208.139.237:8080/api'

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  config => {
     // 하드코딩 하지 않고 로컬스토리지에서 토큰을 자동으로 가져와서 Authorization 헤더에 넣음
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('토큰이 헤더에 추가되었습니다.')
    }
    else {
      console.warn('AccessToken이 없습니다. 로그인 후 토큰을 저장하세요.')
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default apiClient

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  response => response.data, // 자동으로 data만 반환
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    })
    
    if (error.response?.status === 401) {
      console.error('AccessToken이 유효하지 않습니다.')
      // TODO: 토큰 갱신 또는 로그인 페이지로 리다이렉트
    } else if (error.response?.status === 403) {
      console.error('접근 권한이 없습니다. (403 Forbidden)')
      // TODO: 권한 부족 처리
    } else if (error.response?.status === 404) {
      console.error('요청한 리소스를 찾을 수 없습니다. (404 Not Found)')
    } else if (error.response?.status >= 500) {
      console.error('서버 내부 오류가 발생했습니다.')
    }
    
    return Promise.reject(error)
  }
)

// 일지 목록 조회
export const getDiaryList = (groupBy) => {
  return apiClient.get(`/diaries?groupBy=${groupBy}`)  // ✅ 토큰 자동 첨부됨
}

// 일지 상세 조회
export const getDiaryDetail = async (diaryId) => {
  try {
    const response = await apiClient.get(`/diaries/${diaryId}`)
    
    // API 응답 구조에 따른 에러 처리
    if (response.status === 'UNAUTHORIZED') {
      throw new Error('AccessToken이 유효하지 않습니다.')
    } else if (response.status === 'FORBIDDEN') {
      throw new Error('해당 일지에 접근할 수 없습니다.')
    } else if (response.status === 'NOT_FOUND') {
      throw new Error('해당 일지를 찾을 수 없습니다.')
    } else if (response.status === 'INTERNAL_SERVER_ERROR') {
      throw new Error('일지 조회 중 예외 발생')
    }
    
    return response
  } catch (error) {
    console.error('Failed to fetch diary detail:', error)
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

// 일지 삭제 (향후 구현)
export const deleteDiary = async (diaryId) => {
  try {
    const response = await apiClient.delete(`/diaries/${diaryId}`)
    return response
  } catch (error) {
    console.error('Failed to delete diary:', error)
    throw error
  }
}

// 일지 생성 권한 조회
export const getDiaryPermissions = async () => {
  try {
    const response = await apiClient.get('/diaries/permission')
    
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
    throw error
  }
}

// 일지 생성 시작
export const startDiaryGeneration = async (visitedCourseId, style) => {
  try {
    const params = style ? { style } : {}
    const response = await apiClient.post(`/diaries/generation/${visitedCourseId}`, null, { params })
    
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
    const response = await apiClient.post('/diaries/answers', {
      answer: answer,
      chatLog: chatLog
    })
    
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
export const saveDiary = async (title, content, images = []) => {
  try {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    
    // 이미지 파일들 추가
    images.forEach((image, index) => {
      formData.append('images', image)
    })
    
    const response = await apiClient.post('/diaries', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    // API 응답 구조에 따른 에러 처리
    if (response.status === 'BAD_REQUEST') {
      throw new Error('title과 content는 필수입니다.')
    } else if (response.status === 'UNAUTHORIZED') {
      throw new Error('AccessToken이 유효하지 않습니다.')
    } else if (response.status === 'NOT_FOUND') {
      throw new Error('해당 draftDiaryId를 찾을 수 없습니다.')
    } else if (response.status === 'INTERNAL_SERVER_ERROR') {
      throw new Error('일지 생성 중 예외 발생')
    }
    
    return response
  } catch (error) {
    console.error('Failed to save diary:', error)
    throw error
  }
}

// 사용 가능한 코스 목록 조회
export const getAvailableCourses = async () => {
  try {
    const response = await apiClient.get('/courses/available')
    return response
  } catch (error) {
    console.error('Failed to get available courses:', error)
    throw error
  }
}

// 일지 재생성 (regenerateDiary로도 export)
export const regenerateDiary = async (feedback = '', chatLog = []) => {
  try {
    const response = await apiClient.post('/diaries/regeneration', {
      feedback: feedback, // 사용자 추가 요구사항 (선택사항)
      chatLog: chatLog // 이전까지 대화 로그 (필수)
    })
    
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
    console.log('서버 주소:', 'http://18.208.139.237:8080')
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