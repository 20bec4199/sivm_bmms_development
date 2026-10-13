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

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params) => ({
        url: '/users',
        method: 'GET',
        params,
      }),
      providesTags: ['User'],
    }),
    lockUser: builder.mutation({
      query: ({ userId, isPermanentlyLocked }) => ({
        url: `/users/${userId}/lock`,
        method: 'PATCH',
        data: { isPermanentlyLocked },
      }),
      invalidatesTags: ['User'],
    }),
    assignRoles: builder.mutation({
      query: ({ userId, roleIds }) => ({
        url: `/users/${userId}/roles`,
        method: 'POST',
        data: { roleIds },
      }),
      invalidatesTags: ['User'],
    }),
    createUser: builder.mutation({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['User'],
    }),
    assignProperties: builder.mutation({
      query: ({ id, propertyIds }) => ({
        url: `/users/${id}/properties`,
        method: 'POST',
        data: { propertyIds },
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useLockUserMutation,
  useAssignRolesMutation,
  useCreateUserMutation,
  useAssignPropertiesMutation,
} = userApi;
