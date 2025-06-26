const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb+srv://nishantroy449:SwaggerRoy69@cluster0.xztkzdx.mongodb.net/wishesDB?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Wish Schema
const wishSchema = new mongoose.Schema({
  name: String,
  message: String,
  photo: String,
  time: { type: Date, default: Date.now },
});

const Wish = mongoose.model('Wish', wishSchema);

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload config
const uploadsDir = './public/uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Submit wish
app.post('/submit', upload.single('photo'), async (req, res) => {
  const { name, message } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  const wish = new Wish({ name, message, photo });
  await wish.save();
  res.redirect('/thank-you.html');
});

// View wishes
app.get('/wishes', async (req, res) => {
  const wishes = await Wish.find().sort({ time: -1 });

  let html = `
    <html>
    <head>
      <title>Wishes for Mandira</title>
      <style>
        body { font-family: sans-serif; background: #fbecec; padding: 2rem; color: #333; }
        h1 { text-align: center; color: #800000; }
        .wish {
          border: 1px solid #ccc;
          border-radius: 12px;
          padding: 1rem;
          margin: 1rem auto;
          max-width: 600px;
          background: #fff;
          position: relative;
        }
        .wish img {
          max-width: 100%;
          margin-top: 0.5rem;
          border-radius: 10px;
        }
        .name { font-weight: bold; color: #a52a2a; }
        .time { font-size: 0.8rem; color: #888; margin-bottom: 0.5rem; }
        .controls {
          margin-top: 0.7rem;
        }
        button, a.download-btn {
          margin-right: 8px;
          background: #800000;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          text-decoration: none;
        }
      </style>
      <script>
        function deleteWish(id) {
          if (confirm('Are you sure you want to delete this wish?')) {
            fetch('/delete/' + id, { method: 'DELETE' })
              .then(() => window.location.reload());
          }
        }

        function copyWish(name, message) {
          const text = 'From: ' + name + '\\n\\n' + message;
          navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
        }
      </script>
    </head>
    <body>
      <h1>🎉 Wishes for Mandira 💖</h1>
  `;

  wishes.forEach(({ _id, name, message, photo, time }) => {
    html += `
      <div class="wish">
        <div class="name">From: ${name}</div>
        <div class="time">${new Date(time).toLocaleString()}</div>
        <div class="message">${message}</div>
        ${photo ? `<img src="${photo}" alt="Attached image"/><br>
        <a href="${photo}" download class="download-btn">Download Photo</a>` : ''}
        <div class="controls">
          <button onclick="copyWish('${name.replace(/'/g, "\\'")}', '${message.replace(/'/g, "\\'").replace(/\n/g, "\\n")}')">Copy</button>
          <button onclick="deleteWish('${_id}')">Delete</button>
        </div>
      </div>
    `;
  });

  html += `</body></html>`;
  res.send(html);
});

// Delete wish
app.delete('/delete/:id', async (req, res) => {
  await Wish.findByIdAndDelete(req.params.id);
  res.status(200).send({ success: true });
});

// Fallback to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
