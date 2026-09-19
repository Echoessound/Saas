const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 生产环境请通过环境变量配置 JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'sports-registration-dev-secret';
const TOKEN_TTL = '24h';

function signToken(user) {
  return jwt.sign(
    { username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

async function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未登录或登录已过期，请重新登录。' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ username: payload.username });
    if (!user) return res.status(401).json({ error: '账号不存在，请重新登录。' });
    req.user = { username: user.username, role: user.role, displayName: user.displayName };
    next();
  } catch {
    return res.status(401).json({ error: '登录凭证无效或已过期，请重新登录。' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '当前账号无权执行该操作。' });
    }
    next();
  };
}

module.exports = { authRequired, requireRole, signToken };
