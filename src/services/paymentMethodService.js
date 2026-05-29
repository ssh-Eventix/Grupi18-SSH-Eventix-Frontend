// paymentMethodService.js

import api from "./api";

const URL = "/PaymentMethod";

export const paymentMethodService = {
  getAll: async () => {
    const response = await api.get(URL);
    return response.data;
  },
};