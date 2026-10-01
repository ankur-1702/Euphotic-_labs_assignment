const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { URL } = require("node:url");
const { seedMissingDishes } = require("./storage/dishesRepository");
const {
  DishError,
  listDishes,
  updateDish,
} = require("./services/dishesService");

const PORT = Number(process.env.PORT || 3000);
const BUILD_DIR = path.resolve(__dirname, "..", "dist");
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_384)
      throw new DishError(400, "Request body is too large.");
  }
  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new DishError(400, "Request body must be valid JSON.");
  }
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/dishes") {
    return sendJson(response, 200, await listDishes());
  }

  const match = url.pathname.match(/^\/api\/dishes\/([^/]+)$/);
  if (request.method === "PATCH" && match) {
    let dishId;
    try {
      dishId = decodeURIComponent(match[1]);
    } catch {
      throw new DishError(400, "Dish ID is invalid.");
    }
    const input = await readJsonBody(request);
    return sendJson(response, 200, await updateDish(dishId, input));
  }

  return sendJson(response, 404, { error: "API route not found." });
}

async function serveFrontend(request, response, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return sendJson(response, 400, { error: "Path is invalid." });
  }
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(BUILD_DIR, `.${requestedPath}`);
  const buildRoot = `${BUILD_DIR}${path.sep}`;
  if (
    filePath !== path.join(BUILD_DIR, "index.html") &&
    !filePath.startsWith(buildRoot)
  ) {
    return sendJson(response, 404, { error: "Not found." });
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type":
        MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    if (error.code === "ENOENT")
      return sendJson(response, 404, { error: "Not found." });
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(
    request.url,
    `http://${request.headers.host || "localhost"}`,
  );
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }
    await serveFrontend(request, response, url);
  } catch (error) {
    if (error instanceof DishError) {
      sendJson(response, error.status, {
        error: error.message,
        ...(error.current ? { current: error.current } : {}),
      });
      return;
    }
    console.error(error);
    if (!response.headersSent)
      sendJson(response, 500, { error: "Unexpected server error." });
  }
});

async function start() {
  const seeded = await seedMissingDishes();
  console.log(
    `Seed ready: added ${seeded.added} dish(es); ${seeded.total} total.`,
  );
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(PORT, () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  const activePort =
    typeof address === "object" && address ? address.port : PORT;
  console.log(`Nosh API running at http://localhost:${activePort}`);
  if (process.send) process.send({ type: "api-ready", port: activePort });
}

start().catch((error) => {
  console.error("Could not start the backend:", error);
  process.exitCode = 1;
});
