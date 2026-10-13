import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { axiosInstance } from './axios';

const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig['method'];
      data?: AxiosRequestConfig['data'];
      params?: AxiosRequestConfig['params'];
    },
    unknown,
    unknown
  > =>
  async ({ url, method, data, params }) => {
    try {
      const result = await axiosInstance({ url, method, data, params });
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

export const auditApi = createApi({
  reducerPath: 'auditApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Activity', 'AuditStat', 'OrgHealth'],
  endpoints: (builder) => ({
    getActivities: builder.query({
      query: (params) => ({
        url: '/audit/activities',
        method: 'GET',
        params,
      }),
      providesTags: ['Activity'],
    }),
    getActivityStats: builder.query({
      query: (params) => ({
        url: '/audit/stats',
        method: 'GET',
        params,
      }),
      providesTags: ['AuditStat'],
    }),
    getOrganizationHealth: builder.query({
      query: (id) => ({
        url: `/audit/organizations/${id}/health`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'OrgHealth', id }],
    }),
    recordActivityLog: builder.mutation({
      query: (data) => ({
        url: '/audit/log',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Activity', 'AuditStat'],
    }),
  }),
});

export const {
  useGetActivitiesQuery,
  useGetActivityStatsQuery,
  useGetOrganizationHealthQuery,
  useRecordActivityLogMutation,
} = auditApi;
