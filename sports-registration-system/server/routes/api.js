const express = require('express');
const router = express.Router();
const League = require('../models/League');
const Match = require('../models/Match');
const Referee = require('../models/Referee');
const { Order, BankTransaction } = require('../models/Order');
const Counter = require('../models/Counter');
const FeeEngine = require('../services/feeEngine');
const BankAdapter = require('../services/bankAdapter');
const { authRequired, requireRole } = require('../middleware/auth');

// 本路由内所有接口均需登录（/api/auth/* 为公开接口，独立挂载）
router.use(authRequired);

async function getNextLeagueId() {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'leagueId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

async function getEarliestStartTime(matchNumbers) {
  const matches = await Match.find({ matchNumber: { $in: matchNumbers } });
  if (matches.length === 0) return null;
  return new Date(Math.min(...matches.map(m => m.startTime.getTime())));
}

// 校验报名单归属当前经办人（防止越权退改他人订单；历史无归属订单仅可读）
async function assertOrderOwnership(order, req, res) {
  const league = await League.findOne({ leagueId: order.leagueId });
  if (!league || league.ownerUsername !== req.user.username) {
    res.status(403).json({ error: '该报名单不属于当前账号，无权执行退改操作。' });
    return false;
  }
  return true;
}

// -------------------------------------------------------------
// 一、省联赛端报名与费用流转接口
// -------------------------------------------------------------

// 比赛字典查询（任意登录用户）
router.get('/matches', async (req, res) => {
  try {
    const matches = await Match.find().sort({ matchNumber: 1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. 初次填报并调用银行扣款（UC01~UC03，仅经办人，报名归属当前账号）
router.post('/register', requireRole('LEAGUE_REP'), async (req, res) => {
  try {
    const { leagueName, leagueAddress, leagueMemberNames, selectedMatchNumbers } = req.body;

    if (!leagueName || !leagueAddress || !leagueMemberNames) {
      return res.status(400).json({ error: '请完整填写联赛名称、通信地址与参赛人员名单。' });
    }
    if (!selectedMatchNumbers || selectedMatchNumbers.length === 0) {
      return res.status(400).json({ error: '请至少选择一场比赛项目。' });
    }

    const matches = await Match.find({ matchNumber: { $in: selectedMatchNumbers } });
    if (matches.length !== selectedMatchNumbers.length) {
      return res.status(400).json({ error: '所选比赛包含无效项目。' });
    }

    const leagueId = await getNextLeagueId();
    const league = new League({
      leagueId,
      leagueName,
      leagueAddress,
      leagueMemberNames,
      ownerUsername: req.user.username
    });
    await league.save();

    const totalFee = matches.reduce((sum, m) => sum + m.entryFee, 0);
    const orderNumber = `ORD-${Date.now()}-${leagueId}`;

    const bankRes = await BankAdapter.transferPayment(leagueId, totalFee);

    const orderItems = matches.map(m => ({
      matchNumber: m.matchNumber,
      category: m.category,
      level: m.level,
      fee: m.entryFee
    }));

    const order = new Order({
      orderNumber,
      leagueId,
      items: orderItems,
      totalFee,
      paidFee: totalFee,
      status: 'PAID'
    });
    await order.save();

    await BankTransaction.create({
      txnId: bankRes.txnId,
      orderNumber,
      leagueId,
      amount: totalFee,
      type: 'PAYMENT',
      status: 'SUCCESS'
    });

    res.json({
      success: true,
      message: '报名登记与银行结算成功',
      data: {
        leagueId,
        orderNumber,
        totalFee,
        items: orderItems
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 我的报名：当前账号名下全部报名单（含阶段判定）
router.get('/my/orders', requireRole('LEAGUE_REP'), async (req, res) => {
  try {
    const leagues = await League.find({ ownerUsername: req.user.username });
    const leagueIds = leagues.map(l => l.leagueId);
    const orders = await Order.find({ leagueId: { $in: leagueIds } }).sort({ createdAt: -1 });
    const leagueMap = Object.fromEntries(leagues.map(l => [l.leagueId, l]));

    const result = await Promise.all(orders.map(async o => {
      let stage = null;
      if (o.status === 'PAID') {
        const earliest = await getEarliestStartTime(o.items.map(i => i.matchNumber));
        if (earliest) stage = FeeEngine.getStage(earliest);
      }
      return { order: o, league: leagueMap[o.leagueId] || null, stage };
    }));
    res.json({ items: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 报名单查询（手动单号查询通道，含阶段判定与资金流水）
router.get('/order/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return res.status(404).json({ error: '未找到该报名单。' });

    const league = await League.findOne({ leagueId: order.leagueId });
    let stage = null;
    if (order.status === 'PAID') {
      const earliestTime = await getEarliestStartTime(order.items.map(i => i.matchNumber));
      if (earliestTime) stage = FeeEngine.getStage(earliestTime);
    }
    const transactions = await BankTransaction.find({ orderNumber: order.orderNumber }).sort({ createdAt: 1 });
    res.json({ order, league, stage, transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. 开放期内增减比赛与退补差价（UC04，仅经办人且归属本人）
router.post('/order/modify-items', requireRole('LEAGUE_REP'), async (req, res) => {
  try {
    const { orderNumber, newMatchNumbers } = req.body;
    const order = await Order.findOne({ orderNumber, status: 'PAID' });
    if (!order) return res.status(404).json({ error: '未找到生效中的报名单。' });
    if (!(await assertOrderOwnership(order, req, res))) return;

    if (!newMatchNumbers || newMatchNumbers.length === 0) {
      return res.status(400).json({ error: '调整后的报名单至少需保留一场比赛；如需全部退赛请使用取消报名。' });
    }

    const currentEarliest = await getEarliestStartTime(order.items.map(i => i.matchNumber));
    if (!FeeEngine.canModifyItems(currentEarliest)) {
      return res.status(400).json({ error: '报名通道已关闭，不可进行单项调整；如需退赛请整单取消。' });
    }

    const newMatches = await Match.find({ matchNumber: { $in: newMatchNumbers } });
    if (newMatches.length !== newMatchNumbers.length) {
      return res.status(400).json({ error: '所选比赛包含无效项目。' });
    }
    const newEarliest = new Date(Math.min(...newMatches.map(m => m.startTime.getTime())));
    if (!FeeEngine.canModifyItems(newEarliest)) {
      return res.status(400).json({ error: '新选比赛中包含报名通道已关闭（距开赛不足 30 天）的项目。' });
    }

    const newTotalFee = newMatches.reduce((sum, m) => sum + m.entryFee, 0);
    const delta = newTotalFee - order.paidFee;

    if (delta > 0) {
      const payRes = await BankAdapter.transferPayment(order.leagueId, delta);
      await BankTransaction.create({
        txnId: payRes.txnId,
        orderNumber,
        leagueId: order.leagueId,
        amount: delta,
        type: 'ADDITIONAL_PAY'
      });
    } else if (delta < 0) {
      const refundVal = Math.abs(delta);
      const refRes = await BankAdapter.transferRefund(order.leagueId, refundVal, '开放期微调项目退还差额');
      await BankTransaction.create({
        txnId: refRes.txnId,
        orderNumber,
        leagueId: order.leagueId,
        amount: -refundVal,
        type: 'OPEN_REFUND'
      });
    }

    order.items = newMatches.map(m => ({
      matchNumber: m.matchNumber,
      category: m.category,
      level: m.level,
      fee: m.entryFee
    }));
    order.totalFee = newTotalFee;
    order.paidFee = newTotalFee;
    order.updatedAt = new Date();
    await order.save();

    res.json({ success: true, message: '比赛项目及费用结算变更完成', delta, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. 取消全部报名（UC05：梯级退费状态机，仅经办人且归属本人）
router.post('/order/cancel', requireRole('LEAGUE_REP'), async (req, res) => {
  try {
    const { orderNumber } = req.body;
    const order = await Order.findOne({ orderNumber, status: 'PAID' });
    if (!order) return res.status(404).json({ error: '未找到生效中的报名单。' });
    if (!(await assertOrderOwnership(order, req, res))) return;

    const earliestTime = await getEarliestStartTime(order.items.map(i => i.matchNumber));

    const decision = FeeEngine.calculateCancellation(order.paidFee, earliestTime, new Date());
    if (!decision.allowed && decision.refundAmount === 0) {
      return res.status(400).json({ error: decision.message, stage: decision.stage });
    }

    const bankRes = await BankAdapter.transferRefund(order.leagueId, decision.refundAmount, decision.message);

    order.status = 'CANCELLED';
    order.updatedAt = new Date();
    await order.save();

    await BankTransaction.create({
      txnId: bankRes.txnId,
      orderNumber,
      leagueId: order.leagueId,
      amount: -decision.refundAmount,
      type: decision.stage === 'OPEN_STAGE' ? 'OPEN_REFUND' : 'CANCEL_50_REFUND'
    });

    res.json({
      success: true,
      message: decision.message,
      stage: decision.stage,
      refundAmount: decision.refundAmount,
      refundRate: decision.refundRate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. 打印凭单查询（UC06，任意登录用户）
router.get('/voucher/:leagueId', async (req, res) => {
  try {
    const league = await League.findOne({ leagueId: Number(req.params.leagueId) });
    if (!league) return res.status(404).json({ error: '未找到该省联赛档案。' });

    const order = await Order.findOne({ leagueId: league.leagueId, status: 'PAID' });
    res.json({ league, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 二、组委会管理端 4 大检索职能接口（UC07~UC10，仅管理员）
// -------------------------------------------------------------

// 职能 1: 某个省联赛已报名的比赛项目（类别和级别）
router.get('/committee/league-matches/:leagueId', requireRole('COMMITTEE_ADMIN'), async (req, res) => {
  try {
    const order = await Order.findOne({ leagueId: Number(req.params.leagueId), status: 'PAID' });
    if (!order) return res.json({ matches: [] });
    res.json({ matches: order.items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 职能 2: 报名参加某场特定比赛（类别和级别）的具体省联赛
router.get('/committee/match-leagues/:matchNumber', requireRole('COMMITTEE_ADMIN'), async (req, res) => {
  try {
    const matchNo = Number(req.params.matchNumber);
    const orders = await Order.find({ 'items.matchNumber': matchNo, status: 'PAID' });
    const leagueIds = orders.map(o => o.leagueId);
    const leagues = await League.find({ leagueId: { $in: leagueIds } });
    res.json({ leagues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 职能 3: 某场特定比赛的裁判是谁
router.get('/committee/match-referee/:matchNumber', requireRole('COMMITTEE_ADMIN'), async (req, res) => {
  try {
    const matchNo = Number(req.params.matchNumber);
    const referee = await Referee.findOne({ assignedMatchNumber: matchNo });
    res.json({ referee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 职能 4: 某位裁判被分配执裁了哪些比赛
router.get('/committee/referee-matches', requireRole('COMMITTEE_ADMIN'), async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: '请提供裁判姓名。' });

    const assignments = await Referee.find({ refereeName: name });
    const matchNumbers = assignments.map(a => a.assignedMatchNumber);
    const matches = await Match.find({ matchNumber: { $in: matchNumbers } });
    res.json({ refereeName: name, matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 三、组委会统计总览与明细（仅管理员）
// -------------------------------------------------------------

// 全部省联赛（供下拉选择与"参赛省联赛数"明细）
router.get('/committee/leagues', requireRole('COMMITTEE_ADMIN'), async (req, res) => {
  try {
    const leagues = await League.find().sort({ leagueId: 1 });
    const orders = await Order.find({ leagueId: { $in: leagues.map(l => l.leagueId) } });
    const orderMap = Object.fromEntries(orders.map(o => [o.leagueId, o]));
    res.json(leagues.map(l => ({
      ...l.toObject(),
      orderStatus: orderMap[l.leagueId]?.status || 'NONE',
      orderNumber: orderMap[l.leagueId]?.orderNumber || null,
      paidFee: orderMap[l.leagueId]?.paidFee ?? null
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 按状态查询报名单（生效/已取消明细）
router.get('/committee/orders', requireRole('COMMITTEE_ADMIN'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    const leagues = await League.find({ leagueId: { $in: orders.map(o => o.leagueId) } });
    const leagueMap = Object.fromEntries(leagues.map(l => [l.leagueId, l]));
    res.json(orders.map(o => ({ ...o.toObject(), league: leagueMap[o.leagueId] || null })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 全部银行资金流水（实收金额明细）
router.get('/committee/transactions', requireRole('COMMITTEE_ADMIN'), async (req, res) => {
  try {
    const txns = await BankTransaction.find().sort({ createdAt: -1 });
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 统计总览

router.get('/committee/stats', requireRole('COMMITTEE_ADMIN'), async (req, res) => {
  try {
    const [leagueCount, paidCount, cancelledCount, perMatch, perCategory, txnByType] = await Promise.all([
      League.countDocuments(),
      Order.countDocuments({ status: 'PAID' }),
      Order.countDocuments({ status: 'CANCELLED' }),
      Order.aggregate([
        { $match: { status: 'PAID' } },
        { $unwind: '$items' },
        { $group: {
            _id: '$items.matchNumber',
            category: { $first: '$items.category' },
            level: { $first: '$items.level' },
            leagueCount: { $sum: 1 },
            feeTotal: { $sum: '$items.fee' }
        } },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $match: { status: 'PAID' } },
        { $unwind: '$items' },
        { $group: {
            _id: '$items.category',
            itemCount: { $sum: 1 },
            feeTotal: { $sum: '$items.fee' }
        } }
      ]),
      BankTransaction.aggregate([
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    // 实收金额 = 全部台账代数和（扣款为正、退款为负）
    const netRevenue = txnByType.reduce((sum, t) => sum + t.total, 0);

    res.json({
      overview: { leagueCount, paidCount, cancelledCount, netRevenue },
      perMatch: perMatch.map(m => ({
        matchNumber: m._id, category: m.category, level: m.level,
        leagueCount: m.leagueCount, feeTotal: m.feeTotal
      })),
      perCategory: perCategory.map(c => ({
        category: c._id, itemCount: c.itemCount, feeTotal: c.feeTotal
      })),
      transactions: txnByType.map(t => ({ type: t._id, total: t.total, count: t.count }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
