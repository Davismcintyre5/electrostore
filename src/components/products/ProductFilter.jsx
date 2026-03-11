import { useState } from 'react'

const ProductFilter = ({ onFilterChange }) => {
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    setSearch(e.target.value)
    onFilterChange({ category, search: e.target.value })
  }

  const handleCategory = (e) => {
    setCategory(e.target.value)
    onFilterChange({ category: e.target.value, search })
  }

  const handleClear = () => {
    setCategory('')
    setSearch('')
    onFilterChange({ category: '', search: '' })
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={handleSearch}
          className="flex-1 border rounded-md px-4 py-2"
        />
        <select value={category} onChange={handleCategory} className="border rounded-md px-4 py-2">
          <option value="">All Categories</option>
          <option value="Phones">Phones</option>
          <option value="Computers">Computers</option>
          <option value="Accessories">Accessories</option>
          <option value="Audio">Audio</option>
        </select>
        <button onClick={handleClear} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">
          Clear
        </button>
      </div>
    </div>
  )
}

export default ProductFilter