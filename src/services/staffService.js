import api from "./api";

const STAFF_URL = "/Staff";

const normalizeStaff = (staff) => ({
  ...staff,
  fullName: [staff.firstName, staff.lastName].filter(Boolean).join(" "),
  role: staff.role || "Staff",
  isActive: Boolean(staff.isActive),
});

export const staffService = {
  getAll: async () => {
    const response = await api.get(STAFF_URL);
    return response.data.map(normalizeStaff);
  },

  create: async (data) => {
    const response = await api.post(STAFF_URL, {
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      email: data.email?.trim(),
      password: data.password,
      isActive: Boolean(data.isActive),
    });

    return normalizeStaff(response.data);
  },

  deactivate: async (id) => {
    await api.put(`${STAFF_URL}/${id}/deactivate`);
  },
};

export default staffService;
