# Nosh dish dashboard

A React and Node full stack dish management app. The browser keeps edits as local drafts until **Save changes** is clicked. The Node server persists saved values to a JSON database and uses per-dish versions to reject stale writes.

## Prerequisites

- Node.js 20.19 or newer (Vite 8 requirement)
- npm

## Run locally

Install packages and seed the supplied dishes:

```sh
npm install
npm run seed
```

The code is split between `frontend/` and `backend/`. The UI uses Tailwind CSS 4 through its Vite plugin. Utility classes are used for layout and focus/interaction states; `frontend/src/styles.css` keeps the dashboard's custom component styling and imports Tailwind's base and utility layers.

For development, start the API and Vite together:

```sh
npm run dev
```

Open the local URL printed by Vite, usually [http://localhost:5173](http://localhost:5173). The development launcher lets the OS select a free backend port and configures Vite's API proxy to match. If port 5173 is occupied, Vite prints and uses the next available port.

For a production-style local run, use `npm start` to build the React app and serve it from the backend at [http://localhost:3000](http://localhost:3000). The backend also runs the idempotent seed operation on startup. The supplied five-dish dataset is tracked in `backend/data/seed.json`; saved values live in the ignored `backend/data/dishes.json` file. Seeding only inserts missing IDs, so rerunning it neither duplicates dishes nor resets edits. To start over for a fresh review, stop the server and remove `backend/data/dishes.json` before starting again.

Set `PORT` to use a different backend port, for example `PORT=4000 npm start`. During development, update the proxy target in `frontend/vite.config.mjs` if you change the API port.

## API

`GET /api/dishes` returns each dish's `dishId`, `dishName`, `imageUrl`, `isPublished`, and integer `version`.

`PATCH /api/dishes/:dishId` accepts a complete editable snapshot and the version originally loaded by the client:



Successful saves return the saved dish with its incremented version. Invalid payloads and published dishes with a blank name or invalid image URL receive `400`; unknown IDs receive `404`; stale versions receive `409` with the current dish. Version comparison and file replacement run in a serialized critical section, so simultaneous requests cannot both save against the same version. Writes use a temporary file and atomic rename, and JSON storage survives server restarts.

## Verification steps

1. Start the app and open it in two browser tabs. The five supplied dishes should load with their published state and version 1.
2. Change a name or switch publication off. The card should show **Unsaved changes**, and the backend should not change until you click **Save changes**. Click **Discard** and check that the loaded values return.
3. Edit and save a dish. Confirm its version advances, then reload the page or restart the server and confirm the edit remains. Run `npm run seed` again and confirm it does not reset that dish.
4. For backend validation, with dish 1 still published, send a PATCH with an empty `dishName` or temporarily replace its `imageUrl` in `backend/data/dishes.json` with an invalid URL and try to publish it. Expect `400`, then verify `GET /api/dishes` still returns the unchanged saved value. Restore the image URL afterward. A malformed payload should also return `400`; a nonexistent dish ID should return `404`.
5. In tab A, save a change to a dish. In tab B, edit that same dish based on its earlier version and save. Tab B should show a conflict, preserve its draft, and offer **Reload saved version**. Reload only after reviewing the warning; tab A's saved value remains intact.
6. To simulate an unavailable server during a save, stop the server after loading the page, edit a dish, and click Save. The browser should keep the draft editable and show an error. Restart the server and retry.
7. For polling behavior, save a change through `curl` while the dashboard is open. Within four seconds, the page should show that newer saved data is available. If the same dish has an unsaved local draft, that draft remains untouched until explicitly discarded or reloaded.

## Design notes and scope

- The frontend owns unsaved edits; there is no server-side draft table. It retains drafts after validation, network, and conflict errors.
- The dashboard polls every four seconds for external saves, keeps local drafts when newer versions arrive, and cleans up its interval when the page is closed.
- JSON file storage keeps the data easy to inspect. For this single-process local assignment it provides durable atomic updates; running multiple server processes against the same file is outside the supported setup.
- The remote image URLs are used directly. If an image cannot load, the card shows an unavailable-image fallback and the dashboard remains usable.
- Optional real-time sync: implemented with four-second polling. Authentication, image upload, dish creation/deletion, and deployment are outside the required scope.
- Frontend source is under `frontend/src/`: `App.jsx` composes the page, `components/` contains presentational UI, `hooks/` owns dashboard and notification state, and `api/` wraps HTTP requests.
- Backend source is under `backend/`: `server.js` handles HTTP and static files, `services/` enforces update rules and version conflicts, and `storage/` reads and atomically writes JSON. `data/seed.json` is the starter dataset; `data/dishes.json` is the local database.
- `dev.js` starts the API and Vite together, keeping the frontend and backend independently changeable.
- Run `npm run format` to format the source with Prettier, or `npm run format:check` to check formatting.
- Automated tests: not included. Follow the manual verification steps above.
- AI/reuse disclosure: the implementation was created with AI assistance for this assignment. No external repository or substantial borrowed code was used; only Node.js built-in modules and browser APIs are used.
- Approximate active implementation time: 1 hour.
