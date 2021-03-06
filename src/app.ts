import "dotenv/config";
import express, { Application } from "express";
import bodyParser from "body-parser";
import { createServer, Server } from "http";
import startDbConnection from "config/db.config";
import logger from "logger/logger";
import cors from "config/cors";
import morgan from "config/morgan";
import errorMiddleware from "middleware/error.middleware";

const app: Application = express();
const server: Server = createServer(app);
const PORT: string | 3000 = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

cors(app);
morgan(app);

app.use(errorMiddleware);

startDbConnection().then(() => {
  server.listen(PORT, () => {
    logger.debug(`Server is listening on PORT: ${PORT}...`);
  });
});
