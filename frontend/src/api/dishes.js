async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload.error || "The request could not be completed.",
    );
    error.status = response.status;
    error.current = payload.current;
    throw error;
  }
  return payload;
}

export async function getDishes() {
  return readResponse(await fetch("/api/dishes", { cache: "no-store" }));
}

export async function updateDish(dishId, values, expectedVersion) {
  return readResponse(
    await fetch(`/api/dishes/${encodeURIComponent(dishId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, expectedVersion }),
    }),
  );
}
