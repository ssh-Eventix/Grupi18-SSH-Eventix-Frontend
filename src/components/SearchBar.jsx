export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search..."
}) {
  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(e);
      }}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <button type="submit">Search</button>
    </form>
  );
}
