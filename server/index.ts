// ✅ Use ESM-style imports
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import "dotenv/config";


import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupLocalAuth } from "./localAuth";
import { type User } from "@shared/schema-sqlite";
const app = express();

// ✅ Set up CORS
// app.use(cors({
//    origin: ["http://localhost:5173", "http://localhost:5174"], // ✅ Allow both
//   credentials: true
// }));

app.use(cors({
  origin: ["http://localhost:5173", "https://educonnect-8y46.onrender.com"],
  credentials: true
}));


// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// ✅ Set up sessions
app.use(session({
  secret: 'daycare-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
setupLocalAuth(app);




app.use(express.urlencoded({ extended: false }));

// ✅ Logger Middleware for API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // ✅ Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ✅ Vite setup (only in dev)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  //  Start the server on localhost
  const port = 5000;
  // server.listen(port, "127.0.0.1", () => {
  //   console.log(` Server listening on http://127.0.0.1:${port}`);
  // });
  server.listen(process.env.PORT || 5000, "0.0.0.0", () => {
  console.log(` Server listening on http://0.0.0.0:${process.env.PORT || 5000}`);
});

})();
