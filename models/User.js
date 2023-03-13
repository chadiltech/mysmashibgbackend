const mongoose = require("mongoose");

/* Destructuring the Schema from mongoose. */
const {Schema} = mongoose;

/* Creating a new schema called UserSchema. */
const UserSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  lastName: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
    unique: true,
  },
  contact: {
    type: String,
    require: true,
    unique: true,
  },
  configEmail: {
    type: Boolean,
  },
  password: {
    type: String,
    require: true,
  },
  configPassword: {
    type: String,
    require: true,
  },
  isNewUser: {
    type: Boolean,
  },
  image: {
    type: String,
  },
  bannerImage: {
    type: String,
  },
  Date: {
    type: Date,
    default: Date.now,
  },
});

/* Creating a model called User and it is using the UserSchema to create the model. */
const User = mongoose.model("user", UserSchema);
module.exports = User;
