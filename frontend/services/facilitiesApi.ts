import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store/store';

export const facilitiesApi = createApi({
  reducerPath: 'facilitiesApi',
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
  tagTypes: ['Facility', 'FacilityBooking', 'FacilityUsage'],
  endpoints: (builder) => ({
    // Facility management endpoints
    getFacilities: builder.query<any, any | void>({
      query: (params) => ({
        url: '/facilities',
        params,
      }),
      providesTags: ['Facility'],
    }),
    getFacilityById: builder.query<any, string>({
      query: (id) => ({
        url: `/facilities/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Facility', id }],
    }),
    createFacility: builder.mutation<any, any>({
      query: (body) => ({
        url: '/facilities',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Facility', 'FacilityUsage'],
    }),
    updateFacility: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/facilities/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Facility', 'FacilityUsage'],
    }),
    deleteFacility: builder.mutation<any, string>({
      query: (id) => ({
        url: `/facilities/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Facility', 'FacilityUsage'],
    }),
    getFacilityUsageReports: builder.query<any, void>({
      query: () => ({
        url: '/facilities/reports/usage',
      }),
      providesTags: ['FacilityUsage'],
    }),

    // Facility booking endpoints
    getFacilityBookings: builder.query<any, any>({
      query: (params) => ({
        url: '/facility-bookings',
        params,
      }),
      providesTags: ['FacilityBooking'],
    }),
    getFacilityBookingById: builder.query<any, string>({
      query: (id) => ({
        url: `/facility-bookings/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'FacilityBooking', id }],
    }),
    createFacilityBooking: builder.mutation<any, any>({
      query: (body) => ({
        url: '/facility-bookings',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FacilityBooking', 'FacilityUsage'],
    }),
    updateFacilityBooking: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/facility-bookings/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['FacilityBooking', 'FacilityUsage'],
    }),
    checkOutFacilityBooking: builder.mutation<any, string>({
      query: (id) => ({
        url: `/facility-bookings/${id}/check-out`,
        method: 'POST',
      }),
      invalidatesTags: ['FacilityBooking', 'FacilityUsage'],
    }),
    verifyBookingQr: builder.mutation<any, { qrData: string }>({
      query: (body) => ({
        url: '/facility-bookings/verify-qr',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FacilityBooking', 'FacilityUsage'],
    }),
    generateBookingQr: builder.query<any, string>({
      query: (id) => ({
        url: `/facility-bookings/${id}/qr`,
      }),
    }),
  }),
});

export const {
  useGetFacilitiesQuery,
  useGetFacilityByIdQuery,
  useCreateFacilityMutation,
  useUpdateFacilityMutation,
  useDeleteFacilityMutation,
  useGetFacilityUsageReportsQuery,
  useGetFacilityBookingsQuery,
  useGetFacilityBookingByIdQuery,
  useCreateFacilityBookingMutation,
  useUpdateFacilityBookingMutation,
  useCheckOutFacilityBookingMutation,
  useVerifyBookingQrMutation,
  useGenerateBookingQrQuery,
} = facilitiesApi;
