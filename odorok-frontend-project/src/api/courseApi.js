import axios from 'axios';

// 환경변수로 API URL 관리 (개발/운영 환경 분리)
// 기본값을 '/api'로 두어 프록시를 통해 백엔드로 전달되도록 함
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json'
  },
  timeout: 10000,
  withCredentials: false,
  // 요청 중복 방지를 위한 설정
  maxRedirects: 0,
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  }
});

// 요청 중복 방지를 위한 캐시
const requestCache = new Map();
const pendingRequests = new Map();

// 새로고침 시 요청 정리를 위한 플래그
let isRefreshing = false;

// 요청 인터셉터 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    if (token) {
      // axios v1에서 headers가 AxiosHeaders일 수도 있어 set 사용
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`)
      } else {
        config.headers = config.headers || {}
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    if (isRefreshing) {
      return Promise.reject(new Error('새로고침 중 요청 취소'))
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 응답 인터셉터 추가
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      console.warn('인증이 만료되었습니다. 로그아웃 처리합니다.')
      localStorage.removeItem('accessToken')
      
      // 현재 페이지가 로그인 페이지가 아닌 경우에만 로그인 페이지로 리다이렉트
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.status, error.response?.statusText)
    }

    return Promise.reject(error)
  }
)

// 새로고침 감지 및 요청 정리
const handleBeforeUnload = () => {
  isRefreshing = true;
  // 모든 진행 중인 요청 취소
  pendingRequests.clear();
  requestCache.clear();
  console.log('새로고침 감지 - 모든 요청 정리');
};

// 페이지 언로드 이벤트 리스너 등록
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handleBeforeUnload);
}

const courseApi = {
  // 요청 정리 함수
  clearAllRequests: () => {
    isRefreshing = true;
    pendingRequests.clear();
    requestCache.clear();
    console.log('모든 요청 정리 완료');
  },

  startCourse: async (courseId) => {
    try {
      const response = await apiClient.post(`/course/${courseId}/start`)
      return response.data
    } catch (error) {
      console.error('코스 시작 요청 실패:', error)
      throw error
    }
  },

  endCourse: async (courseId) => {
    try {
      const response = await apiClient.post(`/course/${courseId}/end`)
      return response.data
    } catch (error) {
      console.error('코스 종료 요청 실패:', error)
      throw error
    }
  },

  getCourseDistance: async (courseId) => {
    try {
      const response = await apiClient.get(`/course/${courseId}/distance`)
      return response.data
    } catch (error) {
      console.error('코스 거리 조회 실패:', error)
      throw error
    }
  },

  getUserRegionCourses: async (email, page = 0, size = 10, sort = 'rating,desc') => {
    try {
      const params = { email, page, size, sort }
      const response = await apiClient.get('/courses/user-region', { params })
      return response.data
    } catch (error) {
      console.error('사용자 지역 코스 조회 실패:', error)
      throw error
    }
  },

  // 전체 코스 목록 조회
  getAllCourses: async (page = 0, size = 500) => {
    try {
      const response = await apiClient.get('/courses', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('전체 코스 조회 실패:', error);
      throw error;
    }
  },

  // 지역별 코스 검색
  searchByRegion: async (sidoCode, sigunguCode, email = null, page = 0, size = 10) => {
    try {
      const params = {
        sidoCode,
        sigunguCode,
        page,
        size
      };
      
      if (email) {
        params.email = email;
      }

      const response = await apiClient.get('/courses/region', { params });
      return response.data;
    } catch (error) {
      console.error('지역별 코스 검색 실패:', error);
      throw error;
    }
  },

  // 코스 상세 정보 조회
  getCourseDetail: async (courseId) => {
    try {
      const token = localStorage.getItem('accessToken')
      console.log(`🔍 코스 ${courseId} 상세 조회 시도...`)
      
      const response = await fetch(`https://odorok.duckdns.org/api/courses/detail?courseId=${courseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ 코스 ${courseId} 상세 조회 성공!`, data)
        return data
      } else {
        console.log(`❌ 코스 ${courseId} 상세 조회 실패: ${response.status}`)
        throw new Error(`코스 상세 조회 실패: ${response.status}`)
      }
    } catch (error) {
      console.error('코스 상세 정보 조회 실패:', error);
      throw error;
    }
  },

  // 주변 명소 조회 (새로운 API 사용)
  getNearbyAttractions: async (courseId, contentTypeId = 12) => {
    const cacheKey = `attractions_around_${courseId}_${contentTypeId}`;
    
    // 캐시된 응답이 있으면 반환
    if (requestCache.has(cacheKey)) {
      console.log('캐시된 데이터 사용:', cacheKey);
      return requestCache.get(cacheKey);
    }
    
    // 진행 중인 요청이 있으면 기다림
    if (pendingRequests.has(cacheKey)) {
      console.log('진행 중인 요청 대기:', cacheKey);
      return pendingRequests.get(cacheKey);
    }
    
    // 새로운 요청 생성
    const requestPromise = (async () => {
      try {
        const response = await apiClient.get('/attractions/around', {
          params: { courseId, contentTypeId }
        });
        
        // 성공 시 캐시에 저장 (5분간 유효)
        requestCache.set(cacheKey, response.data);
        setTimeout(() => requestCache.delete(cacheKey), 5 * 60 * 1000);
        
        return response.data;
      } catch (error) {
        console.error('주변 명소 조회 실패:', error);
        throw error;
      } finally {
        // 요청 완료 후 pending에서 제거
        pendingRequests.delete(cacheKey);
      }
    })();
    
    // 진행 중인 요청으로 등록
    pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  },

  // 시도 코드 조회
  getSidos: async () => {
    try {
      const response = await apiClient.get('/regions/sido');
      return response.data;
    } catch (error) {
      console.error('시도 코드 조회 실패:', error);
      throw error;
    }
  },

  // 시군구 코드 조회
  getSigungus: async (sidoCode) => {
    try {
      const response = await apiClient.get('/regions/sigungu', {
        params: { sidoCode }
      });
      return response.data;
    } catch (error) {
      console.error('시군구 코드 조회 실패:', error);
      throw error;
    }
  },

  // 컨텐츠 타입 조회
  getContentTypes: async () => {
    try {
      const response = await apiClient.get('/attractions/contenttypes');
      return response.data;
    } catch (error) {
      console.error('컨텐츠 타입 조회 실패:', error);
      throw error;
    }
  },

  // TOP 코스(별점/방문/리뷰) 조회
  getTopCourses: async () => {
    try {
      const response = await apiClient.get('/courses/top')
      return response.data
    } catch (error) {
      console.error('TOP 코스 조회 실패:', error)
      throw error
    }
  },

  // 사용자 질병 코스 리스트 조회
  getDiseaseCourses: async (diseaseId = null, page = 0, size = 10, sort = 'created_at, asc') => {
    try {
      const params = { page, size, sort }
      if (diseaseId !== null && diseaseId !== undefined) params.diseaseId = diseaseId
      const response = await apiClient.get('/courses/disease', { params })
      return response.data
    } catch (error) {
      console.error('질병 코스 조회 실패:', error)
      throw error
    }
  },

  // 명소 상세 정보 조회
  getAttractionDetail: async (attractionId) => {
    try {
      const response = await apiClient.get('/attractions/detail', {
        params: { attractionId }
      });
      return response.data;
    } catch (error) {
      console.error('명소 상세 정보 조회 실패:', error);
      throw error;
    }
  },

  // 코스 리뷰 조회
  getCourseReviews: async (courseId, page = 0, size = 10, sort = 'visitedAt, desc') => {
    try {
      const response = await apiClient.get('/courses/reviews', {
        params: { courseId, page, size, sort }
      });
      return response.data;
    } catch (error) {
      console.error('코스 리뷰 조회 실패:', error);
      throw error;
    }
  },

    // 예정 등록 (Swagger 문서 기준)
    registerSchedule: async (courseId, dueDate, attractionIds) => {
      try {
        const requestData = {
          courseId: Number(courseId),
          dueDate: dueDate,
          attractionIds: attractionIds || []
        }
        
        console.log('🔍 스케줄 등록 요청:', requestData);
        
        const response = await apiClient.post('/courses/schedule', requestData);
        return response.data;
      } catch (error) {
        console.error('예정 등록 실패:', error);
        throw error;
      }
    },

  // 방문 예정 리스트 조회
  getScheduledCourses: async (email) => {
    try {
      const response = await apiClient.get('/courses/schedule', { params: { email } });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default courseApi; 