# 全国体育赛事报名系统（National Sports Competition Registration System）

软件工程课程设计 —— 仅覆盖**报名及凭证打印**业务边界：省联赛填报、银行划扣、三阶段梯级退费状态机、A4 凭单打印、组委会 4 大检索职能。系统含 JWT 账号认证与双角色权限控制。

## 技术栈

- 前端：React 18 + Ant Design v5 + Vite（端口 3000）
- 后端：Node.js + Express（端口 5000），JWT（jsonwebtoken）+ bcryptjs 密码哈希
- 数据库：MongoDB（127.0.0.1:27017，库名 `sports_competition`）

## 默认账号（seed 时自动创建）

| 用户名 | 密码 | 角色 | 可用功能 |
| :---- | :---- | :---- | :---- |
| `rep001` | `123456` | 省联赛经办人 | 报名通道、我的报名/退改、凭单打印、个人中心 |
| `admin` | `admin123` | 组委会管理员 | 统计总览、4 大查询、赛事与裁判管理、报表导出、个人中心 |

也可在登录页自行注册新账号（注册时选择角色）。

## 目录结构

```
sports-registration-system/
├── client/                     # 前端 React 18 工程
│   └── src/
│       ├── App.jsx             # 路由容器（登录守卫 + 角色菜单）
│       ├── AuthContext.jsx     # 登录态上下文
│       ├── api.js              # axios 实例（自动携带 JWT，401 跳转登录）
│       ├── index.jsx           # 入口文件
│       └── pages/
│           ├── Login.jsx               # 登录 / 注册
│           ├── RegisterWizard.jsx      # 极简向导式报名界面（UC01~UC03）
│           ├── OrderManage.jsx         # 我的报名/退改（UC04/UC05）
│           ├── PrintVoucher.jsx        # A4 凭证打印单组件（UC06）
│           ├── CommitteeDashboard.jsx  # 组委会统计总览 + 4 大职能看板（UC07~UC10）
│           ├── AdminManage.jsx         # 赛事与裁判后台管理（CRUD）
│           └── Profile.jsx             # 个人中心（修改密码）
├── server/                     # 后端 Node.js + Express 服务
│   ├── server.js               # 服务启动主入口
│   ├── seed.js                 # 赛事/裁判/计数器/默认账号种子脚本
│   ├── middleware/
│   │   └── auth.js             # JWT 校验与角色鉴权中间件
│   ├── models/                 # Mongoose 数据模型
│   │   ├── User.js             # 用户账号（角色枚举）
│   │   ├── Counter.js          # 全局自增 League ID 计数器（首 ID=1001）
│   │   ├── League.js           # 省联赛档案（ownerUsername 归属账号）
│   │   ├── Match.js            # 比赛字典（类别×级别枚举）
│   │   ├── Referee.js          # 裁判指派
│   │   └── Order.js            # 报名单 + 银行交易台账
│   ├── services/
│   │   ├── feeEngine.js        # 梯级退费状态机（A:100% / B:50% / C:0%）
│   │   └── bankAdapter.js      # 跨行清算模拟适配器（唯一流水号幂等）
│   └── routes/
│       ├── auth.js             # 注册 / 登录 / 修改密码（公开）
│       ├── api.js              # 核心业务 REST API（需登录，按角色鉴权）
│       └── admin.js            # 赛事与裁判 CRUD（仅管理员）
└── README.md
```

## 快速启动（Windows）

前置条件：Node.js ≥ 18、MongoDB 服务已启动（默认 127.0.0.1:27017）。

```bash
# 1. 启动后端
cd server
npm install
npm run seed     # 导入比赛字典、裁判指派、League ID 计数器
npm start        # Express 运行于 :5000

# 2. 启动前端（另开终端）
cd client
npm install
npm run dev      # Vite 运行于 :3000，/api 已代理至 :5000
```

浏览器访问 http://localhost:3000

## 业务时态状态机（以报名单最早开赛时间 T_earliest 为基准）

| 阶段 | 判定条件 | 允许操作 | 资金规则 |
| :---- | :---- | :---- | :---- |
| A 开放报名期 | now ≤ T_earliest − 30天 | 增删单项、取消报名 | 差额 100% 退补，免罚金 |
| B 截止后至开赛前 | T_earliest − 30天 < now < T_earliest | 仅整单取消 | 原路退还 50%，收取 50% 违约金 |
| C 比赛开始后 | now ≥ T_earliest | 完全锁定 | 0% 退款，概不退费 |

种子数据中：#101/#102/#103/#202/#301 为 45 天后开赛（阶段 A），#201 为 15 天后开赛（阶段 B，用于 50% 退费验证）。

## 核心 API

### 认证（公开）
| 方法 | 路径 | 说明 |
| :---- | :---- | :---- |
| POST | /api/auth/register | 注册（用户名/密码/姓名/角色） |
| POST | /api/auth/login | 登录，返回 JWT（24h 有效） |
| GET | /api/auth/me | 当前登录用户 |
| POST | /api/auth/change-password | 修改密码 |

### 省联赛端（需登录；标注 ★ 的仅经办人且仅限本人名下订单）
| 方法 | 路径 | 说明 |
| :---- | :---- | :---- |
| GET | /api/matches | 比赛字典 |
| POST | /api/register ★ | 初次填报 + 银行划扣 + 分配 League ID（归属当前账号） |
| GET | /api/my/orders ★ | 我的全部报名单（含阶段判定） |
| GET | /api/order/:orderNumber | 报名单详情（含资金流水） |
| POST | /api/order/modify-items ★ | 开放期增删单项与差额结算 |
| POST | /api/order/cancel ★ | 整单取消（梯级退费） |
| GET | /api/voucher/:leagueId | 打印凭单数据 |

### 组委会管理端（仅管理员）
| 方法 | 路径 | 说明 |
| :---- | :---- | :---- |
| GET | /api/committee/stats | 统计总览（实收/订单数/每场与类别分布/台账汇总） |
| GET | /api/committee/league-matches/:leagueId | 职能1：查省联赛已报项目 |
| GET | /api/committee/match-leagues/:matchNumber | 职能2：查比赛参赛省联赛 |
| GET | /api/committee/match-referee/:matchNumber | 职能3：查比赛执裁裁判 |
| GET | /api/committee/referee-matches?name= | 职能4：查裁判执裁清单 |
| GET/POST/PUT/DELETE | /api/admin/matches | 比赛管理（有生效报名的比赛禁删、禁改类别级别） |
| GET/POST/PUT/DELETE | /api/admin/referees | 裁判指派管理 |

> JWT 密钥通过环境变量 `JWT_SECRET` 配置；未配置时使用开发默认值，请勿用于生产环境。
