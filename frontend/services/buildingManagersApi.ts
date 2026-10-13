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

export const buildingManagersApi = createApi({
  reducerPath: 'buildingManagersApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['BuildingManager'],
  endpoints: (builder) => ({
    getBuildingManagers: builder.query({
      query: () => ({
        url: '/building-managers',
        method: 'GET',
      }),
      providesTags: ['BuildingManager'],
    }),
    createBuildingManager: builder.mutation({
      query: (data) => ({
        url: '/building-managers',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['BuildingManager'],
    }),
    deleteBuildingManager: builder.mutation({
      query: (id: string) => ({
        url: `/building-managers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BuildingManager'],
    }),
  }),
});

export const {
  useGetBuildingManagersQuery,
  useCreateBuildingManagerMutation,
  useDeleteBuildingManagerMutation,
} = buildingManagersApi;
