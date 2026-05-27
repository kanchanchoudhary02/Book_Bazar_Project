const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const loginRoute = require("./route/login");
const addbookRoute = require("./route/addbook");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/bookbazar";
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error:", err.message));

fs.mkdirSync(path.join(__dirname, "public", "uploads"), { recursive: true });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.locals.currentUser = null;
  const token = req.cookies.token;

  if (token) {
    try {
      res.locals.currentUser = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.clearCookie("token");
    }
  }

  next();
});

app.use("/", loginRoute);
app.use("/books", addbookRoute);

app.use((req, res) => {
  res.status(404).send("Page not found");
});

app.listen(PORT, () => {
  console.log(`Book Bazar running on http://localhost:${PORT}`);
});
