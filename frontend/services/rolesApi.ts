import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';

export const rolesApi = createApi({
  reducerPath: 'rolesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Role', 'Permission'],
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: (params) => ({
        url: '/roles',
        params,
      }),
      providesTags: ['Role'],
    }),
    createRole: builder.mutation({
      query: (data) => ({
        url: '/roles',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Role'],
    }),
    getPermissions: builder.query({
      query: () => '/roles/permissions',
      providesTags: ['Permission'],
    }),
    assignPermission: builder.mutation({
      query: ({ roleId, permissionId, orgId }) => ({
        url: `/roles/${roleId}/permissions/${permissionId}`,
        method: 'POST',
        params: orgId ? { orgId } : undefined,
      }),
      invalidatesTags: ['Role'],
    }),
    removePermission: builder.mutation({
      query: ({ roleId, permissionId, orgId }) => ({
        url: `/roles/${roleId}/permissions/${permissionId}`,
        method: 'DELETE',
        params: orgId ? { orgId } : undefined,
      }),
      invalidatesTags: ['Role'],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useCreateRoleMutation,
  useGetPermissionsQuery,
  useAssignPermissionMutation,
  useRemovePermissionMutation
} = rolesApi;
