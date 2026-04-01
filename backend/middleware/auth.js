const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded.admin;
        next();
    } catch (e) {
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        if (e.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Token is not valid', code: 'TOKEN_INVALID' });
        }
        res.status(401).json({ msg: 'Authentication failed', code: 'AUTH_FAILED' });
    }
};
