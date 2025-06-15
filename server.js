const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const WebSocket = require('ws');

const HTTP_PORT = process.env.HTTP_PORT || 8081;
const WS_PORT = process.env.WS_PORT || 8080;

// Database configuration via environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'r2c_db',
};

async function createDbPool() {
  return await mysql.createPool(dbConfig);
}

async function main() {
  const app = express();
  app.use(bodyParser.json());
  const pool = await createDbPool();

  // Registration
  app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, password]);
      res.json({ id: rows.insertId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  });

  // Login
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id, password_hash FROM users WHERE username = ?', [username]);
      if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
      const user = rows[0];
      if (user.password_hash !== password) return res.status(401).json({ error: 'Invalid credentials' });
      res.json({ id: user.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  });

  // Server list
  app.get('/servers', async (_req, res) => {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id, name, host, port, is_online FROM servers');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  });

  // Characters of a user
  app.get('/characters/:userId', async (req, res) => {
    const { userId } = req.params;
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id, name, class, level FROM characters WHERE user_id = ?', [userId]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  });

  // Create character
  app.post('/characters/:userId', async (req, res) => {
    const { userId } = req.params;
    const { name, class: charClass } = req.body;
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('INSERT INTO characters (user_id, server_id, name, class) VALUES (?, 1, ?, ?)', [userId, name, charClass]);
      res.json({ id: rows.insertId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  });

  // Delete character
  app.delete('/characters/:userId/:charId', async (req, res) => {
    const { charId, userId } = req.params;
    const conn = await pool.getConnection();
    try {
      await conn.query('DELETE FROM characters WHERE id = ? AND user_id = ?', [charId, userId]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  });

  const server = app.listen(HTTP_PORT, () => {
    console.log(`HTTP server listening on ${HTTP_PORT}`);
  });

  const wss = new WebSocket.Server({ port: WS_PORT });
  wss.on('connection', ws => {
    ws.on('message', message => {
      console.log('Received:', message.toString());
      ws.send(`Echo: ${message}`);
    });
    ws.send('Welcome to R2Craft WS server');
  });
  console.log(`WebSocket server listening on ${WS_PORT}`);
}

main().catch(err => {
  console.error('Failed to start server:', err);
});
