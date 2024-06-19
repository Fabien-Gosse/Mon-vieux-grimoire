const express = require("express");
const auth = require("../middlewares/auth");
const multer = require("../middlewares/multer-config");
const bookCtrl = require("../controllers/book");

const router = express.Router();

router.post("/", auth, multer, bookCtrl.createBook);

router.put("/:id", auth, multer, bookCtrl.modifyBook);

router.delete("/:id", auth, bookCtrl.deleteBook);

router.get("/bestrating", bookCtrl.getBestRating);

router.get("/:id", bookCtrl.getOneBook);

router.get("/", bookCtrl.getAllBooks);

router.post("/:id/rating", auth, bookCtrl.ratingBook);

module.exports = router;
