const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://hospital-management-backend-7kc5.onrender.com'

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    )
  } catch (error) {
    throw new Error(
      'Unable to connect to the server. Please make sure the backend is running.'
    )
  }

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('currentUser')

    window.location.href = '/login'

    throw new Error(
      'Session expired. Please login again.'
    )
  }

  if (response.status === 204) {
    return null
  }

  let data = null

  const contentType =
    response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    if (
      data &&
      typeof data === 'object' &&
      data.message
    ) {
      throw new Error(data.message)
    }

    if (typeof data === 'string' && data.trim()) {
      throw new Error(data)
    }

    throw new Error(
      `Request failed with status ${response.status}.`
    )
  }

  return data
}

export const get = (endpoint) =>
  apiRequest(endpoint)

export const post = (endpoint, data) =>
  apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const put = (endpoint, data) =>
  apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const patch = (endpoint, data) =>
  apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

export const remove = (endpoint) =>
  apiRequest(endpoint, {
    method: 'DELETE',
  })