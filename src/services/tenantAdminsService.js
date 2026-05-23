import api from "./api"

const URL = "/TenantAdmins";

export const tenantAdminsService = {
    create: async (data) => {
        const response = await api.post(URL, {
            tenantId: data.tenantId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
        });

        return response.data;
    },
};