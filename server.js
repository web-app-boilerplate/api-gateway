import express from "express";
import cors from "cors";
import config from "./config/index.js";
import correlationId from "./middlewares/correlationId.js";
import routes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./utils/logger.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(correlationId);

app.use(routes);
app.use(errorHandler);

app.listen(config.port, () => {
    logger.info(`API Gateway running on port ${config.port}`);
});
