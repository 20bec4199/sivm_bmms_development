'use client';

import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setCredentials, setLoading, logout } from '@/store/slices/authSlice';
import { axiosInstance } from '@/services/axios';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      try {
        // Attempt to refresh the token via our axios instance which automatically sends cookies
        const { data: refreshData } = await axiosInstance.post('/auth/refresh');
        
        if (refreshData && refreshData.accessToken) {
          // Immediately set the token in axios defaults so the next request works
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${refreshData.accessToken}`;
          
          // Fetch the user profile
          const { data: userData } = await axiosInstance.get('/auth/me');
          
          dispatch(setCredentials({ 
            user: userData, 
            accessToken: refreshData.accessToken 
          }));
        } else {
          dispatch(logout());
        }
      } catch (err) {
        // If refresh fails, they are simply not logged in
        dispatch(logout());
      }
    };

    if (!isAuthenticated) {
      initAuth();
    } else {
      dispatch(setLoading(false));
    }
  }, [dispatch, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
