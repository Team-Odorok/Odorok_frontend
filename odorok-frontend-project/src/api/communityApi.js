import axios from 'axios'

// API 기본 설정 (환경변수 우선, 기본값 fallback)
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// CSRF 획득용(Authorization 자동첨부 금지)
const csrfClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

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

// CSRF 쿠키 보장 유틸
const hasXsrfCookie = () => {
  try {
    return /(?:^|; )XSRF-TOKEN=/.test(document.cookie)
  } catch (_) {
    return false
  }
}

const ensureCsrfCookie = async () => {
  if (hasXsrfCookie()) return
  const csrfPaths = [
    import.meta.env?.VITE_CSRF_URL || '/csrf',
    '/sanctum/csrf-cookie',
    // 마지막 fallback: 리스트 조회(서버에서 토큰 내려주는 경우만 효과)
    '/articles/search'
  ]
  for (const p of csrfPaths) {
    try {
      await csrfClient.get(p, { params: { _t: Date.now() } })
      if (hasXsrfCookie()) return
    } catch (_) {
      // 다음 후보 시도
    }
  }
}

// 커뮤니티 API 함수들
export const communityApi = {
  // 게시글 목록 조회 (API 명세에 맞춤)
  getArticles: async (params) => {
    try {
      const response = await apiClient.get('/articles/search', {
        params: params
      })
      return response.data
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error)
      throw error
    }
  },

  // 게시글 상세 조회
  getArticle: async (articleId) => {
    try {
      const response = await apiClient.get(`/articles/${articleId}`)
      return response.data
    } catch (error) {
      console.error('게시글 상세 조회 실패:', error)
      throw error
    }
  },

  // 게시글 작성
  createArticle: async (articleData) => {
    try {
      if (!hasXsrfCookie()) await ensureCsrfCookie()
      // FormData일 경우 Content-Type은 브라우저가 boundary 포함해 자동 설정하도록 둡니다.
      const response = await apiClient.post('/articles', articleData)
      return response.data
    } catch (error) {
      // 1회 재시도(403/CSRF 의심 시)
      if (error?.response?.status === 403) {
        try {
          await ensureCsrfCookie()
          const retry = await apiClient.post('/articles', articleData)
          return retry.data
        } catch (e) {}
      }
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
      if (!hasXsrfCookie()) await ensureCsrfCookie()
      // 일부 백엔드는 빈 바디라도 JSON을 기대할 수 있음 → {}
      const response = await apiClient.post(`/articles/${articleId}/likes`, {})
      return response.data
    } catch (error) {
      if (error?.response?.status === 403) {
        try {
          await ensureCsrfCookie()
          const retry = await apiClient.post(`/articles/${articleId}/likes`, {})
          return retry.data
        } catch (e) {}
      }
      console.error('좋아요 토글 실패:', error)
      throw error
    }
  },

  // 댓글 목록 조회
  getComments: async (articleId, page = 1) => {
    try {
      const response = await apiClient.get(`/articles/${articleId}/comments`, { params: { page } })
      return response.data
    } catch (error) {
      console.error('댓글 목록 조회 실패:', error)
      throw error
    }
  },

  // 댓글 작성
  createComment: async (articleId, commentData) => {
    try {
      if (!hasXsrfCookie()) await ensureCsrfCookie()
      const response = await apiClient.post(`/articles/${articleId}/comments`, commentData)
      return response.data
    } catch (error) {
      if (error?.response?.status === 403) {
        try { await ensureCsrfCookie(); const retry = await apiClient.post(`/articles/${articleId}/comments`, commentData); return retry.data } catch (_) {}
      }
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