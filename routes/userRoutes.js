const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/stats', userController.updateStats);
router.post('/profile', userController.updateProfile);
router.get('/stats/:username', userController.getStats);
router.get('/leaderboard', userController.getLeaderboard);

module.exports = router;
