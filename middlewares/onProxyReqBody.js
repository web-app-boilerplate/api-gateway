function onProxyReqBody(proxyReq, req) {
    if (!req.body || Object.keys(req.body).length === 0) return;

    const contentType = proxyReq.getHeader("Content-Type") || "application/json";
    let bodyData;

    if (contentType.includes("application/json")) {
        bodyData = JSON.stringify(req.body);
    } else {
        bodyData = req.body;
    }

    proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
}

export default onProxyReqBody;
