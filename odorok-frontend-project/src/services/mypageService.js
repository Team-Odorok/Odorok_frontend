import authClient from './authClient.js'
import { handleApiError, showSuccess } from '../utils/errorHandler.js'

// 마이페이지 관련 API 서비스
export const mypageService = {
  // 백엔드 API 엔드포인트 테스트
  async testBackendEndpoints() {
    try {
      console.log('🔍 백엔드 API 엔드포인트 테스트 시작...')
      
      // 실제로 작동하는 API들로 백엔드 연결 확인
      const workingEndpoints = [
        '/diaries/available-course',
        '/courses/user-region',
        '/articles/search'
      ]
      
      for (const endpoint of workingEndpoints) {
        try {
          console.log(`연결 테스트: ${endpoint}`)
          const response = await authClient.get(endpoint)
          console.log(`✅ 연결 성공: ${endpoint}`, response.status)
        } catch (error) {
          console.log(`❌ 연결 실패: ${endpoint}`, error.response?.status)
        }
      }
      
      return true
    } catch (error) {
      console.error('백엔드 연결 테스트 실패:', error)
      return false
    }
  },
  // 사용자 프로필 조회
  async getProfile() {
    try {
      console.log('🔍 사용자 프로필 조회 시도...')
      
      // 토큰 정보 확인
      const token = localStorage.getItem('accessToken')
      console.log('🔑 현재 토큰:', token ? `${token.substring(0, 20)}...` : '없음')
      
          // 스웨거에 명시된 프로필 엔드포인트만 시도
          const endpoints = [
            '/me/profile'        // 스웨거에 명시된 엔드포인트
          ]
      
      for (const endpoint of endpoints) {
        try {
          console.log(`프로필 조회 시도: ${endpoint}`)
          const response = await authClient.get(endpoint)
          console.log(`✅ 프로필 조회 성공: ${endpoint}`, response.data)
      return response.data
    } catch (error) {
          console.log(`❌ 프로필 조회 실패: ${endpoint}`, error.response?.status, error.response?.statusText)
          if (error.response?.status !== 404 && error.response?.status !== 403) {
            throw error
          }
        }
      }
      
      throw new Error('사용자 프로필 API를 찾을 수 없습니다.')
    } catch (error) {
      console.error('프로필 조회 실패:', error)
      throw error
    }
  },

  // 사용자 건강정보 조회
  async getUserHealth() {
    try {
      console.log('🏥 사용자 건강정보 조회 시도...')
      
          // 스웨거에 명시된 건강정보 엔드포인트만 시도
          const endpoints = [
            'https://odorok.duckdns.org/api/me/userhealth'     // 절대경로로 호출
          ]
      
      for (const endpoint of endpoints) {
        try {
          console.log(`건강정보 조회 시도: ${endpoint}`)
          const response = await authClient.get(endpoint)
          console.log(`✅ 건강정보 조회 성공: ${endpoint}`, response.data)
      return response.data
    } catch (error) {
          console.log(`❌ 건강정보 조회 실패: ${endpoint}`, error.response?.status, error.response?.statusText)
          if (error.response?.status !== 404 && error.response?.status !== 403) {
            throw error
          }
        }
      }
      
      throw new Error('사용자 건강정보 API를 찾을 수 없습니다.')
    } catch (error) {
      console.error('건강정보 조회 실패:', error)
      throw error
    }
  },

  // 사용자 건강정보 수정 (스웨거 명세에 맞춤)
  async updateUserHealth(healthData) {
    try {
      console.log('🏥 사용자 건강정보 수정 시도...')
      
      const token = localStorage.getItem('accessToken')
      console.log('🔑 현재 토큰:', token ? `${token.substring(0, 20)}...` : '없음')
      
      // 스웨거 명세에 맞는 바디 형식으로 변환
      // healthData가 { data: {...} } 구조일 수 있으므로 처리
      const actualData = healthData.data || healthData
      
      const requestBody = {
        gender: actualData.gender || true,
        height: actualData.height || 0,
        weight: actualData.weight || 0,
        age: actualData.age || 0,
        smoking: actualData.smoking || true,
        drinkPerWeek: actualData.drinkPerWeek || 0,
        exercisePerWeek: actualData.exercisePerWeek || 0,
        diseaseList: actualData.diseaseList || []
      }
      
      console.log('📤 전송할 데이터 (스웨거 명세):', requestBody)
      
      // 스웨거 명세: PUT /api/me/userhealth
      const response = await fetch('https://odorok.duckdns.org/api/me/userhealth', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json;charset=UTF-8',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ 건강정보 수정 성공!', data)
        showSuccess('건강정보가 성공적으로 수정되었습니다.')
        return data
      } else {
        console.log(`❌ 건강정보 수정 실패: ${response.status}`)
        const errorText = await response.text()
        console.log('❌ 에러 응답:', errorText)
        throw new Error(`건강정보 수정 실패: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('건강정보 수정 실패:', error)
      handleApiError(error, '건강정보 수정')
      throw error
    }
  },

  // 사용자 활동내역 통계 조회 (스웨거 명세에 맞춤)
  async getActivityStatistics() {
    try {
      console.log('📊 사용자 활동 통계 조회 시도...')
      
      const token = localStorage.getItem('accessToken')
      console.log('🔑 현재 토큰:', token ? `${token.substring(0, 20)}...` : '없음')
      
      // 스웨거에 명시된 정확한 엔드포인트 사용
      const response = await fetch('https://odorok.duckdns.org/api/me/activity/statistics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json, text/plain, */*'
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ 활동 통계 조회 성공!', data)
        return data
      } else {
        console.log(`❌ 활동 통계 조회 실패: ${response.status}`)
        throw new Error(`활동 통계 조회 실패: ${response.status}`)
      }
    } catch (error) {
      console.error('활동 통계 조회 실패:', error)
      throw error
    }
  },

  // 프로필 이미지 업로드
  async uploadProfileImage(imageFile) {
    try {
      console.log('📷 프로필 이미지 업로드 시도...')
      
      const formData = new FormData()
      formData.append('image', imageFile)
      
      const token = localStorage.getItem('accessToken')
      console.log('🔑 현재 토큰:', token ? `${token.substring(0, 20)}...` : '없음')
      
      // 첫 번째 시도: 강력한 헤더로 요청
      let response = await fetch('https://odorok.duckdns.org/api/me/profile/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
          // Content-Type을 명시하지 않음 (브라우저가 자동으로 multipart/form-data + boundary 설정)
        },
        credentials: 'include',
        body: formData
      })
      
      // 403 에러 시 재시도
      if (!response.ok && response.status === 403) {
        console.log('🔄 403 에러 - 재시도 중...')
        response = await fetch('https://odorok.duckdns.org/api/me/profile/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: formData
        })
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ 프로필 이미지 업로드 성공!', data)
        showSuccess('프로필 이미지가 성공적으로 업로드되었습니다.')
        return data
      } else {
        console.log(`❌ 프로필 이미지 업로드 실패: ${response.status}`)
        console.log('🔍 응답 상태:', response.status, response.statusText)
        console.log('🔍 응답 헤더:', Object.fromEntries(response.headers.entries()))
        
        // 응답 본문 읽기 시도
        try {
          const errorText = await response.text()
          console.log('🔍 에러 응답 본문:', errorText)
        } catch (e) {
          console.log('🔍 에러 응답 본문 읽기 실패:', e)
        }
        
        throw new Error(`프로필 이미지 업로드 실패: ${response.status}`)
      }
    } catch (error) {
      console.error('프로필 이미지 업로드 실패:', error)
      handleApiError(error, '프로필 이미지 업로드')
      throw error
    }
  },

  // 사용자 정보 수정
  async updateProfile(profileData) {
    try {
      console.log('👤 사용자 정보 수정 시도...')
      
      const token = localStorage.getItem('accessToken')
      console.log('🔑 현재 토큰:', token ? `${token.substring(0, 20)}...` : '없음')
      
      // 첫 번째 시도: 강력한 헤더로 요청
      let response = await fetch('https://odorok.duckdns.org/api/me/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      })
      
      // 403 에러 시 재시도
      if (!response.ok && response.status === 403) {
        console.log('🔄 403 에러 - 재시도 중...')
        response = await fetch('https://odorok.duckdns.org/api/me/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(profileData)
        })
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ 프로필 수정 성공!', data)
        showSuccess('프로필이 성공적으로 수정되었습니다.')
        return data
      } else {
        console.log(`❌ 프로필 수정 실패: ${response.status}`)
        console.log('🔍 응답 상태:', response.status, response.statusText)
        console.log('🔍 응답 헤더:', Object.fromEntries(response.headers.entries()))
        
        // 응답 본문 읽기 시도
        try {
          const errorText = await response.text()
          console.log('🔍 에러 응답 본문:', errorText)
        } catch (e) {
          console.log('🔍 에러 응답 본문 읽기 실패:', e)
        }
        
        throw new Error(`프로필 수정 실패: ${response.status}`)
      }
    } catch (error) {
      console.error('프로필 수정 실패:', error)
      handleApiError(error, '프로필 수정')
      throw error
    }
  }
}
