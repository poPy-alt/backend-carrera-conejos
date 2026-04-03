const db = require('../db');

exports.updateStats = (req, res) => {
  const { username, won } = req.body;
  if (!username || won === undefined) {
    return res.status(400).json({ error: 'Username and won (boolean) are required' });
  }

  const query = won ?
    'UPDATE users SET wins = wins + 1, games_played = games_played + 1 WHERE username = ?' :
    'UPDATE users SET losses = losses + 1, games_played = games_played + 1 WHERE username = ?';

  db.run(query, [username], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ message: 'Stats updated successfully' });
  });
};

exports.updateProfile = (req, res) => {
  const { username, skin, stripeColor, scenario } = req.body;
  const query = 'UPDATE users SET skin = ?, stripe_color = ?, scenario = ? WHERE username = ?';
  db.run(query, [skin, stripeColor, scenario, username], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Profile updated' });
  });
};

exports.getStats = (req, res) => {
  const { username } = req.params;
  const query = 'SELECT username, wins, losses, games_played, skin, stripe_color, scenario FROM users WHERE username = ?';
  db.get(query, [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Mapear de vuelta a camelCase para el frontend del panda
    const mappedUser = {
      username: user.username,
      wins: user.wins,
      losses: user.losses,
      gamesPlayed: user.games_played,
      skin: user.skin,
      stripeColor: user.stripe_color,
      scenario: user.scenario
    };
    res.status(200).json(mappedUser);
  });
};

exports.getLeaderboard = (req, res) => {
  const query = 'SELECT username, wins, losses, games_played FROM users ORDER BY wins DESC LIMIT 10';
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const mappedRows = rows.map(user => ({
      username: user.username,
      wins: user.wins,
      losses: user.losses,
      gamesPlayed: user.games_played
    }));
    res.status(200).json(mappedRows);
  });
};
