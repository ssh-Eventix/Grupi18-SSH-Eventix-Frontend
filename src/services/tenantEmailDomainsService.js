import api from "./api";

const URL = "/TenantEmailDomains";

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
    const response = await api.post(URL, {
      tenantId: data.tenantId,
      domain: data.domain,
      defaultRoleName: data.defaultRoleName,
      autoApprove: Boolean(data.autoApprove),
    });

    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`${URL}/${id}`, {
      domain: data.domain,
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
