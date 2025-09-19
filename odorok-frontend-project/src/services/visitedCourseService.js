import authClient from './authClient'

const normalizeResponse = (response) => response?.data ?? response

export const getVisitedCourses = async () => {
  try {
    const response = await authClient.get('https://odorok.duckdns.org/api/visited-courses')
    const data = normalizeResponse(response)
    
    // 새로운 응답 형식 처리
    if (data && data.data && data.data.reviewList) {
      // reviewList를 visitedCourses 형식으로 변환
      const visitedCourses = data.data.reviewList.map(review => ({
        visitedCourseId: review.courseId, // courseId를 visitedCourseId로 매핑
        courseId: review.courseId,
        courseName: review.courseName,
        stars: review.stars,
        review: review.review,
        hasReview: true,
        reviewObject: {
          rating: review.stars,
          content: review.review
        }
      }))
      
      return {
        ...data,
        data: {
          ...data.data,
          visitedCourses: visitedCourses
        }
      }
    }
    
    return data
  } catch (error) {
    console.error('Failed to fetch visited courses:', error)
    throw error
  }
}

export const getVisitedCourseDetail = async (visitedCourseId) => {
  if (!visitedCourseId) throw new Error('visitedCourseId is required')
  try {
    const response = await authClient.get(`/visited-courses/${visitedCourseId}`)
    return normalizeResponse(response)
  } catch (error) {
    console.error('Failed to fetch visited course detail:', error)
    throw error
  }
}

export const upsertVisitedCourseReview = async (visitedCourseId, reviewData) => {
  if (!visitedCourseId) throw new Error('visitedCourseId is required')
  try {
    // 토큰 확인
    let token = localStorage.getItem('accessToken')
    console.log('🔑 토큰 상태:', token ? `${token.substring(0, 20)}...` : '없음')
    
    if (!token) {
      throw new Error('로그인이 필요합니다.')
    }
    
    // 토큰 갱신 시도
    try {
      console.log('🔄 토큰 갱신 시도...')
      const refreshResponse = await fetch('https://odorok.duckdns.org/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        if (refreshData.accessToken) {
          const newToken = refreshData.accessToken
          localStorage.setItem('accessToken', newToken)
          console.log('✅ 토큰 갱신 성공:', newToken.substring(0, 20) + '...')
          token = newToken
        }
      } else {
        console.log('⚠️ 토큰 갱신 실패:', refreshResponse.status)
      }
    } catch (refreshError) {
      console.log('⚠️ 토큰 갱신 에러:', refreshError)
    }
    
    // 서버 스펙에 맞춰 form-data로 star, review만 전송
    const ratingNum = Math.max(0, Math.min(5, Number(reviewData.rating) || 0))
    const contentStr = (reviewData.content || '').toString()
    const formData = new FormData()
    formData.append('star', String(ratingNum))
    formData.append('review', contentStr)
    
    // 이미지 파일이 있으면 파일 그대로 form-data에 포함
    if (reviewData.imageFile) {
      try {
        formData.append('image', reviewData.imageFile, reviewData.imageFile.name)
        console.log('🔍 이미지 파일 추가됨:', reviewData.imageFile.name, reviewData.imageFile.size)
      } catch (_) {
        console.log('⚠️ 이미지 파일 추가 실패, 파일 없이 전송합니다.')
      }
    } else {
      console.log('🔍 이미지 파일 없음')
    }
    
    console.log('🔍 FormData 전송:', { visitedCourseId, star: ratingNum, review: contentStr, hasImage: !!reviewData.imageFile })
    
    const url = `https://odorok.duckdns.org/api/visited-courses/${visitedCourseId}/reviews`
    console.log('🌐 요청 URL:', url)
    console.log('📤 요청 헤더:', {
      'Authorization': `Bearer ${token ? token.substring(0, 20) + '...' : '없음'}`,
      'Content-Type': '(브라우저가 multipart/form-data boundary 자동 설정)'
    })
    
    // fetch API로 직접 시도 (authClient 대신)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Content-Type은 생략 (브라우저가 multipart/form-data로 자동 설정)
      },
      body: formData
    })
    
    console.log('📥 응답 정보:')
    console.log('  - 상태 코드:', response.status)
    console.log('  - 상태 텍스트:', response.statusText)
    console.log('  - 응답 URL:', response.url)
    console.log('  - 응답 타입:', response.type)
    console.log('  - 응답 OK:', response.ok)
    console.log('  - 응답 헤더:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ 후기 작성 성공:')
      console.log('  - 응답 데이터:', JSON.stringify(data, null, 2))
      console.log('  - 데이터 타입:', typeof data)
      console.log('  - 데이터 키들:', Object.keys(data))
      return data
    } else {
      const errorText = await response.text()
      console.error('❌ 후기 작성 실패:')
      console.error('  - 상태 코드:', response.status)
      console.error('  - 상태 텍스트:', response.statusText)
      console.error('  - 에러 응답 텍스트:', errorText)
      console.error('  - 에러 응답 길이:', errorText.length)
      
      try {
        const errorJson = JSON.parse(errorText)
        console.error('  - 에러 JSON:', JSON.stringify(errorJson, null, 2))
      } catch (e) {
        console.error('  - 에러 응답이 JSON이 아님')
      }
      
      throw new Error(`후기 작성 실패: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.error('Failed to submit visited course review:', error)
    throw error
  }
}

export default {
  getVisitedCourses,
  getVisitedCourseDetail,
  upsertVisitedCourseReview
}
