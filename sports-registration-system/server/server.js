const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/sports_competition')
  .then(() => console.log('[MongoDB] 服务连接成功: 127.0.0.1:27017/sports_competition'))
  .catch(err => console.error('[MongoDB] 连接失败:', err));

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`[Express] 体育赛事报名服务运行在 Windows 宿主端口: ${PORT}`);
});
