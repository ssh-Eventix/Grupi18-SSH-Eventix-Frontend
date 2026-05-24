import api from "./api";

export const createCrudService = (url, options = {}) => ({
  getAll: async () => {
    const response = await api.get(url);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${url}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(url, options.mapCreate ? options.mapCreate(data) : data);
    return response.data;
  },

  update: async (id, data) => {
    if (options.readonly || options.createOnly) return null;
    const response = await api.put(`${url}/${id}`, options.mapUpdate ? options.mapUpdate(data) : data);
    return response.data;
  },

  delete: async (id) => {
    if (options.readonly) return null;
    await api.delete(`${url}/${id}`);
    return null;
  },
});

export const localCrudService = (storageKey, seed = []) => ({
  getAll: async () => JSON.parse(localStorage.getItem(storageKey) || JSON.stringify(seed)),
  create: async (data) => {
    const items = JSON.parse(localStorage.getItem(storageKey) || JSON.stringify(seed));
    const item = { ...data, id: `${storageKey}-${Date.now()}` };
    localStorage.setItem(storageKey, JSON.stringify([item, ...items]));
    return item;
  },
  update: async (id, data) => {
    const items = JSON.parse(localStorage.getItem(storageKey) || JSON.stringify(seed));
    localStorage.setItem(storageKey, JSON.stringify(items.map((item) => item.id === id ? { ...item, ...data } : item)));
    return data;
  },
  delete: async (id) => {
    const items = JSON.parse(localStorage.getItem(storageKey) || JSON.stringify(seed));
    localStorage.setItem(storageKey, JSON.stringify(items.filter((item) => item.id !== id)));
  },
});
