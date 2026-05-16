import EntityCrudPage from "../../components/crud/EntityCrudPage";
import { venueSectionsApi } from "../../api/venueSectionsApi";

export default function VenueSectionsPage() {
  return (
    <EntityCrudPage
      title="Venue Sections"
      api={venueSectionsApi}
      initialForm={{
        venueId: "",
        name: "",
        code: "",
        capacity: 0,
        seatType: 0,
        displayOrder: 0,
        isActive: true,
        defaultBasePrice: 0,
      }}
      fields={[
        { name: "venueId", label: "Venue Id" },
        { name: "name", label: "Name" },
        { name: "code", label: "Code" },
        { name: "capacity", label: "Capacity", type: "number" },
        { name: "seatType", label: "Seat Type", type: "number" },
        { name: "displayOrder", label: "Display Order", type: "number" },
        { name: "defaultBasePrice", label: "Default Price", type: "number" },
        { name: "isActive", label: "Active", type: "checkbox" },
      ]}
    />
  );
}