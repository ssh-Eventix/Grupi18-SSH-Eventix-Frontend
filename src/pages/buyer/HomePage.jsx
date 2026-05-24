import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaHeart,
  FaMapMarkerAlt,
  FaSearch,
  FaTicketAlt,
  FaUserCircle,
} from "react-icons/fa";
import { buyerEvents } from "./buyerData";
import api from "../../api/axios";
import { eventsApi } from "../../api/eventsApi";

const categoryOptions = ["all", "Festival", "Music", "Conference", "Comedy", "Wellness", "Party"];

function HomePage() {
  const { logout } = useAuth();
  const [draftQuery, setDraftQuery] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [backendStatus, setBackendStatus] = useState("Checking backend...");
  const [events, setEvents] = useState(buyerEvents);

  const cityOptions = useMemo(() => [...new Set(events.map((event) => event.city))], [events]);

  const citySuggestions = useMemo(() => {
    const normalizedCity = draftCity.trim().toLowerCase();
    if (!normalizedCity) {
      return [];
    }

    return cityOptions.filter((item) => item.toLowerCase().startsWith(normalizedCity));
  }, [cityOptions, draftCity]);

  useEffect(() => {
    api.get("/health")
      .then((response) => setBackendStatus(response.data.message || "Backend connected"))
      .catch(() => setBackendStatus("Backend not connected"));
  }, []);

  useEffect(() => {
    eventsApi.browse({ search: query }).then(setEvents);
  }, [query]);

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
      const matchesFree = !freeOnly || event.price === "Free";

      return matchesQuery && matchesCity && matchesCategory && matchesFree;
    });
  }, [category, city, events, freeOnly, query]);

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
    setFreeOnly(false);
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
        <button className="primary-button" type="submit">
          Search
        </button>
        <nav className="buyer-links" aria-label="Buyer shortcuts">
          <span
            className={
              backendStatus.includes("not")
                ? "api-status offline"
                : "api-status online"
            }
          >
            {backendStatus}
          </span>

          <Link to="/buyer/favorites">Favorites</Link>

          <Link to="/buyer/tickets">My Tickets</Link>

          <Link to="/buyer/profile" aria-label="Profile">
            <FaUserCircle />
          </Link>

          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </nav>
      </form>

      <div className="buyer-layout-grid">
        <div className="buyer-main">
          <section className="hero-event">
            <div>
              <h1>Live Music Night</h1>
              <p>An unforgettable evening with top artists</p>
              <div className="hero-meta">
                <span>
                  <FaCalendarAlt /> May 25, 2025
                </span>
                <span>21:00</span>
                <span>
                  <FaMapMarkerAlt /> Pallati i Kongreseve
                </span>
              </div>
              <Link className="hero-ticket-link" to="/buyer/events/live-music-night">Get Tickets</Link>
            </div>
            <div className="slider-dots">
              <span />
              <span />
              <span className="active" />
              <span />
            </div>
          </section>

          <section className="event-section">
            <div className="panel-title">
              <h2>Popular Events Near You</h2>
              <Link to="/buyer/top-events">View All</Link>
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
              {visibleEvents.map((event) => (
                <article className="event-card" key={event.id}>
                  <div className="event-card-image" style={{ backgroundImage: `url("${event.image}")` }}>
                    <Link to="/buyer/favorites" aria-label={`Save ${event.title}`}>
                      <FaHeart />
                    </Link>
                  </div>
                  <Link className="event-title-link" to={`/buyer/events/${event.id}`}>
                    {event.title}
                  </Link>
                  <span>{event.category}</span>
                  <small>{event.date}</small>
                  <small>{event.venue}</small>
                  <b>{event.price}</b>
                  <Link className="mini-ticket-link" to={`/buyer/events/${event.id}`}>
                    <FaTicketAlt /> View details
                  </Link>
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
            <span>Popular Cities</span>
            <div className="filter-chips">
              {cityOptions.map((item) => (
                <button
                  className={draftCity === item ? "active" : ""}
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
          <label>
            Date
            <input type="date" />
          </label>
          <label>
            Price Range
            <input type="range" min="0" max="200" defaultValue="200" />
          </label>
          <label className="check-row">
            <input checked={freeOnly} onChange={(event) => setFreeOnly(event.target.checked)} type="checkbox" /> Free Events
          </label>
          <button className="primary-button" onClick={() => setQuery(draftQuery)} type="button">
            Apply Filters
          </button>
        </aside>
      </div>
    </section>
  );
}

export default HomePage;
