import React from 'react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="mt-6 text-2xl font-extrabold text-gray-900">Access Denied</h2>
        
        <p className="mt-4 text-sm text-gray-600 leading-relaxed">
          You do not have the required permissions to access this page. If you believe you should have access, please contact your administrator.
        </p>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Return to Dashboard
          </Link>
        </div>
        
        <div className="mt-4 text-sm">
          <Link href="/login" className="font-medium text-gray-600 hover:text-gray-500">
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  );
}
