//On utilise multer pour gerer les fichier entrant des requetes http
const multer = require("multer");

// on utilise le memory storage pour pouvoir recupérer le buffer dans le controller
const storage = multer.memoryStorage();

module.exports = multer({ storage: storage }).single("image");
