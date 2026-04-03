const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 8);

  const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
  db.run(query, [username, hashedPassword], function (err) {
    if (err) {
      if (err.message.includes('unique constraint') || err.code === '23505') {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, username, wins: 0, losses: 0, gamesPlayed: 0 });
  });
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const query = 'SELECT * FROM users WHERE username = ?';
  db.get(query, [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'supersecret', {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).json({
      auth: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        wins: user.wins,
        losses: user.losses,
        gamesPlayed: user.games_played,
        skin: user.skin,
        stripeColor: user.stripe_color,
        scenario: user.scenario
      }
    });
  });
};

