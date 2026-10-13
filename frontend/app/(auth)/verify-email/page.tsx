'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useVerifyEmailQuery } from '../../../services/authApi';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const { data, error, isLoading } = useVerifyEmailQuery(token || '', {
    skip: !token,
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Invalid Link</h2>
          <p className="mt-2 text-gray-600">The verification link is missing or invalid.</p>
          <div className="mt-6">
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Return to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        {isLoading ? (
          <>
            <div className="mx-auto flex h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Verifying Email</h2>
            <p className="mt-2 text-gray-600">Please wait while we verify your email address...</p>
          </>
        ) : error ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="mt-2 text-gray-600">
              {(error as any)?.data?.message || 'The verification link may have expired or is invalid.'}
            </p>
            <div className="mt-6">
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Return to login
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Email Verified</h2>
            <p className="mt-2 text-gray-600">Your email has been successfully verified.</p>
            <div className="mt-6">
              <Link href="/login" className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                Continue to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
