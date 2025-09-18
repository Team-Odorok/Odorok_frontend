import authClient from './authClient'

const normalizeResponse = (response) => response?.data ?? response

export const getVisitedCourses = async (params = {}) => {
  try {
    const response = await authClient.get('/visited-courses', { params })
    return normalizeResponse(response)
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
    // Postman과 동일하게 form-data로 전송
    const formData = new FormData()
    formData.append('review', reviewData.content || '')
    formData.append('star', reviewData.rating || 0)
    
    // 이미지 파일 처리: 파일이 있을 때만 추가, 없으면 아예 추가하지 않음
    if (reviewData.imageFile) {
      formData.append('image', reviewData.imageFile)
      console.log('🔍 이미지 파일 추가됨:', reviewData.imageFile.name, reviewData.imageFile.size)
    } else {
      console.log('🔍 이미지 파일 없음 - image 필드 추가하지 않음')
    }
    
    console.log('🔍 후기 데이터 전송:', {
      visitedCourseId,
      review: reviewData.content,
      star: reviewData.rating,
      hasImage: !!reviewData.imageFile
    })
    
    // FormData 내용 확인
    console.log('🔍 FormData 내용:')
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value)
    }
    
    // authClient 대신 fetch API 사용 (커뮤니티 글쓰기에서 성공한 방식)
    const token = localStorage.getItem('accessToken')
    console.log('🔑 토큰:', token ? `${token.substring(0, 20)}...` : '없음')
    
    const response = await fetch(`https://odorok.duckdns.org/api/visited-courses/${visitedCourseId}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Content-Type을 명시하지 않음 (브라우저가 자동으로 multipart/form-data + boundary 설정)
      },
      body: formData
    })
    
    console.log('🔍 응답 상태:', response.status, response.statusText)
    console.log('🔍 응답 헤더:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ 후기 작성 성공!', data)
      return data
    } else {
      console.log(`❌ 후기 작성 실패: ${response.status}`)
      const errorText = await response.text()
      console.log('에러 응답:', errorText)
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
