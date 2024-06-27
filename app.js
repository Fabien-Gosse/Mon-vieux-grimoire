const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const bookRoutes = require("./routes/book");
const userRoutes = require("./routes/user");
const mongodbUri = process.env.MONGODB_URI;

//Connection à la base de donnée grâce au package mongoose
mongoose
  .connect(mongodbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

const app = express();

//On indique à Express qu'il faut gérer la ressource /images de manière statique
app.use("/images", express.static(path.join(__dirname, "images")));

//Permet d'extraire le corp json d'une requete et de nous le mettre a disposition dans req.body
app.use(express.json());

//Middleware reglant les headers afin de configurer les CORS
app.use((req, res, next) => {
  // permet l'access à notre API depuis n'importe qu'elle origine
  res.setHeader("Access-Control-Allow-Origin", "*");
  //Ajouter les headers ci dessous aux requetes
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  //accepter les requetes suivantes
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use(bodyParser.json());

app.use("/api/books", bookRoutes);
app.use("/api/auth", userRoutes);

module.exports = app;
