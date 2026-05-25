import { useEffect, useMemo, useState } from "react";
import EntityCrudPage from "../../components/crud/EntityCrudPage";
import { aiService } from "../../services/aiService";
import { eventCategoriesService } from "../../services/eventCategoriesService";
import { eventsService } from "../../services/eventsService";
import { venuesService } from "../../services/venuesService";
import { FaBrain } from "react-icons/fa";

export default function EventsPage() {
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadLookups() {
      try {
        const [venueData, categoryData] = await Promise.all([
          venuesService.getAll(),
          eventCategoriesService.getAll(),
        ]);

        if (!isMounted) return;

        setVenues(Array.isArray(venueData) ? venueData : venueData?.data ?? []);
        setCategories(Array.isArray(categoryData) ? categoryData : categoryData?.data ?? []);
      } catch {
        if (!isMounted) return;

        setVenues([]);
        setCategories([]);
      }
    }

    loadLookups();

    return () => {
      isMounted = false;
    };
  }, []);

  const venueOptions = useMemo(() => [
    { value: "", label: "Select venue" },
    ...venues.map((venue) => ({
      value: venue.id,
      label: venue.code ? `${venue.name} (${venue.code})` : venue.name,
    })),
  ], [venues]);

  const categoryOptions = useMemo(() => [
    { value: "", label: "Select category" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ], [categories]);

  const venueNameById = useMemo(() => {
    return venues.reduce((map, venue) => {
      map[String(venue.id)] = venue.name;
      return map;
    }, {});
  }, [venues]);

  const categoryNameById = useMemo(() => {
    return categories.reduce((map, category) => {
      map[String(category.id)] = category.name;
      return map;
    }, {});
  }, [categories]);

  const generateDescription = async ({ form, updateField, setError, setMessage }) => {
    const title = form.title?.trim();

    if (!title) {
      setError("Add an event title before generating the description.");
      return;
    }

    const result = await aiService.generateEventDescription({
      title,
      category: categoryNameById[String(form.eventCategoryId)] || "Event",
      location: venueNameById[String(form.venueId)] || form.organizerName?.trim() || "Event venue",
      organizerName: form.organizerName?.trim() || "",
      startUtc: form.startUtc || "",
      endUtc: form.endUtc || "",
      currency: form.currency || "EUR",
      isFree: Boolean(form.isFree),
    });

    const response = result.response?.trim();

    if (!response) {
      setError("AI did not return a description. Try again.");
      return;
    }

    updateField("description", response.slice(0, 3000));
    setMessage("AI description generated.");
  };

  const generateMarketing = async ({ form, updateField, setError, setMessage }) => {
    const eventTitle = form.title?.trim();
    const eventDescription = form.description?.trim();

    if (!eventTitle) {
      setError("Add an event title before generating marketing content.");
      return;
    }

    if (!eventDescription) {
      setError("Add or generate an event description first.");
      return;
    }

    const result = await aiService.generateMarketing({
      eventTitle,
      eventDescription,
    });

    const response = result.response?.trim();

    if (!response) {
      setError("AI did not return marketing content. Try again.");
      return;
    }

    updateField("marketingCopy", response);
    setMessage("AI marketing content generated.");
  };

  const fields = [
    {
      name: "venueId",
      label: "Venue",
      type: "select",
      options: venueOptions,
      required: true,
      render: (event) => venueNameById[String(event.venueId)] || event.venueName || event.venueId,
    },
    {
      name: "eventCategoryId",
      label: "Category",
      type: "select",
      options: categoryOptions,
      required: true,
      render: (event) =>
        categoryNameById[String(event.eventCategoryId)] ||
        event.eventCategoryName ||
        event.eventCategoryId,
    },
    { name: "title", label: "Title", required: true },
    { name: "slug", label: "Slug" },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      rows: 7,
      maxLength: 3000,
      fullWidth: true,
      action: {
        label: "AI",
        loadingLabel: "Generating...",
        title: "Generate description with AI",
        icon: FaBrain,
        onClick: generateDescription,
      },
    },
    {
      name: "marketingCopy",
      label: "Marketing Copy",
      type: "textarea",
      rows: 7,
      fullWidth: true,
      action: {
        label: "AI Marketing",
        loadingLabel: "Generating...",
        title: "Generate marketing content with AI",
        icon: FaBrain,
        onClick: generateMarketing,
      },
    },
    { name: "organizerName", label: "Organizer" },
    { name: "startUtc", label: "Start", type: "datetime-local", required: true },
    { name: "endUtc", label: "End", type: "datetime-local", required: true },
    { name: "status", label: "Status", type: "number" },
    { name: "visibility", label: "Visibility", type: "number" },
    { name: "bannerImageUrl", label: "Banner Image URL" },
    { name: "maxTicketsPerOrder", label: "Max Tickets", type: "number", min: 1 },
    { name: "minTicketsPerOrder", label: "Min Tickets", type: "number", min: 1 },
    { name: "currency", label: "Currency", required: true },
    { name: "isFree", label: "Free", type: "checkbox" },
    { name: "isPublished", label: "Published", type: "checkbox" },
  ];

  const tableFields = [
    { name: "title", label: "Title" },
    {
      name: "eventCategoryId",
      label: "Category",
      render: (event) =>
        categoryNameById[String(event.eventCategoryId)] ||
        event.eventCategoryName ||
        event.eventCategoryId,
    },
    {
      name: "venueId",
      label: "Venue",
      render: (event) => venueNameById[String(event.venueId)] || event.venueName || event.venueId,
    },
    { name: "organizerName", label: "Organizer" },
    {
      name: "startUtc",
      label: "Start",
      render: (event) => event.startUtc ? new Date(event.startUtc).toLocaleString() : "",
    },
    {
      name: "endUtc",
      label: "End",
      render: (event) => event.endUtc ? new Date(event.endUtc).toLocaleString() : "",
    },
    {
      name: "isPublished",
      label: "Published",
      render: (event) => (event.isPublished ? "Yes" : "No"),
    },
  ];

  return (
    <EntityCrudPage
      title="Events"
      api={eventsService}
      initialForm={{
        venueId: "",
        eventCategoryId: "",
        title: "",
        slug: "",
        description: "",
        marketingCopy: "",
        organizerName: "",
        startUtc: "",
        endUtc: "",
        status: 0,
        visibility: 0,
        bannerImageUrl: "",
        maxTicketsPerOrder: 10,
        minTicketsPerOrder: 1,
        isFree: false,
        isPublished: false,
        currency: "EUR",
      }}
      fields={fields}
      tableFields={tableFields}
    />
  );
}
