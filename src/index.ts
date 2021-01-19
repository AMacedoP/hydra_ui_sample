import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import login from "./routes/login";
import consent from "./routes/consent";

const app = express();
const PORT = 3000;

// Use body-parser and cookie-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// View engine
app.set("views", path.join(__dirname, "..", "views"));
app.set("view engine", "pug");

app.get("/", (_, res) => {
  res.render("index");
});

app.use("/login", login);
app.use("/consent", consent);

app.use((_, __, next) => {
  const err = new Error("Not Found");
  next(err);
});

if (app.get("env") === "development") {
  app.use((err: Error, _: Request, res: Response, __: NextFunction) => {
    res.status(500).render("error", {
      message: err.message,
      error: err,
    });
  });
}

app.use((err: Error, _: Request, res: Response, __: NextFunction) => {
  res.status(500).render("error", {
    message: err.message,
    err: {},
  });
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
