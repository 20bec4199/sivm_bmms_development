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

export const packagesApi = createApi({
  reducerPath: 'packagesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Package', 'PackageModule', 'AvailableModule', 'Organization'],
  endpoints: (builder) => ({
    getPackages: builder.query({
      query: (params) => ({
        url: '/packages',
        method: 'GET',
        params,
      }),
      providesTags: ['Package'],
    }),
    getPackage: builder.query({
      query: (id) => ({
        url: `/packages/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Package', id: id as string }],
    }),
    createPackage: builder.mutation({
      query: (data) => ({
        url: '/packages',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Package'],
    }),
    updatePackage: builder.mutation({
      query: ({ id, data }) => ({
        url: `/packages/${id}`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Package', id }, 'Package'],
    }),
    activatePackage: builder.mutation({
      query: (id) => ({
        url: `/packages/${id}/activate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Package', id: id as string }, 'Package'],
    }),
    deactivatePackage: builder.mutation({
      query: (id) => ({
        url: `/packages/${id}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Package', id: id as string }, 'Package'],
    }),
    getPackageModules: builder.query({
      query: (id) => ({
        url: `/packages/${id}/modules`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'PackageModule', id: id as string }],
    }),
    addModuleToPackage: builder.mutation({
      query: ({ id, moduleId }) => ({
        url: `/packages/${id}/modules`,
        method: 'POST',
        data: { moduleId },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PackageModule', id }, { type: 'Package', id }],
    }),
    assignPackageToOrg: builder.mutation({
      query: ({ orgId, packageId }) => ({
        url: `/organizations/${orgId}/packages/${packageId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Organization'],
    }),
    assignAddonsToOrg: builder.mutation({
      query: ({ orgId, moduleIds }) => ({
        url: `/organizations/${orgId}/addons`,
        method: 'POST',
        data: { moduleIds },
      }),
      invalidatesTags: ['Organization'],
    }),
    removeModuleFromPackage: builder.mutation({
      query: ({ id, moduleId }) => ({
        url: `/packages/${id}/modules/${moduleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PackageModule', id }, { type: 'Package', id }],
    }),
    getAvailableModules: builder.query({
      query: () => ({
        url: '/packages/available-modules',
        method: 'GET',
      }),
      providesTags: ['AvailableModule'],
    }),
  }),
});

export const {
  useGetPackagesQuery,
  useGetPackageQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useActivatePackageMutation,
  useDeactivatePackageMutation,
  useGetPackageModulesQuery,
  useAddModuleToPackageMutation,
  useRemoveModuleFromPackageMutation,
  useGetAvailableModulesQuery,
  useAssignPackageToOrgMutation,
  useAssignAddonsToOrgMutation,
} = packagesApi;
