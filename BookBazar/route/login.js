const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Book = require("../models/book");
const isLoggedIn = require("../utils/Islogin");

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

router.get("/", async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.render("home", { books });
});

router.get("/login", (req, res) => {
  if (res.locals.currentUser) return res.redirect("/");
  res.render("index", { error: null });
});

router.get("/register", (req, res) => {
  if (res.locals.currentUser) return res.redirect("/");
  res.render("register", { error: null });
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render("register", { error: "This email is already registered. Please login." });
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash });

    res.redirect("/login");
  } catch (err) {
    res.render("register", { error: "Something went wrong. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("index", { error: "User not found. Please register first." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("index", { error: "Invalid password. Please try again." });
    }

    const token = jwt.sign({ userId: user._id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: "7d"
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict"
    });

    // After successful login, user will see the home page with all books.
    res.redirect("/");
  } catch (err) {
    res.render("index", { error: "Something went wrong. Please try again." });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

router.get("/account", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user.userId);
  const books = await Book.find({ sellerId: req.user.userId }).sort({ createdAt: -1 });
  res.render("account", { user, books });
});

router.post("/cart/add/:id", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user.userId);

  const existingItem = user.cart.find((item) => item.bookId.toString() === req.params.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    user.cart.push({ bookId: req.params.id, quantity: 1 });
  }

  await user.save();
  res.redirect("/cart");
});

router.get("/cart", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user.userId).populate("cart.bookId");
  res.render("cart", { cartItems: user.cart.filter((item) => item.bookId) });
});

router.post("/cart/remove/:id", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user.userId);
  user.cart = user.cart.filter((item) => item.bookId.toString() !== req.params.id);
  await user.save();
  res.redirect("/cart");
});

module.exports = router;
