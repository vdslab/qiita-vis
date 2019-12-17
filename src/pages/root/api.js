const request = async (path, params = {}) => {
  const base =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:8080'
      : 'https://asia-northeast1-vdslab-207906.cloudfunctions.net/qiita-vis-api'
  const urlParams = new URLSearchParams(params)
  const url = `${base}${path}?${urlParams.toString()}`
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
