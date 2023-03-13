const mongoose = require("mongoose");

/* Destructuring the Schema from mongoose. */
const {Schema} = mongoose;

/* Creating a new schema called UserSchema. */
const OrderSchema = new Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "user",
  },
  title: {
    type: String,
    require: true,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
    require: true,
  },
  contact: {
    type: String,
    require: true,
  },
  orderDescription: {
    type: String,
    require: true,
  },
  orderNumber: {
    type: String,
    unique: true,
    require: true,
  },
  status: {
    type: String,
  },
  isReade: {
    type: Boolean,
  },
  Date: {
    type: Date,
    default: Date.now,
  },
});
OrderSchema.index({contact: 1}, {unique: false});
/* Creating a model called User and it is using the UserSchema to create the model. */
const Order = mongoose.model("order", OrderSchema);
module.exports = Order;
