import React from 'react';
import { Loader } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
