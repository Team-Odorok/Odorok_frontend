import axios from 'axios'

// API 기본 설정
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://odorok.duckdns.org/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Accept': 'application/json'
  }
})

// 요청 인터셉터 - 토큰 자동 첨부
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API 요청 실패:', error)
    return Promise.reject(error)
  }
)

// 커뮤니티 API 함수들
export const communityApi = {
  // 게시글 목록 조회
  getArticles: async (params) => {
    try {
      console.log('📝 게시글 목록 조회 요청:', params)
      const response = await apiClient.get('/articles/search', { params })
      console.log('📝 게시글 목록 조회 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error)
      throw error
    }
  },

  // 게시글 상세 조회
  getArticle: async (articleId) => {
    try {
      console.log(`🔍 게시글 ${articleId} 상세 조회 시도...`)
      
      const token = localStorage.getItem('accessToken')
      console.log('🔑 현재 토큰:', token ? `${token.substring(0, 20)}...` : '없음')
      
      // fetch API로 직접 요청 (CSRF 문제 우회)
      const response = await fetch(`https://odorok.duckdns.org/api/articles/${articleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ 게시글 ${articleId} 상세 조회 성공!`, data)
        return data
      } else {
        console.log(`❌ 게시글 ${articleId} 상세 조회 실패: ${response.status}`)
        const errorText = await response.text()
        console.log('❌ 에러 응답:', errorText)
        throw new Error(`게시글 상세 조회 실패: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('게시글 상세 조회 실패:', error)
      throw error
    }
  },

  // 게시글 작성 (스웨거 명세에 맞춤)
  createArticle: async (articleData) => {
    try {
      console.log('📝 게시글 작성 시작')
      
      const token = localStorage.getItem('accessToken')
      console.log('🔑 현재 토큰:', token ? `${token.substring(0, 20)}...` : '없음')
      
      // FormData 생성 (data는 Blob, images는 파일)
      const formData = new FormData()
      
      // data 필드 (JSON을 Blob으로 감싸서 추가)
      const dataObject = {
        title: articleData.title,
        content: articleData.content,
        boardType: articleData.boardType || 3,
        notice: articleData.notice || false,
        diseaseId: articleData.diseaseId || 0,
        courseId: articleData.courseId || 0
      }
      formData.append(
        'data',
        new Blob([JSON.stringify(dataObject)], { type: 'application/json' })
      )
      
      // images 필드 (파일이 있을 때만 추가)
      if (articleData.images && articleData.images.length > 0) {
        articleData.images.forEach((file, index) => {
          formData.append('images', file)
        })
      }
      // 이미지가 없으면 append 생략
      
      console.log('📤 전송할 데이터:', {
        data: dataObject,
        images: articleData.images?.length || 0
      })
      
      // fetch API로 직접 요청 (multipart/form-data)
      const response = await fetch('https://odorok.duckdns.org/api/articles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
          // Content-Type은 FormData가 자동으로 multipart/form-data로 설정
        },
        credentials: 'include',
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ 게시글 작성 성공!', data)
        return data
      } else {
        console.log(`❌ 게시글 작성 실패: ${response.status}`)
        const errorText = await response.text()
        console.log('❌ 에러 응답:', errorText)
        throw new Error(`게시글 작성 실패: ${response.status} - ${errorText}`)
      }
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


  // 댓글 목록 조회
  getComments: async (articleId, page = 1) => {
    try {
      console.log(`💬 게시글 ${articleId} 댓글 목록 조회 시도...`)
      const response = await apiClient.get(`/articles/${articleId}/comments?page=${page}`)
      console.log(`✅ 게시글 ${articleId} 댓글 목록 조회 성공!`, response.data)
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

  // 댓글 수정
  updateComment: async (commentId, commentData) => {
    try {
      const response = await apiClient.put(`/comments/${commentId}`, commentData)
      return response.data
    } catch (error) {
      console.error('댓글 수정 실패:', error)
      throw error
    }
  },

  // 댓글 삭제
  deleteComment: async (commentId) => {
    try {
      const response = await apiClient.delete(`/comments/${commentId}`)
      return response.data
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
      throw error
    }
  },

  // 좋아요 추가 (스웨거 명세에 맞춤)
  addLike: async (articleId) => {
    try {
      console.log('👍 좋아요 추가 시도:', articleId)
      
      const token = localStorage.getItem('accessToken')
      console.log('🔑 현재 토큰:', token ? `${token.substring(0, 20)}...` : '없음')
      
      // 스웨거 명세: POST /api/articles/{articles-id}/likes
      const response = await fetch(`https://odorok.duckdns.org/api/articles/${articleId}/likes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({})
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ 좋아요 추가 성공:', data)
        return data
      } else {
        console.log(`❌ 좋아요 추가 실패: ${response.status}`)
        const errorText = await response.text()
        console.log('❌ 에러 응답:', errorText)
        throw new Error(`좋아요 추가 실패: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('좋아요 추가 실패:', error)
      throw error
    }
  },

  // 좋아요 취소 (스웨거 명세에 맞춤)
  removeLike: async (articleId) => {
    try {
      console.log('👎 좋아요 취소 시도:', articleId)
      
      const token = localStorage.getItem('accessToken')
      console.log('🔑 현재 토큰:', token ? `${token.substring(0, 20)}...` : '없음')
      
      // 스웨거 명세: POST /api/articles/{articles-id}/unlikes
      const response = await fetch(`https://odorok.duckdns.org/api/articles/${articleId}/unlikes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({})
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ 좋아요 취소 성공:', data)
        return data
      } else {
        console.log(`❌ 좋아요 취소 실패: ${response.status}`)
        const errorText = await response.text()
        console.log('❌ 에러 응답:', errorText)
        throw new Error(`좋아요 취소 실패: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('좋아요 취소 실패:', error)
      throw error
    }
  }
}

export default communityApi
