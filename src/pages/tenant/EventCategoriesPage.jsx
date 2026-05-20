import EntityCrudPage from "../../components/crud/EntityCrudPage";
import { eventCategoriesService } from "../../services/eventCategoriesService";

export default function EventCategoriesPage() {
  return (
    <EntityCrudPage
      title="Event Categories"
      api={eventCategoriesService}
      initialForm={{
        name: "",
        description: "",
        icon: "",
        displayOrder: 0,
        isActive: true,
      }}
      fields={[
        { name: "name", label: "Name" },
        { name: "description", label: "Description" },
        { name: "icon", label: "Icon" },
        { name: "displayOrder", label: "Display Order", type: "number" },
        { name: "isActive", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
