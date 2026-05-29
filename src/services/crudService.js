import api from "./api";

export const createCrudService = (url, options = {}) => ({
  getAll: async () => {
    const response = await api.get(url);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${url}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(url, options.mapCreate ? options.mapCreate(data) : data);
    return response.data;
  },

  update: async (id, data) => {
    if (options.readonly || options.createOnly) return null;
    const response = await api.put(`${url}/${id}`, options.mapUpdate ? options.mapUpdate(data) : data);
    return response.data;
  },

  delete: async (id) => {
    if (options.readonly) return null;
    await api.delete(`${url}/${id}`);
    return null;
  },
});

