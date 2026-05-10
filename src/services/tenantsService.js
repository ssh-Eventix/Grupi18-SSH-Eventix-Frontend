import api from "./api";

const URL = "/Tenants";

export const tenantsService = {
  getAll: async () => {
    const response = await api.get(URL);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${URL}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(URL, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`${URL}/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`${URL}/${id}`);
  },
};