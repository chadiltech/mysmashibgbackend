/* Importing the db.js file. */
const connectDb = require("./db");
/* Importing the express module. */
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
require("dotenv").config();
/* Allowing the client to access the server. */
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const socket = require("socket.io");
app.set("trust proxy", 1);
app.use(
  cors({
    origin: ["https://smashingpages-616e5.web.app", "http://localhost:3000"],
    credentials: true,
  })
);
// set up the session store
const store = MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "mySessions",
  autoReconnect: true,
});

app.use(cookieParser());
// set up the session middleware
app.use(
  session({
    name:"Login",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
      secure: true,
      httpOnly:true,
      sameSite: "none", // set to 'none' if your app is hosted on a different domain
      maxAge: 86400000, // session expiration time in milliseconds
    },
  })
);

/* Setting the port to 5000. */
const port = process.env.PORT || 5000;

/* A middleware that parses the body of the request. */
app.use(express.json());

app.use("/uploads/profile_images", express.static("uploads/profile_images"));
app.use("/uploads/banner_images", express.static("uploads/banner_images"));
app.use("/api/auth/", require("./Routes/auth"));
app.use("/api/admin/", require("./Routes/AdminAuthentication"));
app.use("/api/user/profile", require("./Routes/userProfile"));
app.use("/api/order", require("./Routes/CreateOrder"));
app.use("/api/message",require("./Routes/ContactMsg"))
app.get("/", (req, res) => {
  res.send(`<h1>hello adil</h1>`);
});
const server = app.listen(port, () => {
  console.log(port);
});

const io = socket(server, {
  cors: {
    origin: ["https://smashingpages-616e5.web.app", "http://localhost:3000"],
    methods: ["GET", "POST", "DELETE", "PUT"],
  },
});

io.on("connection", (socket) => {
  socket.on("newOrder", (order) => {
    io.emit("newOrder", order);
  });
});

io.on("connection", (socket) => {
  socket.on("newUser", (user) => {
    io.emit("getnewUser", user);
  });
});
/* Connecting to the database. */
connectDb();
