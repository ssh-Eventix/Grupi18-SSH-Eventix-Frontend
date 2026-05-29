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

  getByEventId: async (eventId, tenantSlug) => {
    const response = await api.get(`${URL}/event/${eventId}`, {
      headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
      suppressAuthRedirect: true,
    });

    return response.data;
  },

  getByUserId: async (userId, tenantSlug) => {
    const response = await api.get(`${URL}/user/${userId}`, {
      headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
    });

    return response.data;
  },

  create: async (data, tenantSlug) => {
    const response = await api.post(URL, data, {
      headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
    });

    return response.data;
  },

  getByUserId: async (userId, tenantSlug) => {
  const response = await api.get(`${URL}/user/${userId}`, {
    headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
  });

  return response.data;
},
};
