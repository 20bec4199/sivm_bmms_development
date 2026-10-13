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

export const platformApi = createApi({
  reducerPath: 'platformApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Organization', 'OrganizationUser'],
  endpoints: (builder) => ({
    getOrganizations: builder.query({
      query: (params) => ({
        url: '/organizations',
        method: 'GET',
        params,
      }),
      providesTags: ['Organization'],
    }),
    createOrganization: builder.mutation({
      query: (data) => ({
        url: '/organizations',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Organization'],
    }),
    inviteOrganizationAdmin: builder.mutation({
      query: (data) => ({
        url: '/auth/invite-admin', // From existing backend
        method: 'POST',
        data,
      }),
    }),
    updateOrganization: builder.mutation({
      query: ({ id, data }) => ({
        url: `/organizations/${id}`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Organization', id }, 'Organization'],
    }),
    deleteOrganization: builder.mutation({
      query: (id) => ({
        url: `/organizations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Organization'],
    }),
    deactivateOrganization: builder.mutation({
      query: (id) => ({
        url: `/organizations/${id}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: ['Organization'],
    }),
    activateOrganization: builder.mutation({
      query: (id) => ({
        url: `/organizations/${id}/activate`,
        method: 'POST',
      }),
      invalidatesTags: ['Organization'],
    }),
    suspendOrganization: builder.mutation({
      query: (id) => ({
        url: `/organizations/${id}/suspend`,
        method: 'POST',
      }),
      invalidatesTags: ['Organization'],
    }),
    getOrganization: builder.query({
      query: (id) => ({
        url: `/organizations/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Organization', id }],
    }),
    getOrganizationUsers: builder.query({
      query: (id) => ({
        url: `/organizations/${id}/users`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'OrganizationUser', id }],
    }),
    updateOrganizationUser: builder.mutation({
      query: ({ orgId, userId, data }) => ({
        url: `/organizations/${orgId}/users/${userId}`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: (result, error, { orgId }) => [{ type: 'OrganizationUser', id: orgId }],
    }),
    removeOrganizationUser: builder.mutation({
      query: ({ orgId, userId }) => ({
        url: `/organizations/${orgId}/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { orgId }) => [{ type: 'OrganizationUser', id: orgId }],
    }),
    getPlatformUsers: builder.query({
      query: () => ({
        url: '/users/platform/all',
        method: 'GET',
      }),
      providesTags: ['OrganizationUser'],
    }),
    lockPlatformUser: builder.mutation({
      query: ({ userId, isPermanentlyLocked }) => ({
        url: `/users/platform/${userId}/lock`,
        method: 'PATCH',
        data: { isPermanentlyLocked },
      }),
      invalidatesTags: ['OrganizationUser'],
    }),
    getMyModules: builder.query({
      query: () => ({
        url: '/organizations/me/modules',
        method: 'GET',
      }),
      providesTags: ['Organization'], // Tagging it to Organization so it invalidates on org changes
    }),
  }),
});

export const {
  useGetOrganizationsQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useInviteOrganizationAdminMutation,
  useDeactivateOrganizationMutation,
  useActivateOrganizationMutation,
  useSuspendOrganizationMutation,
  useGetOrganizationQuery,
  useGetOrganizationUsersQuery,
  useUpdateOrganizationUserMutation,
  useRemoveOrganizationUserMutation,
  useGetPlatformUsersQuery,
  useLockPlatformUserMutation,
  useGetMyModulesQuery,
} = platformApi;
