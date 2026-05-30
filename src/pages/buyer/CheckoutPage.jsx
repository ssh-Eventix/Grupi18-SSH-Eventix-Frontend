import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaTicketAlt, FaTrash } from "react-icons/fa";
import { eventsApi } from "../../api/eventsApi";
import { useAuth } from "../../auth/AuthContext";
import { getTicketTypes } from "../../services/ticketTypeService";

const normalizeEmail = (email) => {
  if (Array.isArray(email)) {
    return email.find(Boolean) || "";
  }

  return email || "";
};

const getEventTenantSlug = (event) => {
  if (event?.tenantSlug) return event.tenantSlug;
  if (event?.schemaName?.startsWith("tenant_")) {
    return event.schemaName.replace(/^tenant_/, "").replace(/_events$/, "");
  }

  return "";
};

const encodeItems = (items) => JSON.stringify(items);

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return amount === 0 ? "Free" : `EUR ${amount.toFixed(2)}`;
};

const getStockLevel = (type) => {
  const left = Number(type?.quantityAvailable || type?.ticketsLeft || 0);

  return { left };
};

const parseCartItems = (searchParams) => {
  const itemsParam = searchParams.get("items");

  if (!itemsParam) return [];

  try {
    const parsed = JSON.parse(itemsParam);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        ticketTypeId: item.ticketTypeId,
        quantity: Number(item.quantity) || 0,
      }))
      .filter((item) => item.ticketTypeId && item.quantity > 0);
  } catch {
    return [];
  }
};

function CheckoutPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [ticketTypeError, setTicketTypeError] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [email, setEmail] = useState(normalizeEmail(user?.email));

  useEffect(() => {
    eventsApi.getById(eventId).then(setEvent);
  }, [eventId]);

  useEffect(() => {
    if (!event?.id) return;

    const eventTenantSlug = getEventTenantSlug(event);
    setTicketTypeError("");

    getTicketTypes(event.backendId || event.id, eventTenantSlug)
      .then((types) => {
        setTicketTypes(types);

        if (!types.length) {
          setTicketTypeError("No active ticket types were found for this event.");
          return;
        }

        const queryItems = parseCartItems(searchParams);
        const typeById = types.reduce((map, type) => {
          map[String(type.id)] = type;
          return map;
        }, {});
        const normalizedQueryItems = queryItems
          .filter((item) => typeById[String(item.ticketTypeId)])
          .map((item) => {
            const type = typeById[String(item.ticketTypeId)];

            return {
              ticketTypeId: item.ticketTypeId,
              quantity: Math.min(item.quantity, Number(type.quantityAvailable || item.quantity)),
            };
          });

        if (normalizedQueryItems.length) {
          setCartItems(normalizedQueryItems);
          return;
        }

        const queryTicketTypeId = searchParams.get("ticketTypeId") || types[0]?.id;
        const queryQuantity = Number(searchParams.get("quantity")) || 1;
        const selectedType = types.find((type) => type.id === queryTicketTypeId) || types[0];

        setCartItems([
          {
            ticketTypeId: selectedType.id,
            quantity: Math.min(queryQuantity, Number(selectedType.quantityAvailable || queryQuantity)),
          },
        ]);
      })
      .catch(() => {
        setTicketTypes([]);
        setCartItems([]);
        setTicketTypeError("Ticket types could not be loaded for this event.");
      });
  }, [event, searchParams]);

  const ticketTypeById = useMemo(() => {
    return ticketTypes.reduce((map, type) => {
      map[String(type.id)] = type;
      return map;
    }, {});
  }, [ticketTypes]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const type = ticketTypeById[String(item.ticketTypeId)];
      return sum + Number(type?.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [cartItems, ticketTypeById]);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [cartItems]);

  const updateQuantity = (ticketTypeId, nextQuantity) => {
    const type = ticketTypeById[String(ticketTypeId)];
    const maxQuantity = Math.max(1, Number(type?.quantityAvailable || 1));
    const parsedQuantity = Number(String(nextQuantity).replace(/\D/g, "")) || 1;

    setCartItems((items) =>
      items.map((item) =>
        item.ticketTypeId === ticketTypeId
          ? { ...item, quantity: Math.min(Math.max(1, parsedQuantity), maxQuantity) }
          : item
      )
    );
  };

  const addTicketType = (ticketTypeId) => {
    const type = ticketTypeById[String(ticketTypeId)];
    if (!type) return;

    setCartItems((items) => {
      const existing = items.find((item) => item.ticketTypeId === ticketTypeId);
      const maxQuantity = Number(type.quantityAvailable || 0);

      if (existing) {
        return items.map((item) =>
          item.ticketTypeId === ticketTypeId
            ? {
                ...item,
                quantity: Math.min(Number(item.quantity || 0) + 1, maxQuantity),
              }
            : item
        );
      }

      return [...items, { ticketTypeId, quantity: 1 }];
    });
  };

  const removeTicketType = (ticketTypeId) => {
    setCartItems((items) => items.filter((item) => item.ticketTypeId !== ticketTypeId));
  };

  const goToPayment = (submitEvent) => {
    submitEvent.preventDefault();

    const validItems = cartItems.filter((item) => item.ticketTypeId && Number(item.quantity) > 0);

    if (!validItems.length) {
      setTicketTypeError("Choose at least one ticket before payment.");
      return;
    }

    const params = new URLSearchParams({
      items: encodeItems(validItems),
      email: email.trim(),
    });

    navigate(`/buyer/payment/${event.id}?${params.toString()}`);
  };

  if (!event) {
    return (
      <section className="buyer-page simple-buyer-page empty-state">
        <strong>Checkout unavailable</strong>
        <p>Choose an event before buying tickets.</p>
        <Link to="/buyer">Back to events</Link>
      </section>
    );
  }

  return (
    <section className="buyer-page checkout-page">
      <form className="panel checkout-summary" onSubmit={goToPayment}>
        <h1>Checkout</h1>
        <div className="checkout-event">
          <span style={{ backgroundImage: `url("${event.image}")` }} />
          <div>
            <strong>{event.title}</strong>
            <small>{event.date} - {event.venue}</small>
          </div>
        </div>

        {ticketTypeError && <div className="form-alert">{ticketTypeError}</div>}

        <div className="ticket-type-picker">
          <span>Available ticket types</span>
          <div className="ticket-option-list">
            {ticketTypes.map((type) => {
              const selectedQuantity =
                cartItems.find((item) => String(item.ticketTypeId) === String(type.id))?.quantity || 0;
              const { left } = getStockLevel(type);
              const reachedLimit = selectedQuantity >= left;
              const isSoldOut = left <= 0;
              const isLowStock = left > 0 && left <= 10;

              return (
                <button
                  key={type.id}
                  type="button"
                  className={`ticket-option-button ${selectedQuantity ? "selected" : ""} ${isLowStock ? "low-stock" : ""}`}
                  disabled={isSoldOut || reachedLimit}
                  onClick={() => addTicketType(type.id)}
                >
                  <span>
                    <strong>{type.name}</strong>
                    {selectedQuantity > 0 && <em><FaCheckCircle /> {selectedQuantity} selected</em>}
                  </span>
                  <b>{formatMoney(type.price)}</b>
                  {(isSoldOut || isLowStock) && (
                    <small>{isSoldOut ? "Sold out" : "Tickets are selling out soon"}</small>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ticket-type-picker">
          <span>Selected tickets</span>
          <div className="checkout-cart-list">
            {cartItems.length === 0 ? (
              <small>No tickets selected.</small>
            ) : (
              cartItems.map((item) => {
                const type = ticketTypeById[String(item.ticketTypeId)];
                const lineTotal = Number(type?.price || 0) * Number(item.quantity || 0);

                return (
                  <div className="checkout-cart-item" key={item.ticketTypeId}>
                    <div>
                      <strong>{type?.name || "Ticket"}</strong>
                      <small>{formatMoney(type?.price)} each</small>
                    </div>
                    <div className="checkout-quantity-control">
                      <label htmlFor={`quantity-${item.ticketTypeId}`}>Quantity</label>
                      <input
                        id={`quantity-${item.ticketTypeId}`}
                        inputMode="numeric"
                        maxLength={4}
                        onChange={(input) => updateQuantity(item.ticketTypeId, input.target.value)}
                        value={item.quantity}
                      />
                    </div>
                    <strong>{formatMoney(lineTotal)}</strong>
                    <button type="button" className="icon-button danger" onClick={() => removeTicketType(item.ticketTypeId)}>
                      <FaTrash />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <label className="ticket-type-picker">
          Email for confirmation
          <input
            onChange={(input) => setEmail(input.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <div className="checkout-total">
          <span>Subtotal ({totalQuantity} tickets)</span>
          <strong>{subtotal === 0 ? "Free" : `EUR ${subtotal}`}</strong>
        </div>

        <button className="primary-button" disabled={!cartItems.length} type="submit">
          Go to payment
        </button>
      </form>

      <aside className="panel checkout-panel">
        <FaTicketAlt />
        <h2>Ticket details first</h2>
        <p>Choose ticket types, quantities, and confirmation email. Payment opens on the next page.</p>
      </aside>
    </section>
  );
}

export default CheckoutPage;
