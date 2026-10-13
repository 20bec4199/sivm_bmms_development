import api from './api';

export const facilitiesService = {
  getFacilities: async () => {
    const { data } = await api.get('/facilities');
    return data;
  },
  getBookings: async () => {
    const { data } = await api.get('/facilities/bookings');
    return data;
  },
  createBooking: async (payload: any) => {
    const { data } = await api.post('/facilities/bookings', payload);
    return data;
  }
};
