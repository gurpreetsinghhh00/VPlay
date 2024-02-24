import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//for configuring cors
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); //limit of json data
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //for express to understand spaces,+,etc that will be encoded in the url
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/userRouter.route.js";
app.use("/api/v1/users", userRouter);

export default app;
