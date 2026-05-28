import api from "./api";

const URL = "/AuditLog";

export const auditLogsService = {
  getAll: async (params = {}) => {
    const response = await api.get(URL, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${URL}/${id}`);
    return response.data;
  },
};