import api from "./api";

const URL = "/Venue";

export const venuesService = {
  getAll: async () => {
    const response = await api.get(`${URL}/public`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${URL}/public/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(URL, data);
    return response.data;
  },

  update: async (id, data) => {
    await api.put(`${URL}/${id}`, data);
  },

  delete: async (id) => {
    await api.delete(`${URL}/${id}`);
  },
};