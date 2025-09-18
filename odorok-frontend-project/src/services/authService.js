import authClient from './authClient'

export const login = async (username, password) => {
  try {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await authClient.post('/auth/login', formData)
    return handleLoginResponse(response)
  } catch (error) {
    console.error('Login failed:', error.response?.status, error.response?.statusText)
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
    console.log('Login succeeded: token saved')
  } else {
    console.warn('Login succeeded but no token returned')
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

    console.log('Signup succeeded:', response)
    return response
  } catch (error) {
    console.error('Signup failed:', error.response?.status, error.response?.statusText)
    throw error
  }
}

export const refreshAccessToken = async () => {
  try {
    const response = await authClient.get('/auth/refresh-token')
    handleLoginResponse(response)
    return response
  } catch (error) {
    console.error('Token refresh failed:', error.response?.status, error.response?.statusText)
    throw error
  }
}

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)
    const jsonPayload = decodeURIComponent(Array.from(decoded).map(c => {
      const code = c.charCodeAt(0).toString(16).padStart(2, '0')
      return `%${code}`
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.warn('Failed to decode JWT payload:', error)
    return null
  }
}

export const getAuthUser = () => {
  const token = getAccessToken()
  return decodeJwtPayload(token)
}
