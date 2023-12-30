// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/dbconnect.js";

dotenv.config({ path: "./env" });
const app = express();

connectDB();

//always use try catch and async await while connecting to database
/*
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
    app.on("error", (error) => {
      console.error("Error: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log("Listening on port ", process.env.PORT);
    });
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
})();
*/
