const User = require("../models/User");

const Order = require("../models/Order");

const express = require("express");

require("dotenv").config();
/* Creating a new router object. */
const router = express.Router();
const multer = require("multer");
/* Importing the middleware function. */
const SessionVerify = require("../middleware/SessionVerify");
const isAdmin = require("../middleware/AdminVerify");
router.get("/user_profile", SessionVerify, async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId).select([
      "-password",
      "-configPassword",
    ]);
    res.send(user);
  } catch (error) {
    res.status(500).send({error: error.message});
  }
});

// get user profile with id for admin
router.get("/myUser/profile", isAdmin, async (req, res) => {
  try {
    const id = req.query.id;
    const user = await User.findById(id).select(["-password", "-configPassword"]);
    if (user.isNewUser === true) {
      user.isNewUser = false;
      await user.save();
    }
    const orders = await Order.find({user: id});

    return res.status(200).send({user, orders});
  } catch (error) {
    res.status(500).send({error: error.message});
  }
});
// upload user profile photo
// Configure multer for uploads profile photos
const ProfileImgstorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads/profile_images");
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  },
});
const uploadProfileImg = multer({storage: ProfileImgstorage});

// Define the API endpoint for uploading a user's profile image
router.post(
    "/upload/profile_photo",
    uploadProfileImg.single("file"),
    async (req, res) => {
      try {
        const userId = req.session.user && req.session.user;
        const user = await User.findById(userId);
        if (!user) {
          return res.status(400).json({error: "user note found"});
        }
        // get the file path and send it back to the client
        const imagePath = `/${req.file.path}`;
        user.image = imagePath;
        await user.save();
        return res
            .status(200)
            .json({message: "profile picture uploaded successfully"});
      } catch (err) {
        return res.status(500).json({error: err.message});
      }
    },
);

// upload user banner photo
// Configure multer for uploads banner photos
const BannerImgstorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads/banner_images");
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  },
});
const uploadBannerImg = multer({storage: BannerImgstorage});

// Define the API endpoint for uploading a user's profile image
router.post(
    "/upload/banner_photo",
    uploadBannerImg.single("file"),
    async (req, res) => {
      try {
        const userId = req.session.user && req.session.user;
        const user = await User.findById(userId);
        if (!user) {
          return res.status(400).json({error: "user note found"});
        }
        // get the file path and send it back to the client
        const imagePath = `/${req.file.path}`;
        user.bannerImage = imagePath;
        await user.save();
        return res
            .status(200)
            .json({message: "banner picture uploaded successfully"});
      } catch (err) {
        return res.status(500).json({error: err.message});
      }
    },
);

module.exports = router;
