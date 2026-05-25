import api from "./api";

const URL = "/TenantEmailDomains";

const normalizeDomainPayload = (data) => ({
  tenantId: data.tenantId,
  domain: String(data.domain || "").trim().toLowerCase(),
  defaultRoleName: data.defaultRoleName,
  autoApprove: Boolean(data.autoApprove),
});

export const tenantEmailDomainsService = {
  getAll: async () => {
    const response = await api.get(URL);
    return response.data;
  },

  getByTenantId: async (tenantId) => {
    const response = await api.get(`${URL}/tenant/${tenantId}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${URL}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(URL, normalizeDomainPayload(data));
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`${URL}/${id}`, {
      domain: String(data.domain || "").trim().toLowerCase(),
      defaultRoleName: data.defaultRoleName,
      autoApprove: Boolean(data.autoApprove),
    });
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`${URL}/${id}`);
  },
};

export default tenantEmailDomainsService;
