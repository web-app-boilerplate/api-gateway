import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger.js";

const correlationId = (req, res, next) => {
    const cid = req.header("x-correlation-id") || uuidv4();
    req.correlationId = cid;
    res.setHeader("x-correlation-id", cid);

    // attach child logger
    req.log = logger.child({ correlationId: cid, service: "api-gateway" });
    req.log.info({ msg: "Incoming request", method: req.method, path: req.originalUrl });

    next();
};

export default correlationId;
