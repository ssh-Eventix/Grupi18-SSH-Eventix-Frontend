export const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : fallback;
    return parsed ?? fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

const readArray = (key) => {
  const value = readJson(key, []);
  return Array.isArray(value) ? value : [];
};

export const readObject = (key, fallback = {}) => {
  const value = readJson(key, fallback);
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
};

export const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getBuyerTickets = () => readArray("buyerTickets");

export const saveBuyerTicket = (ticket) => {
  const tickets = getBuyerTickets();
  writeJson("buyerTickets", [ticket, ...tickets.filter((item) => item.id !== ticket.id)]);
};

export const getFavoriteEvents = () => readArray("buyerFavoriteEvents");

export const isFavoriteEvent = (eventId) =>
  getFavoriteEvents().some((event) => event.id === eventId);

export const toggleFavoriteEvent = (event) => {
  const favorites = getFavoriteEvents();
  const exists = favorites.some((item) => item.id === event.id);
  const next = exists
    ? favorites.filter((item) => item.id !== event.id)
    : [{ ...event, savedAt: new Date().toISOString() }, ...favorites];

  writeJson("buyerFavoriteEvents", next);
  return next;
};

export const getBuyerNotifications = () => readArray("buyerNotifications");

export const getUnreadBuyerNotifications = () =>
  getBuyerNotifications().filter((notification) => !notification.read);

export const markBuyerNotificationRead = (notificationId) => {
  const nextNotifications = getBuyerNotifications().map((notification) =>
    notification.id === notificationId ? { ...notification, read: true } : notification
  );

  writeJson("buyerNotifications", nextNotifications);
  window.dispatchEvent(new CustomEvent("buyerNotificationsChanged", { detail: nextNotifications }));
  return nextNotifications;
};

export const addBuyerNotification = (notification) => {
  const notifications = getBuyerNotifications();
  const id = notification.id || `notification-${Date.now()}`;
  const nextNotifications = [
    {
      id,
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    },
    ...notifications.filter((item) => item.id !== id),
  ];

  writeJson("buyerNotifications", nextNotifications);
  window.dispatchEvent(new CustomEvent("buyerNotificationsChanged", { detail: nextNotifications }));
};

export const getBuyerReviews = () => readArray("buyerReviews");

export const addBuyerReview = (review) => {
  const reviews = getBuyerReviews();
  writeJson("buyerReviews", [
    {
      id: review.id || `review-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...review,
    },
    ...reviews,
  ]);
};

const TICKET_INVENTORY_KEY = "buyerTicketInventoryAdjustments";

export const getTicketInventoryAdjustments = () => readObject(TICKET_INVENTORY_KEY);

export const getTicketInventoryAdjustment = (ticketTypeId) => {
  const adjustments = getTicketInventoryAdjustments();
  return adjustments[ticketTypeId] || { purchased: 0, lastKnownAvailable: null };
};

export const recordTicketTypePurchase = (ticketTypeId, quantity, lastKnownAvailable) => {
  if (!ticketTypeId || Number(quantity) <= 0) return;

  const adjustments = getTicketInventoryAdjustments();
  const current = adjustments[ticketTypeId] || { purchased: 0, lastKnownAvailable: null };

  writeJson(TICKET_INVENTORY_KEY, {
    ...adjustments,
    [ticketTypeId]: {
      purchased: Number(current.purchased || 0) + Number(quantity),
      lastKnownAvailable: Number(lastKnownAvailable ?? current.lastKnownAvailable ?? 0),
    },
  });
};
