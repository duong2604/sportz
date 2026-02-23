import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) {
  console.warn("ARCJET_KEY not set – ArcJet protection disabled.");
}

export const httpArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({ mode: arcjetMode, interval: "10s", max: 50 }),
      ],
    })
  : null;

export const wsArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({ mode: arcjetMode, interval: "2s", max: 5 }),
      ],
    })
  : null;

/**
 * Create an Express-compatible middleware that enforces ArcJet protection on incoming HTTP requests.
 *
 * The returned middleware skips enforcement when ArcJet is not configured, calls ArcJet to obtain a protection
 * decision for the request, and responds accordingly: 429 for rate-limited requests, 403 for other denials,
 * 503 if the middleware encounters an internal error. If the request is allowed, the middleware calls `next()`.
 *
 * @returns {(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void>} An Express middleware that applies ArcJet protection to requests.
 */
export function securityMiddleware() {
  return async (req, res, next) => {
    if (!httpArcjet) return next();

    try {
      const decision = await httpArcjet.protect(req);

      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({ error: "Too many requests." });
        }

        return res.status(403).json({ error: "Forbidden." });
      }
    } catch (e) {
      console.error("Arcjet middleware error", e);
      return res.status(503).json({ error: "Service Unavailable" });
    }

    next();
  };
}