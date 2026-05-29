import api from "../api/axios";

const URL = "/Notification";

export const notificationService = {
  getByUserId: async (userId, tenantSlug) => {
    const response = await api.get(`${URL}/user/${userId}`, {
      headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
    });

    return response.data;
  },
};

export default notificationService;