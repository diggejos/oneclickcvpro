// src/pages/VerifyEmailPage.tsx

import React, { useEffect, useState } from 'react';

const VerifyEmailPage: React.FC = () => {
  const [message, setMessage] = useState('Verifying your email...');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setMessage('Invalid or missing verification token.');
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-email?token=${token}`
        );
        const data = await response.json();

        if (response.ok && data.success !== false) {
          setMessage(data.message || 'Email successfully verified! You may now log in.');
          setStatus('success');
        } else {
          setMessage(data.message || 'Verification failed. The link may have expired.');
          setStatus('error');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setMessage('An error occurred during verification.');
        setStatus('error');
      }
    };

    verify();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-2xl font-semibold mb-4">Email Verification</h1>
      <p className={`text-lg ${status === 'error' ? 'text-red-500' : 'text-green-600'}`}>
        {message}
      </p>
    </div>
  );
};

export default VerifyEmailPage;
