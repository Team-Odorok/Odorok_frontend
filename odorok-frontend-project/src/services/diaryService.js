// 일지 관련 API 서비스
const API_BASE_URL = '/api'

// JWT 토큰 가져오기 (실제 구현에서는 store나 localStorage에서 가져옴)
const getAccessToken = () => {
  // TODO: 실제 토큰 관리 로직으로 교체
  return localStorage.getItem('accessToken') || 'mock-token'
}

// API 요청 헬퍼 함수
const apiRequest = async (endpoint, options = {}) => {
  const token = getAccessToken()
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('AccessToken이 유효하지 않습니다.')
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// 일지 목록 조회
export const getDiaryList = async (groupBy = null) => {
  try {
    const params = new URLSearchParams()
    if (groupBy) {
      params.append('groupBy', groupBy)
    }
    
    const endpoint = `/diaries${params.toString() ? `?${params.toString()}` : ''}`
    const response = await apiRequest(endpoint)
    
    return response
  } catch (error) {
    console.error('Failed to fetch diary list:', error)
    throw error
  }
}

// 일지 상세 조회
export const getDiaryDetail = async (diaryId) => {
  try {
    const response = await apiRequest(`/diaries/${diaryId}`)
    
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
    const response = await apiRequest('/diaries', {
      method: 'POST',
      body: JSON.stringify(diaryData)
    })
    return response
  } catch (error) {
    console.error('Failed to create diary:', error)
    throw error
  }
}

// 일지 수정 (향후 구현)
export const updateDiary = async (diaryId, diaryData) => {
  try {
    const response = await apiRequest(`/diaries/${diaryId}`, {
      method: 'PUT',
      body: JSON.stringify(diaryData)
    })
    return response
  } catch (error) {
    console.error('Failed to update diary:', error)
    throw error
  }
}

// 일지 삭제 (향후 구현)
export const deleteDiary = async (diaryId) => {
  try {
    const response = await apiRequest(`/diaries/${diaryId}`, {
      method: 'DELETE'
    })
    return response
  } catch (error) {
    console.error('Failed to delete diary:', error)
    throw error
  }
}

// 일지 생성 권한 조회
export const getDiaryPermissions = async () => {
  try {
    const response = await apiRequest('/diaries/permissions')
    
    // API 응답 구조에 따른 에러 처리
    if (response.status === 'UNAUTHORIZED') {
      throw new Error('AccessToken이 유효하지 않습니다.')
    } else if (response.status === 'INTERNAL_SERVER_ERROR') {
      throw new Error('일지 생성 가능 여부 조회 중 예외 발생')
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
    const params = new URLSearchParams()
    if (style) {
      params.append('style', style)
    }
    
    const endpoint = `/diaries/generation/${visitedCourseId}${params.toString() ? `?${params.toString()}` : ''}`
    const response = await apiRequest(endpoint)
    
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
    const response = await apiRequest('/diaries/answers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        answer: answer,
        chatLog: chatLog
      })
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

// 일지 재생성
export const regenerateDiaryAPI = async (feedback = '', chatLog = []) => {
  try {
    const response = await apiRequest('/diaries/regeneration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        feedback: feedback, // 사용자 추가 요구사항 (선택사항)
        chatLog: chatLog // 이전까지 대화 로그 (필수)
      })
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
    
    const response = await apiRequest('/diaries', {
      method: 'POST',
      headers: {
        // multipart/form-data는 브라우저가 자동으로 설정
      },
      body: formData
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