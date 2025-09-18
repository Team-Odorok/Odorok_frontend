import axios from 'axios'

// API 기본 설정 (환경변수 우선, 기본값 fallback)
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Accept': 'application/json'
  }
})

// CSRF 해제로 인해 더 이상 필요 없음
// const csrfClient = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 10000,
//   withCredentials: false,
//   headers: {
//     'Accept': 'application/json'
//   }
// })

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // Authorization 자동 첨부
    try {
      const raw = localStorage.getItem('accessToken') || localStorage.getItem('token')
      const token = raw?.replace(/^Bearer\s+/i, '')
      if (token) {
        if (config.headers && typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`)
        } else {
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${token}`
        }
        if (import.meta.env && import.meta.env.DEV) {
          try {
            // 토큰 문자열은 출력하지 않음(보안)
            console.log('[communityApi] Authorization attached →', !!token, 'URL:', config.url)
          } catch (_) {}
        }
      } else if (import.meta.env && import.meta.env.DEV) {
        console.warn('[communityApi] Authorization 토큰이 비어있습니다. URL:', config.url)
      }

      // CSRF 쿠키가 있으면 헤더로 함께 전송 (양쪽 헤더명 모두 시도)
      try {
        const xsrfMatch = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)
        const xsrfToken = xsrfMatch ? decodeURIComponent(xsrfMatch[1]) : null
        if (xsrfToken) {
          if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set('X-XSRF-TOKEN', xsrfToken)
            config.headers.set('X-CSRF-TOKEN', xsrfToken)
          } else {
            config.headers = config.headers || {}
            config.headers['X-XSRF-TOKEN'] = xsrfToken
            config.headers['X-CSRF-TOKEN'] = xsrfToken
          }
        }
      } catch (_) {}
    } catch (_) {}
    return config
  },
  (error) => Promise.reject(error)
)

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API 요청 실패:', error)
    if (error.response) {
      console.error('서버 응답 에러:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url
      })
    }
    return Promise.reject(error)
  }
)

// CSRF 해제로 인해 더 이상 필요 없음

// 커뮤니티 API 함수들
export const communityApi = {
  // 게시글 목록 조회 (API 명세에 맞춤)
  getArticles: async (params) => {
    try {
      console.log('📝 게시글 목록 조회 요청:', params)
      const response = await apiClient.get('/articles/search', {
        params: params
      })
      console.log('📝 게시글 목록 조회 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error)
      throw error
    }
  },

  getArticlesByDisease: async (payload) => {
    try {
      const response = await apiClient.post('/articles/diseases', payload)
      return response.data
    } catch (error) {
      console.error('질병 추천 게시글 조회 실패:', error)
      throw error
    }
  },

  // 게시글 상세 조회
  getArticle: async (articleId) => {
    try {
      const token = localStorage.getItem('accessToken')
      console.log(`🔍 게시글 ${articleId} 상세 조회 시도...`)
      
      // fetch API로 직접 요청 (CSRF 문제 우회)
      const response = await fetch(`https://odorok.duckdns.org/api/articles/${articleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ 게시글 ${articleId} 상세 조회 성공!`, data)
        return data
      } else {
        console.log(`❌ 게시글 ${articleId} 상세 조회 실패: ${response.status}`)
        throw new Error(`게시글 상세 조회 실패: ${response.status}`)
      }
    } catch (error) {
      console.error('게시글 상세 조회 실패:', error)
      throw error
    }
  },

    // 게시글 작성 (Swagger 문서 기준)
    createArticle: async (articleData) => {
      try {
        console.log('📝 게시글 작성 시작')
        
        // Swagger 문서에 맞는 바디 형식으로 변환
        const requestBody = {
          data: {
            title: articleData.title,
            content: articleData.content,
            boardType: articleData.boardType || 1,
            notice: articleData.notice || false,
            diseaseId: articleData.diseaseId || null,
            courseId: articleData.courseId || null
          },
          images: articleData.images || []
        }
        
        console.log('📤 전송할 데이터:', requestBody)
        
        const response = await apiClient.post('/articles', requestBody)
        console.log('✅ 게시글 작성 성공!', response.data)
        return response.data
      } catch (error) {
        console.error('게시글 작성 실패:', error)
        throw error
      }
    },

  // 게시글 수정
  updateArticle: async (articleId, articleData) => {
    try {
      const response = await apiClient.put(`/articles/${articleId}`, articleData)
      return response.data
    } catch (error) {
      console.error('게시글 수정 실패:', error)
      throw error
    }
  },

  // 게시글 삭제
  deleteArticle: async (articleId) => {
    try {
      const response = await apiClient.delete(`/articles/${articleId}`)
      return response.data
    } catch (error) {
      console.error('게시글 삭제 실패:', error)
      throw error
    }
  },

  // 좋아요 토글
  toggleLike: async (articleId) => {
    try {
      const response = await apiClient.post(`/articles/${articleId}/likes`, {})
      return response.data
    } catch (error) {
      console.error('좋아요 토글 실패:', error)
      throw error
    }
  },
  // 좋아요 취소
  unlikeArticle: async (articleId) => {
    try {
      const response = await apiClient.post(`/articles/${articleId}/unlikes`, {})
      return response.data
    } catch (error) {
      console.error('좋아요 취소 실패:', error)
      throw error
    }
  },

  // 댓글 목록 조회
  getComments: async (articleId, page = 1) => {
    try {
      const token = localStorage.getItem('accessToken')
      console.log(`💬 게시글 ${articleId} 댓글 목록 조회 시도...`)
      
      const response = await fetch(`https://odorok.duckdns.org/api/articles/${articleId}/comments?page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ 게시글 ${articleId} 댓글 목록 조회 성공!`, data)
        return data
      } else {
        console.log(`❌ 게시글 ${articleId} 댓글 목록 조회 실패: ${response.status}`)
        throw new Error(`댓글 목록 조회 실패: ${response.status}`)
      }
    } catch (error) {
      console.error('댓글 목록 조회 실패:', error)
      throw error
    }
  },

  // 댓글 작성
  createComment: async (articleId, commentData) => {
    try {
      const response = await apiClient.post(`/articles/${articleId}/comments`, commentData)
      return response.data
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      throw error
    }
  },

  // 댓글 수정 (PUT /comments/{commentId})
  updateComment: async (commentId, commentData) => {
    try {
      const response = await apiClient.put(`/comments/${commentId}`, commentData)
      return response.data
    } catch (error) {
      console.error('댓글 수정 실패:', error)
      throw error
    }
  },

  // 댓글 삭제 (DELETE /comments/{commentId})
  deleteComment: async (commentId) => {
    try {
      const response = await apiClient.delete(`/comments/${commentId}`)
      return response.data
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
      throw error
    }
  }
}

export default communityApi 
