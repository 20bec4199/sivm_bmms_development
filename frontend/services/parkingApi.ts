import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { axiosInstance } from './axios';

const axiosBaseQuery =
  (): BaseQueryFn<
    string | {
      url: string;
      method?: AxiosRequestConfig['method'];
      data?: AxiosRequestConfig['data'];
      body?: AxiosRequestConfig['data'];
      params?: AxiosRequestConfig['params'];
    },
    unknown,
    unknown
  > =>
  async (arg) => {
    try {
      const config = typeof arg === 'string' ? { url: arg } : arg;
      const result = await axiosInstance({
        url: config.url,
        method: config.method || 'GET',
        data: config.data || config.body,
        params: config.params,
      });
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

export const parkingApi = createApi({
  reducerPath: 'parkingApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    'ParkingArea', 
    'ParkingSlot', 
    'ParkingAllocation', 
    'ParkingViolation',
    'ParkingConfig',
    'ParkingRule',
    'ParkingSession',
    'ParkingReservation',
    'ParkingPermit',
    'ParkingRate'
  ],
  endpoints: (builder) => ({
    getParkingAreas: builder.query<any, void>({
      query: () => ({ url: '/parking/areas', method: 'GET' }),
      providesTags: ['ParkingArea'],
    }),
    createParkingArea: builder.mutation({
      query: (data) => ({
        url: '/parking/areas',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['ParkingArea'],
    }),
    getParkingSlots: builder.query<any, string | void>({
      query: (areaId) => ({
        url: areaId ? `/parking/slots?areaId=${areaId}` : '/parking/slots',
        method: 'GET',
      }),
      providesTags: ['ParkingSlot'],
    }),
    createParkingSlot: builder.mutation({
      query: (data) => ({
        url: '/parking/slots',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['ParkingSlot', 'ParkingArea'],
    }),
    allocateSlot: builder.mutation({
      query: (data) => ({
        url: '/parking/allocations',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['ParkingSlot', 'ParkingAllocation'],
    }),
    deleteParkingArea: builder.mutation({
      query: (id) => ({
        url: `/parking/areas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ParkingArea', 'ParkingSlot'],
    }),
    deleteParkingSlot: builder.mutation({
      query: (id) => ({
        url: `/parking/slots/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ParkingSlot', 'ParkingArea'],
    }),
    deallocateSlot: builder.mutation({
      query: (id) => ({
        url: `/parking/allocations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ParkingSlot', 'ParkingAllocation'],
    }),
    getViolations: builder.query<any, void>({
      query: () => ({ url: '/parking/violations', method: 'GET' }),
      providesTags: ['ParkingViolation'],
    }),
    reportViolation: builder.mutation({
      query: (data) => ({
        url: '/parking/violations',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['ParkingViolation'],
    }),
    getMyParking: builder.query<any, void>({
      query: () => ({ url: '/parking/my-parking', method: 'GET' }),
      providesTags: ['ParkingSlot', 'ParkingAllocation'],
    }),
    gateCheckIn: builder.mutation({
      query: (data) => ({
        url: '/parking/gate/check-in',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['ParkingSlot', 'ParkingAllocation', 'ParkingSession'],
    }),
    gateCheckOut: builder.mutation({
      query: (data) => ({
        url: '/parking/gate/check-out',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['ParkingSlot', 'ParkingAllocation', 'ParkingSession'],
    }),

    // --- PARKORA Extensions ---
    getParkingConfig: builder.query<any, void>({
      query: () => ({ url: '/parking/config', method: 'GET' }),
      providesTags: ['ParkingConfig'],
    }),
    updateParkingConfig: builder.mutation({
      query: (data) => ({
        url: '/parking/config',
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['ParkingConfig'],
    }),
    getParkingRules: builder.query<any, void>({
      query: () => ({ url: '/parking/rules', method: 'GET' }),
      providesTags: ['ParkingRule'],
    }),
    createParkingRule: builder.mutation({
      query: (data) => ({
        url: '/parking/rules',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['ParkingRule'],
    }),
    deleteParkingRule: builder.mutation({
      query: (id) => ({
        url: `/parking/rules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ParkingRule'],
    }),
    getVisualMap: builder.query<any, any>({
      query: (params) => ({
        url: '/parking/map',
        method: 'GET',
        params,
      }),
      providesTags: ['ParkingSlot', 'ParkingArea'],
    }),
    updateSlotStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/parking/slots/${id}/status`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['ParkingSlot'],
    }),
    getParkingSessions: builder.query<any, any>({
      query: (params) => ({
        url: '/parking/sessions',
        method: 'GET',
        params,
      }),
      providesTags: ['ParkingSession'],
    }),
    createSessionEntry: builder.mutation({
      query: (data) => ({
        url: '/parking/sessions/entry',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['ParkingSession', 'ParkingSlot'],
    }),
    createSessionExit: builder.mutation({
      query: (data) => ({
        url: '/parking/sessions/exit',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['ParkingSession', 'ParkingSlot'],
    }),
    getReservations: builder.query<any, any>({
      query: (params) => ({
        url: '/parking/reservations',
        method: 'GET',
        params,
      }),
      providesTags: ['ParkingReservation'],
    }),
    createReservation: builder.mutation({
      query: (data) => ({
        url: '/parking/reservations',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['ParkingReservation', 'ParkingSlot'],
    }),
    getPermits: builder.query<any, any>({
      query: (params) => ({
        url: '/parking/permits',
        method: 'GET',
        params,
      }),
      providesTags: ['ParkingPermit'],
    }),
    createPermit: builder.mutation({
      query: (data) => ({
        url: '/parking/permits',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['ParkingPermit'],
    }),
    getRates: builder.query<any, void>({
      query: () => ({ url: '/parking/rates', method: 'GET' }),
      providesTags: ['ParkingRate'],
    }),
    createRate: builder.mutation({
      query: (data) => ({
        url: '/parking/rates',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['ParkingRate'],
    }),
    recordAccessEvent: builder.mutation({
      query: (data) => ({
        url: '/parking/events',
        method: 'POST',
        data,
      }),
    }),
    updateViolationWorkflow: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/parking/violations/${id}/workflow`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['ParkingViolation'],
    }),
    getParkingAnalytics: builder.query<any, any>({
      query: (params) => ({
        url: '/parking/analytics',
        method: 'GET',
        params,
      }),
      providesTags: ['ParkingSlot', 'ParkingSession', 'ParkingViolation'],
    }),
  }),
});

export const {
  useGetParkingAreasQuery,
  useCreateParkingAreaMutation,
  useDeleteParkingAreaMutation,
  useGetParkingSlotsQuery,
  useCreateParkingSlotMutation,
  useDeleteParkingSlotMutation,
  useAllocateSlotMutation,
  useDeallocateSlotMutation,
  useGetViolationsQuery,
  useReportViolationMutation,
  useGetMyParkingQuery,
  useGateCheckInMutation,
  useGateCheckOutMutation,
  useGetParkingConfigQuery,
  useUpdateParkingConfigMutation,
  useGetParkingRulesQuery,
  useCreateParkingRuleMutation,
  useDeleteParkingRuleMutation,
  useGetVisualMapQuery,
  useUpdateSlotStatusMutation,
  useGetParkingSessionsQuery,
  useCreateSessionEntryMutation,
  useCreateSessionExitMutation,
  useGetReservationsQuery,
  useCreateReservationMutation,
  useGetPermitsQuery,
  useCreatePermitMutation,
  useGetRatesQuery,
  useCreateRateMutation,
  useRecordAccessEventMutation,
  useUpdateViolationWorkflowMutation,
  useGetParkingAnalyticsQuery,
} = parkingApi;

