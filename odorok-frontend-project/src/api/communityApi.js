import axios from 'axios'

// API 기본 설정 (환경변수 우선, 기본값 fallback)
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://odorok.duckdns.org'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // ngrok 사용 시 헤더 추가
    if (config.baseURL && config.baseURL.includes('ngrok')) {
      config.headers['ngrok-skip-browser-warning'] = 'true'
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
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
      const response = await apiClient.post('/articles', articleData)
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
      const response = await apiClient.post(`/articles/${articleId}/like`)
      return response.data
    } catch (error) {
      console.error('좋아요 토글 실패:', error)
      throw error
    }
  },

  // 댓글 목록 조회
  getComments: async (articleId, page = 1) => {
    try {
      const response = await apiClient.get(`/articles/${articleId}/comments`, {
        params: { page }
      })
      return response.data
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

  // 댓글 삭제 (API 명세에 맞춤)
  deleteComment: async (articleId, commentData) => {
    try {
      const response = await apiClient.delete(`/articles/${articleId}/comments`, {
        data: commentData
      })
      return response.data
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
      throw error
    }
  }
}

export default communityApi 