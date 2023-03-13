const User = require("../models/User");
const Order = require("../models/Order");
const express = require("express");
require("dotenv").config();
/* Importing the body and validationResult from express-validator. */
const {body, validationResult} = require("express-validator");
const SessionVerify = require("../middleware/SessionVerify");
const isAdmin = require("../middleware/AdminVerify");
/* Creating a new router object. */
const router = express.Router();

// generate order number function
const generateOrderNumber = () => {
  // const timestamp = new Date().toISOString().replace(/[^0-9]/g, "");
  const randomString = Math.random()
    .toString(36)
    .substring(2, 20)
    .toUpperCase();
  return `#${randomString}`;
};

// create new order
router.post(
  "/createOrder",
  [
    body("title").isString(),
    body("title").isLength({min: 5}),
    body("email").isEmail(),
    body("contact").isString(),
    body("orderDescription").isString(),
  ],
  SessionVerify,
  async (req, res) => {
    const errors = validationResult(req);
    const {title, email, contact, orderDescription} = req.body;
    if (!errors.isEmpty()) {
      return res.status(400).json({error: errors.array()});
   }

    try {
      const userId = req.session.user && req.session.user;
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(400)
          .json({error: "User note found plese Login again"});
     }
      if (user.configEmail === false) {
        return res.status(401).json({
          error: "User note verified plese login again and verify your account",
       });
     }
      const order = new Order({
        title: title,
        name: user.name,
        email: email,
        contact: contact,
        orderDescription: orderDescription,
        orderNumber: generateOrderNumber(),
        status: "pending",
        isReade: false,
        user: user.id,
     });

      await order.save();
      res.status(201).json({
        message:
          "Your order has been successfully submitted and we will contact you shortly.",
     });
   } catch (error) {
      return res.status(500).json({error: error.message});
   }
 },
);

// update user orders
router.put("/update/Order/:id", SessionVerify, async (req, res) => {
  const {title, email, orderDescription, contact} = req.body;
  const UpdatedOrder = {isReade: false};
  try {
    const userId = req.session.user && req.session.user;
    const user = await User.findById(userId);
    if (title) {
      UpdatedOrder.title = title;
   }
    if (email) {
      UpdatedOrder.email = email;
   }
    if (orderDescription) {
      UpdatedOrder.orderDescription = orderDescription;
   }
    if (contact) {
      UpdatedOrder.contact = contact;
   }
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({error: "Order not found"});
   }
    if (order.user.toString() !== user.id) {
      return res.status(401).json({error: "Not allowed"});
   }
    order = await Order.findByIdAndUpdate(
      req.params.id,
      {$set: UpdatedOrder},
      {new: true},
    );
    return res.status(200).json({message: "Updated SuccessFully"});
 } catch (error) {
    return res.status(500).json({error: error.message});
 }
});

// cancel order
router.get("/cancel/order/:id", SessionVerify, async (req, res) => {
  try {
    const userId = req.session.user && req.session.user;
    const user = await User.findById(userId);
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({error: "Order not found"});
   }
    if (order.user.toString() !== user.id) {
      return res.status(401).json({error: "Not allowed"});
   }
    order.status = "cancelled";
    order.isReade = false;
    await order.save();
    return res.status(200).json({message: "Order cancel successFully"});
 } catch (error) {
    return res.status(500).json({error: error.message});
 }
});

// fetch all orders of the user
router.get("/myorders", SessionVerify, async (req, res) => {
  try {
    const userId = req.session.user && req.session.user;
    const user = await User.findById(userId);
    const order = await Order.find({
      user: user.id,
   });
    if (!order || order.length === 0) {
      return res
        .status(404)
        .json({message: "No Orders found please create a new Order"});
   }
    if (order[0].user.toString() !== user.id) {
      return res.status(401).json({error: "Not allowed"});
   }
    return res.status(200).json({orders: order});
 } catch (error) {
    return res.status(500).json({error: error.message});
 }
});

// fetch orders for admin
router.get("/orders/foradmin/:status", isAdmin, async (req, res) => {
  try {
    const SortStatus = req.params.status;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const size = req.query.size ? parseInt(req.query.size) : 3;
    const skip = (page - 1) * size;
    if (SortStatus === "all") {
      const orders = await Order.find()
        .sort({Date: -1})
        .skip(skip)
        .limit(size)
        .exec();
      if (!orders || orders.length === 0) {
        return res.status(404).json({error: "Orders are not available"});
     } else {
        const total = await Order.countDocuments();
        return res.status(200).json({orders: orders, total, page, size});
     }
   }
    const orders = await Order.find({status: SortStatus})
      .sort({Date: -1})
      .skip(skip)
      .limit(size)
      .exec();

    const total = await Order.countDocuments({status: SortStatus});
    return res.status(200).json({orders: orders, total, page, size});
 } catch (error) {
    return res.status(500).json({error: error.message});
 }
});

// read order from admin
router.put("/myorder/readebyadmin/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({error: "order not found!"});
   }
    order.isReade = true;
    await order.save();
    return res.status(200).json({message: "order reded my admin"});
 } catch (error) {
    return res.status(500).json({error: error.message});
 }
});

// delete order by Admin
router.delete("/cancelled/deletByAdmin", async (req, res) => {
  try {
    const orderIds = req.body.orders;
    const order = await Order.deleteMany({_id: {$in: orderIds}});
    return res.status(200).json(order);
 } catch (error) {
    return res.status(500).json({error: error.message});
 }
});

// accept and reject orders by admin
router.post("/accept/reject/orders/:id/:type", async (req, res) => {
  try {
    const orderId = req.params.id;
    const type = req.params.type;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({error: "Order not found!"});
   }
    if (type === "accept" && order.status === "pending") {
      order.status = "inProgress";
      order.isReade = false;
      await order.save();
      return res.status(200).json({message: "Order Accepted SuccessFully"});
   }
    if (type === "reject" && order.status === "pending") {
      order.status = "cancelled";
      order.isReade = false;
      await order.save();
      return res.status(200).json({message: "Order Rejected SuccessFully"});
   }
    if (type === "completed" && order.status === "inProgress") {
      order.status = "completed";
      order.isReade = false;
      await order.save();
      return res.status(200).json({message: "Order completed SuccessFully"});
   }
 } catch (error) {
    return res.status(500).json({error: error.message});
 }
});
module.exports = router;
