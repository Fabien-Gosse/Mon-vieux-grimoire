const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const tokenKey = process.env.TOKEN_KEY;

exports.signup = (req, res, next) => {
  //on hash notre password avec bcrypt (on lance 10 fois l'algorithme)
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({
        email: req.body.email,
        password: hash,
      });
      user
        .save()
        .then(() =>
          res.status(201).json({ message: "Nouvelle utilisateur créé !" })
        )
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ message: "Paire login/mot de passe incorrecte" });
      }
      //on utilise bcrypt pour comparer les mdp user(hasher) et celui renseigné
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res
              .status(401)
              .json({ message: "Paire login/mot de passe incorrecte" });
          }
          //On utilise sign de jsonwebtoken pour chiffrer un nouveau token
          //La reponse contiendra l'ID user, un chaine secrète et la durée de vie de 24h
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, tokenKey, {
              expiresIn: "24h",
            }),
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
