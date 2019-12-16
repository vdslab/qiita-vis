const request = async (path) => {
  const url = `http://localhost:8080${path}`
  const request = await window.fetch(url)
  return request.json()
}

export const fetchTotal = async () => {
  return request('/total')
}

export const fetchGraph = async () => {
  return request('/graph')
}
