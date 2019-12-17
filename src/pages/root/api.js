const request = async (path, params = {}) => {
  const urlParams = new URLSearchParams(params)
  const url = `http://localhost:8080${path}?${urlParams.toString()}`
  const request = await window.fetch(url)
  return request.json()
}

export const fetchTags = async (params = {}) => {
  return request('/tags', params)
}

export const fetchTotal = async (params = {}) => {
  return request('/total', params)
}

export const fetchGraph = async (params = {}) => {
  return request('/graph', params)
}

export const fetchMonthly = async (params = {}) => {
  return request('/monthly', params)
}
