import api from "./api";

const URL = "/VenueSection";

const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;
  return data?.data ?? [];
};

const uniqueById = (items) => {
  const map = new Map();

  items.forEach((item) => {
    if (!item?.id) return;
    map.set(String(item.id), item);
  });

  return Array.from(map.values());
};

export const venueSectionsService = {
  getAll: async () => {
    const [tenantResponse, publicResponse] = await Promise.allSettled([
      api.get(URL),
      api.get(`${URL}/public`),
    ]);

    const tenantSections =
      tenantResponse.status === "fulfilled"
        ? normalizeArray(tenantResponse.value.data).map((section) => ({
            ...section,
            source: "tenant",
          }))
        : [];

    const publicSections =
      publicResponse.status === "fulfilled"
        ? normalizeArray(publicResponse.value.data).map((section) => ({
            ...section,
            source: "public",
          }))
        : [];

    return uniqueById([...tenantSections, ...publicSections]);
  },

  getByVenueId: async (venueId) => {
    const [tenantResponse, publicResponse] = await Promise.allSettled([
      api.get(`${URL}/venue/${venueId}`),
      api.get(`${URL}/public/venue/${venueId}`),
    ]);

    const tenantSections =
      tenantResponse.status === "fulfilled"
        ? normalizeArray(tenantResponse.value.data).map((section) => ({
            ...section,
            source: "tenant",
          }))
        : [];

    if (tenantSections.length > 0) return tenantSections;

    return publicResponse.status === "fulfilled"
      ? normalizeArray(publicResponse.value.data).map((section) => ({
          ...section,
          source: "public",
        }))
      : [];
  },

  getById: async (id) => {
    const response = await api.get(`${URL}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(URL, data);
    return response.data;
  },

  update: async (id, data) => {
    await api.put(`${URL}/${id}`, data);
  },

  delete: async (id) => {
    await api.delete(`${URL}/${id}`);
  },
};
