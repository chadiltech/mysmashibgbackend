const mongoose = require("mongoose");
require("dotenv").config();
/* The connection string to the database. */
const Uri = process.env.MONGO_URI;

mongoose.set("strictQuery", false);
/**
 * It connects to the database.
 */
const connectDb = () => {
  mongoose
      .connect(Uri)
      .then((db) => {
        console.log("connected to dstsbsde");
      })
      .catch((err) => {
        console.log(`some error: ${err}`);
      });
};

module.exports = connectDb;
