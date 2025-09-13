import express from 'express';

const router = express.Router();

router.get('/send', (req, res) => {
  // Handle sending a message
  res.send('Send message endpoint');
});

export default router;