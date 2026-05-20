import EntityCrudPage from "../../components/crud/EntityCrudPage";
import { tenantsApi } from "../../api/tenantsApi";

export default function TenantsPage() {
  return (
    <EntityCrudPage
      title="Tenants"
      api={tenantsApi}
      initialForm={{
        name: "",
        slug: "",
        schemaName: "",
        description: "",
        contactEmail: "",
        city: "",
        country: "",
        logoUrl: "",
        status: 0,
        isTrial: false,
        isActive: true,
      }}
      fields={[
        { name: "name", label: "Name" },
        { name: "slug", label: "Slug" },
        { name: "schemaName", label: "Schema Name" },
        { name: "description", label: "Description" },
        { name: "contactEmail", label: "Contact Email", type: "email" },
        { name: "city", label: "City" },
        { name: "country", label: "Country" },
        { name: "logoUrl", label: "Logo URL" },
        { name: "status", label: "Status", type: "number" },
        { name: "isTrial", label: "Trial", type: "checkbox" },
        { name: "isActive", label: "Active", type: "checkbox" },
      ]}
    />
  );
}