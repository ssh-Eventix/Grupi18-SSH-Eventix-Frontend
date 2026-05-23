const toPositiveInteger = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 1;
};

export const bookingItemService = {
  toRequest: (item) => ({
    ticketTypeId: item.ticketTypeId,
    quantity: toPositiveInteger(item.quantity),
  }),

  toRequestList: (items = []) =>
    items
      .filter((item) => item?.ticketTypeId)
      .map((item) => bookingItemService.toRequest(item)),

  fromTicketType: (ticketTypeId, quantity = 1) =>
    bookingItemService.toRequest({
      ticketTypeId,
      quantity,
    }),
};

export const bookingItemsService = bookingItemService;

export const createBookingItemRequest = (item) => bookingItemService.toRequest(item);

export const createBookingItemsRequest = (items) => bookingItemService.toRequestList(items);

export default bookingItemService;
