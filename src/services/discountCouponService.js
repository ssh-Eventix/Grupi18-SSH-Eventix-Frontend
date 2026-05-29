import api from "../api/axios";

export const discountCouponService = {
  validate: async ({ eventId, code, subtotal, tenantSlug }) => {
    const response = await api.post(
      "/DiscountCoupon/validate",
      {
        eventId,
        code,
        subtotal,
      },
      {
        headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {},
        suppressAuthRedirect: true,
      }
    );

    return response.data;
  },
};