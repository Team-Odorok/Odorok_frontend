import authClient from './authClient'

export const login = async (username, password) => {
  try {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await authClient.post('/auth/login', formData)
    return handleLoginResponse(response)
  } catch (error) {
    console.error('로그인 실패:', error.response?.status, error.response?.statusText)
    throw error
  }
}

const handleLoginResponse = (response) => {
  let token = response.headers?.authorization || response.headers?.Authorization

  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7)
  }

  if (!token && response.data) {
    token = response.data.accessToken || response.data.token || response.data.access_token
  }

  if (token) {
    localStorage.setItem('accessToken', token)
    console.log('로그인 성공: 토큰 저장 완료')
  } else {
    console.warn('로그인 성공했지만 토큰을 찾을 수 없습니다.')
  }

  return response
}

export const logout = () => {
  localStorage.removeItem('accessToken')
}

export const isLoggedIn = () => {
  return !!localStorage.getItem('accessToken')
}

export const getAccessToken = () => {
  return localStorage.getItem('accessToken')
}

export const signup = async (email, password, nickname) => {
  try {
    const response = await authClient.post('/auth/signup', {
      email,
      password,
      nickname
    })

    console.log('회원가입 성공:', response)
    return response
  } catch (error) {
    console.error('회원가입 실패:', error.response?.status, error.response?.statusText)
    throw error
  }
}
