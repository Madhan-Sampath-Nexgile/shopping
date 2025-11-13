import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { UserIcon } from '@heroicons/react/24/outline'
import { setToken, setProfile } from '../store/userSlice'
import api from '../services/api'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  setMsg('')
  try {
    const { data } = await api.post('/auth/login', form)

    // Save to storage
    if (form.remember) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    } else {
      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('user', JSON.stringify(data.user))
    }

    // Update Redux store immediately
    dispatch(setToken(data.token))
    dispatch(setProfile(data.user))

    // Trigger Navbar update
    window.dispatchEvent(new Event('authChange'))

    setMsg('Login successful! Redirecting...')
    setTimeout(() => navigate('/'), 500)
  } catch (err) {
    setMsg(err.response?.data?.error || 'Login failed')
  } finally {
    setLoading(false)
  }
}

const fillAdminCredentials = () => {
  setForm({ email: 'admin@smartshop.ai', password: 'admin123', remember: true })
}

const fillDemoCredentials = () => {
  setForm({ email: 'demo@example.com', password: 'demo123', remember: false })
}

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Login</h2>

        {/* Quick Login Buttons */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Quick Login:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-md flex items-center justify-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              Admin
            </button>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 transition shadow-md flex items-center justify-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              Demo User
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">Click to auto-fill credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-full px-3 py-2 border rounded"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Password</label>
              <Link to="/request-reset" className="text-xs text-blue-600 hover:text-blue-700">
                Forgot Password?
              </Link>
            </div>
            <input
              className="w-full px-3 py-2 border rounded"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            />
            <span className="text-sm">Remember me</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {msg && <p className="mt-4 text-sm text-red-600">{msg}</p>}
        <p className="mt-4 text-sm text-center">
          Don't have an account? <Link to="/register" className="text-blue-600">Register</Link>
        </p>
      </div>
    </div>
  )
}
