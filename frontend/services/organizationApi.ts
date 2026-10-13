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

export const organizationApi = createApi({
  reducerPath: 'organizationApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Building', 'Tower', 'Floor', 'Unit', 'Owner', 'Tenant', 'Vehicle', 'Transfer'],
  endpoints: (builder) => ({
    getBuildings: builder.query({
      query: (params) => ({
        url: '/properties', // Based on backend
        method: 'GET',
        params: { take: 1000, ...params },
      }),
      providesTags: ['Building'],
    }),
    createBuilding: builder.mutation({
      query: (data) => ({
        url: '/properties',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Building'],
    }),
    deleteBuilding: builder.mutation({
      query: (id) => ({
        url: `/properties/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Building'],
    }),
    getBuilding: builder.query({
      query: (id) => ({
        url: `/properties/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Building', id }],
    }),
    getTowers: builder.query({
      query: (params) => ({
        url: '/blocks', // Based on backend
        method: 'GET',
        params: { take: 1000, ...params },
      }),
      providesTags: ['Tower'],
    }),
    getTower: builder.query({
      query: (id) => ({
        url: `/blocks/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Tower', id }],
    }),
    createTower: builder.mutation({
      query: (data) => ({
        url: '/blocks',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Tower', 'Building'],
    }),
    deleteTower: builder.mutation({
      query: (id) => ({
        url: `/blocks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tower', 'Building'],
    }),
    getFloors: builder.query({
      query: (params) => ({
        url: '/floors',
        method: 'GET',
        params: { take: 1000, ...params },
      }),
      providesTags: ['Floor'],
    }),
    getFloor: builder.query({
      query: (id) => ({
        url: '/floors/' + id,
        method: 'GET',
      }),
      providesTags: ['Floor'],
    }),
    createFloor: builder.mutation({
      query: (data) => ({
        url: '/floors',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Floor', 'Tower'],
    }),
    deleteFloor: builder.mutation({
      query: (id) => ({
        url: `/floors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Floor', 'Tower'],
    }),
    getUnits: builder.query({
      query: (params) => ({
        url: '/units',
        method: 'GET',
        params,
      }),
      providesTags: ['Unit'],
    }),
    getMyUnits: builder.query({
      query: () => ({
        url: '/units/my-units',
        method: 'GET',
      }),
      providesTags: ['Unit'],
    }),
    getUnit: builder.query({
      query: (id) => ({
        url: `/units/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Unit', id }],
    }),
    createUnit: builder.mutation({
      query: (data) => ({
        url: '/units',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Unit', 'Floor'],
    }),
    deleteUnit: builder.mutation({
      query: (id) => ({
        url: `/units/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Unit', 'Floor'],
    }),
    getOwners: builder.query({
      query: (params) => ({
        url: '/owners',
        method: 'GET',
        params,
      }),
      providesTags: ['Owner'],
    }),
    createOwner: builder.mutation({
      query: (data) => ({
        url: '/owners',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Owner', 'Unit'],
    }),
    deleteOwner: builder.mutation({
      query: (id) => ({
        url: `/owners/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Owner', 'Unit'],
    }),
    getTenants: builder.query({
      query: (params) => ({
        url: '/tenants',
        method: 'GET',
        params,
      }),
      providesTags: ['Tenant'],
    }),
    createTenant: builder.mutation({
      query: (data) => ({
        url: '/tenants',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Tenant', 'Unit'],
    }),
    deleteTenant: builder.mutation({
      query: (id) => ({
        url: `/tenants/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tenant', 'Unit'],
    }),
    getVehicles: builder.query({
      query: (params) => ({
        url: '/vehicles',
        method: 'GET',
        params,
      }),
      providesTags: ['Vehicle'],
    }),
    createVehicle: builder.mutation({
      query: (data) => ({
        url: '/vehicles',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Vehicle'],
    }),
    deleteVehicle: builder.mutation({
      query: (id) => ({
        url: `/vehicles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vehicle'],
    }),
    getTransfers: builder.query({
      query: (params) => ({
        url: '/ownership-transfers',
        method: 'GET',
        params,
      }),
      providesTags: ['Transfer'],
    }),
    createTransfer: builder.mutation({
      query: (data) => ({
        url: '/ownership-transfers',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Transfer', 'Owner', 'Unit'],
    }),
  }),
});

export const {
  useGetBuildingsQuery,
  useGetBuildingQuery,
  useCreateBuildingMutation,
  useDeleteBuildingMutation,
  useGetTowersQuery,
  useGetTowerQuery,
  useCreateTowerMutation,
  useDeleteTowerMutation,
  useGetFloorsQuery,
  useGetFloorQuery,
  useCreateFloorMutation,
  useDeleteFloorMutation,
  useGetUnitsQuery,
  useGetMyUnitsQuery,
  useGetUnitQuery,
  useCreateUnitMutation,
  useDeleteUnitMutation,
  useGetOwnersQuery,
  useCreateOwnerMutation,
  useDeleteOwnerMutation,
  useGetTenantsQuery,
  useCreateTenantMutation,
  useDeleteTenantMutation,
  useGetVehiclesQuery,
  useCreateVehicleMutation,
  useDeleteVehicleMutation,
  useGetTransfersQuery,
  useCreateTransferMutation,
} = organizationApi;
