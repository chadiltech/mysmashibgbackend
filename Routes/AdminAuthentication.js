const Admin = require("../models/Admin");
const express = require("express");
/* Creating a new router object. */
const router = express.Router();

/* A library that allows you to hash passwords. */
const bcrypt = require("bcryptjs");

/* A library that allows you to create and verify JSON Web Tokens. */
const isAdmin = require("../middleware/AdminVerify");
require("dotenv").config();

// login admin
router.post("/myadmin/login", async (req, res) => {
  const {email, password} = req.body;
  try {
    const admin = await Admin.findOne({email: email});
    if (!admin) {
      return res
        .status(401)
        .json({error: "Please try to login with correct credentials!"});
    }
    const comparePassword = await bcrypt.compare(password, admin.password);
    if (!comparePassword) {
      return res
        .status(401)
        .json({error: "Please try to login with correct credentials!"});
    }
    req.session.admin = admin.id;
    return res
      .status(200)
      .json({message: "Login Admin SuccessFully", success: true});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
});

// admin profile
router.get(
  "/myadmin/myadminprofile",

  isAdmin,
  async (req, res) => {
    try {
      const adminId = req.session.admin && req.session.admin;
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(400).json({error: "Admin note found!"});
      }
      return res.status(200).json({
        name: admin.name,
        lastName: admin.lastName,
        email: admin.email,
        contact: admin.contact,
        roll: admin.roll,
      });
    } catch (error) {
      return res.status(500).json({error: error.message});
    }
  },
);

// verify admin token every time page reload
router.get("/verify/myadmin/token", isAdmin, async (req, res) => {
  const adminId = req.session.admin && req.session.admin;
  if (!adminId) {
    return res.status(401).json({error: "1Unauthorized"});
  }
  const admin = await Admin.findById(adminId);
  if (!admin) {
    return res.status(401).json({error: "2Unauthorized"});
  }
  res.status(200).json({verified: true});
});

router.get("/myadmin/logoute", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(req.sessionID).send({message: "logout successfully"});
  });
});

module.exports = router;
