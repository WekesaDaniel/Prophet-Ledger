import React from 'react';

const statusConfig = {
  good: { color: 'green', text: 'Good' },
  warning: { color: 'yellow', text: 'Warning' },
  critical: { color: 'red', text: 'Critical' },
  pending: { color: 'orange', text: 'Pending' },
  completed: { color: 'green', text: 'Completed' },
  failed: { color: 'red', text: 'Failed' }
};

const StatusBadge = ({ status, className = '' }) => {
  const config = statusConfig[status] || { color: 'gray', text: status };
  
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[config.color]} ${className}`}>
      {config.text}
    </span>
  );
};

export default StatusBadge;
