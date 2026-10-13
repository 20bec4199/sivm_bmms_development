'use client';

import React from 'react';
import { useGetSessionsQuery, useRevokeSessionMutation, useRevokeAllSessionsMutation } from '../../../../services/authApi';
import { useConfirm } from '@/providers/ConfirmProvider';

export default function ActiveSessionsPage() {
  const { data: sessions, isLoading, refetch } = useGetSessionsQuery(undefined);
  const [revokeSession, { isLoading: isRevoking }] = useRevokeSessionMutation();
  const [revokeAllSessions, { isLoading: isRevokingAll }] = useRevokeAllSessionsMutation();
  const [error, setError] = React.useState<string | null>(null);
  const confirm = useConfirm();

  const handleRevoke = async (sessionId: string) => {
    try {
      await revokeSession(sessionId).unwrap();
      refetch();
    } catch (err: any) {
      setError(err.data?.message || 'Failed to revoke session');
    }
  };

  const handleRevokeAll = async () => {
    const isConfirmed = await confirm({
      title: 'Revoke All Sessions',
      message: 'Are you sure you want to log out of all other devices?',
      confirmText: 'Yes, Log Out All',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (!isConfirmed) return;
    try {
      await revokeAllSessions(undefined).unwrap();
      refetch();
    } catch (err: any) {
      setError(err.data?.message || 'Failed to revoke sessions');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Active Sessions
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Review and manage devices that are currently logged into your account.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleRevokeAll}
            disabled={isRevokingAll || isLoading}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-100 dark:bg-red-900/30 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 shadow-sm hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isRevokingAll ? 'Revoking...' : 'Sign out of all other devices'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md transition-colors duration-200">
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : sessions?.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            No active sessions found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions?.map((session: any) => (
              <li key={session.id}>
                <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {/* Icon based on device type would go here, defaulting to generic computer */}
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.deviceName || session.userAgent || 'Unknown Device'}
                        </p>
                        {session.isCurrent && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                            Current Device
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <p className="flex items-center">
                          IP: {session.ipAddress || 'Unknown'}
                        </p>
                        <p className="flex items-center mt-1 sm:mt-0">
                          Last active: {new Date(session.lastActiveAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleRevoke(session.id)}
                      disabled={isRevoking}
                      className="ml-4 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
