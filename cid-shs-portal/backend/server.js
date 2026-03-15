require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
// Restrict CORS to the frontend dev server to avoid issues in dev
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5174' }));
app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded files statically at /uploads (in production, secure this)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health route
app.get('/api/ping', (req, res) => res.json({ status: 'ok' }));

// Mount API routes
app.use('/api', routes);

// Fallback route for uploads listing (kept for convenience)
app.get('/api/uploads', (req, res) => {
  const dir = path.join(__dirname, 'uploads');
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Cannot read uploads directory' });
    res.json(files || []);
  });
});

// Error handler
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
