import axios from 'axios';
let store: any;
export const injectStore = (_store: any) => {
  store = _store;
};
import { setCredentials, logout } from '../store/slices/authSlice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for receiving/sending HttpOnly cookies (refresh token)
});

// Request interceptor: attach access token if available
axiosInstance.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// To prevent multiple simultaneous refresh requests when multiple API calls fail at once
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Response interceptor: handle token refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if the error is 401 Unauthorized and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh' && originalRequest.url !== '/auth/login') {
      
      if (isRefreshing) {
        // If a refresh is already in progress, queue this request
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // Once the refresh completes, the queue resolves with the new token
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 1. Attempt to refresh the token
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        
        if (!data || !data.accessToken) {
          throw new Error('No access token returned from refresh');
        }

        // 2. Store the new tokens in Redux
        store.dispatch(setCredentials({ 
          accessToken: data.accessToken, 
          // Retain the existing user profile
          user: store.getState().auth.user 
        }));
        
        // 3. Re-attach the new token to the original request that failed
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        // 4. Resolve the queued requests with the new token
        processQueue(null, data.accessToken);
        
        // 5. Retry the original request
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed (e.g., refresh token is expired, invalid, or missing)
        processQueue(refreshError, null);
        
        // Logout user explicitly from the store
        store.dispatch(logout());
        
        // Redirect to Login page (client-side only)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        // Reset the flag regardless of success or failure
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);
