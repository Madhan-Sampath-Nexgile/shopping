import { useState } from 'react'
import api from '../services/api'

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    preferences: [],
    price_range: { min: 0, max: 0 },
    shopping_frequency: 'Occasional'
  })

  const [msg, setMsg] = useState('')

  const categoryOptions = [
    'Smartphone',
    'Laptop',
    'Audio',
    'Wearable',
    'Smart Home',
    'Gaming'
  ]

  const frequencyOptions = ['Daily', 'Weekly', 'Monthly', 'Occasional']

  const togglePreference = (category) => {
    setForm((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(category)
        ? prev.preferences.filter((c) => c !== category)
        : [...prev.preferences, category]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/auth/register', form)
      setMsg(`Registered successfully: ${data.user.email}`)
      setForm({
        name: '',
        email: '',
        password: '',
        preferences: [],
        price_range: { min: 0, max: 0 },
        shopping_frequency: 'Occasional'
      })
    } catch (err) {
      setMsg(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="max-w-md mx-auto card">
      <h2 className="text-2xl font-semibold mb-3 text-center">Create an Account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <input
          className="input"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="input"
          placeholder="Email Address"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {/* Preferences */}
        <div>
          <p className="text-sm font-medium mb-1">Categories of Interest</p>
          <div className="grid grid-cols-2 gap-2">
            {categoryOptions.map((cat) => (
              <label
                key={cat}
                className={`border rounded px-3 py-2 text-sm cursor-pointer ${
                  form.preferences.includes(cat)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.preferences.includes(cat)}
                  onChange={() => togglePreference(cat)}
                  className="hidden"
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <p className="text-sm font-medium mb-1">Preferred Price Range ($)</p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              className="input w-1/2"
              value={form.price_range.min}
              onChange={(e) =>
                setForm({
                  ...form,
                  price_range: { ...form.price_range, min: Number(e.target.value) }
                })
              }
            />
            <input
              type="number"
              placeholder="Max"
              className="input w-1/2"
              value={form.price_range.max}
              onChange={(e) =>
                setForm({
                  ...form,
                  price_range: { ...form.price_range, max: Number(e.target.value) }
                })
              }
            />
          </div>
        </div>

        {/* Shopping Frequency */}
        <div>
          <p className="text-sm font-medium mb-1">Shopping Frequency</p>
          <select
            className="input"
            value={form.shopping_frequency}
            onChange={(e) =>
              setForm({ ...form, shopping_frequency: e.target.value })
            }
          >
            {frequencyOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn w-full bg-blue-600 text-white hover:bg-blue-700">
          Register
        </button>
      </form>

      {msg && <p className="text-sm mt-3 text-center text-gray-600">{msg}</p>}
    </div>
  )
}
