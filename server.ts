import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('cyber_risk.db');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    owner TEXT
  );

  CREATE TABLE IF NOT EXISTS risks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER,
    threat TEXT NOT NULL,
    vulnerability TEXT NOT NULL,
    likelihood INTEGER NOT NULL,
    impact INTEGER NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    mitigation_strategy TEXT,
    FOREIGN KEY (asset_id) REFERENCES assets(id)
  );
`);

// Seed sample data if empty
const assetCount = db.prepare('SELECT count(*) as count FROM assets').get() as { count: number };
if (assetCount.count === 0) {
  const insertAsset = db.prepare('INSERT INTO assets (name, type, description, owner) VALUES (?, ?, ?, ?)');
  insertAsset.run('Customer Database', 'Data', 'Contains PII of all customers', 'IT Operations');
  insertAsset.run('Corporate Website', 'System', 'Public facing web server', 'Marketing');
  insertAsset.run('HR Portal', 'System', 'Internal employee management system', 'HR');
  
  const insertRisk = db.prepare('INSERT INTO risks (asset_id, threat, vulnerability, likelihood, impact, risk_score, risk_level, mitigation_strategy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertRisk.run(1, 'Data Breach', 'Unpatched SQL injection vulnerability', 4, 5, 20, 'Critical', 'Implement WAF and patch database software immediately.');
  insertRisk.run(2, 'DDoS Attack', 'Lack of rate limiting', 3, 3, 9, 'Medium', 'Enable Cloudflare DDoS protection and rate limiting.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/assets', (req, res) => {
    const assets = db.prepare('SELECT * FROM assets').all();
    res.json(assets);
  });

  app.post('/api/assets', (req, res) => {
    const { name, type, description, owner } = req.body;
    const info = db.prepare('INSERT INTO assets (name, type, description, owner) VALUES (?, ?, ?, ?)').run(name, type, description, owner);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete('/api/assets/:id', (req, res) => {
    db.prepare('DELETE FROM risks WHERE asset_id = ?').run(req.params.id);
    db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/risks', (req, res) => {
    const risks = db.prepare(`
      SELECT risks.*, assets.name as asset_name 
      FROM risks 
      JOIN assets ON risks.asset_id = assets.id
    `).all();
    res.json(risks);
  });

  app.post('/api/risks', (req, res) => {
    const { asset_id, threat, vulnerability, likelihood, impact, mitigation_strategy } = req.body;
    const risk_score = likelihood * impact;
    let risk_level = 'Low';
    if (risk_score >= 15) risk_level = 'Critical';
    else if (risk_score >= 10) risk_level = 'High';
    else if (risk_score >= 5) risk_level = 'Medium';

    const info = db.prepare(`
      INSERT INTO risks (asset_id, threat, vulnerability, likelihood, impact, risk_score, risk_level, mitigation_strategy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(asset_id, threat, vulnerability, likelihood, impact, risk_score, risk_level, mitigation_strategy);
    
    res.json({ id: info.lastInsertRowid, risk_score, risk_level });
  });

  app.delete('/api/risks/:id', (req, res) => {
    db.prepare('DELETE FROM risks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
