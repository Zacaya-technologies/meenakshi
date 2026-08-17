const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'meenakshi_build_world_jwt_secret_key_2026';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
}

function requireRole(roles = []) {
    if (typeof roles === 'string') roles = [roles];
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: `Forbidden: ${req.user.role} role does not have access.` });
        }
        next();
    };
}

module.exports = {
    JWT_SECRET,
    authenticateToken,
    requireRole
};
