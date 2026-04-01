const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// POST login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const token = jwt.sign({ admin: { id: admin._id } }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST refresh token (if still within 24h grace, re-issue a fresh 24h token)
router.post('/refresh', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token provided' });

    try {
        // Verify even if expired, to allow refresh
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
        const admin = await Admin.findById(decoded.admin.id);
        if (!admin) return res.status(401).json({ msg: 'Admin not found' });

        // Issue a fresh 24h token
        const newToken = jwt.sign({ admin: { id: admin._id } }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token: newToken });
    } catch (err) {
        res.status(401).json({ msg: 'Cannot refresh token' });
    }
});

module.exports = router;
