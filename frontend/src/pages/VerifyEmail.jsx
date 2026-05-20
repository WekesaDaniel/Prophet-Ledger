// frontend/src/pages/VerifyEmail.jsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

const VerifyEmail = () => {
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <Mail className="w-16 h-16 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h2>
        <p className="text-gray-600 mb-2">
          We've sent a verification link to:
        </p>
        <p className="text-blue-600 font-medium mb-4">{email}</p>
        <p className="text-gray-500 text-sm mb-6">
          Click the link in the email to verify your account. After verification, you can log in.
        </p>
        <Link
          to="/login"
          className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:opacity-90"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;