export default function DishToolbar({
  counts,
  filter,
  onFilterChange,
  query,
  onQueryChange,
}) {
  const tabs = [
    ["all", "All dishes", counts.all],
    ["published", "Published", counts.published],
    ["draft", "Drafts", counts.draft],
  ];

  return (
    <div className="toolbar">
      <div className="tabs">
        {tabs.map(([id, label, count]) => (
          <button
            className={`tab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#638354] ${filter === id ? "active" : ""}`}
            key={id}
            onClick={() => onFilterChange(id)}
          >
            {label} <span>{count}</span>
          </button>
        ))}
      </div>
      <label className="search">
        <span>⌕</span>
        <input
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91aa75]"
          id="dish-search"
          type="search"
          placeholder="Search dishes..."
          aria-label="Search dishes"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <kbd>⌘ K</kbd>
      </label>
    </div>
  );
}
