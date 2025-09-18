// 에러 처리 유틸리티
export class ErrorHandler {
  constructor() {
    this.toastCallbacks = []
  }

  // Toast 컴포넌트 콜백 등록
  registerToastCallback(callback) {
    this.toastCallbacks.push(callback)
  }

  // Toast 표시
  showToast(message, type = 'error', duration = 3000) {
    this.toastCallbacks.forEach(callback => {
      callback(message, type, duration)
    })
  }

  // API 에러 처리
  handleApiError(error, context = '') {
    console.error(`API Error ${context}:`, error)
    
    let message = '알 수 없는 오류가 발생했습니다.'
    let type = 'error'

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
          message = data?.message || '잘못된 요청입니다.'
          break
        case 401:
          message = '로그인이 필요합니다.'
          // TODO: 로그인 페이지로 리다이렉트
          break
        case 403:
          message = '접근 권한이 없습니다.'
          break
        case 404:
          message = '요청한 리소스를 찾을 수 없습니다.'
          break
        case 409:
          message = '이미 존재하는 데이터입니다.'
          break
        case 422:
          message = data?.message || '입력 데이터가 올바르지 않습니다.'
          break
        case 429:
          message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
          break
        case 500:
          message = '서버 내부 오류가 발생했습니다.'
          break
        case 502:
        case 503:
        case 504:
          message = '서버가 일시적으로 사용할 수 없습니다.'
          break
        default:
          message = data?.message || `서버 오류가 발생했습니다. (${status})`
      }
    } else if (error.request) {
      message = '네트워크 연결을 확인해주세요.'
    } else if (error.message) {
      message = error.message
    }

    this.showToast(message, type)
    return message
  }

  // 성공 메시지
  showSuccess(message) {
    this.showToast(message, 'success')
  }

  // 경고 메시지
  showWarning(message) {
    this.showToast(message, 'warning')
  }

  // 정보 메시지
  showInfo(message) {
    this.showToast(message, 'info')
  }
}

// 싱글톤 인스턴스
export const errorHandler = new ErrorHandler()

// 기본 에러 처리 함수들
export const handleApiError = (error, context = '') => errorHandler.handleApiError(error, context)
export const showSuccess = (message) => errorHandler.showSuccess(message)
export const showError = (message) => errorHandler.showToast(message, 'error')
export const showWarning = (message) => errorHandler.showWarning(message)
export const showInfo = (message) => errorHandler.showInfo(message)
