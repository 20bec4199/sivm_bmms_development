import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';

export interface AlertQuery {
  type?: string;
  audience?: string;
  search?: string;
  skip?: number;
  take?: number;
}

export interface CreateAlertPayload {
  title: string;
  message: string;
  type?: string;
  priority?: string;
  audience?: string;
  targetNodeId?: string;
}

export const alertsApi = createApi({
  reducerPath: 'alertsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Alert'],
  endpoints: (builder) => ({
    getAlerts: builder.query<any, AlertQuery | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.type && params.type !== 'ALL') queryParams.append('type', params.type);
        if (params?.audience && params.audience !== 'ALL') queryParams.append('audience', params.audience);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.skip !== undefined) queryParams.append('skip', String(params.skip));
        if (params?.take !== undefined) queryParams.append('take', String(params.take));
        const qs = queryParams.toString();
        return qs ? `/alerts?${qs}` : '/alerts';
      },
      providesTags: ['Alert'],
    }),
    getAlert: builder.query<any, string>({
      query: (id) => `/alerts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Alert', id }],
    }),
    createBroadcast: builder.mutation<any, CreateAlertPayload>({
      query: (data) => ({
        url: '/alerts/broadcast',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Alert'],
    }),
  }),
});

export const {
  useGetAlertsQuery,
  useGetAlertQuery,
  useCreateBroadcastMutation,
} = alertsApi;
