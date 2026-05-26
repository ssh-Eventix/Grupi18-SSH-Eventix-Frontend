import api from "./api";

const URL = "/ArchiveRecords";

export const archiveRecordsService = {
  getAll: async () => (await api.get(URL)).data,
  getStats: async () => (await api.get(`${URL}/stats`)).data,
};