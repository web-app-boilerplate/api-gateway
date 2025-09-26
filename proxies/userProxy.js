import { createProxyMiddleware } from "http-proxy-middleware";
import config from "../config/index.js";
import onProxyReqBody from "../middlewares/onProxyReqBody.js";
import verifyJwtIfNeeded from "../middlewares/verifyJwtIfNeeded.js";

const userProxy = [
    verifyJwtIfNeeded,
    createProxyMiddleware({
        target: config.services.user,
        changeOrigin: true,
        pathRewrite: { "^/api/users": "/users" },
        onProxyReq: onProxyReqBody,
        logLevel: "warn",
        selfHandleResponse: false,
        onError: (err, req, res) => {
            req.log?.error({ msg: "User error", service: "auth", error: err.message });
            if (!res.headersSent) {
                res.status(502).json({ error: { message: "Upstream service unavailable" } });
            }
        }
    })
];

export default userProxy;
