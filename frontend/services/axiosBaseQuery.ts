import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { axiosInstance } from './axios';

// Goes through axiosInstance so an expired 15-minute access token is refreshed and the request retried.
export const axiosBaseQuery =
  (): BaseQueryFn<
    | string
    | {
        url: string;
        method?: AxiosRequestConfig['method'];
        body?: AxiosRequestConfig['data'];
        params?: AxiosRequestConfig['params'];
      },
    unknown,
    unknown
  > =>
  async (args) => {
    const { url, method, body, params } = typeof args === 'string' ? { url: args } as { url: string; method?: undefined; body?: undefined; params?: undefined } : args;
    try {
      const result = await axiosInstance({ url, method, data: body, params });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };
