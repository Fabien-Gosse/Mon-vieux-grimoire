const multer = require("multer");

/*const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};*/

/*const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(" ").join("_");
    const extension = "webp";
    callback(null, name + Date.now() + "." + extension);
  },
});*/

const storage = multer.memoryStorage();

module.exports = multer({ storage: storage }).single("image");
