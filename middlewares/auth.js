const jwt = require("jsonwebtoken");

const tokenKey = process.env.TOKEN_KEY;

module.exports = (req, res, next) => {
  try {
    // on recupère le token dans le header authorization
    const token = req.headers.authorization.split(" ")[1];
    //On utilise verify de jsonwebtoken pour verifier celui-ci (en lui passant le token recupéré et la chaine secrète)
    const decodedToken = jwt.verify(token, tokenKey);
    const userId = decodedToken.userId;
    //On ajoute l'user ID à notre objet request afin que nos différentes routes puisse l'utiliser
    req.auth = {
      userId: userId,
    };
    next();
  } catch (error) {
    res.status(403).json({ message: "403: unauthorized request" });
  }
};
