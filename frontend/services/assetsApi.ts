import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store/store';

export const assetsApi = createApi({
  reducerPath: 'assetsApi',
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
  tagTypes: ['Asset', 'AssetCategory', 'WarrantyAlert'],
  endpoints: (builder) => ({
    getAssets: builder.query<any, any | void>({
      query: (params) => ({
        url: '/assets',
        params: params || {},
      }),
      providesTags: ['Asset'],
    }),
    getAssetById: builder.query<any, string>({
      query: (id) => ({
        url: `/assets/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Asset', id }],
    }),
    createAsset: builder.mutation<any, any>({
      query: (body) => ({
        url: '/assets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Asset', 'WarrantyAlert'],
    }),
    updateAsset: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/assets/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Asset', id }, 'Asset', 'WarrantyAlert'],
    }),
    deleteAsset: builder.mutation<any, string>({
      query: (id) => ({
        url: `/assets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Asset', 'WarrantyAlert'],
    }),
    getWarrantyAlerts: builder.query<any, void>({
      query: () => ({
        url: '/assets/alerts/warranty',
      }),
      providesTags: ['WarrantyAlert'],
    }),
    getAssetCategories: builder.query<any, any | void>({
      query: (params) => ({
        url: '/asset-categories',
        params: params || {},
      }),
      providesTags: ['AssetCategory'],
    }),
    createAssetCategory: builder.mutation<any, any>({
      query: (body) => ({
        url: '/asset-categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AssetCategory'],
    }),
    deleteAssetCategory: builder.mutation<any, string>({
      query: (id) => ({
        url: `/asset-categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AssetCategory'],
    }),
    addAssetDocument: builder.mutation<any, { assetId: string; title: string; fileUrl: string }>({
      query: (body) => ({
        url: '/asset-documents',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { assetId }) => [{ type: 'Asset', id: assetId }, 'Asset'],
    }),
    removeAssetDocument: builder.mutation<any, { id: string; assetId?: string }>({
      query: ({ id }) => ({
        url: `/asset-documents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { assetId }) => [
        ...(assetId ? [{ type: 'Asset' as const, id: assetId }] : []),
        'Asset'
      ],
    }),
  }),
});

export const {
  useGetAssetsQuery,
  useGetAssetByIdQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useGetWarrantyAlertsQuery,
  useGetAssetCategoriesQuery,
  useCreateAssetCategoryMutation,
  useDeleteAssetCategoryMutation,
  useAddAssetDocumentMutation,
  useRemoveAssetDocumentMutation,
} = assetsApi;
