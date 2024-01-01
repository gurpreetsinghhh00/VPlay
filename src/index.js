// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import connectDB from "./db/dbconnect.js";
import app from "./app.js";

dotenv.config({ path: "./env" });

connectDB()
  .then(() => {
    //for listening errors
    app.on("error", (error) => {
      console.error("Error: ", error);
      throw error;
    });

    app.listen(process.env.PORT || 4000, () => {
      console.log("Listening on port ", process.env.PORT);
    });
  })
  .catch((err) => {
    console.log("Mongo connection failed !!!", err);
  });

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
