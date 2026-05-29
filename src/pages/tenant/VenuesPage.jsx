import EntityCrudPage from "../../components/crud/EntityCrudPage";
import { venuesService } from "../../services/venuesService";

export default function VenuesPage() {
  return (
    <EntityCrudPage
      title="Venues"
      description="Public venues and venues created by this tenant."
      api={venuesService}
      initialForm={{
        name: "",
        code: "",
        addressLine1: "",
        city: "",
        country: "",
        totalCapacity: 0,
        isIndoor: true,
        isAccessible: true,
      }}
      fields={[
        { name: "name", label: "Name" },
        { name: "code", label: "Code" },
        { name: "addressLine1", label: "Address" },
        { name: "city", label: "City" },
        { name: "country", label: "Country" },
        { name: "totalCapacity", label: "Total Capacity", type: "number" },
        { name: "isIndoor", label: "Indoor", type: "checkbox" },
        { name: "isAccessible", label: "Accessible", type: "checkbox" },
      ]}
      tableFields={[
        { name: "name", label: "Name" },
        { name: "code", label: "Code" },
        { name: "addressLine1", label: "Address" },
        { name: "city", label: "City" },
        { name: "country", label: "Country" },
        { name: "totalCapacity", label: "Total Capacity", type: "number" },
        {
          name: "source",
          label: "Source",
          render: (venue) => (venue.source === "tenant" ? "Tenant" : "Public"),
        },
      ]}
    />
  );
}
