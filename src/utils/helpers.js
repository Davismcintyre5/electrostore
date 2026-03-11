export const formatCurrency = (amount) => {
  return `KES ${amount.toLocaleString()}`
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

export const truncate = (str, length) => {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}