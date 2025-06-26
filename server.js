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


const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load existing wishes
let wishes = [];
const wishesFilePath = path.join(__dirname, 'wishes.json');
if (fs.existsSync(wishesFilePath)) {
  wishes = JSON.parse(fs.readFileSync(wishesFilePath, 'utf-8'));
}

// POST route to save a wish
app.post('/submit', (req, res) => {
  const { name, message, photo } = req.body;
  const newWish = { name, message, photo, time: new Date().toISOString() };
  wishes.push(newWish);

  fs.writeFileSync(wishesFilePath, JSON.stringify(wishes, null, 2));
  res.redirect('/thank-you.html');
});

// ✅ GET route to view wishes as a simple HTML page
app.get('/wishes', (req, res) => {
  let html = `
    <html>
    <head>
      <title>Mandira’s Birthday Wishes 🎉</title>
      <style>
        body { font-family: sans-serif; background: #fbecec; padding: 2rem; color: #333; }
        h1 { text-align: center; color: #800000; }
        .wish { border: 1px solid #ccc; border-radius: 12px; padding: 1rem; margin: 1rem auto; max-width: 600px; background: #fff; }
        .wish img { max-width: 100%; border-radius: 10px; margin-top: 0.5rem; }
        .name { font-weight: bold; color: #a52a2a; margin-bottom: 0.3rem; }
        .time { font-size: 0.8rem; color: #888; }
      </style>
    </head>
    <body>
      <h1>All Birthday Wishes for Mandira 🎂💖</h1>
  `;

  wishes.reverse().forEach(({ name, message, photo, time }) => {
    html += `
      <div class="wish">
        <div class="name">${name}</div>
        <div class="time">${new Date(time).toLocaleString()}</div>
        <div class="message">${message}</div>
        ${photo ? `<img src="${photo}" alt="photo from ${name}" />` : ""}
      </div>
    `;
  });

  html += `</body></html>`;
  res.send(html);
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
