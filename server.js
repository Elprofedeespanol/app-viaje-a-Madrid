require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Conexión a base de datos (no te preocupes, es local)
mongoose.connect('mongodb://localhost:27017/viaje-madrid', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Modelo: Alumno
const eleveSchema = new mongoose.Schema({
  nom: String,
  classe: String,
  prioriteLCE: Boolean,
});
const Eleve = mongoose.model('Eleve', eleveSchema);

// Modelo: Dossier del alumno
const dossierSchema = new mongoose.Schema({
  code: String,
  nomEleve: String,
  classe: String,
  nomTuteur: String,
  emailTuteur: String,
  telephoneTuteur: String,
  documents: {
    passeport: Boolean,
    visa: Boolean,
    autorisation: Boolean,
    medical: Boolean,
  },
  paiements: {
    sep: Boolean,
    oct: Boolean,
    nov: Boolean,
    dec: Boolean,
    jan: Boolean,
    fev: Boolean,
    mar: Boolean,
    avr: Boolean,
  },
});
const Dossier = mongoose.model('Dossier', dossierSchema);

// Cargar alumnos del Excel
async function chargerEleves() {
  try {
    const filePath = path.join(__dirname, 'data', 'eleves.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    await Eleve.deleteMany({});
    const eleves = data.map(e => ({
      nom: (e['Nom complet'] || '').trim().toLowerCase(),
      classe: (e['Classe'] || '').trim(),
      prioriteLCE: e['Priorité'] === 'LCE',
    })).filter(e => e.nom && e.classe);

    await Eleve.insertMany(eleves);
    console.log(`✅ ${eleves.length} élèves chargés.`);
  } catch (error) {
    console.log('❌ Aún no se carga el archivo eleves.xlsx. Lo harás más tarde.');
  }
}

// Configuración
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API: Validar alumno
app.post('/api/valider', async (req, res) => {
  const { nom, classe } = req.body;
  const nomNormalise = nom.trim().toLowerCase();
  const eleve = await Eleve.findOne({ nom: nomNormalise, classe });
  res.json({ valide: !!eleve });
});

// API: Inscribir
app.post('/api/inscrire', async (req, res) => {
  const { nomEleve, classe, nomTuteur, emailTuteur, telephoneTuteur } = req.body;
  const code = Array(3).fill().map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('') +
               "-" +
               Array(3).fill().map(() => Math.floor(Math.random() * 10)).join('');

  const nouveauDossier = new Dossier({
    code, nomEleve, classe, nomTuteur, emailTuteur, telephoneTuteur, documents: {}, paiements: {}
  });

  try {
    await nouveauDossier.save();
    res.json({ code });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// API: Recuperar dossier
app.get('/api/dossier/:code', async (req, res) => {
  const { code } = req.params;
  const dossier = await Dossier.findOne({ code });
  if (dossier) res.json(dossier);
  else res.status(404).json({ error: 'Non trouvé' });
});

// API: Guardar progreso
app.put('/api/dossier/:code', async (req, res) => {
  const { code } = req.params;
  const { documents, paiements } = req.body;
  try {
    await Dossier.findOneAndUpdate({ code }, { documents, paiements });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 App lista en: http://localhost:${PORT}`);
  await chargerEleves();
});
