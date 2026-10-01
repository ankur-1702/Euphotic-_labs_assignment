export default function ConflictBanner({ dishIds, dishes, onReload }) {
  if (!dishIds.length) return null;
  const conflicted = dishes.filter((dish) =>
    dishIds.includes(String(dish.dishId)),
  );
  return (
    <div className="banner" role="status">
      <span>↗</span> Newer saved data is available for{" "}
      {conflicted.map((dish) => dish.dishName).join(", ")}. Your local draft is
      safe.
      {conflicted.map((dish) => (
        <button key={dish.dishId} onClick={() => onReload(dish.dishId)}>
          Reload {dish.dishName}
        </button>
      ))}
    </div>
  );
}
