import { useEffect, useState } from "react";
import DynamicForm from "../../components/DynamicForm.jsx";
import DynamicTable from "../../components/DynamicTable.jsx";
import { getTicketTypes } from "../../services/ticketTypeService.js";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
};

const toDateInputValue = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function TicketTypesPage() {
  const [ticketTypes, setTicketTypes] = useState([]);
  const [editingTicketType, setEditingTicketType] = useState(null);

  const columns = [
    { key: "name", label: "Name" },
    { key: "priceText", label: "Price" },
    { key: "quantityAvailable", label: "Available" },
    { key: "saleStartText", label: "Sale Start" },
    { key: "saleEndText", label: "Sale End" }
  ];

  const fields = [
    { name: "name", label: "Name", type: "text", placeholder: "VIP", required: true },
    { name: "price", label: "Price", type: "number", placeholder: "75", required: true },
    {
      name: "quantityAvailable",
      label: "Quantity Available",
      type: "number",
      placeholder: "100",
      required: true
    },
    { name: "saleStartDate", label: "Sale Start", type: "date", required: true },
    { name: "saleEndDate", label: "Sale End", type: "date", required: true }
  ];

  useEffect(() => {
    getTicketTypes().then(setTicketTypes);
  }, []);

  const normalizeTicketType = (values, id = crypto.randomUUID()) => ({
    id,
    name: values.name,
    price: Number(values.price),
    quantityAvailable: Number(values.quantityAvailable),
    saleStartDate: values.saleStartDate,
    saleEndDate: values.saleEndDate
  });

  const handleSubmit = (values) => {
    if (editingTicketType) {
      setTicketTypes((prev) =>
        prev.map((ticketType) =>
          ticketType.id === editingTicketType.id
            ? normalizeTicketType(values, editingTicketType.id)
            : ticketType
        )
      );
      setEditingTicketType(null);
      return;
    }

    setTicketTypes((prev) => [normalizeTicketType(values), ...prev]);
  };

  const handleEdit = (ticketType) => {
    setEditingTicketType({
      ...ticketType,
      price: String(ticketType.price),
      quantityAvailable: String(ticketType.quantityAvailable),
      saleStartDate: toDateInputValue(ticketType.saleStartDate),
      saleEndDate: toDateInputValue(ticketType.saleEndDate)
    });
  };

  const handleDelete = (ticketType) => {
    setTicketTypes((prev) => prev.filter((item) => item.id !== ticketType.id));
  };

  const fetchTicketTypes = async (page, pageSize, search) => {
    const mappedTicketTypes = ticketTypes.map((ticketType) => ({
      ...ticketType,
      priceText: `${Number(ticketType.price || 0).toFixed(2)} EUR`,
      saleStartText: formatDate(ticketType.saleStartDate),
      saleEndText: formatDate(ticketType.saleEndDate)
    }));

    const filtered = mappedTicketTypes.filter((ticketType) =>
      [
        ticketType.name,
        ticketType.price,
        ticketType.quantityAvailable,
        ticketType.saleStartText,
        ticketType.saleEndText
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    const start = (page - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize),
      totalPages: Math.ceil(filtered.length / pageSize) || 1
    };
  };

  return (
    <section className="page">
      <h1>Ticket Types</h1>
      <DynamicForm
        fields={fields}
        initialValues={editingTicketType || {}}
        onSubmit={handleSubmit}
        submitText={editingTicketType ? "Update ticket type" : "Add ticket type"}
      />

      {editingTicketType && (
        <div className="page-actions">
          <button type="button" onClick={() => setEditingTicketType(null)}>
            Cancel edit
          </button>
        </div>
      )}

      <DynamicTable
        columns={columns}
        fetchData={fetchTicketTypes}
        pageSizeOptions={[5, 10, 20]}
        refreshKey={ticketTypes.length + (editingTicketType?.id || "")}
        actions={{
          onEdit: handleEdit,
          onDelete: handleDelete
        }}
      />
    </section>
  );
}
