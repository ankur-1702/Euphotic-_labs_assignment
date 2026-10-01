import DishCard from "./DishCard.jsx";

export default function DishGrid({
  dishes,
  loading,
  error,
  valuesFor,
  isDirty,
  savingIds,
  onDraftChange,
  onSave,
  onDiscard,
  onRetry,
}) {
  if (loading && dishes.length === 0) {
    return (
      <section className="dish-grid">
        <div className="state-card loading-state">
          <span className="loading-spinner" />
          <h2>Setting the table...</h2>
          <p>Loading your dishes</p>
        </div>
      </section>
    );
  }
  if (error && dishes.length === 0) {
    return (
      <section className="dish-grid">
        <div className="state-card">
          <span className="state-icon">!</span>
          <h2>We couldn't load the menu</h2>
          <p>{error}</p>
          <button className="button secondary" onClick={onRetry}>
            Try again
          </button>
        </div>
      </section>
    );
  }
  if (dishes.length === 0) {
    return (
      <section className="dish-grid">
        <div className="state-card">
          <span className="state-icon">▦</span>
          <h2>Your menu is taking a breather</h2>
          <p>No dishes are available yet.</p>
        </div>
      </section>
    );
  }
  return (
    <section className="dish-grid" aria-live="polite" aria-label="Dishes">
      {dishes.length ? (
        dishes.map((dish, index) => (
          <DishCard
            key={dish.dishId}
            dish={dish}
            values={valuesFor(dish)}
            dirty={isDirty(dish)}
            saving={savingIds.includes(String(dish.dishId))}
            index={index}
            onDraftChange={onDraftChange}
            onSave={onSave}
            onDiscard={onDiscard}
          />
        ))
      ) : (
        <div className="state-card">
          <span className="state-icon">⌕</span>
          <h2>No dishes match</h2>
          <p>Try a different search or filter.</p>
        </div>
      )}
    </section>
  );
}
