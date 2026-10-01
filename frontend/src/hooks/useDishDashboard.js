import { useCallback, useEffect, useRef, useState } from "react";
import { getDishes, updateDish } from "../api/dishes.js";
import useToast from "./useToast.js";

const keyFor = (dishId) => String(dishId);

export default function useDishDashboard() {
  const [dishes, setDishes] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [newerDishIds, setNewerDishIds] = useState([]);
  const [savingIds, setSavingIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lastSynced, setLastSynced] = useState(null);
  const { toast, announce } = useToast();
  const stateRef = useRef({ dishes, drafts, newerDishIds });
  stateRef.current = { dishes, drafts, newerDishIds };

  const isDirty = useCallback(
    (dish) => {
      const draft = drafts[keyFor(dish.dishId)];
      return Boolean(
        draft &&
        (draft.dishName !== dish.dishName ||
          draft.isPublished !== dish.isPublished),
      );
    },
    [drafts],
  );

  const loadDishes = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setLoading(true);
      try {
        const incoming = await getDishes();
        const {
          dishes: currentDishes,
          drafts: currentDrafts,
          newerDishIds: currentConflicts,
        } = stateRef.current;
        const byId = new Map(
          currentDishes.map((dish) => [keyFor(dish.dishId), dish]),
        );
        const conflicts = incoming
          .filter((remote) => {
            const current = byId.get(keyFor(remote.dishId));
            const id = keyFor(remote.dishId);
            const draft = currentDrafts[id];
            const hasDraft =
              current &&
              draft &&
              (draft.dishName !== current.dishName ||
                draft.isPublished !== current.isPublished);
            return (
              hasDraft &&
              (remote.version > current.version ||
                currentConflicts.includes(id))
            );
          })
          .map((dish) => keyFor(dish.dishId));

        setNewerDishIds(conflicts);
        setDishes(incoming);
        setLoadError("");
        setLastSynced(new Date());
        if (conflicts.length && !quiet)
          announce(
            "Newer saved data is available. Your local draft is preserved.",
          );
      } catch (error) {
        setLoadError(
          `${error.message} Your edits are still here; please retry.`,
        );
      } finally {
        setLoading(false);
      }
    },
    [announce],
  );

  useEffect(() => {
    loadDishes();
    const timer = window.setInterval(() => loadDishes({ quiet: true }), 4000);
    return () => window.clearInterval(timer);
  }, [loadDishes]);

  const valuesFor = useCallback(
    (dish) =>
      drafts[keyFor(dish.dishId)] || {
        dishName: dish.dishName,
        isPublished: dish.isPublished,
      },
    [drafts],
  );

  const editDraft = useCallback((dish, values) => {
    const id = keyFor(dish.dishId);
    const isSameAsSaved =
      values.dishName === dish.dishName &&
      values.isPublished === dish.isPublished;
    setDrafts((current) => {
      const next = { ...current };
      if (isSameAsSaved) delete next[id];
      else next[id] = values;
      return next;
    });
  }, []);

  const discardDraft = useCallback(
    (dishId) => {
      setDrafts((current) => {
        const next = { ...current };
        delete next[keyFor(dishId)];
        return next;
      });
      announce("Draft discarded. Saved values restored.", "success");
    },
    [announce],
  );

  const reloadDish = useCallback(
    async (dishId) => {
      const latest = await getDishes();
      const remoteDish = latest.find(
        (dish) => keyFor(dish.dishId) === keyFor(dishId),
      );
      if (!remoteDish) return;
      setDishes(latest);
      setDrafts((current) => {
        const next = { ...current };
        delete next[keyFor(dishId)];
        return next;
      });
      setNewerDishIds((current) =>
        current.filter((id) => id !== keyFor(dishId)),
      );
      setLastSynced(new Date());
      announce("Saved version reloaded.", "success");
    },
    [announce],
  );

  const saveDish = useCallback(
    async (dish) => {
      const id = keyFor(dish.dishId);
      const values = drafts[id];
      if (!values || !isDirty(dish)) return;
      setSavingIds((current) => [...new Set([...current, id])]);
      try {
        const saved = await updateDish(id, values, dish.version);
        setDishes((current) =>
          current.map((item) => (keyFor(item.dishId) === id ? saved : item)),
        );
        setDrafts((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        setNewerDishIds((current) => current.filter((item) => item !== id));
        setLastSynced(new Date());
        announce(`${saved.dishName || "Dish"} saved successfully.`, "success");
      } catch (error) {
        if (error.status === 409 && error.current) {
          setDishes((current) =>
            current.map((item) =>
              keyFor(item.dishId) === id ? error.current : item,
            ),
          );
          setNewerDishIds((current) => [...new Set([...current, id])]);
          announce(
            "Conflict detected. Your draft is safe and ready to review.",
            "warning",
          );
        } else {
          announce(error.message, "error");
        }
      } finally {
        setSavingIds((current) => current.filter((item) => item !== id));
      }
    },
    [announce, drafts, isDirty],
  );

  useEffect(() => {
    const hasDrafts = dishes.some(isDirty);
    if (!hasDrafts) return undefined;
    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dishes, isDirty]);

  return {
    dishes,
    drafts,
    isDirty,
    valuesFor,
    editDraft,
    discardDraft,
    saveDish,
    savingIds,
    reloadDish,
    loadDishes,
    newerDishIds,
    loading,
    loadError,
    lastSynced,
    toast,
    announce,
  };
}
