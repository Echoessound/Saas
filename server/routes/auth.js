const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const { authRequired, signToken } = require('../middleware/auth');

const ROLE_LABELS = ['LEAGUE_REP', 'COMMITTEE_ADMIN'];

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName, role } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: '请完整填写用户名、密码与姓名。' });
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ error: '用户名需为 3-20 位字母、数字或下划线。' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: '密码长度至少 6 位。' });
    }
    if (!ROLE_LABELS.includes(role)) {
      return res.status(400).json({ error: '请选择有效的账号角色。' });
    }
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: '该用户名已被注册。' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash, displayName, role });
    res.json({
      success: true,
      message: '注册成功，请登录。',
      user: { username: user.username, displayName: user.displayName, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: '用户名或密码错误。' });
    const ok = await bcrypt.compare(password || '', user.passwordHash);
    if (!ok) return res.status(401).json({ error: '用户名或密码错误。' });

    const token = signToken(user);
    res.json({
      success: true,
      token,
      user: { username: user.username, displayName: user.displayName, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 当前登录用户
router.get('/me', authRequired, async (req, res) => {
  res.json({ user: req.user });
});

// 修改密码
router.post('/change-password', authRequired, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: '新密码长度至少 6 位。' });
    }
    const user = await User.findOne({ username: req.user.username });
    const ok = await bcrypt.compare(oldPassword || '', user.passwordHash);
    if (!ok) return res.status(400).json({ error: '原密码不正确。' });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: '密码修改成功，下次登录请使用新密码。' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
