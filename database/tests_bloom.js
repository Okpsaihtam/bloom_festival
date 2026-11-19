db = db.getSiblingDB("bloom_festival");
let ok = 0, ko = 0;
function doitEchouer(nom, fn) {
  try { fn(); print("ÉCHEC (accepté à tort) : " + nom); ko++; }
  catch (e) { print("OK refusé : " + nom + "  [" + (e.code || e.codeName) + "]"); ok++; }
}
const SCENE = ObjectId("6650b1000000000000000001");
const C1 = ObjectId("6650c1000000000000000001");
db.scenes.deleteOne({ _id: SCENE });
db.scenes.insertOne({
  _id: SCENE,
  nom: "Scène Tournesol",
  type: "plein_air",
  capacite: NumberInt(5000),
  localisation: { zone: "Nord" },
  accessiblePMR: true,
  concerts: [
    {
      _id: C1,
      titre: "Les Pétales Électriques - Live Bloom",
      dateDebut: ISODate("2027-07-10T21:00:00Z"),
      dateFin: ISODate("2027-07-10T23:00:00Z"),
      genre: "electro",
      statut: "en_vente",
      artistes: [
        { _id: ObjectId("6650a1000000000000000001"), nom: "Les Pétales Électriques", pays: "France", role: "tete_affiche" },
        { _id: ObjectId("6650a1000000000000000002"), nom: "Moss Garden", pays: "Belgique", role: "premiere_partie" }
      ],
      categories: [
        { code: "standard", libelle: "Fosse", prix: 45 },
        { code: "reduit", libelle: "Tarif réduit", prix: 35 },
        { code: "vip", libelle: "Carré VIP", prix: 120 }
      ],
      tarifMin: 35,
      jauge: NumberInt(5000),
      billets: [
        { code: "BLM-7F3K-92QX", categorie: "standard", prix: 45, dateAchat: ISODate("2027-01-15T10:03:00Z"), statut: "valide",
          acheteur: { nom: "Petit", prenom: "Léa", email: "lea.petit@mail.fr" } }
      ],
      alertes: []
    },
    {
      _id: ObjectId("6650c1000000000000000002"),
      titre: "Riff Riders - Rock Night",
      dateDebut: ISODate("2027-07-11T20:00:00Z"),
      dateFin: ISODate("2027-07-11T22:00:00Z"),
      genre: "rock",
      statut: "programme",
      artistes: [{ _id: ObjectId("6650a1000000000000000003"), nom: "Riff Riders", pays: "France", role: "tete_affiche" }],
      categories: [{ code: "standard", libelle: "Placement libre", prix: 30 }],
      tarifMin: 30,
      jauge: NumberInt(4000),
      billets: []
    }
  ]
});
function sceneValide() { const s = db.scenes.findOne({ _id: SCENE }); delete s._id; s.nom = "Copie " + Math.random(); s.concerts.forEach(c => { c._id = new ObjectId(); c.billets = []; }); return s; }
const billetValide = (code) => ({ code, categorie: "standard", prix: 45, dateAchat: new Date(), statut: "valide",
  acheteur: { nom: "Test", prenom: "Tom", email: "tom@test.fr" } });

doitEchouer("scène sans nom", () => { const s = sceneValide(); delete s.nom; db.scenes.insertOne(s); });
doitEchouer("type de scène inconnu", () => { const s = sceneValide(); s.type = "bateau"; db.scenes.insertOne(s); });
doitEchouer("capacité 0", () => { const s = sceneValide(); s.capacite = NumberInt(0); db.scenes.insertOne(s); });
doitEchouer("capacité en texte", () => { const s = sceneValide(); s.capacite = "5000"; db.scenes.insertOne(s); });
doitEchouer("nom de scène en double", () => { const s = sceneValide(); s.nom = "Scène Tournesol"; db.scenes.insertOne(s); });
doitEchouer("champ inconnu (faute de frappe)", () => { const s = sceneValide(); s.capacitee = 10; db.scenes.insertOne(s); });

doitEchouer("genre non autorisé (jazz)", () => { const s = sceneValide(); s.concerts[0].genre = "jazz"; db.scenes.insertOne(s); });
doitEchouer("statut de concert inconnu", () => { const s = sceneValide(); s.concerts[0].statut = "bientot"; db.scenes.insertOne(s); });
doitEchouer("date en texte", () => { const s = sceneValide(); s.concerts[0].dateDebut = "2027-07-10"; db.scenes.insertOne(s); });
doitEchouer("fin avant le début", () => { const s = sceneValide(); s.concerts[0].dateFin = ISODate("2027-07-10T20:00:00Z"); db.scenes.insertOne(s); });
doitEchouer("jauge > capacité de la scène", () => { const s = sceneValide(); s.concerts[0].jauge = NumberInt(6000); db.scenes.insertOne(s); });
doitEchouer("prix négatif", () => { const s = sceneValide(); s.concerts[0].categories[0].prix = -5; db.scenes.insertOne(s); });
doitEchouer("prix > 500", () => { const s = sceneValide(); s.concerts[0].categories[2].prix = 900; db.scenes.insertOne(s); });
doitEchouer("tarifMin incohérent", () => { const s = sceneValide(); s.concerts[0].tarifMin = 45; db.scenes.insertOne(s); });
doitEchouer("titre manquant", () => { const s = sceneValide(); delete s.concerts[0].titre; db.scenes.insertOne(s); });

doitEchouer("concert sans artiste", () => { const s = sceneValide(); s.concerts[0].artistes = []; db.scenes.insertOne(s); });
doitEchouer("artiste sans nom", () => { const s = sceneValide(); delete s.concerts[0].artistes[0].nom; db.scenes.insertOne(s); });
doitEchouer("rôle d'artiste inconnu", () => { const s = sceneValide(); s.concerts[0].artistes[0].role = "star"; db.scenes.insertOne(s); });
doitEchouer("code billet mal formé", () => db.scenes.updateOne({ _id: SCENE, "concerts._id": C1 }, { $push: { "concerts.$.billets": billetValide("1234") } }));
doitEchouer("code billet en double (même scène)", () => db.scenes.updateOne({ _id: SCENE, "concerts._id": C1 }, { $push: { "concerts.$.billets": billetValide("BLM-7F3K-92QX") } }));
doitEchouer("statut de billet inconnu", () => { const b = billetValide("BLM-AAAA-0001"); b.statut = "perdu"; db.scenes.updateOne({ _id: SCENE, "concerts._id": C1 }, { $push: { "concerts.$.billets": b } }); });
doitEchouer("email acheteur invalide", () => { const b = billetValide("BLM-AAAA-0002"); b.acheteur.email = "pas-un-email"; db.scenes.updateOne({ _id: SCENE, "concerts._id": C1 }, { $push: { "concerts.$.billets": b } }); });
doitEchouer("billet 'utilise' sans contrôle", () => db.scenes.updateOne({ _id: SCENE }, { $set: { "concerts.$[c].billets.$[b].statut": "utilise" } },
  { arrayFilters: [{ "c._id": C1 }, { "b.code": "BLM-7F3K-92QX" }] }));
doitEchouer("alerte avec email invalide", () => db.scenes.updateOne({ _id: SCENE, "concerts._id": C1 }, { $push: { "concerts.$.alertes": { email: "x", dateCreation: new Date(), envoyee: false } } }));
doitEchouer("survente : jauge de 1 déjà atteinte", () => {
  const s = sceneValide(); s.concerts[0].jauge = NumberInt(1); s.concerts[0].billets = [billetValide("BLM-BBBB-0001")];
  db.scenes.insertOne(s);
  db.scenes.updateOne({ nom: s.nom, "concerts._id": s.concerts[0]._id },
    { $push: { "concerts.$.billets": billetValide("BLM-BBBB-0002") } });
});
db.scenes.deleteMany({ nom: /^Copie / });

print("\n--- Vente d'un billet ---");
const vente = (code) => db.scenes.updateOne(
  { _id: SCENE, concerts: { $elemMatch: { _id: C1, statut: "en_vente" } } },
  { $push: { "concerts.$.billets": billetValide(code) } });
print("vente -> modifiedCount = " + vente("BLM-CCCC-0001").modifiedCount);
db.scenes.updateOne({ _id: SCENE }, { $pull: { "concerts.$[c].billets": { code: "BLM-CCCC-0001" } } }, { arrayFilters: [{ "c._id": C1 }] });

print("\n--- Contrôle d'entrée (vigile) ---");
const scan = (code) => db.scenes.updateOne(
  { "concerts.billets.code": code },
  { $set: { "concerts.$[c].billets.$[b].statut": "utilise",
            "concerts.$[c].billets.$[b].controle": { dateScan: new Date(), vigile: "karim.durand" } } },
  { arrayFilters: [{ "c.billets.code": code }, { "b.code": code, "b.statut": "valide" }] }).modifiedCount;
print("1er scan -> " + (scan("BLM-7F3K-92QX") ? "ENTRÉE AUTORISÉE" : "refus"));
print("2e scan  -> " + (scan("BLM-7F3K-92QX") ? "ENTRÉE AUTORISÉE" : "REFUS (déjà utilisé)"));
print("code inconnu -> " + (db.scenes.findOne({ "concerts.billets.code": "BLM-FAUX-0000" }) ? "trouvé" : "FRAUDE (inexistant)"));
db.scenes.updateOne({ _id: SCENE }, { $set: { "concerts.$[c].billets.$[b].statut": "valide" }, $unset: { "concerts.$[c].billets.$[b].controle": "" } },
  { arrayFilters: [{ "c._id": C1 }, { "b.code": "BLM-7F3K-92QX" }] });

print("\n--- Recherche multicritère + tri (renvoie des concerts, sans les billets) ---");
printjson(db.scenes.aggregate([
  { $match: { concerts: { $elemMatch: { statut: "en_vente", genre: "electro" } } } },
  { $unwind: "$concerts" },
  { $match: { "concerts.statut": "en_vente", "concerts.genre": "electro",
              "concerts.dateDebut": { $gte: ISODate("2027-07-01") }, "concerts.tarifMin": { $lte: 40 },
              "concerts.artistes.nom": { $regex: "pétales", $options: "i" } } },
  { $project: { _id: 0, scene: "$nom", concertId: "$concerts._id", titre: "$concerts.titre",
                dateDebut: "$concerts.dateDebut", tarifMin: "$concerts.tarifMin" } },
  { $sort: { dateDebut: 1 } }
]).toArray());

print("\n--- explain : index utilisé par la recherche ---");
const ex = db.scenes.find({ concerts: { $elemMatch: { statut: "en_vente", genre: "electro" } } }).explain("executionStats");
print(JSON.stringify(ex.queryPlanner.winningPlan).includes("recherche_statut_genre_date") ? "IXSCAN recherche_statut_genre_date" : "COLLSCAN");

print("\n--- Mes billets (par email) ---");
printjson(db.scenes.aggregate([
  { $match: { "concerts.billets.acheteur.email": "lea.petit@mail.fr" } },
  { $unwind: "$concerts" }, { $unwind: "$concerts.billets" },
  { $match: { "concerts.billets.acheteur.email": "lea.petit@mail.fr" } },
  { $project: { _id: 0, code: "$concerts.billets.code", concert: "$concerts.titre", scene: "$nom",
                date: "$concerts.dateDebut", statut: "$concerts.billets.statut" } }
]).toArray());

print("\n--- Tableau de bord ---");
print("Recettes par jour et par scène :");
printjson(db.scenes.aggregate([
  { $unwind: "$concerts" }, { $unwind: "$concerts.billets" },
  { $match: { "concerts.billets.statut": { $in: ["valide", "utilise"] } } },
  { $group: { _id: { jour: { $dateToString: { format: "%Y-%m-%d", date: "$concerts.dateDebut", timezone: "Europe/Paris" } }, scene: "$nom" },
              recette: { $sum: "$concerts.billets.prix" }, billets: { $sum: 1 } } },
  { $sort: { "_id.jour": 1, "_id.scene": 1 } }
]).toArray());
print("Taux de remplissage :");
printjson(db.scenes.aggregate([
  { $unwind: "$concerts" },
  { $match: { "concerts.statut": { $ne: "annule" } } },
  { $project: { _id: 0, scene: "$nom", titre: "$concerts.titre",
      vendus: { $size: { $filter: { input: "$concerts.billets", as: "b", cond: { $ne: ["$$b.statut", "annule"] } } } },
      jauge: "$concerts.jauge" } },
  { $addFields: { taux: { $round: [{ $multiply: [{ $divide: ["$vendus", "$jauge"] }, 100] }, 2] } } },
  { $sort: { taux: -1 } }
]).toArray());
print("Top artistes :");
printjson(db.scenes.aggregate([
  { $unwind: "$concerts" },
  { $project: { artistes: "$concerts.artistes",
      vendus: { $size: { $filter: { input: "$concerts.billets", as: "b", cond: { $ne: ["$$b.statut", "annule"] } } } } } },
  { $unwind: "$artistes" },
  { $group: { _id: "$artistes.nom", billetsVendus: { $sum: "$vendus" } } },
  { $sort: { billetsVendus: -1 } }, { $limit: 10 }
]).toArray());

db.scenes.deleteOne({ _id: SCENE });

print("\nRÉSULTAT : " + ok + " refus corrects, " + ko + " erreurs.");
