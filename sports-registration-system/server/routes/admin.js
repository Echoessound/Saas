const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Referee = require('../models/Referee');
const { Order } = require('../models/Order');
const { authRequired, requireRole } = require('../middleware/auth');

// 赛事与裁判后台管理：仅组委会管理员
router.use(authRequired, requireRole('COMMITTEE_ADMIN'));

const CATEGORIES = ['Basketball', 'Football', 'Volleyball'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// ---------------- 比赛管理 ----------------

router.get('/matches', async (req, res) => {
  try {
    const matches = await Match.find().sort({ matchNumber: 1 });
    // 附带每场比赛的生效报名数，供前端判断能否删除
    const referenced = await Order.aggregate([
      { $match: { status: 'PAID' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.matchNumber', count: { $sum: 1 } } }
    ]);
    const refMap = Object.fromEntries(referenced.map(r => [r._id, r.count]));
    res.json(matches.map(m => ({ ...m.toObject(), paidOrderRefs: refMap[m.matchNumber] || 0 })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/matches', async (req, res) => {
  try {
    const { matchNumber, category, level, startTime, entryFee } = req.body;
    if (!matchNumber || !CATEGORIES.includes(category) || !LEVELS.includes(level) || !startTime || entryFee == null) {
      return res.status(400).json({ error: '请完整填写比赛编号、类别、级别、开赛时间与费用。' });
    }
    const exists = await Match.findOne({ matchNumber: Number(matchNumber) });
    if (exists) return res.status(409).json({ error: `比赛编号 #${matchNumber} 已存在。` });
    const match = await Match.create({
      matchNumber: Number(matchNumber), category, level,
      startTime: new Date(startTime), entryFee: Number(entryFee)
    });
    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/matches/:matchNumber', async (req, res) => {
  try {
    const matchNo = Number(req.params.matchNumber);
    const match = await Match.findOne({ matchNumber: matchNo });
    if (!match) return res.status(404).json({ error: '未找到该比赛。' });

    const { category, level, startTime, entryFee } = req.body;
    if (category && !CATEGORIES.includes(category)) return res.status(400).json({ error: '无效的赛事类别。' });
    if (level && !LEVELS.includes(level)) return res.status(400).json({ error: '无效的赛事级别。' });

    // 已有生效订单引用的比赛：仅允许调整开赛时间与费用提示，不允许改类别/级别（避免订单项语义漂移）
    const refs = await Order.countDocuments({ status: 'PAID', 'items.matchNumber': matchNo });
    if (refs > 0 && ((category && category !== match.category) || (level && level !== match.level))) {
      return res.status(400).json({ error: `比赛 #${matchNo} 已有 ${refs} 笔生效报名，不可变更类别或级别。` });
    }

    if (category) match.category = category;
    if (level) match.level = level;
    if (startTime) match.startTime = new Date(startTime);
    if (entryFee != null) match.entryFee = Number(entryFee);
    await match.save();
    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/matches/:matchNumber', async (req, res) => {
  try {
    const matchNo = Number(req.params.matchNumber);
    const refs = await Order.countDocuments({ status: 'PAID', 'items.matchNumber': matchNo });
    if (refs > 0) {
      return res.status(400).json({ error: `比赛 #${matchNo} 已有 ${refs} 笔生效报名，禁止删除。` });
    }
    const result = await Match.deleteOne({ matchNumber: matchNo });
    if (result.deletedCount === 0) return res.status(404).json({ error: '未找到该比赛。' });
    await Referee.deleteMany({ assignedMatchNumber: matchNo });
    res.json({ success: true, message: `比赛 #${matchNo} 及其裁判指派已删除。` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- 裁判指派管理 ----------------

router.get('/referees', async (req, res) => {
  try {
    const referees = await Referee.find().sort({ assignedMatchNumber: 1 });
    res.json(referees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/referees', async (req, res) => {
  try {
    const { refereeName, assignedMatchNumber, refereeAddress, organization } = req.body;
    if (!refereeName || !assignedMatchNumber || !refereeAddress || !organization) {
      return res.status(400).json({ error: '请完整填写裁判姓名、指派比赛编号、通信地址与所属单位。' });
    }
    const match = await Match.findOne({ matchNumber: Number(assignedMatchNumber) });
    if (!match) return res.status(400).json({ error: `比赛 #${assignedMatchNumber} 不存在。` });
    const dup = await Referee.findOne({ refereeName, assignedMatchNumber: Number(assignedMatchNumber) });
    if (dup) return res.status(409).json({ error: '该裁判已指派到这场比赛。' });
    const referee = await Referee.create({
      refereeName, assignedMatchNumber: Number(assignedMatchNumber), refereeAddress, organization
    });
    res.json({ success: true, referee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/referees/:id', async (req, res) => {
  try {
    const referee = await Referee.findById(req.params.id);
    if (!referee) return res.status(404).json({ error: '未找到该裁判指派记录。' });
    const { refereeName, assignedMatchNumber, refereeAddress, organization } = req.body;
    if (assignedMatchNumber) {
      const match = await Match.findOne({ matchNumber: Number(assignedMatchNumber) });
      if (!match) return res.status(400).json({ error: `比赛 #${assignedMatchNumber} 不存在。` });
      referee.assignedMatchNumber = Number(assignedMatchNumber);
    }
    if (refereeName) referee.refereeName = refereeName;
    if (refereeAddress) referee.refereeAddress = refereeAddress;
    if (organization) referee.organization = organization;
    await referee.save();
    res.json({ success: true, referee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/referees/:id', async (req, res) => {
  try {
    const result = await Referee.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: '未找到该裁判指派记录。' });
    res.json({ success: true, message: '裁判指派记录已删除。' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
