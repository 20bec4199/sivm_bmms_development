import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store/store';

export const maintenancePlansApi = createApi({
  reducerPath: 'maintenancePlansApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
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
