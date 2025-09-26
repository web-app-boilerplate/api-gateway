import { createProxyMiddleware } from "http-proxy-middleware";
import config from "../config/index.js";
import onProxyReqBody from "../middlewares/onProxyReqBody.js";
import verifyJwtIfNeeded from "../middlewares/verifyJwtIfNeeded.js";

const creditProxy = [
    verifyJwtIfNeeded,
    createProxyMiddleware({
        target: config.services.credit,
        changeOrigin: true,
        pathRewrite: { "^/api/credit": "/credit" },
        onProxyReq: onProxyReqBody,
        logLevel: "warn",
        selfHandleResponse: false,
        onError: (err, req, res) => {
            req.log?.error({ msg: "Proxy error", service: "credit", error: err.message });
            if (!res.headersSent) {
                res.status(502).json({ error: { message: "Upstream service unavailable" } });
            }
        }
    })
];

export default creditProxy;
