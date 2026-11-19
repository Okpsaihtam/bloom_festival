const fs = require("fs");
const path = require("path");

function versMongo(s) {
  if (Array.isArray(s)) return s.map(versMongo);
  if (s === null || typeof s !== "object") return s;
  const r = {};
  for (const [cle, valeur] of Object.entries(s)) {
    if (cle === "$schema" || cle === "format") continue;
    if (cle === "properties") {
      r.properties = {};
      for (const [champ, sousSchema] of Object.entries(valeur)) r.properties[champ] = versMongo(sousSchema);
    } else {
      r[cle] = versMongo(valeur);
    }
  }
  if (s.format === "date-time" || s.format === "date") { delete r.type; r.bsonType = "date"; }
  if (s.format === "email") r.pattern = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";
  if (s.type === "integer") { delete r.type; r.bsonType = "int"; }
  return r;
}

const schemaJson = JSON.parse(fs.readFileSync(path.join(__dirname, "schema_scenes.json"), "utf8"));
const schema = versMongo(schemaJson);

const pourChaqueConcert = (regle) => ({
  $expr: { $allElementsTrue: [{ $map: { input: "$concerts", as: "c", in: regle } }] }
});

const regles = [
  pourChaqueConcert({ $gt: ["$$c.dateFin", "$$c.dateDebut"] }),
  pourChaqueConcert({ $lte: ["$$c.jauge", "$capacite"] }),
  pourChaqueConcert({
    $lte: [
      { $size: { $filter: { input: "$$c.billets", as: "b", cond: { $ne: ["$$b.statut", "annule"] } } } },
      "$$c.jauge"
    ]
  }),
  pourChaqueConcert({ $eq: ["$$c.tarifMin", { $min: "$$c.categories.prix" }] }),
  pourChaqueConcert({
    $allElementsTrue: [{
      $map: {
        input: "$$c.billets", as: "b",
        in: { $or: [{ $ne: ["$$b.statut", "utilise"] }, { $ne: [{ $type: "$$b.controle" }, "missing"] }] }
      }
    }]
  }),
  {
    $expr: {
      $let: {
        vars: {
          codes: { $reduce: { input: "$concerts", initialValue: [], in: { $concatArrays: ["$$value", "$$this.billets.code"] } } }
        },
        in: { $eq: [{ $size: { $setUnion: ["$$codes", []] } }, { $size: "$$codes" }] }
      }
    }
  }
];

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

print("Base bloom_festival créée : collection 'scenes', validateur et index OK.");
