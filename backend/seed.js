const { seedMissingDishes } = require("./storage/dishesRepository");

async function seed() {
  const result = await seedMissingDishes();
  console.log(
    `Seed complete: added ${result.added} dish(es); ${result.total} total.`,
  );
}

seed().catch((error) => {
  console.error("Could not seed dishes:", error);
  process.exitCode = 1;
});
