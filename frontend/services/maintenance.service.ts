import api from './api';

export const maintenanceService = {
  getPlans: async () => {
    const { data } = await api.get('/maintenance-plans');
    return data;
  },
  getWorkOrders: async () => {
    const { data } = await api.get('/work-orders');
    return data;
  },
  updateWorkOrderStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/work-orders/${id}/status`, { status });
    return data;
  }
};
