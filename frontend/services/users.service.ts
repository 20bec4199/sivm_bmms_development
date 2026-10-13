import api from './api';

export const usersService = {
  getAllUsers: async () => {
    const { data } = await api.get('/users');
    return data;
  },
  getResidents: async () => {
    const { data } = await api.get('/residents');
    return data;
  }
};
