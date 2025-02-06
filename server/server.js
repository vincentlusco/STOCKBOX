const express = require('express');
const cors = require('cors');
const marketRoutes = require('./routes/market');

const app = express();
const PORT = process.env.PORT || 2008;

// Middleware
app.use(cors());
app.use(express.json());

// Use market routes
app.use('/api', marketRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 