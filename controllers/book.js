const Book = require("../models/book");
const fs = require("fs");
const sharp = require("sharp");

exports.createBook = async (req, res, next) => {
  //l'objet req etant un Json sous forme de chaine de caractère, il nous faut la parser (car fichier)
  const bookObject = JSON.parse(req.body.book);
  //On supprime l'id recupéré ainsi que le userID car on préfère par sécurité le récupérer nous meme
  delete bookObject._id;
  delete bookObject._userId;
  const { buffer, originalname } = req.file;
  const name = originalname.split(" ").join("_");
  //On défini un nouveau nom à l'image pour éviter les doublons et on lui met l'extension webp
  const ref = Date.now() + name + ".webp";
  //On utilise sharp pour changer le format en Webp avec une qualité de 50%
  await sharp(buffer)
    .webp({ quality: 50 })
    .toFile("./images/" + ref);
  //On défini les valeurs du nouveau book en ajoutant l'id authentifié et l'image compressée
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${ref}`,
  });
  //Création du nouvel objet book
  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Nouvel objet enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.modifyBook = async (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  delete bookObject._userId;
  if (req.file != null) {
    const { buffer, originalname } = req.file;
    const name = originalname.split(" ").join("_");
    const ref = Date.now() + name + ".webp";
    await sharp(buffer)
      .webp({ quality: 50 })
      .toFile("./images/" + ref);
    bookObject.imageUrl = `${req.protocol}://${req.get("host")}/images/${ref}`;
  }
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Non autorisé" });
      } else {
        const imgName = book.imageUrl.split("/images/")[1];
        // on verifie si on a une nouvelle image, si oui, on supprime celle précédente (sinon elle resterai dans notre Bdd)
        req.file &&
          fs.unlink(`images/${imgName}`, (err) => {
            if (err) console.log(err);
          });
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: "unauthorized request" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        //On utilise la méthode unlink du package fs pour supprimer l'image dans le systeme de fichié
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.getBestRating = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.ratingBook = async (req, res, next) => {
  const rating = req.body.rating;
  const userId = req.auth.userId;
  const newRating = { ...req.body, grade: rating };
  delete newRating._id;
  // On recupère le livre dans la base de donné avec l'ID en params
  Book.findById({ _id: req.params.id })
    .then((book) => {
      // Si le livre n'existe pas, on renvoie une erreur
      if (book == null) {
        res.status(404).json({ message: "Livre introuvable !" });
      } else {
        // On compare les UserID dans le rating du livre, si on trouve la même celle de l'utilisateur => erreur
        const databaseRatings = book.ratings;
        const isCurrentUserRatingNew = databaseRatings.find(
          (rating) => rating.userId == userId
        );
        if (isCurrentUserRatingNew != null) {
          res.status(400).json({ message: "Vous avez déjà noté se livre !" });
        }
        // On push la note et l'id utilisateur dans les ratings
        databaseRatings.push(newRating);
        // On recupère la nouvelle moyenne des notes du livre dans averageGrades
        const averageGrades = AverageRating(databaseRatings);
        book.averageRating = averageGrades;
        // On met a jours les notes et la moyenne des notes
        Book.updateOne(
          { _id: req.params.id },
          {
            ratings: databaseRatings,
            averageRating: averageGrades,
            _id: req.params.id,
          }
        )
          //on retourne le livre mis à jours
          .then(() => {
            res.status(201).json(book);
          })
          .catch((error) => {
            res.status(400).json({ error });
          });
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

//fonction de calcul de la moyenne des notes
function AverageRating(ratings) {
  const totalAllGrades = ratings.reduce(
    (total, rating) => total + rating.grade,
    0
  );
  const averageGrades = totalAllGrades / ratings.length;
  return averageGrades.toFixed(1);
}
