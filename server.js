import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import logger from "./utils/logger.js";

dotenv.config();
// Proxy options
const authTarget = process.env.AUTH_SERVICE_URL || "http://auth-service:5004";
const userTarget = process.env.USER_SERVICE_URL || "http://user-service:5001";
const JWT_SECRET = process.env.JWT_SECRET

const app = express();
app.use(express.json()); // parse JSON bodies
app.use(cors()); // allow CORS for frontend (configure origin in .env if needed)

// Correlation ID middleware
app.use((req, res, next) => {
    const cid = req.header("x-correlation-id") || uuidv4();
    req.correlationId = cid;
    res.setHeader("x-correlation-id", cid);
    // attach to logger
    req.log = logger.child({ correlationId: cid, service: "api-gateway" });
    req.log.info({ msg: "Incoming request", method: req.method, path: req.originalUrl });
    next();
});

// Helper: auth check middleware for selected proxied routes
const verifyJwtIfNeeded = (req, res, next) => {
    // Define public paths that should NOT be verified
    const publicPaths = [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh-token",
        "/api/auth/health",
        "/api/users/create", // user creation handled via user-service (public)
    ];

    // if path exactly matches a public path, skip verify
    if (publicPaths.includes(req.path)) return next();

    // For other /api/* routes, require authorization header
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(401).json({ error: { message: "Access denied: missing Authorization header" } });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: { message: "Access denied: malformed Authorization header" } });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // attach user info for downstream logging / possible use
        req.user = decoded;
        return next();
    } catch (err) {
        req.log?.warn({ msg: "JWT verification failed", error: err.message });
        return res.status(401).json({ error: { message: "Invalid or expired token" } });
    }
};

// Helper: forward request body when proxying POST/PUT/PATCH
// (http-proxy-middleware doesn't automatically forward the parsed body)
function onProxyReqBody(proxyReq, req, res) {
    if (!req.body || Object.keys(req.body).length === 0) return;

    const contentType = proxyReq.getHeader("Content-Type") || "application/json";
    let bodyData;
    if (contentType.includes("application/json")) {
        bodyData = JSON.stringify(req.body);
    } else {
        // fallback: raw string
        bodyData = req.body;
    }

    proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
}

// Create proxy for auth
app.use("/api/auth", (req, res, next) => {
    // no JWT required for register/login/refresh (verifyJwtIfNeeded will allow)
    next();
}, createProxyMiddleware({
    target: authTarget,
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "/auth" },
    onProxyReq: onProxyReqBody,
    logLevel: "warn",
    selfHandleResponse: false
}));

// Create proxy for users, with JWT check applied before proxying
app.use("/api/users", verifyJwtIfNeeded, createProxyMiddleware({
    target: userTarget,
    changeOrigin: true,
    pathRewrite: { "^/api/users": "/users" },
    onProxyReq: onProxyReqBody,
    logLevel: "warn",
    selfHandleResponse: false
}));

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "api-gateway ok" });
});

// Catch-all error handler - always JSON
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    req.log?.error({ msg: "Unhandled error in gateway", error: err.stack || err });
    res.status(status).json({ error: { message } });
});

// Start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`);
});
