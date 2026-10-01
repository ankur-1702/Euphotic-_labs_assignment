const { readDishes, writeDishes } = require("../storage/dishesRepository");

class DishError extends Error {
  constructor(status, message, current) {
    super(message);
    this.name = "DishError";
    this.status = status;
    this.current = current;
  }
}

let updateQueue = Promise.resolve();

function serializeUpdate(operation) {
  const result = updateQueue.then(operation);
  updateQueue = result.catch(() => {});
  return result;
}

function validateUpdate(input) {
  const allowedFields = new Set(["dishName", "isPublished", "expectedVersion"]);
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !allowedFields.has(key)) ||
    typeof input.dishName !== "string" ||
    typeof input.isPublished !== "boolean" ||
    !Number.isInteger(input.expectedVersion) ||
    input.expectedVersion < 1
  ) {
    throw new DishError(
      400,
      "dishName (string), isPublished (boolean), and expectedVersion (positive integer) are required.",
    );
  }
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

async function listDishes() {
  return readDishes();
}

async function updateDish(dishId, input) {
  validateUpdate(input);
  return serializeUpdate(async () => {
    const dishes = await readDishes();
    const index = dishes.findIndex(
      (dish) => String(dish.dishId) === String(dishId),
    );
    if (index === -1) throw new DishError(404, "Dish not found.");

    const current = dishes[index];
    if (current.version !== input.expectedVersion) {
      throw new DishError(
        409,
        "This dish was changed elsewhere. Reload the latest value before saving.",
        current,
      );
    }

    const dishName = input.dishName.trim();
    if (input.isPublished && !dishName) {
      throw new DishError(400, "Published dishes need a non-empty name.");
    }
    if (input.isPublished && !isHttpUrl(current.imageUrl || "")) {
      throw new DishError(
        400,
        "Published dishes need a valid HTTP or HTTPS image URL.",
      );
    }

    const updated = {
      ...current,
      dishName,
      isPublished: input.isPublished,
      version: current.version + 1,
    };
    dishes[index] = updated;
    await writeDishes(dishes);
    return updated;
  });
}

module.exports = { DishError, listDishes, updateDish };
