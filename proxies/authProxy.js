import { createProxyMiddleware } from "http-proxy-middleware";
import config from "../config/index.js";
import onProxyReqBody from "../middlewares/onProxyReqBody.js";

const authProxy = createProxyMiddleware({
    target: config.services.auth,
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "/auth" },
    onProxyReq: onProxyReqBody,
    logLevel: "warn",
    selfHandleResponse: false,
    onError: (err, req, res) => {
        req.log?.error({ msg: "Proxy error", service: "auth", error: err.message });
        if (!res.headersSent) {
            res.status(502).json({ error: { message: "Upstream service unavailable" } });
        }
    }
});

export default authProxy;
