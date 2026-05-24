import api from "./api";

const URL = "/User";

export const usersService = {
  getAll: async () => {
    const response = await api.get(URL);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${URL}/${id}`);
    return response.data;
  },

  getByEmail: async (email) => {
    const response = await api.get(`${URL}/by-email`, {
      params: { email },
    });
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