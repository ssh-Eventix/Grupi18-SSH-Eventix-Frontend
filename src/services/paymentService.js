// src/services/paymentService.js
import api from "./api";

const URL = "/Payment";

export const paymentService = {
  getAll: async () => {
    const response = await api.get(URL);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(URL, {
      bookingId: data.bookingId,
      paymentMethodId: data.paymentMethodId,
      amount: Number(data.amount),
      status: data.status,
      paidAt: data.paidAt,
    }, {
      headers: data.tenantSlug ? { "X-Tenant-Slug": data.tenantSlug } : undefined,
    });

    return response.data;
  },
};
