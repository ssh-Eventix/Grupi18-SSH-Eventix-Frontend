import EntityCrudPage from "../../components/crud/EntityCrudPage";
import { eventSectionsService } from "../../services/eventSectionsService";

export default function EventSectionsPage() {
  return (
    <EntityCrudPage
      title="Event Sections"
      api={eventSectionsService}
      initialForm={{
        eventId: "",
        venueSectionId: "",
        name: "",
        code: "",
        capacity: 0,
        isActive: true,
        salesStartUtc: "",
        salesEndUtc: "",
      }}
      fields={[
        { name: "eventId", label: "Event Id" },
        { name: "venueSectionId", label: "Venue Section Id" },
        { name: "name", label: "Name" },
        { name: "code", label: "Code" },
        { name: "capacity", label: "Capacity", type: "number" },
        { name: "salesStartUtc", label: "Sales Start", type: "datetime-local" },
        { name: "salesEndUtc", label: "Sales End", type: "datetime-local" },
        { name: "isActive", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
