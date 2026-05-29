import api from "./api";

const URL = "/PaymentMethod";

export const paymentMethodService = {
  getAll: async (tenantSlug) => {
    const response = await api.get(URL, {
      headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
    });

    return Array.isArray(response.data) ? response.data : response.data?.data ?? [];
  },
};

export default paymentMethodService;
