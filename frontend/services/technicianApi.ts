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

export const technicianApi = createApi({
  reducerPath: 'technicianApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Technician'],
  endpoints: (builder) => ({
    getTechnicians: builder.query({
      query: (params) => ({
        url: '/technicians',
        method: 'GET',
        params,
      }),
      providesTags: ['Technician'],
    }),
    getTechnician: builder.query({
      query: (id) => ({
        url: `/technicians/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Technician', id }],
    }),
    createTechnician: builder.mutation({
      query: (data) => ({
        url: '/technicians',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Technician'],
    }),
    updateTechnician: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/technicians/${id}`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Technician', id }, 'Technician'],
    }),
    deleteTechnician: builder.mutation({
      query: (id) => ({
        url: `/technicians/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Technician'],
    }),
  }),
});

export const {
  useGetTechniciansQuery,
  useGetTechnicianQuery,
  useCreateTechnicianMutation,
  useUpdateTechnicianMutation,
  useDeleteTechnicianMutation,
} = technicianApi;
