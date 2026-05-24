import EntityCrudPage from "../../components/crud/EntityCrudPage";
import { eventsService } from "../../services/eventsService";

export default function EventsPage() {
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
      fields={[
        { name: "venueId", label: "Venue Id" },
        { name: "eventCategoryId", label: "Category Id" },
        { name: "title", label: "Title" },
        { name: "slug", label: "Slug" },
        { name: "description", label: "Description" },
        { name: "organizerName", label: "Organizer" },
        { name: "startUtc", label: "Start", type: "datetime-local" },
        { name: "endUtc", label: "End", type: "datetime-local" },
        { name: "status", label: "Status", type: "number" },
        { name: "visibility", label: "Visibility", type: "number" },
        { name: "bannerImageUrl", label: "Banner Image URL" },
        { name: "maxTicketsPerOrder", label: "Max Tickets", type: "number" },
        { name: "minTicketsPerOrder", label: "Min Tickets", type: "number" },
        { name: "currency", label: "Currency" },
        { name: "isFree", label: "Free", type: "checkbox" },
        { name: "isPublished", label: "Published", type: "checkbox" },
      ]}
    />
  );
}
