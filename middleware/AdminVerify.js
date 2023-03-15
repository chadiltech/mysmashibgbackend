const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
require("dotenv").config();
const isAdmin = async (req, res, next) => {
  try {
    const adminId = req.session.admin && req.session.admin;
    if (!adminId) {
      return res.status(401).send({error: "Unauthorized Admin!"});
    }
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(401).send({error: "Session expired!"});
    }
    next();
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};
module.exports = isAdmin;
