require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Proxy to Python AI
app.post('/api/analyze', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:5001/analyze', req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "AI service unavailable" });
    }
});

app.post('/api/interview', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:5001/interview', req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "AI service unavailable" });
    }
});

app.listen(3000, () => {
    console.log('Node server running on port 3000');
});