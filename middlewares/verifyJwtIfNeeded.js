import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { ApiError } from "../errors/ApiError.js";

const verifyJwtIfNeeded = (req, res, next) => {
    const publicPaths = [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh-token",
        "/api/auth/health",
        "/api/users/create"
    ];

    if (publicPaths.includes(req.path)) return next();

    const authHeader = req.headers["authorization"];
    if (!authHeader) return next(new ApiError("Access denied: missing Authorization header", 401));

    const token = authHeader.split(" ")[1];
    if (!token) return next(new ApiError("Access denied: malformed Authorization header", 401));

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        req.log?.warn({ msg: "JWT verification failed", error: err.message });
        next(new ApiError("Invalid or expired token", 401));
    }
};

export default verifyJwtIfNeeded;
