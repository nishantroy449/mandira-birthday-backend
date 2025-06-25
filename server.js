const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Save uploads to public/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './public/uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Ensure wishes.json exists
const wishesFile = './wishes.json';
if (!fs.existsSync(wishesFile)) fs.writeFileSync(wishesFile, '[]');

// Route to handle form submission
app.post('/submit', upload.single('photo'), (req, res) => {
  const { name, message } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  const newWish = { name, message, photo, timestamp: new Date().toISOString() };
  const existingWishes = JSON.parse(fs.readFileSync(wishesFile));
  existingWishes.push(newWish);
  fs.writeFileSync(wishesFile, JSON.stringify(existingWishes, null, 2));

  res.redirect('/thank-you.html');
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
