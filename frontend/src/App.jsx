import { useEffect, useMemo, useState } from "react";
import ConflictBanner from "./components/ConflictBanner.jsx";
import DishGrid from "./components/DishGrid.jsx";
import DishToolbar from "./components/DishToolbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Toast from "./components/Toast.jsx";
import TopBar from "./components/TopBar.jsx";
import useDishDashboard from "./hooks/useDishDashboard.js";

function formatSyncTime(date) {
  if (!date) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  return seconds < 5 ? "just now" : `${seconds}s ago`;
}

export default function App() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [, setClock] = useState(Date.now());
  const dashboard = useDishDashboard();
  const {
    dishes,
    valuesFor,
    isDirty,
    editDraft,
    discardDraft,
    saveDish,
    reloadDish,
    loadDishes,
    newerDishIds,
    loading,
    loadError,
    lastSynced,
    toast,
    announce,
    savingIds,
  } = dashboard;

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const focusSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector("#dish-search")?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const counts = useMemo(
    () => ({
      all: dishes.length,
      published: dishes.filter((dish) => valuesFor(dish).isPublished).length,
      draft: dishes.filter((dish) => !valuesFor(dish).isPublished).length,
    }),
    [dishes, valuesFor],
  );

  const visibleDishes = useMemo(
    () =>
      dishes.filter((dish) => {
        const values = valuesFor(dish);
        const matchesFilter =
          filter === "all" ||
          (filter === "published" ? values.isPublished : !values.isPublished);
        return (
          matchesFilter &&
          `${values.dishName} ${dish.dishId}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        );
      }),
    [dishes, filter, query, valuesFor],
  );

  const handleReload = async (dish) => {
    const name =
      dishes.find((item) => String(item.dishId) === String(dish))?.dishName ||
      "this dish";
    if (
      !window.confirm(
        `Reload the saved version of ${name}? This will discard your local draft for this dish.`,
      )
    )
      return;
    try {
      await reloadDish(dish);
    } catch (error) {
      announce(error.message, "error");
    }
  };

  return (
    <div className="app-shell min-h-screen bg-[#f7f7f4]">
      <Sidebar dishCount={dishes.length} />
      <main className="main-content" id="dishes">
        <TopBar />
        <section className="page-heading">
          <div>
            <p className="eyebrow">YOUR MENU</p>
            <h1>
              Dishes <span className="heading-count">{dishes.length}</span>
            </h1>
            <p className="subtitle">
              Manage your menu and keep everything tasting just right.
            </p>
          </div>
          <button
            className="refresh-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#638354] focus-visible:ring-offset-2"
            title="Reload dishes"
            onClick={() => loadDishes()}
          >
            ↻ <span>Refresh</span>
          </button>
        </section>
        <DishToolbar
          counts={counts}
          filter={filter}
          onFilterChange={setFilter}
          query={query}
          onQueryChange={setQuery}
        />
        {loadError && dishes.length > 0 && (
          <div className="banner error-banner" role="status">
            {loadError}
          </div>
        )}
        <ConflictBanner
          dishIds={newerDishIds}
          dishes={dishes}
          onReload={handleReload}
        />
        <DishGrid
          dishes={visibleDishes}
          loading={loading}
          error={dishes.length === 0 ? loadError : ""}
          valuesFor={valuesFor}
          isDirty={isDirty}
          savingIds={savingIds}
          onDraftChange={editDraft}
          onSave={saveDish}
          onDiscard={discardDraft}
          onRetry={() => loadDishes()}
        />
        <div className="footer-note">
          <span>
            <i /> Your changes are saved securely
          </span>
          <span>
            Last synced <strong>{formatSyncTime(lastSynced)}</strong>
          </span>
        </div>
        <Toast toast={toast} />
      </main>
    </div>
  );
}
