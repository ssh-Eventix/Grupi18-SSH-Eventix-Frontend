import api from "./api";

const URL = "/Review";

export const reviewsService = {
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
};