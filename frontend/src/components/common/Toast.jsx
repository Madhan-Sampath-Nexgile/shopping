import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div
      className={`fixed top-20 right-6 ${bgColors[type]} text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-slide-in-right max-w-md`}
    >
      <div className="text-2xl">{icons[type]}</div>
      <div className="flex-1">
        <p className="font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 text-xl font-bold ml-2"
      >
        ×
      </button>
    </div>
  );
}
