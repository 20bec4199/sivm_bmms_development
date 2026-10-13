import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store/store';

export const workOrdersApi = createApi({
  reducerPath: 'workOrdersApi',
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
  tagTypes: ['WorkOrder'],
  endpoints: (builder) => ({
    getWorkOrders: builder.query<any, any>({
      query: (params) => ({
        url: '/work-orders',
        params,
      }),
      providesTags: ['WorkOrder'],
    }),
    getWorkOrderById: builder.query<any, string>({
      query: (id) => ({
        url: `/work-orders/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'WorkOrder', id }],
    }),
    createWorkOrder: builder.mutation<any, any>({
      query: (body) => ({
        url: '/work-orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WorkOrder'],
    }),
    updateWorkOrder: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/work-orders/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['WorkOrder', { type: 'WorkOrder', id: 'LIST' }],
    }),
    deleteWorkOrder: builder.mutation<any, string>({
      query: (id) => ({
        url: `/work-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WorkOrder'],
    }),
    toggleChecklist: builder.mutation<any, { workOrderId: string; checklistId: string; isCompleted: boolean }>({
      query: ({ workOrderId, checklistId, isCompleted }) => ({
        url: `/work-orders/${workOrderId}/checklists/${checklistId}/toggle`,
        method: 'PATCH',
        body: { isCompleted },
      }),
      invalidatesTags: (result, error, { workOrderId }) => [
        { type: 'WorkOrder', id: workOrderId },
        'WorkOrder',
      ],
    }),
    addHistory: builder.mutation<any, { workOrderId: string; notes: string }>({
      query: ({ workOrderId, notes }) => ({
        url: `/work-orders/${workOrderId}/history`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: (result, error, { workOrderId }) => [
        { type: 'WorkOrder', id: workOrderId },
      ],
    }),
  }),
});

export const {
  useGetWorkOrdersQuery,
  useGetWorkOrderByIdQuery,
  useCreateWorkOrderMutation,
  useUpdateWorkOrderMutation,
  useDeleteWorkOrderMutation,
  useToggleChecklistMutation,
  useAddHistoryMutation,
} = workOrdersApi;
