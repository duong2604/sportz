import express from "express";

import { matchesRoutes } from "./src/routes/index.js";

const app = express();
const PORT = 8000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to Sportz API" });
});

app.use("/matches", matchesRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
