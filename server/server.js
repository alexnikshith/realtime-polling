const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for simplicity in this assignment
        methods: ['GET', 'POST']
    }
});

const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Setup
const db = new sqlite3.Database('./polls.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS polls (
      id TEXT PRIMARY KEY,
      question TEXT,
      options TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
        db.run(`CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id TEXT,
      option_index INTEGER,
      ip_address TEXT,
      fingerprint TEXT,
      FOREIGN KEY(poll_id) REFERENCES polls(id)
    )`);
    }
});

// Helper: Get Vote Counts
const getVoteCounts = (pollId, optionsLength) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT option_index, COUNT(*) as count FROM votes WHERE poll_id = ? GROUP BY option_index`, [pollId], (err, rows) => {
            if (err) return reject(err);

            const counts = new Array(optionsLength).fill(0);
            rows.forEach(row => {
                if (row.option_index >= 0 && row.option_index < optionsLength) {
                    counts[row.option_index] = row.count;
                }
            });
            resolve(counts);
        });
    });
};

// API Routes

// Create a new poll
app.post('/api/polls', (req, res) => {
    const { question, options } = req.body;
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: 'Invalid poll data. Need question and at least 2 options.' });
    }

    const id = uuidv4();
    const optionsStr = JSON.stringify(options);

    db.run(`INSERT INTO polls (id, question, options) VALUES (?, ?, ?)`, [id, question, optionsStr], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id, question, options });
    });
});

// Get poll details and results
app.get('/api/polls/:id', (req, res) => {
    const { id } = req.params;

    db.get(`SELECT * FROM polls WHERE id = ?`, [id], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Poll not found' });

        const options = JSON.parse(row.options);
        try {
            const votes = await getVoteCounts(id, options.length);
            res.json({ ...row, options, votes });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch votes' });
        }
    });
});

// Vote on a poll
app.post('/api/polls/:id/vote', (req, res) => {
    const { id } = req.params;
    const { optionIndex, fingerprint } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    if (optionIndex === undefined || !fingerprint) {
        return res.status(400).json({ error: 'Missing optionIndex or fingerprint' });
    }

    // Check if poll exists
    db.get(`SELECT options FROM polls WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Poll not found' });

        const options = JSON.parse(row.options);
        if (optionIndex < 0 || optionIndex >= options.length) {
            return res.status(400).json({ error: 'Invalid option index' });
        }

        // Fairness Mechanism: Check for existing vote by IP or Fingerprint
        // NOTE: For testing purposes on localhost, we allow multiple votes from localhost IPs
        const isLocalhost = ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
        console.log(`Vote request from IP: ${ip} (Localhost: ${isLocalhost})`);

        db.get(`SELECT * FROM votes WHERE poll_id = ? AND (ip_address = ? OR fingerprint = ?)`, [id, ip, fingerprint], (err, existingVote) => {
            if (err) return res.status(500).json({ error: err.message });

            if (existingVote && !isLocalhost) {
                return res.status(403).json({ error: 'You have already voted on this poll.' });
            }

            // Record Vote
            db.run(`INSERT INTO votes (poll_id, option_index, ip_address, fingerprint) VALUES (?, ?, ?, ?)`, [id, optionIndex, ip, fingerprint], async function (err) {
                if (err) return res.status(500).json({ error: err.message });

                // Broadcast new results
                const votes = await getVoteCounts(id, options.length);
                io.to(id).emit('update_results', { votes });

                res.json({ success: true, message: 'Vote recorded', votes });
            });
        });
    });
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_poll', (pollId) => {
        socket.join(pollId);
        console.log(`User ${socket.id} joined poll room: ${pollId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
