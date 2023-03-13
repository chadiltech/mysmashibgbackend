const Admin = require("../models/Admin");
const express = require("express");
const SendVerificationMail = require("../mail/SendVerification");
/* Creating a new router object. */
const router = express.Router();
/* Importing the body and validationResult from express-validator. */
const {body, validationResult} = require("express-validator");

/* A library that allows you to hash passwords. */
const bcrypt = require("bcryptjs");

/* A library that allows you to create and verify JSON Web Tokens. */
const jwt = require("jsonwebtoken");
const isAdmin = require("../middleware/AdminVerify");
require("dotenv").config();

// route for register admin
router.post(
  "/register/myadmin",
  /* Validating the input. */
  [
    body("name").isString(),
    body("name").isLength({min: 3}),
    body("lastName").isString(),
    body("email", "inter a valid Email").isEmail(),
    body("contact").isString(),
    body("secret").isString(),
    body("password", "Password must be at least 8 characters long.").isLength({
      min: 8,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    /* Checking if there are any errors in the input. If there are, it will return a 400 status code and
  the errors. */
    if (!errors.isEmpty()) {
      return res.status(401).json({errors: errors.array()});
    }
    try {
      let admin = await Admin.findOne({email: req.body.email});
      if (admin) {
        return res.status(401).json({error: "Admin is already registered!"});
      }
      const contact = await Admin.findOne({contact: req.body.contact});
      if (contact) {
        return res
          .status(401)
          .json({error: "Contact number is in used already!"});
      }
      const secret = Buffer.from(req.body.secret, "hex");
      const adminsecretkey = Buffer.from(process.env.ADMIN_SECRET_KEY, "hex");
      if (Buffer.compare(secret, adminsecretkey) !== 0) {
        return res.status(401).json({error: "Invalid secret key"});
      }
      const salt = await bcrypt.genSalt(10);
      // secret key hash
      const hashSecret = await bcrypt.hash(process.env.ADMIN_SECRET_KEY, salt);
      // passwordhash
      const hashedpass = await bcrypt.hash(req.body.password, salt);
      admin = await Admin.create({
        name: req.body.name,
        lastName: req.body.lastName,
        email: req.body.email,
        contact: req.body.contact,
        roll: "admin",
        secret: hashSecret,
        password: hashedpass,
        configPassword: hashedpass,
        image: "",
        configEmail: false,
      });

      const verifyMailToken = jwt.sign(
        {email: admin.email, id: admin.id},
        process.env.JWT_SECRET,
        {expiresIn: "5m"},
      );
      // send verify email methode
      SendVerificationMail({
        email: req.body.email,
        id: admin.id,
        token: verifyMailToken,
        route: "/verifyAdmin/",
        message: "confirm your email",
        subject: "Admin Verification",
      });
      return res.status(201).json({
        success: true,
        message: "Admin created",
      });
    } catch (error) {
      return res.status(500).json({error: error.message});
    }
  },
);

// resend admin verification
router.post("/resend/admin/verification", async (req, res) => {
  try {
    const admin = await Admin.findOne({email: req.body.email});
    if (!admin) {
      return res.status(401).json({error: "Invalid email address!"});
    }
    if (admin.configEmail === true) {
      return res.status(401).json({error: "Admin is already verified!"});
    }
    const secret = Buffer.from(req.body.secret, "hex");
    const adminsecretkey = Buffer.from(process.env.ADMIN_SECRET_KEY, "hex");
    if (Buffer.compare(secret, adminsecretkey) !== 0) {
      return res.status(401).json({error: "Invalid secret key"});
    }
    /* The above code is sending a verification email to the user. */
    const verifyMailToken = jwt.sign(
      {email: req.body.email, id: admin.id},
      process.env.JWT_SECRET,
      {expiresIn: "5m"},
    );
    // send verify email methode
    SendVerificationMail({
      email: req.body.email,
      id: admin.id,
      token: verifyMailToken,
      route: "/verifyAdmin/",
      message: "confirm your email",
      subject: "Admin Verification",
    });
    return res.status(201).json({
      success: true,
      message: "SuccessFully resent verification",
    });
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
});

// verify admin with link that was send to there email
router.get("/verifyAdmin/:token", async (req, res) => {
  const token = req.params.token;
  try {
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findOne({email: verify.email});
    if (!admin) {
      return res.status(400).json({error: "1 Link expired!"});
    }
    const secret = admin.secret;
    const compare = await bcrypt.compare(process.env.ADMIN_SECRET_KEY, secret);
    if (!compare) {
      return res.status(401).json({error: "2 Link expired!"});
    }
    admin.configEmail = true;
    await admin.save();
    req.session.admin = admin.id;
    return res.status(200).json({message: "Admin verified"});
  } catch (err) {
    return res.status(500).json({admin: err.message});
  }
});

// login admin
router.post("/myadmin/login", async (req, res) => {
  const {email, password, secret} = req.body;
  try {
    const admin = await Admin.findOne({email: email});
    if (!admin) {
      return res
        .status(401)
        .json({error: "1Please try to login with correct credentials!"});
    }
    const comparePassword = await bcrypt.compare(password, admin.password);
    if (!comparePassword) {
      return res
        .status(401)
        .json({error: "2Please try to login with correct credentials!"});
    }
    const Providedsecret = Buffer.from(secret, "hex");
    const adminsecretkey = Buffer.from(process.env.ADMIN_SECRET_KEY, "hex");
    if (Buffer.compare(Providedsecret, adminsecretkey) !== 0) {
      return res.status(401).json({
        error: "3Please try to login with correct credentials!",
      });
    }
    const compareSecret = await bcrypt.compare(
      process.env.ADMIN_SECRET_KEY,
      admin.secret,
    );
    if (!compareSecret) {
      return res.status(401).json({
        error: "4Please try to login with correct credentials!",
      });
    }
    if (admin.configEmail === false) {
      const verifyMailToken = jwt.sign(
        {email: admin.email, id: admin.id},
        process.env.JWT_SECRET,
        {expiresIn: "5m"},
      );
      // send verify email methode
      SendVerificationMail({
        email: req.body.email,
        id: admin.id,
        token: verifyMailToken,
        route: "/verifyAdmin/",
        message: "confirm your email",
        subject: "Admin Verification",
      });
      return res.status(401).json({
        error: "Admin email is not verified plese verify before login!",
      });
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
      const compareSecret = await bcrypt.compare(
        process.env.ADMIN_SECRET_KEY,
        admin.secret,
      );
      if (!compareSecret) {
        return res
          .setMaxListeners(401)
          .json({error: "The admin logged in with token is expired!"});
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
  const compareSecret = await bcrypt.compare(
    process.env.ADMIN_SECRET_KEY,
    admin.secret,
  );
  if (!compareSecret) {
    return res.status(401).json({error: "Admin note found"});
  }
  res.status(200).json({verified: true});
});

router.get("/myadmin/logoute", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(req.sessionID).send({message: "logout successfully"});
  });
});

module.exports = router;
