const express = require('express');
const router = express.Router();
const expenseRoutes = require('./expenseRoutes');

router.use('/api', expenseRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;