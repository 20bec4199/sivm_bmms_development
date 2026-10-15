import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';

export const maintenancePlansApi = createApi({
  reducerPath: 'maintenancePlansApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['MaintenancePlan'],
  endpoints: (builder) => ({
    getMaintenancePlans: builder.query<any, void>({
      query: () => ({
        url: '/maintenance-plans',
      }),
      providesTags: ['MaintenancePlan'],
    }),
    getMaintenancePlanById: builder.query<any, string>({
      query: (id) => ({
        url: `/maintenance-plans/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'MaintenancePlan', id }],
    }),
    createMaintenancePlan: builder.mutation<any, any>({
      query: (body) => ({
        url: '/maintenance-plans',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MaintenancePlan'],
    }),
    updateMaintenancePlan: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/maintenance-plans/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => ['MaintenancePlan', { type: 'MaintenancePlan', id }],
    }),
    generateWorkOrderFromPlan: builder.mutation<any, string>({
      query: (id) => ({
        url: `/maintenance-plans/${id}/generate-work-order`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => ['MaintenancePlan', { type: 'MaintenancePlan', id }],
    }),
    deleteMaintenancePlan: builder.mutation<any, string>({
      query: (id) => ({
        url: `/maintenance-plans/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MaintenancePlan'],
    }),
  }),
});

export const {
  useGetMaintenancePlansQuery,
  useGetMaintenancePlanByIdQuery,
  useCreateMaintenancePlanMutation,
  useUpdateMaintenancePlanMutation,
  useGenerateWorkOrderFromPlanMutation,
  useDeleteMaintenancePlanMutation,
} = maintenancePlansApi;
