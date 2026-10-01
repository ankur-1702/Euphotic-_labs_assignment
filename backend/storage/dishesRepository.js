const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const DATA_DIR = path.resolve(__dirname, "..", "data");
const DATABASE_PATH = path.join(DATA_DIR, "dishes.json");
const SEED_PATH = path.join(DATA_DIR, "seed.json");

async function readDishes() {
  try {
    return JSON.parse(await fs.readFile(DATABASE_PATH, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeDishes(dishes) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temporaryPath = `${DATABASE_PATH}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(dishes, null, 2)}\n`);
  await fs.rename(temporaryPath, DATABASE_PATH);
}

async function seedMissingDishes() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const [current, supplied] = await Promise.all([
    readDishes(),
    fs.readFile(SEED_PATH, "utf8").then(JSON.parse),
  ]);
  const knownIds = new Set(current.map((dish) => String(dish.dishId)));
  const additions = supplied
    .filter((dish) => !knownIds.has(String(dish.dishId)))
    .map((dish) => ({ ...dish, version: 1 }));
  const next = [...current, ...additions];
  await writeDishes(next);
  return { added: additions.length, total: next.length };
}

module.exports = { readDishes, writeDishes, seedMissingDishes };
