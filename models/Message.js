const mongoose = require("mongoose");

/* Destructuring the Schema from mongoose. */
const { Schema } = mongoose;

/* Creating a new schema called UserSchema. */
const MessageSchima = new Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "user",
  },
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  contact: {
    type: String,
    require: true,
  },
  message: {
    type: String,
    require: true,
  },
  Date: {
    type: Date,
    default: Date.now,
  },
});

/* Creating a model called User and it is using the UserSchema to create the model. */
const Msg = mongoose.model("message", MessageSchima);
module.exports = Msg;
