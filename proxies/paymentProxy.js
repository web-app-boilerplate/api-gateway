import { createProxyMiddleware } from "http-proxy-middleware";
import config from "../config/index.js";
import onProxyReqBody from "../middlewares/onProxyReqBody.js";
import verifyJwtIfNeeded from "../middlewares/verifyJwtIfNeeded.js";

const paymentProxy = [
    verifyJwtIfNeeded,
    createProxyMiddleware({
        target: config.services.payment,
        changeOrigin: true,
        pathRewrite: { "^/api/payments": "/payments" },
        onProxyReq: onProxyReqBody,
        logLevel: "warn",
        selfHandleResponse: false,
        onError: (err, req, res) => {
            req.log?.error({ msg: "Proxy error", service: "payment", error: err.message });
            if (!res.headersSent) {
                res.status(502).json({ error: { message: "Upstream service unavailable" } });
            }
        }
    })
];

export default paymentProxy;
