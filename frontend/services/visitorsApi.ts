import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';

export const visitorsApi = createApi({
  reducerPath: 'visitorsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Visitor', 'Registration'],
  endpoints: (builder) => ({
    getVisitorRegistrations: builder.query<any, any>({
      query: (params) => ({
        url: '/visitor-registrations',
        params,
      }),
      providesTags: ['Registration'],
    }),
    getRegistrationPass: builder.query<any, string>({
      query: (id) => ({
        url: `/visitor-registrations/${id}/pass`,
      }),
      providesTags: (result, error, id) => [{ type: 'Registration', id }],
    }),
    getVisitors: builder.query<any, any>({
      query: (params) => ({
        url: '/visitors',
        params,
      }),
      providesTags: ['Visitor'],
    }),
    getVisitorById: builder.query<any, string>({
      query: (id) => ({
        url: `/visitors/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Visitor', id }],
    }),
    createVisitor: builder.mutation<any, any>({
      query: (body) => ({
        url: '/visitors',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Visitor'],
    }),
    createRegistration: builder.mutation<any, any>({
      query: (body) => ({
        url: '/visitor-registrations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Registration'],
    }),
    verifyQr: builder.mutation<any, { qrData: string }>({
      query: (body) => ({
        url: '/visitor-registrations/verify-qr',
        method: 'POST',
        body,
      }),
    }),
    checkInVisitor: builder.mutation<any, { id: string; notes?: string }>({
      query: ({ id, notes }) => ({
        url: `/visitor-registrations/${id}/check-in`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: ['Registration'],
    }),
    checkOutVisitor: builder.mutation<any, { logId: string; notes?: string }>({
      query: ({ logId, notes }) => ({
        url: `/visitor-registrations/logs/${logId}/check-out`,
        method: 'PATCH',
        body: { notes },
      }),
      invalidatesTags: ['Registration'],
    }),
  }),
});

export const { 
  useGetVisitorRegistrationsQuery, 
  useGetRegistrationPassQuery,
  useGetVisitorsQuery,
  useGetVisitorByIdQuery,
  useCreateVisitorMutation, 
  useCreateRegistrationMutation, 
  useVerifyQrMutation,
  useCheckInVisitorMutation,
  useCheckOutVisitorMutation,
} = visitorsApi;
