import { MdCheckCircle, MdRadioButtonUnchecked, MdCancel } from 'react-icons/md';

export default function OrderTimeline({ status, createdAt }) {
  const statuses = [
    {
      key: 'PLACED',
      label: 'Order Placed',
      description: 'Your order has been received',
    },
    {
      key: 'PROCESSING',
      label: 'Processing',
      description: 'We are preparing your order',
    },
    {
      key: 'SHIPPED',
      label: 'Shipped',
      description: 'Your order is on the way',
    },
    {
      key: 'DELIVERED',
      label: 'Delivered',
      description: 'Order delivered successfully',
    },
  ];

  const getStatusIndex = (currentStatus) => {
    const index = statuses.findIndex((s) => s.key === currentStatus);
    return index;
  };

  const currentIndex = getStatusIndex(status);
  const isCancelled = status === 'CANCELLED';

  const getStepStatus = (index) => {
    if (isCancelled) return 'cancelled';
    if (index <= currentIndex) return 'completed';
    return 'pending';
  };

  const getStepColor = (stepStatus) => {
    if (stepStatus === 'completed') return 'text-green-600 bg-green-100 border-green-300';
    if (stepStatus === 'cancelled') return 'text-red-600 bg-red-100 border-red-300';
    return 'text-gray-400 bg-gray-100 border-gray-300';
  };

  const getLineColor = (index) => {
    if (isCancelled) return 'bg-red-200';
    if (index < currentIndex) return 'bg-green-500';
    return 'bg-gray-300';
  };

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 border-2 border-red-300">
            <MdCancel className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h4 className="font-semibold text-lg text-red-800">Order Cancelled</h4>
            <p className="text-sm text-red-600">
              This order was cancelled on{' '}
              {new Date(createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline */}
      <div className="space-y-0">
        {statuses.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const isCompleted = stepStatus === 'completed';
          const isLast = index === statuses.length - 1;

          return (
            <div key={step.key} className="relative flex items-start gap-4 pb-8">
              {/* Vertical Line */}
              {!isLast && (
                <div
                  className={`absolute left-6 top-12 w-0.5 h-full -ml-px ${getLineColor(index)} transition-all duration-500`}
                  style={{ height: 'calc(100% - 3rem)' }}
                />
              )}

              {/* Step Icon */}
              <div className="relative z-10 flex items-center justify-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${getStepColor(stepStatus)}`}
                >
                  {isCompleted ? (
                    <MdCheckCircle className="w-7 h-7" />
                  ) : (
                    <MdRadioButtonUnchecked className="w-7 h-7" />
                  )}
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4
                      className={`font-semibold text-base ${
                        isCompleted ? 'text-gray-800' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p
                      className={`text-sm mt-1 ${
                        isCompleted ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>

                  {/* Timestamp (can be enhanced with actual timestamps from backend) */}
                  {isCompleted && index === currentIndex && (
                    <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Current Status
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500 ease-out"
          style={{
            width: `${((currentIndex + 1) / statuses.length) * 100}%`,
          }}
        />
      </div>

      {/* Progress Percentage */}
      <div className="mt-2 text-center">
        <span className="text-sm font-medium text-gray-600">
          {Math.round(((currentIndex + 1) / statuses.length) * 100)}% Complete
        </span>
      </div>
    </div>
  );
}
