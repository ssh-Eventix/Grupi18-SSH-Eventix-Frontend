import api from "./api";

const EVENTS_URL = "/Events";

export const eventsService = {
  getAll: async (search = "") => {
    const response = await api.get(`${EVENTS_URL}?search=${search}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${EVENTS_URL}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(EVENTS_URL, data);
    return response.data;
  },

  update: async (id, data) => {
    await api.put(`${EVENTS_URL}/${id}`, data);
  },

  delete: async (id) => {
    await api.delete(`${EVENTS_URL}/${id}`);
  },
};