import api from "./api";

const URL = "/Venue";

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

export const venuesService = {
  getAll: async () => {
    const response = await api.get(`${URL}/public`);
    return response.data;
  },

  getAllTenant: async () => {
    const response = await api.get(URL);
    return response.data;
  },

  getAllAvailable: async () => {
    const [publicResponse, tenantResponse] = await Promise.allSettled([
      api.get(`${URL}/public`),
      api.get(URL),
    ]);

    const publicVenues =
      publicResponse.status === "fulfilled"
        ? normalizeArray(publicResponse.value.data).map((venue) => ({
            ...venue,
            source: "public",
          }))
        : [];

    const tenantVenues =
      tenantResponse.status === "fulfilled"
        ? normalizeArray(tenantResponse.value.data).map((venue) => ({
            ...venue,
            source: "tenant",
          }))
        : [];

    return uniqueById([...tenantVenues, ...publicVenues]);
  },

  getById: async (id) => {
    const response = await api.get(`${URL}/public/${id}`);
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