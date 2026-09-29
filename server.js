import "dotenv/config";

import app from "./src/app.js";
import { loadDb } from "./src/db/store.js";

const port = process.env.PORT || 4000;

// Make sure the JSON file store exists and is seeded
// before accepting requests.
loadDb();

app.listen(port, () => {
  console.log(`Pustaka API listening on http://localhost:${port}`);
});

