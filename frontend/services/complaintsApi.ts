import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store/store';

export interface ComplaintStatistics {
  statusStats: { status: string; _count: { id: number } }[];
  priorityStats: { priority: string; _count: { id: number } }[];
}

export const complaintsApi = createApi({
  reducerPath: 'complaintsApi',
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
  tagTypes: ['Complaint', 'ComplaintCategory'],
  endpoints: (builder) => ({
    getStatistics: builder.query<ComplaintStatistics, void>({
      query: () => ({
        url: '/complaints/dashboard/statistics',
        method: 'GET',
      }),
      providesTags: ['Complaint'],
    }),
    getComplaints: builder.query<any, any>({
      query: (params) => ({
        url: '/complaints',
        params,
      }),
      providesTags: ['Complaint'],
    }),
    getComplaintCategories: builder.query<any, any>({
      query: () => ({
        url: '/complaint-categories',
        method: 'GET',
      }),
      providesTags: ['ComplaintCategory'],
    }),
    createComplaintCategory: builder.mutation<any, any>({
      query: (body) => ({
        url: '/complaint-categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ComplaintCategory'],
    }),
    deleteComplaintCategory: builder.mutation<any, string>({
      query: (id) => ({
        url: `/complaint-categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ComplaintCategory'],
    }),
    createComplaint: builder.mutation<any, any>({
      query: (body) => ({
        url: '/complaints',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Complaint'],
    }),
    getComplaintById: builder.query<any, string>({
      query: (id) => ({
        url: `/complaints/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Complaint', id }],
    }),
    updateComplaint: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/complaints/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Complaint', id }, { type: 'Complaint', id: 'LIST' }, 'Complaint'],
    }),
    addComplaintComment: builder.mutation<any, { id: string; content: string }>({
      query: ({ id, content }) => ({
        url: `/complaints/${id}/comments`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Complaint', id }],
    }),
    addAttachment: builder.mutation<any, { id: string; fileUrl: string; fileName: string }>({
      query: ({ id, ...body }) => ({
        url: `/complaints/${id}/attachments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Complaint', id }],
    }),
    deleteComplaint: builder.mutation<any, string>({
      query: (id) => ({
        url: `/complaints/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Complaint'],
    }),
  }),
});

export const { 
  useGetStatisticsQuery,
  useGetComplaintsQuery, 
  useGetComplaintByIdQuery,
  useCreateComplaintMutation, 
  useUpdateComplaintMutation,
  useAddComplaintCommentMutation,
  useAddAttachmentMutation,
  useGetComplaintCategoriesQuery, 
  useCreateComplaintCategoryMutation,
  useDeleteComplaintCategoryMutation,
  useDeleteComplaintMutation
} = complaintsApi;
