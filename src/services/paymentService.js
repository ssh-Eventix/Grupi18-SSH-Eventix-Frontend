// src/services/paymentService.js
import api from "./api";

const URL = "/Payment";

export const paymentService = {
  create: async (data) => {
    const response = await api.post(URL, data);
    return response.data;
  },
};