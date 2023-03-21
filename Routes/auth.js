const User = require("../models/User");
const express = require("express");
/* Creating a new router object. */
const router = express.Router();
/* Importing the body and validationResult from express-validator. */
const { body, validationResult } = require("express-validator");
const SendVerificationMail = require("../mail/SendVerification");
/* A library that allows you to hash passwords. */
const bcrypt = require("bcryptjs");
/* A library that allows you to create and verify JSON Web Tokens. */
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SessionVerify = require("../middleware/SessionVerify");
const isAdmin = require("../middleware/AdminVerify");
// route for creating new user acount
router.post(
  "/signup",
  /* Validating the input. */
  [
    body("name").isString(),
    body("name").isLength({ min: 3 }),
    body("lastName").isString(),
    body("email", "inter a valid Email").isEmail(),
    body("contact").isString(),
    body("password", "Password must be at least 8 characters long.").isLength({
      min: 8,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    /* Checking if there are any errors in the input. If there are, it will return a 400 status code and
  the errors. */
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      /* Checking if the user already exists. */
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res.status(400).json({ error: "User already exists" });
      }

      const usernumber = await User.findOne({ contact: req.body.contact });
      if (usernumber) {
        return res.status(400).json({ error: "This phone number is exists" });
      }

      /* Generating a salt for the password. */
      const salt = await bcrypt.genSaltSync(10);

      /* Hashing the password. */
      const spacess = await bcrypt.hash(req.body.password, salt);

      /* Creating a new user. */
      user = await User.create({
        name: req.body.name,
        lastName: req.body.lastName,
        email: req.body.email,
        contact: req.body.contact,
        password: spacess,
        configPassword: spacess,
        isNewUser: true,
        image: "",
        bannerImage: "",
        configEmail: false,
      });

      /* Creating a new JSON Web Token. for email verification*/
      const VerifyToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "5m",
      });
      // send verify email methode
      SendVerificationMail({
        email: req.body.email,
        id: user.id,
        token: VerifyToken,
        route: "/verify/",
        message: "confirm your email",
        subject: "Acount Verification",
      });
      return res.status(201).json({
        success: true,
        message: "Acount created😄",
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// resend verification route
router.post(
  "/resendverificationEmail",
  body("email", "inter a valid Email").isEmail(),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array });
    }
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ error: "invalid Email address" });
    }
    if (user.configEmail === true) {
      return res
        .status(400)
        .json({ error: "User is already verified Pleas try to login" });
    }
    /* Creating a new JSON Web Token. for email verification*/
    const VerifyToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "5m",
    });
    // send verify email methode
    SendVerificationMail({
      email: req.body.email,
      id: user._id,
      token: VerifyToken,
      route: "/verify/",
      message: "confirm your email",
      subject: "Acount Verification",
    });
    return res
      .status(200)
      .json({ success: true, Verification: "Verification has been sent" });
  }
);

// verify email
router.get("/verify/", async (req, res) => {
  const token = req.query.token;
  try {
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    const id = decodeToken.id;
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ error: "Invalid Token" });
    }
    user.configEmail = true;
    await user.save();

    req.session.user = user._id;
    req.session.save();
    res.json({
      configEmail: user.configEmail,
      message: "User successfully verified",
    });
  } catch (err) {
    return res.status(500).json({ error: "Token Expired" });
  }
});

// login
router.post(
  "/login",
  [
    body("email", "inter a valid email").isEmail(),
    body("password", "password can't be blank").exists(),
  ],
  async (req, res) => {
    /* Checking if there are any errors in the input. If there are, it will return a 400 status code and
   the errors. */
    const errors = validationResult(req);

    /* Checking if there are any errors in the input. If there are, it will return a 400 status code and
  the errors. */
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array });
    }

    /* Destructuring the email and password properties from the request body. */
    const { email, password } = req.body;

    try {
      /* Finding a user with the email that was passed in the request body. */
      const user = await User.findOne({ email });

      /* Checking if the user exists. If it doesn't, it will return a 400 status code and an error
   message. */
      if (!user) {
        return res
          .status(400)
          .json({ error: "Please try to login with correct credentials" });
      }
      /* Comparing the password that was passed in the request body with the password that is stored in
        the database. */
      const configPass = await bcrypt.compare(password, user.password);

      /* Checking if the password that was passed in the request body is the same as the password that is
        stored in the database. */
      if (!configPass) {
        return res
          .status(400)
          .json({ error: "Please try to login with correct credentials" });
      }
      if (user.configEmail === false) {
        /* Creating a new JSON Web Token. */
        const VerifyToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: "5m",
        });
        // send verify email methode
        SendVerificationMail({
          email: req.body.email,
          id: user.id,
          token: VerifyToken,
          route: "/verify/",
          message: "confirm your email",
        });
        return res.status(400).json({
          error:
            "your email is not verified. Pleas check your inbox to verify your email",
          isVerified: false,
        });
      }
      if (req.session.user) {
        return res.status(200).json("User is already logged in");
      }
      /* Returning a JSON object with the authToken property set to the token. */
      if (user.configEmail === true) {
        req.session.user = user.id;
        return res.json({ isVerified: true, session: req.session });
      }
    } catch (err) {
      return res.status(500).send("some error occured");
    }
  }
);

// forgot password link
router.post("/forgotPassword/config/ForgotPasswordemail", async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });

    if (!email) {
      return res.status(400).json({ error: "Email is Requierd" });
    }

    if (!user) {
      return res.status(400).json({ error: "This user is not exists" });
    }
    if (!email) {
      return {
        error: "email is required",
      };
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "5m",
    });
    // send forgrt password mail methode
    SendVerificationMail({
      email: email,
      id: user._id,
      token: token,
      route: "/resetPassword/",
      message: "Reset your Password",
      subject: "Reset password Verification",
    });
    return res
      .status(200)
      .json({ success: "Forget password link has been sent to your email" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// resend forgotpassword mail
router.post(
  "/resend/forgotpasswordMail",
  [body("email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array });
    }
    const email = req.body.email;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "this email is not exists" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "5m",
    });
    // send forgot password mail methode
    SendVerificationMail({
      email: email,
      id: user._id,
      token: token,
      route: "/resetPassword/",
      message: "Reset your Password",
      subject: "Reset password Verification",
    });
    return res
      .status(200)
      .json({ success: true, Verification: "Verification has been sent" });
  }
);
// finaly reset password
router.post("/resetPassword/:token", async (req, res) => {
  // verifying the link is it valid or expired
  try {
    const token = req.params.token;
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(verify.id);
    if (!user) {
      return res
        .status(400)
        .json({ error: "The link has expired pleas try again" });
    }
    const { password, configPassword } = req.body;
    if (password !== configPassword) {
      return res.status(400).json({
        error: "Passwords do not match.",
      });
    }
    const oldPassword = await bcrypt.compare(password, user.password);
    if (oldPassword) {
      return res.status(400).json({
        error:
          "password is in a list of passwords commonly used on other websites",
      });
    }

    /* Generating a salt for the password. */
    const salt = await bcrypt.genSaltSync(10);
    /* Hashing the password. */
    const spacess = await bcrypt.hash(password, salt);
    user.password = spacess;
    user.configPassword = spacess;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Password changed Successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "The link has expired pleas try again" });
  }
});
router.get("/verifyToken", SessionVerify, async (req, res) => {
  try {
    const userId = req.session.user && req.session.user;
    if (!userId) {
      req.session.destroy(() => {
        res.clearCookie(req.sessionID).send({ message: "logout successfully" });
      });
      return res.status(401).json({ error: "Unauthorized!" });
    }
    const user = await User.findById(userId);
    res.status(200).json({ message: `Welcom ${user.name}` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
// fetch all users for admin
router.get("/myusers", isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select(["-password", "-configPassword"])
      .sort({ Date: -1 })
      .exec();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.get("/logout", async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(req.sessionID).send({ message: "logout successfully" });
  });
});
router.get("/getme", (req, res) => {
  return res.send(`<h1>user: ${req.session.user}</h1>`);
});
module.exports = router;
