import api from "./api";

const URL = "/Impersonation";

export const impersonationService = {
  start: async (data) => {
    const response = await api.post(`${URL}/start`, data);
    return response.data;
  },

  stop: async (sessionId) => {
    const response = await api.post(`${URL}/stop`, { sessionId });
    return response.data;
  },
};