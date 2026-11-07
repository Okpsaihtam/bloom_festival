const fs = require("fs");
const path = require("path");

function lireJson(nomFichier) {
  return EJSON.parse(fs.readFileSync(path.join(__dirname, nomFichier), "utf8"));
}

const schema = lireJson("schema_scenes.json");
const regles = lireJson("regles_scenes.json");
const exemple = lireJson("exemple_scene.json");

db = db.getSiblingDB("bloom_festival");
db.dropDatabase();

db.createCollection("scenes", {
  validator: { $and: [{ $jsonSchema: schema }, ...regles] },
  validationLevel: "strict",
  validationAction: "error"
});

db.scenes.createIndex({ nom: 1 }, { unique: true, name: "uniq_nom_scene" });
db.scenes.createIndex(
  { "concerts.statut": 1, "concerts.genre": 1, "concerts.dateDebut": 1 },
  { name: "recherche_statut_genre_date" }
);
db.scenes.createIndex({ "concerts.billets.code": 1 }, { unique: true, sparse: true, name: "uniq_code_billet" });
db.scenes.createIndex({ "concerts.billets.acheteur.email": 1 }, { name: "billets_par_acheteur" });
db.scenes.createIndex({ "concerts.artistes.nom": 1 }, { name: "recherche_artiste" });

db.scenes.insertOne(exemple);

print("Base bloom_festival créée : collection 'scenes', validateur, index et exemple OK.");
