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

    const compareSecret = bcrypt.compare(
        process.env.ADMIN_SECRET_KEY,
        admin.secret,
    );
    if (!compareSecret) {
      return res.status(401).send({error: "Invalid credentials!"});
    }
    next();
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};
module.exports = isAdmin;
