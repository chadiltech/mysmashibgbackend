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
      isRead: false,
    });
    await Message.save();
    return res.status(200).json({
      successMsg: "Message has been sent we will contact you shortly😄",
    });
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

//read message by admin
router.put("/read/message/byadmin/:id", async (req, res) => {
  try {
    const messageId = req.params.id;
    const message = await Msg.findById(messageId);
    message.isRead = true;
    await message.save();
    return res.status(200).send("success");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
//delete messages
router.delete("/delete/messages/admin", async (req, res) => {
  try {
    const idArray = req.body.idArray;
    const messages = await Msg.deleteMany({ _id: { $in: idArray } });
    if (!messages) {
      return res
        .status(404)
        .json({ error: "The message you want to delete is not found!" });
    }
    return res.status(200).json({message:'Success'});
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
module.exports = router;
