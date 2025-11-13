import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { MdLock, MdVisibility, MdVisibilityOff, MdCheckCircle, MdInfo } from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!token.trim()) {
      showError('Please enter the reset token');
      return;
    }

    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        token: token.trim(),
        newPassword
      });

      if (response.data.success) {
        setResetSuccess(true);
        showSuccess('Password reset successfully!');

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showError(error.response?.data?.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <MdCheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Password Reset Successfully!
          </h2>

          <p className="text-gray-600 mb-8">
            Your password has been changed. You can now login with your new password.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Go to Login
          </button>
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
          Reset Your Password
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Enter your reset token and new password
        </p>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <MdInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <strong>Find your reset token:</strong> Check the backend server console for the token that was generated when you requested a password reset.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reset Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reset Token *
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter the reset token from console"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              required
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <MdVisibilityOff className="w-5 h-5" />
                ) : (
                  <MdVisibility className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <MdVisibilityOff className="w-5 h-5" />
                ) : (
                  <MdVisibility className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Password match indicator */}
          {confirmPassword && (
            <div className={`text-sm ${
              newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'
            }`}>
              {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center space-y-2">
          <Link
            to="/request-reset"
            className="block text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Request New Reset Token
          </Link>
          <Link
            to="/login"
            className="block text-gray-600 hover:text-gray-700 text-sm"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
