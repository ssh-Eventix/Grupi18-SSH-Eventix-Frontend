import api from "./api";

const URL = "/TenantAdmins";

export const tenantAdminsService = {
  create: async (data) => {
    const response = await api.post(URL, {
      tenantId: data.tenantId,
      firstName: String(data.firstName || "").trim(),
      lastName: String(data.lastName || "").trim(),
      email: String(data.email || "").trim().toLowerCase(),
      password: data.password,
    });

    return response.data;
  },
};

export default tenantAdminsService;
