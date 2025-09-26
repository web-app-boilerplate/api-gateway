// middlewares/errorHandler.js
import logger from "../utils/logger.js";
import { ApiError } from "../errors/ApiError.js";

const isProd = process.env.NODE_ENV === "production";

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let status = 500;
    let message = "Internal Server Error";
    let code = null;

    if (err instanceof ApiError) {
        status = err.statusCode;
        message = err.message;
        code = err.code;
    } else {
        // Map known network/proxy errors to 502
        if (["ECONNREFUSED", "ECONNRESET", "ENOTFOUND"].includes(err.code)) {
            status = 502;
            message = "Upstream service unavailable";
            code = err.code;
        } else if (err.name === "UnauthorizedError") {
            status = 401;
            message = err.message || "Unauthorized";
        } else {
            status = err.statusCode || err.status || 500;
            message = err.message || message;
        }
    }

    // Logging with correlation id if available
    if (req?.log) {
        req.log.error({ msg: message, status, code, stack: err.stack || null });
    } else {
        logger.error(`${req?.method ?? "?"} ${req?.originalUrl ?? "?"} -> ${message}`);
        if (err.stack) logger.error(err.stack);
    }

    // Response payload
    const payload = {
        error: {
            message: isProd && status >= 500 ? "Internal Server Error" : message,
        },
    };

    if (!isProd) {
        payload.error.stack = err.stack;
        if (code) payload.error.code = code;
    }

    res.status(status).json(payload);
};

export default errorHandler;
