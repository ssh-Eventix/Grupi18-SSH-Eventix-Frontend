import api from "./api";

const URL = "/DiscountCoupon";

export const discountCouponService = {
  validate: async ({ eventId, code, subtotal, tenantSlug }) => {
    const response = await api.post(
      `${URL}/validate`,
      {
        eventId,
        code,
        subtotal: Number(subtotal),
      },
      {
        headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
      }
    );

    return response.data;
  },

  redeem: async ({ eventId, code, tenantSlug }) => {
    await api.post(
      `${URL}/redeem`,
      {
        eventId,
        code,
      },
      {
        headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
      }
    );
  },
};

export default discountCouponService;
