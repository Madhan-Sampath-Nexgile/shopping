import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { MdEmail, MdLock, MdInfo } from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function RequestReset() {
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      showError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/request-reset`, { email });

      if (response.data.success) {
        setResetRequested(true);
        showSuccess('Password reset link sent! Check the console for the reset token.');
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      showError(error.response?.data?.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  if (resetRequested) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <MdEmail className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
            Check Your Email
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <MdInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="mb-2">
                  <strong>For this demo project:</strong> Password reset tokens are logged to the console.
                </p>
                <p>
                  Check the <strong>backend server console</strong> for your reset token, then use it to reset your password.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-center mb-6">
            We've sent password reset instructions to <strong>{email}</strong>
          </p>

          <Link
            to="/reset-password"
            className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-3"
          >
            Enter Reset Token
          </Link>

          <Link
            to="/login"
            className="block text-center text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <MdLock className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Forgot Password?
        </h2>
        <p className="text-gray-600 text-center mb-8">
          No worries, we'll send you reset instructions
        </p>

        {/* Info Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <MdInfo className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <strong>Demo Project:</strong> Reset tokens will be logged to the backend console instead of being sent via email.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
