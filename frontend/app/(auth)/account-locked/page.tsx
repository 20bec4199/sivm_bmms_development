import React from 'react';
import Link from 'next/link';

export default function AccountLockedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="mt-6 text-2xl font-extrabold text-gray-900">Account Locked</h2>
        
        <p className="mt-4 text-sm text-gray-600 leading-relaxed">
          For your security, your account has been temporarily locked due to multiple failed login attempts.
        </p>
        
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Please try again later or contact your system administrator if you believe this is an error.
        </p>

        <div className="mt-8 space-y-4">
          <Link
            href="/forgot-password"
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Reset Password
          </Link>
          
          <Link
            href="/login"
            className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
