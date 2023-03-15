const express = require("express");
const isAdmin = require("../middleware/AdminVerify");
const SessionVerify = require("../middleware/SessionVerify");
const Msg = require("../models/Message");
const User = require("../models/User");
const router = express.Router();

router.post("/contectus/message", SessionVerify, async (req, res) => {
  try {
    const { name, email, contact, message } = req.body;
    const userId = req.session.user && req.session.user;
    const user = await User.findById(userId);
    const Message = new Msg({
      user: user._id,
      name: name,
      email: email,
      contact: contact,
      message: message,
      isNewmsg: true,
    });
    await Message.save();
    return res
      .status(200)
      .json({ message: "Message has been sent we will contact you shortly😄" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/getmessages/foruser", SessionVerify, async (req, res) => {
  try {
    const userId = req.session.user && req.session.user;
    const message = await Msg.find({ user: userId });
    if (!message) {
      return res.status(404).json({ error: "Messages not found!" });
    }
    return res.status(200).json(message);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/getmessages/foradmin", isAdmin, async (req, res) => {
  try {
    const messages = await Msg.find();
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//get message for admin to show in user profile
router.get("/getmessage/foradminuser/:id", isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const messages = await Msg.find({ user: userId });
    if (messages.length === 0) {
      return res
        .status(404)
        .json({ error: "No messages found for this user!" });
    }
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
module.exports = router;
