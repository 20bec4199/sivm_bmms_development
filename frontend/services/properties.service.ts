import api from './api';

export const propertiesService = {
  getAllProperties: async () => {
    const { data } = await api.get('/properties');
    return data;
  },
  getPropertyById: async (id: string) => {
    const { data } = await api.get(`/properties/${id}`);
    return data;
  },
  getBlocks: async (propertyId: string) => {
    const { data } = await api.get(`/blocks?propertyId=${propertyId}`);
    return data;
  },
  getUnits: async (blockId: string) => {
    const { data } = await api.get(`/units?blockId=${blockId}`);
    return data;
  }
};
