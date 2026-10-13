import api from './api';

export const complaintsService = {
  getAllComplaints: async () => {
    const { data } = await api.get('/complaints');
    return data;
  },
  createComplaint: async (payload: any) => {
    const { data } = await api.post('/complaints', payload);
    return data;
  },
  updateComplaintStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/complaints/${id}/status`, { status });
    return data;
  }
};
