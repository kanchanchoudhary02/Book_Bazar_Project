const express = require("express");
const router = express.Router();
const Book = require("../models/book");
const isLoggedIn = require("../utils/Islogin");
const upload = require("../utils/multer");

router.get("/", isLoggedIn, (req, res) => {
  res.render("add", { error: null });
});

router.post("/", isLoggedIn, upload.single("image"), async (req, res) => {
  try {
    const { title, author, price, condition, category, description } = req.body;

    await Book.create({
      title,
      author,
      price,
      condition,
      category,
      description,
      sellerId: req.user.userId,
      image: req.file ? req.file.filename : ""
    });

    // After adding a book, seller can directly see their own uploaded books.
    res.redirect("/account");
  } catch (err) {
    res.render("add", { error: "Book could not be added. Please check all fields." });
  }
});

router.get("/browse", async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.render("home", { books });
});

router.post("/delete/:id", isLoggedIn, async (req, res) => {
  await Book.findOneAndDelete({ _id: req.params.id, sellerId: req.user.userId });
  res.redirect("/account");
});

module.exports = router;
