import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaCalendarAlt,
  FaHeart,
  FaLightbulb,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaRobot,
  FaSearch,
  FaTicketAlt,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import { useAuth } from "../../auth/AuthContext";
import { eventsApi } from "../../api/eventsApi";
import aiService from "../../services/aiService";
import { isFavoriteEvent, toggleFavoriteEvent } from "../../services/buyerStorage";
import AuthPromptModal from "../../components/AuthPromptModal";

const getWeekRange = (offsetWeeks = 0) => {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay() || 7;

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day + 1 + offsetWeeks * 7);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { start, end };
};

const isEventInWeek = (event, offsetWeeks) => {
  const eventDate = new Date(event.startUtc || event.date);
  if (Number.isNaN(eventDate.getTime())) return false;

  const { start, end } = getWeekRange(offsetWeeks);
  return eventDate >= start && eventDate < end;
};

const aiQuickPrompts = [
  "Show me free events",
  "Recommend a music event",
  "What is happening next week?",
  "Compare Prizren Friday Beats and Gjakova Weekend Stage",
];

function HomePage() {
  const { user } = useAuth();
  const location = useLocation();
  const isPublicPage = location.pathname === "/";
  const eventDetailsBase = isPublicPage ? "/events" : "/buyer/events";
  const [draftQuery, setDraftQuery] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [events, setEvents] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [authPrompt, setAuthPrompt] = useState(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const cityOptions = useMemo(
    () => [...new Set(events.map((event) => event.city).filter(Boolean))],
    [events]
  );

  const categoryOptions = useMemo(
    () => ["all", ...new Set(events.map((event) => event.category).filter(Boolean))],
    [events]
  );

  const citySuggestions = useMemo(() => {
    const normalizedCity = draftCity.trim().toLowerCase();
    if (!normalizedCity) return [];

    return cityOptions.filter((item) => item.toLowerCase().startsWith(normalizedCity));
  }, [cityOptions, draftCity]);
    
  useEffect(() => {
    eventsApi
      .browse({ search: query })
      .then(setEvents)
      .catch((error) => {
        console.error("Public events failed:", error.response?.data || error.message);
        setEvents([]);
      });
  }, [query]);

  useEffect(() => {
    setFavoriteIds(new Set(events.filter((event) => isFavoriteEvent(event.id)).map((event) => event.id)));
  }, [events]);

  const visibleEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedCity = city.trim().toLowerCase();

    return events.filter((event) => {
      const matchesQuery = !normalizedQuery
        || event.title.toLowerCase().includes(normalizedQuery)
        || event.category.toLowerCase().includes(normalizedQuery)
        || event.venue.toLowerCase().includes(normalizedQuery);
      const matchesCity = !normalizedCity || event.city.toLowerCase().startsWith(normalizedCity);
      const matchesCategory = category === "all" || event.category === category;
      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "thisWeek" && isEventInWeek(event, 0)) ||
        (dateFilter === "nextWeek" && isEventInWeek(event, 1));
      const matchesFree = !freeOnly || event.price === "Free";

      return matchesQuery && matchesCity && matchesCategory && matchesDate && matchesFree;
    });
  }, [category, city, dateFilter, events, freeOnly, query]);

  const heroEvent = visibleEvents[0] || events[0];
  const featuredEvents = visibleEvents.slice(0, 2);
  const latestEvents = visibleEvents.slice(2, 8);

  const handleSearch = (event) => {
    event.preventDefault();
    setQuery(draftQuery);
    setCity(draftCity);
  };

  const clearFilters = () => {
    setDraftQuery("");
    setDraftCity("");
    setQuery("");
    setCity("");
    setCategory("all");
    setDateFilter("all");
    setFreeOnly(false);
  };

  const handleFavorite = (event) => {
    if (!user) {
      setAuthPrompt({
        message: `Save ${event.title} after you log in or create a buyer account.`,
        redirectTo: `/buyer/events/${event.id}`,
      });
      return;
    }

    const next = toggleFavoriteEvent(event);
    setFavoriteIds(new Set(next.map((item) => item.id)));
  };

  const askAi = async () => {
    const question = aiQuestion.trim();
    if (!question) return;

    setAiLoading(true);
    setAiError("");
    setAiQuestion("");
    setChatMessages((messages) => [...messages, { role: "user", text: question }]);

    try {
      const data = await aiService.buyerChat(question);
      setChatMessages((messages) => [...messages, { role: "assistant", text: data.response || "" }]);
      setAiError("");
    } catch {
      setAiError("AI assistant could not answer right now.");
    } finally {
      setAiLoading(false);
    }
  };

  const submitQuickPrompt = async (prompt) => {
    if (aiLoading) return;

    setAiQuestion(prompt);
    setAiLoading(true);
    setAiError("");
    setChatMessages((messages) => [...messages, { role: "user", text: prompt }]);

    try {
      const data = await aiService.buyerChat(prompt);
      setChatMessages((messages) => [...messages, { role: "assistant", text: data.response || "" }]);
      setAiError("");
    } catch {
      setAiError("AI assistant could not answer right now.");
    } finally {
      setAiQuestion("");
      setAiLoading(false);
    }
  };

  return (
    <section className="buyer-page">
      <form className="buyer-topbar" onSubmit={handleSearch}>
        <div className="search-input">
          <FaSearch />
          <input
            aria-label="Search events"
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Search events, artists, categories..."
            value={draftQuery}
          />
        </div>
        <div className="search-input location-input">
          <FaMapMarkerAlt />
          <input
            aria-label="Location"
            autoComplete="off"
            list="city-suggestions"
            onChange={(event) => setDraftCity(event.target.value)}
            placeholder="Search city..."
            value={draftCity}
          />
          <datalist id="city-suggestions">
            {citySuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>
        <button className="primary-button" type="submit">Search</button>
        <nav className="buyer-links" aria-label="Buyer shortcuts">
          {isPublicPage ? (
            <>
              <button
                className="buyer-shortcut-button"
                type="button"
                onClick={() => setAuthPrompt({
                  message: "Log in or create an account to keep your favorite events.",
                  redirectTo: "/buyer/favorites",
                })}
              >
                <FaHeart /> Favorites
              </button>
              <Link className="buyer-register-link" to="/register"   onClick={() => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantSlug");
    localStorage.removeItem("user");
  }}>Create account</Link>
              <button
                className="buyer-profile-button"
                type="button"
                onClick={() => setAuthPrompt({
                  message: "Your profile is ready after you create an account or log in.",
                  redirectTo: "/buyer",
                })}
                aria-label="Profile"
              >
                <FaUserCircle />
              </button>
            </>
          ) : (
            <>
              <Link to="/buyer/favorites">Favorites</Link>
              <Link to="/buyer/tickets">My Tickets</Link>
              <Link to="/buyer/profile" aria-label="Profile">
                <FaUserCircle />
              </Link>
            </>
          )}
        </nav>
      </form>

      <div className="buyer-layout-grid">
        <div className="buyer-main">
          {heroEvent && (
            <section className="hero-event" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.28)), url("${heroEvent.image}")` }}>
              <div>
                <span className="hero-kicker">Eventix Tickets</span>
                <h1>{heroEvent.title}</h1>
                <p>{heroEvent.description}</p>
                <div className="hero-meta">
                  <span><FaCalendarAlt /> {heroEvent.date}</span>
                  {heroEvent.time && <span>{heroEvent.time}</span>}
                  <span><FaMapMarkerAlt /> {heroEvent.venue}</span>
                </div>
                <Link className="hero-ticket-link" to={`${eventDetailsBase}/${heroEvent.id}`}>View Details</Link>
              </div>
            </section>
          )}

          <section className="event-ticker" aria-label="Upcoming event shortcuts">
            {visibleEvents.slice(0, 7).map((event) => (
              <Link key={`ticker-${event.id}`} to={`${eventDetailsBase}/${event.id}`}>
                <span>{event.date}</span>
                <strong>{event.title}</strong>
              </Link>
            ))}
          </section>

          <section className="event-promo-band">
            <div>
              <span>Curated for you</span>
              <h2>Find the right event without scrolling forever.</h2>
              <p>Use the filters, pick a category, or jump into the most relevant events for this week.</p>
            </div>
            <button type="button" onClick={() => setDateFilter("thisWeek")}>
              This week
            </button>
          </section>

          <section className="event-section">
            <div className="panel-title">
              <div>
                <span className="section-kicker">Featured</span>
                <h2>Book tickets with Eventix</h2>
                <p className="section-note">Official ticketing for festivals, concerts, meetups, and cultural nights.</p>
              </div>
              <Link to={isPublicPage ? "/login" : "/buyer/top-events"} state={isPublicPage ? { from: location, forceAuthPrompt: true } : undefined}>View All</Link>
            </div>
            {query && (
              <p className="search-summary">
                Showing results for <strong>{query}</strong>
              </p>
            )}
            {city && (
              <p className="search-summary">
                City: <strong>{city}</strong>
              </p>
            )}
            <div className="event-card-grid">
              {featuredEvents.map((event) => (
                <article className="event-card featured-event-card" key={event.id}>
                  <div className="event-card-image" style={{ backgroundImage: `url("${event.image}")` }}>
                    <button
                      aria-label={`Save ${event.title}`}
                      className={favoriteIds.has(event.id) ? "favorite-active" : ""}
                      onClick={() => handleFavorite(event)}
                      type="button"
                    >
                      <FaHeart />
                    </button>
                  </div>
                  <div className="event-card-content">
                    <span>{event.category}</span>
                    <Link className="event-title-link" to={`${eventDetailsBase}/${event.id}`}>
                      {event.title}
                    </Link>
                    <small>{event.date}{event.time ? ` - ${event.time}` : ""}</small>
                    <small>{event.venue}</small>
                    <div className="event-card-actions">
                      <b>{event.price}</b>
                      <Link className="mini-ticket-link" to={`${eventDetailsBase}/${event.id}`}>
                        <FaTicketAlt /> View details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
              <article className="event-space-card">
                <span>Explore smarter</span>
                <h3>Only the best picks first.</h3>
                <p>More events are still available through search and filters, but the page stays clean.</p>
              </article>
              {latestEvents.map((event) => (
                <article className="event-card compact-event-card" key={event.id}>
                  <div className="event-card-image" style={{ backgroundImage: `url("${event.image}")` }}>
                    <button
                      aria-label={`Save ${event.title}`}
                      className={favoriteIds.has(event.id) ? "favorite-active" : ""}
                      onClick={() => handleFavorite(event)}
                      type="button"
                    >
                      <FaHeart />
                    </button>
                  </div>
                  <div className="event-card-content">
                    <span>{event.category}</span>
                    <Link className="event-title-link" to={`${eventDetailsBase}/${event.id}`}>
                      {event.title}
                    </Link>
                    <small>{event.date}{event.time ? ` - ${event.time}` : ""}</small>
                    <small>{event.venue}</small>
                    <div className="event-card-actions">
                      <b>{event.price}</b>
                      <Link className="mini-ticket-link" to={`${eventDetailsBase}/${event.id}`}>
                        <FaTicketAlt /> View details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {visibleEvents.length === 0 && (
              <div className="empty-state">
                <strong>No events found</strong>
                <p>Try another search term or clear the filters.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="filters-panel panel">
          <div className="panel-title">
            <h2>Filters</h2>
            <button onClick={clearFilters} type="button">Clear All</button>
          </div>
          <div className="filter-group">
            <span>Category</span>
            <div className="filter-chips">
              {categoryOptions.map((item) => (
                <button
                  className={category === item ? "active" : ""}
                  key={item}
                  onClick={() => setCategory(item)}
                  type="button"
                >
                  {item === "all" ? "All" : item}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span>Date</span>
            <div className="filter-chips">
              <button
                className={dateFilter === "all" ? "active" : ""}
                onClick={() => setDateFilter("all")}
                type="button"
              >
                All
              </button>
              <button
                className={dateFilter === "thisWeek" ? "active" : ""}
                onClick={() => setDateFilter("thisWeek")}
                type="button"
              >
                This week
              </button>
              <button
                className={dateFilter === "nextWeek" ? "active" : ""}
                onClick={() => setDateFilter("nextWeek")}
                type="button"
              >
                Next week
              </button>
            </div>
          </div>
          <div className="filter-group">
            <span>Popular Cities</span>
            <div className="filter-chips">
              {cityOptions.map((item) => (
                <button
                  className={city === item ? "active" : ""}
                  key={item}
                  onClick={() => {
                    setDraftCity(item);
                    setCity(item);
                  }}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <label className="check-row">
            <input checked={freeOnly} onChange={(event) => setFreeOnly(event.target.checked)} type="checkbox" /> Free Events
          </label>
          <button className="primary-button" onClick={() => setQuery(draftQuery)} type="button">
            Apply Filters
          </button>
        </aside>
      </div>
      <footer className="buyer-footer">
        <strong>Eventix</strong>
        <span>Made for events, tickets, and unforgettable nights.</span>
      </footer>
      {authPrompt && (
        <AuthPromptModal
          message={authPrompt.message}
          onClose={() => setAuthPrompt(null)}
          redirectTo={authPrompt.redirectTo}
        />
      )}
      {!isPublicPage && user && (
        <div className={`buyer-chatbot ${chatOpen ? "open" : ""}`}>
          {chatOpen && (
            <section className="buyer-chatbot-panel" aria-label="AI chatbot">
              <div className="buyer-chatbot-header">
                <div className="buyer-chatbot-title">
                  <span className="buyer-chatbot-avatar"><FaRobot /></span>
                  <div>
                    <strong>Eventix AI</strong>
                    <span><i /> Online event assistant</span>
                  </div>
                </div>
                <button aria-label="Close AI chat" onClick={() => setChatOpen(false)} type="button">
                  <FaTimes />
                </button>
              </div>
              <div className="buyer-chatbot-body">
                <div className="chat-intro">
                  <FaLightbulb />
                  <div>
                    <strong>Ask me about events</strong>
                    <span>Recommendations, free events, cities, categories, or comparisons.</span>
                  </div>
                </div>
                {chatMessages.map((message, index) => (
                  <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
                    {message.text}
                  </div>
                ))}
                {aiLoading && (
                  <div className="chat-message assistant typing-message">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
                {aiError && <small className="form-error">{aiError}</small>}
              </div>
              <div className="buyer-chatbot-prompts" aria-label="Suggested AI questions">
                {aiQuickPrompts.map((prompt) => (
                  <button
                    disabled={aiLoading}
                    key={prompt}
                    onClick={() => submitQuickPrompt(prompt)}
                    type="button"
                  >
                    {prompt}
                  </button>
                ))}
                {chatMessages.length > 0 && (
                  <button
                    className="chat-reset-button"
                    disabled={aiLoading}
                    onClick={() => {
                      setChatMessages([]);
                      setAiError("");
                    }}
                    type="button"
                  >
                    New chat
                  </button>
                )}
              </div>
              <div className="buyer-chatbot-input">
                <textarea
                  onChange={(event) => setAiQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      askAi();
                    }
                  }}
                  placeholder="Ask about events..."
                  rows={2}
                  value={aiQuestion}
                />
                <button aria-label="Send AI message" disabled={aiLoading || !aiQuestion.trim()} onClick={askAi} type="button">
                  <FaPaperPlane />
                </button>
              </div>
            </section>
          )}
          <button className="buyer-chatbot-toggle" onClick={() => setChatOpen((value) => !value)} type="button">
            <FaRobot />
          </button>
        </div>
      )}
    </section>
  );
}

export default HomePage;
