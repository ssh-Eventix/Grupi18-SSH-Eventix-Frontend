import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { handleApiError } from "../../utils/apiErrorHandler";
import "./SuperAdmin.css";

const emptyVenue = {
  name: "",
  code: "",
  addressLine1: "",
  city: "",
  country: "",
  totalCapacity: 0,
  isIndoor: true,
  isAccessible: true,
};

const emptySection = {
  name: "",
  code: "",
  capacity: 0,
  seatType: 1,
  displayOrder: 0,
  isActive: true,
  defaultBasePrice: "",
};

export default function SuperAdminVenuesPage() {
  const [venues, setVenues] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);

  const [venueForm, setVenueForm] = useState(emptyVenue);
  const [sectionForm, setSectionForm] = useState(emptySection);

  const [editingVenueId, setEditingVenueId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [venueSectionsMap, setVenueSectionsMap] = useState({});
  const [success, setSuccess] = useState("");
  const [savingSection, setSavingSection] = useState(false);

    const loadVenues = async () => {
    try {
        setLoading(true);

        const response = await api.get("/Venue");
        const venueList = response.data || [];
        setVenues(venueList);

        const sectionsByVenue = {};

        await Promise.all(
        venueList.map(async (venue) => {
            try {
            const sectionResponse = await api.get(
              `/VenueSection/public/venue/${venue.id}`
            );

            sectionsByVenue[venue.id] = sectionResponse.data || [];
            } catch {
            sectionsByVenue[venue.id] = [];
            }
        })
        );

        setVenueSectionsMap(sectionsByVenue);
    } catch {
        setError(handleApiError(err));
    } finally {
        setLoading(false);
    }
    };

  const loadSections = async (venue) => {
    try {
      setSelectedVenue(venue);
      const response = await api.get(
        `/VenueSection/public/venue/${venue.id}`
      );
      setSections(response.data || []);
    } catch (err) {
      setError("Failed to load venue sections.");
    }
  };

  useEffect(() => {
    loadVenues();
  }, []);

  const handleVenueChange = (e) => {
    const { name, value, type, checked } = e.target;

    setVenueForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSectionChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSectionForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveVenue = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      ...venueForm,
      totalCapacity: Number(venueForm.totalCapacity),
    };

    try {
      if (editingVenueId) {
        await api.put(`/Venue/${editingVenueId}`, payload);
      } else {
        await api.post("/Venue", payload);
      }

      setVenueForm(emptyVenue);
      setEditingVenueId(null);
      await loadVenues();
    } catch (err) {
      setError("Failed to save venue.");
    }
  };

  const editVenue = (venue) => {
    setEditingVenueId(venue.id);
    setVenueForm({
      name: venue.name || "",
      code: venue.code || "",
      addressLine1: venue.addressLine1 || "",
      city: venue.city || "",
      country: venue.country || "",
      totalCapacity: venue.totalCapacity || 0,
      isIndoor: Boolean(venue.isIndoor),
      isAccessible: Boolean(venue.isAccessible),
    });
  };

  const deleteVenue = async (id) => {
    if (!window.confirm("Delete this venue?")) return;

    try {
      await api.delete(`/Venue/${id}`);
      if (selectedVenue?.id === id) {
        setSelectedVenue(null);
        setSections([]);
      }
      await loadVenues();
    } catch (err) {
      setError("Failed to delete venue.");
    }
  };

    const saveSection = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedVenue) {
        setError("Select a venue first.");
        return;
    }

    const newCapacity = Number(sectionForm.capacity);

    if (newCapacity <= 0) {
        setError("Section capacity must be greater than 0.");
        return;
    }

    const duplicateCode = sections.some(
        (section) =>
        section.code?.trim().toLowerCase() ===
        sectionForm.code.trim().toLowerCase()
    );

    if (duplicateCode) {
        setError("A section with this code already exists for this venue.");
        return;
    }

    const currentUsedCapacity = sections.reduce(
        (sum, section) => sum + Number(section.capacity || 0),
        0
    );

    if (currentUsedCapacity + newCapacity > Number(selectedVenue.totalCapacity)) {
        setError(
        `Cannot add this section. Used capacity would become ${
            currentUsedCapacity + newCapacity
        }, but venue capacity is only ${selectedVenue.totalCapacity}.`
        );
        return;
    }

    const payload = {
        venueId: selectedVenue.id,
        name: sectionForm.name.trim(),
        code: sectionForm.code.trim(),
        capacity: newCapacity,
        seatType: Number(sectionForm.seatType),
        displayOrder: Number(sectionForm.displayOrder),
        isActive: Boolean(sectionForm.isActive),
        defaultBasePrice:
        sectionForm.defaultBasePrice === ""
            ? null
            : Number(sectionForm.defaultBasePrice),
    };

    try {
        setSavingSection(true);

        await api.post("/VenueSection", payload);

        const sectionResponse = await api.get(
          `/VenueSection/public/venue/${selectedVenue.id}`
        );

        const updatedSections = sectionResponse.data || [];

        setSections(updatedSections);

        setVenueSectionsMap((prev) => ({
        ...prev,
        [selectedVenue.id]: updatedSections,
        }));

        setSectionForm(emptySection);
        setSuccess("Venue section created successfully.");
    } catch (err) {
        setError(handleApiError(err));
    } finally {
        setSavingSection(false);
    }
    };

  const deleteSection = async (id) => {
    if (!window.confirm("Delete this section?")) return;

    try {
      await api.delete(`/VenueSection/${id}`);
      await loadSections(selectedVenue);
      await loadVenues();
    } catch (err) {
      setError("Failed to delete section.");
    }
  };

  const usedCapacity = sections.reduce(
    (sum, section) => sum + Number(section.capacity || 0),
    0
  );

  return (
    <div style={styles.page}>
      <h1>Venues</h1>
      <p style={styles.subtitle}>
        Manage venue structure and physical sections. VIP or Regular setup is
        decided later in Event Sections.
      </p>

      {error && <div className="form-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2>{editingVenueId ? "Edit Venue" : "Create Venue"}</h2>

        <form onSubmit={saveVenue} className="superadmin-form">
        <div className="superadmin-field">
            <label>Name</label>
            <input
            className="superadmin-input"
            style={styles.inputFull}
            name="name"
            value={venueForm.name}
            onChange={handleVenueChange}
            placeholder="Example: Prishtina Arena"
            required
            />
        </div>

        <div className="superadmin-field">
            <label>Code</label>
            <input
            className="superadmin-input"
            style={styles.inputFull}
            name="code"
            value={venueForm.code}
            onChange={handleVenueChange}
            placeholder="Example: PR-ARENA"
            required
            />
        </div>

        <div className="superadmin-field full">
            <label>Address</label>
            <input
            className="superadmin-input"
            style={styles.inputFull}
            name="addressLine1"
            value={venueForm.addressLine1}
            onChange={handleVenueChange}
            placeholder="Street address"
            required
            />
        </div>

        <div className="superadmin-field">
            <label>City</label>
            <input
            className="superadmin-input"
            style={styles.inputFull}
            name="city"
            value={venueForm.city}
            onChange={handleVenueChange}
            placeholder="City"
            required
            />
        </div>

        <div className="superadmin-field">
            <label>Country</label>
            <input
            className="superadmin-input"
            style={styles.inputFull}
            name="country"
            value={venueForm.country}
            onChange={handleVenueChange}
            placeholder="Country"
            required
            />
        </div>

        <div className="superadmin-field">
            <label>Total capacity</label>
            <input
            className="superadmin-input"
            style={styles.inputFull}
            name="totalCapacity"
            type="number"
            min="0"
            value={venueForm.totalCapacity}
            onChange={handleVenueChange}
            required
            />
        </div>

        <label>
            <input
            type="checkbox"
            name="isIndoor"
            checked={venueForm.isIndoor}
            onChange={handleVenueChange}
            />
            Indoor venue
        </label>

        <label>
            <input
            type="checkbox"
            name="isAccessible"
            checked={venueForm.isAccessible}
            onChange={handleVenueChange}
            />
            Accessible venue
        </label>

        <div className="form-row-actions">
            <button className="primary-action" type="submit">
            {editingVenueId ? "Update Venue" : "Create Venue"}
            </button>

            {editingVenueId && (
            <button
                className="secondary-action"
                type="button"
                onClick={() => {
                setEditingVenueId(null);
                setVenueForm(emptyVenue);
                }}
            >
                Cancel Edit
            </button>
            )}
        </div>
        </form>
        </section>
        <section style={styles.card}>
        <h2>Venue List</h2>

        {loading ? (
            <p>Loading...</p>
        ) : (
            <div style={styles.venueCards}>
            {venues.map((venue) => {
                const venueSections = venueSectionsMap[venue.id] || [];

                return (
                <div key={venue.id} style={styles.venueCard}>
                    <h3>{venue.name}</h3>

                    <p><strong>Code:</strong> {venue.code}</p>
                    <p><strong>Address:</strong> {venue.addressLine1 || "-"}</p>
                    <p><strong>City:</strong> {venue.city}</p>
                    <p><strong>Country:</strong> {venue.country}</p>
                    <p><strong>Total Capacity:</strong> {venue.totalCapacity}</p>
                    <p><strong>Indoor:</strong> {venue.isIndoor ? "Yes" : "No"}</p>
                    <p><strong>Accessible:</strong> {venue.isAccessible ? "Yes" : "No"}</p>

                    <div style={styles.miniMap}>
                    {venueSections.length === 0 ? (
                        <p style={styles.mapEmpty}>No sections yet</p>
                    ) : (
                        venueSections
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((section, index) => (
                            <div key={section.id} style={getMiniSectionBoxStyle(index)}>
                            <strong>{section.name}</strong>
                            <span>{section.code}</span>
                            <small>{section.capacity} seats</small>
                            </div>
                        ))
                    )}
                    </div>

                    <div style={styles.actions}>
                    <button onClick={() => loadSections(venue)}>
                        Manage Sections
                    </button>
                    <button onClick={() => editVenue(venue)}>Edit</button>
                    <button onClick={() => deleteVenue(venue.id)}>Delete</button>
                    </div>
                </div>
                );
            })}
            </div>
        )}
        </section>
      </div>

      {selectedVenue && (
        <section style={styles.card}>
          <h2>Sections for {selectedVenue.name}</h2>

          <p>
            Used capacity: <strong>{usedCapacity}</strong> /{" "}
            <strong>{selectedVenue.totalCapacity}</strong>
          </p>

          <div style={styles.map}>
            {sections.length === 0 && (
              <p style={styles.mapEmpty}>No sections added yet.</p>
            )}

            {sections
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((section, index) => (
                <div key={section.id} style={getSectionBoxStyle(index)}>
                  <strong>{section.name}</strong>
                  <span>{section.code}</span>
                  <small>{section.capacity} seats</small>
                </div>
              ))}
          </div>

          <form onSubmit={saveSection} style={styles.sectionForm}>
            <input
              name="name"
              placeholder="Section Name"
              value={sectionForm.name}
              onChange={handleSectionChange}
              required
            />

            <input
              name="code"
              placeholder="Code"
              value={sectionForm.code}
              onChange={handleSectionChange}
              required
            />

            <input
              name="capacity"
              type="number"
              placeholder="Capacity"
              value={sectionForm.capacity}
              onChange={handleSectionChange}
              required
            />

            <select
              name="seatType"
              value={sectionForm.seatType}
              onChange={handleSectionChange}
            >
              <option value={1}>General Admission</option>
              <option value={2}>Numbered Seats</option>
            </select>

            <input
              name="displayOrder"
              type="number"
              placeholder="Display Order"
              value={sectionForm.displayOrder}
              onChange={handleSectionChange}
            />

            <input
              name="defaultBasePrice"
              type="number"
              placeholder="Default Base Price"
              value={sectionForm.defaultBasePrice}
              onChange={handleSectionChange}
            />

            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={sectionForm.isActive}
                onChange={handleSectionChange}
              />
              Active
            </label>

            <button className="primary-action" type="submit" disabled={savingSection}>
            {savingSection ? "Adding..." : "Add Section"}
            </button>
          </form>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Capacity</th>
                <th>Seat Type</th>
                <th>Order</th>
                <th>Base Price</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={section.id}>
                  <td>{section.name}</td>
                  <td>{section.code}</td>
                  <td>{section.capacity}</td>
                  <td>
                    {section.seatType === 1
                      ? "General Admission"
                      : "Numbered Seats"}
                  </td>
                  <td>{section.displayOrder}</td>
                  <td>{section.defaultBasePrice ?? "-"}</td>
                  <td>{section.isActive ? "Yes" : "No"}</td>
                  <td>
                    <button onClick={() => deleteSection(section.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function getSectionBoxStyle(index) {
  const columns = 3;
  const width = 28;
  const height = 24;
  const gapX = 4;
  const gapY = 8;

  const row = Math.floor(index / columns);
  const col = index % columns;

  return {
    ...styles.sectionBox,
    left: `${4 + col * (width + gapX)}%`,
    top: `${8 + row * (height + gapY)}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

function getMiniSectionBoxStyle(index) {
  const columns = 2;
  const width = 42;
  const height = 30;
  const gapX = 6;
  const gapY = 8;

  const row = Math.floor(index / columns);
  const col = index % columns;

  return {
    position: "absolute",
    left: `${5 + col * (width + gapX)}%`,
    top: `${8 + row * (height + gapY)}%`,
    width: `${width}%`,
    height: `${height}%`,
    border: "1px solid #333",
    borderRadius: "8px",
    background: "#e9eefc",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: "12px",
    padding: "4px",
  };
}

const styles = {
  page: {
    padding: "24px",
  },
  subtitle: {
    color: "#666",
    marginBottom: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(480px, 560px) 1fr",
    gap: "20px",
    alignItems: "start",
  },
  inputFull: {
  width: "100%",
  boxSizing: "border-box",
  },
  card: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
  },
  form: {
    display: "grid",
    gap: "10px",
  },
  sectionForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "10px",
    marginBottom: "20px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  error: {
    background: "#ffe5e5",
    color: "#b00020",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "15px",
  },
  map: {
    position: "relative",
    height: "360px",
    border: "2px dashed #aaa",
    borderRadius: "14px",
    background: "#f8f8f8",
    marginBottom: "20px",
    overflow: "hidden",
  },
  mapEmpty: {
    textAlign: "center",
    marginTop: "150px",
    color: "#777",
  },
  sectionBox: {
    position: "absolute",
    border: "1px solid #333",
    borderRadius: "10px",
    background: "#e9eefc",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "8px",
  },
  venueCards: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "16px",
},

venueCard: {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "16px",
  background: "#fff",
},

miniMap: {
  position: "relative",
  height: "180px",
  border: "2px dashed #aaa",
  borderRadius: "12px",
  background: "#f8f8f8",
  marginTop: "12px",
  marginBottom: "12px",
  overflow: "hidden",
},

actions: {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
},
};