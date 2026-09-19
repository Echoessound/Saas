const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Match = require('./models/Match');
const Referee = require('./models/Referee');
const Counter = require('./models/Counter');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/sports_competition');

async function seedData() {
  try {
    await Match.deleteMany({});
    await Referee.deleteMany({});

    const now = Date.now();
    const openDate = new Date(now + 45 * 24 * 60 * 60 * 1000); // 45天后开赛（开放报名期）
    const preMatchDate = new Date(now + 15 * 24 * 60 * 60 * 1000); // 15天后开赛（截止后至开赛前，退50%）

    const matches = [
      { matchNumber: 101, category: 'Basketball', level: 'Beginner', startTime: openDate, entryFee: 1000 },
      { matchNumber: 102, category: 'Basketball', level: 'Intermediate', startTime: openDate, entryFee: 1500 },
      { matchNumber: 103, category: 'Basketball', level: 'Advanced', startTime: openDate, entryFee: 2000 },
      { matchNumber: 201, category: 'Football', level: 'Beginner', startTime: preMatchDate, entryFee: 1200 },
      { matchNumber: 202, category: 'Football', level: 'Intermediate', startTime: openDate, entryFee: 1800 },
      { matchNumber: 301, category: 'Volleyball', level: 'Beginner', startTime: openDate, entryFee: 1000 }
    ];
    await Match.insertMany(matches);

    const referees = [
      {
        refereeName: '张建国',
        assignedMatchNumber: 101,
        refereeAddress: '北京市海淀区中关村南大街1号',
        organization: '中国篮球协会裁判委员会'
      },
      {
        refereeName: '张建国',
        assignedMatchNumber: 102,
        refereeAddress: '北京市海淀区中关村南大街1号',
        organization: '中国篮球协会裁判委员会'
      },
      {
        refereeName: '李铁柱',
        assignedMatchNumber: 201,
        refereeAddress: '上海市徐汇区漕溪北路零陵路',
        organization: '中国足球协会裁判委员会'
      },
      {
        refereeName: '王立新',
        assignedMatchNumber: 301,
        refereeAddress: '广州市天河区天河路体育中心',
        organization: '广东省排球协会'
      }
    ];
    await Referee.insertMany(referees);

    // 初始化全局 League ID 计数器（首个分配的 League ID 为 1001）
    await Counter.findByIdAndUpdate(
      { _id: 'leagueId' },
      { $setOnInsert: { seq: 1000 } },
      { upsert: true, new: true }
    );

    // 初始化默认账号（已存在则跳过）
    const defaultUsers = [
      { username: 'admin', password: 'admin123', displayName: '组委会管理员', role: 'COMMITTEE_ADMIN' },
      { username: 'rep001', password: '123456', displayName: '省联赛经办人', role: 'LEAGUE_REP' }
    ];
    for (const u of defaultUsers) {
      const exists = await User.findOne({ username: u.username });
      if (!exists) {
        await User.create({
          username: u.username,
          passwordHash: await bcrypt.hash(u.password, 10),
          displayName: u.displayName,
          role: u.role
        });
        console.log(`[Seed] 默认账号已创建: ${u.username} (${u.role})`);
      }
    }

    console.log('[Seed] 基础比赛字典与裁判执裁指派数据初始化完成！');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] 数据植入失败:', err);
    process.exit(1);
  }
}

seedData();
