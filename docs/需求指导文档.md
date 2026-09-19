
# **全国体育赛事报名系统 —— 软件工程课程设计报告与研发方案**

**项目名称**：全国体育赛事报名系统（National Sports Competition Registration System）

**运行**：Windows 操作系统 Web 运行环境

**设计边界**：**仅用于报名及凭证打印功能**，赛事编排、竞赛打分等其他管理职能均划出系统边界

**交付截止**：9 月 22 日 08:00 前（迟交规则：每迟交 1 小时扣 5 分）

**全栈技术栈**：React v18 \+ Ant Design v5 \+ Node.js (Express) \+ MongoDB (Mongoose)

## **一、 团队设计方法与成员分工**

### **1.1 研发设计方法论**

本项目采用**轻量级敏捷开发（Agile Scrum）与面向对象分析设计（OOAD）**：

* **业务内聚与边界隔离**：核心域限定为省联赛填报、审核状态机与凭据生成；外部银行网络通过适配层解耦。  
* **分层解耦架构**：表现层（React 18 SPA \+ AntD）、业务服务层（Express Router \+ Fee Engine \+ Bank Adapter）、持久化层（MongoDB via Mongoose）。  
* **进度与质量保障**：严格按照 9 月 22 日 08:00 交付红线倒排工期，预留 24 小时进行回归测试与部署演练，杜绝超时扣分风险。

### **1.2 团队分工与贡献度矩阵**

| 团队角色 | 责任人 | 核心职责与任务分工 | 主要交付成果 |
| :---- | :---- | :---- | :---- |
| **组长 / 系统架构师** | 学生 A | 架构设计、技术选型、部署拓扑、UML 类图/时序图/部署图绘制 | 系统设计规格书、UML 模型全套 |
| **后端开发工程师** | 学生 B | Node.js \+ Express 业务 API 研发、梯级退费规则引擎、银行跨行划款适配器 | /server/services/feeEngine.js、API 路由 |
| **数据工程师** | 学生 C | MongoDB 数据建模、Mongoose Schema 约束、自增 League ID 机制、初始化种子数据 | /server/models/ 模型集合、seed.js 脚本 |
| **前端开发工程师** | 学生 D | React 18 \+ Ant Design v5 向导式交互表单、响应式状态管理、A4 凭单原生打印样式 | /client/src/pages/（向导页、看板页、打印单） |
| **测试与文档工程师** | 学生 E | 3 阶段退费时间边界测试、组委会 4 大查询接口联调、技术报告整合与答辩 PPT | 测试报告、答辩 PPT、课程设计最终文档 |

### **1.3 里程碑时间节点表**

| 阶段划分 | 起止时间 | 关键交付目标 | 验收标准 |
| :---- | :---- | :---- | :---- |
| **Sprint 1: 需求与领域建模** | 9月15日 \- 9月16日 | 完成用例模型、概念模型、MongoDB Schema 设计 | 通过评审，完成架构与数据模型锁定 |
| **Sprint 2: 核心功能与状态机** | 9月17日 \- 9月18日 | 完成前后端主链路（填报、银行扣款、梯级退费算法） | 前后端打通，实现报名与自动扣退款 |
| **Sprint 3: 凭据打印与多维查询** | 9月19日 \- 9月20日 | 凭单 Print CSS 适配、组委会 4 项管理端查询看板 | 打印排版符合 A4，查询结果完全一致 |
| **Sprint 4: 部署测试与归档** | 9月21日 | Windows 生产环境部署演练、回归测试、文档封版 | **9月22日 08:00 前完成最终提交** |

## **二、 设计目标与设计原则**

### **2.1 设计目标**

> 1. **单一报名业务边界**：排除赛事日常管理、裁判打分、排班调度等冗余干扰，系统全生命周期只服务于“填报、审核、结算、退改、打印与查询”。  
> 2. **零培训极简交互（Zero-Training UX）**：针对各省联赛工作人员的计算机操作差异，利用 Ant Design 的步骤向导（Steps）和卡片选择器，提供 3 步内完成报名的直觉式操作。  
> 3. **基于时间窗的高鲁棒状态机**：以“比赛开始前 30 天”与“比赛正式开始”为关键时间锚点，后端严格执行无罚金退补、50% 违约退款、0% 开赛不退的梯级控制。  
> 4. **纸质凭证法律效力支持**：基于浏览器原生打印管道，一键生成符合 A4 规格、包含完整防伪序列、单位信息和核验印鉴的报名凭单。

### **2.2 设计原则**

* **单一职责原则（Single Responsibility Principle）**：省联赛档案、赛事字典、裁判指派、报名单与资金流水物理分表与独立领域建模。  
* **开闭原则（Open-Closed Principle）**：赛事类别与级别基于枚举和字典表驱动，后续平滑增加羽毛球、乒乓球或青年组、老年组时无需改动核心报名代码。  
* **金融幂等性与资金安全原则**：银行支付与退款接口封装独立流水追踪，多次重试不会导致二次划转或重复扣退费。

## **三、 需求捕获与分析（用例模型）**

### **3.1 角色定义（Actors）**

> 1. **省联赛经办人（Province League Representative）**：录入省联赛基本档案；选报比赛项目；调用银行系统扣款；开放期调整比赛条目；申请取消报名；随时打印报名记录存根。  
> 2. **赛事组委会管理员（Committee Administrator）**：执行管理端 4 大检索职能（查省联赛项目、查比赛参赛省、查比赛裁判、查裁判任务）；导出与打印统计报表。  
> 3. **互联银行清算系统（Interbank Settlement System）**：系统外部依赖，假设各省银行与组委会银行互联互通，负责资金在账户间的划转与原路退回。

### **3.2 业务时态状态机与退款判定矩阵**

系统以参赛报名单中所包含比赛的最早开赛时间（$T\_{\\text{earliest}}$）为基准点，将业务划分为三个时间窗口：

&nbsp;

&nbsp;

&nbsp;

Plaintext

时间轴: \--------\[ 阶段 A: 开放报名期 \]--------|--------\[ 阶段 B: 截止后至开赛前 \]--------|--------\[ 阶段 C: 比赛开始后 \]--------\>  
节点:                                     T\_close (T\_earliest \- 30天)              T\_earliest (比赛开始)  
规则:    自由增删单项，差额 100% 退补，免罚金            禁止增删单项；仅可整单取消并退还 50%           系统锁定；概不退费

| 业务阶段 | 判定条件（对比系统时间 Tnow​） | 允许的变更操作 | 银行资金收退规则 |
| :---- | :---- | :---- | :---- |
| **阶段 A：开放报名期** | $T\_{\\text{now}} \\le T\_{\\text{earliest}} \- 30\\text{天}$ | 增加比赛、删除单项比赛、取消报名 | **100% 差额退补，免收罚金**。少交补缴，多减原路退回。 |
| **阶段 B：截止后至开赛前** | $T\_{\\text{earliest}} \- 30\\text{天} \< T\_{\\text{now}} \< T\_{\\text{earliest}}$ | **禁止增删单项**；仅允许**取消全部报名** | **原路退还 50% 原始报名费**；系统收取 50% 违约金。 |
| **阶段 C：比赛开赛后** | $T\_{\\text{now}} \\ge T\_{\\text{earliest}}$ | **完全锁定**；禁止任何变更与取消 | **0% 退款**；概不退费。 |

### **3.3 系统用例图（Use Case Diagram）**

&nbsp;

&nbsp;

&nbsp;

代码段

graph LR  
&nbsp;&nbsp;&nbsp;&nbsp;subgraph 角色  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PL\[省联赛经办人\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CA\[赛事组委会管理员\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BK\[互联银行结算系统\]  
&nbsp;&nbsp;&nbsp;&nbsp;end

&nbsp;&nbsp;&nbsp;&nbsp;subgraph 全国体育赛事报名系统核心用例  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UC1\[UC01: 录入省联赛基本信息\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UC2\[UC02: 勾选参赛类别与级别\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UC3\[UC03: 银行扣款并获取 League ID\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UC4\[UC04: 开放期增删项目与差额结算\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UC5\[UC05: 截止后全额退赛与50%退款\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UC6\[UC06: 随时打印参赛报名记录凭证\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UC7\[UC07: 查询某省联赛已报名的比赛项目\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UC8\[UC08: 查询参加某场比赛的具体省联赛\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UC9\[UC09: 查询某场比赛的指派执裁裁判\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UC10\[UC10: 查询某位裁判执裁的所有比赛\]  
&nbsp;&nbsp;&nbsp;&nbsp;end

&nbsp;&nbsp;&nbsp;&nbsp;PL \--\> UC1  
&nbsp;&nbsp;&nbsp;&nbsp;PL \--\> UC2  
&nbsp;&nbsp;&nbsp;&nbsp;PL \--\> UC3  
&nbsp;&nbsp;&nbsp;&nbsp;PL \--\> UC4  
&nbsp;&nbsp;&nbsp;&nbsp;PL \--\> UC5  
&nbsp;&nbsp;&nbsp;&nbsp;PL \--\> UC6

&nbsp;&nbsp;&nbsp;&nbsp;CA \--\> UC7  
&nbsp;&nbsp;&nbsp;&nbsp;CA \--\> UC8  
&nbsp;&nbsp;&nbsp;&nbsp;CA \--\> UC9  
&nbsp;&nbsp;&nbsp;&nbsp;CA \--\> UC10

&nbsp;&nbsp;&nbsp;&nbsp;UC3 \-.-\>|转账扣款| BK  
&nbsp;&nbsp;&nbsp;&nbsp;UC4 \-.-\>|多退少补| BK  
&nbsp;&nbsp;&nbsp;&nbsp;UC5 \-.-\>|原路退还50%| BK

### **3.4 核心用例规约说明**

#### **用例 UC03：银行扣款并获取 League ID**

* **主执行者**：省联赛经办人  
* **前置条件**：已填写联赛名称、地址、人员名单，并已选择至少 1 场比赛。  
* **业务规则**：  
  1. 系统自动汇总应付报名费用。  
  2. 系统向全局计数器申请生成唯一递增的数字型 League ID。  
  3. 系统调用银行接口适配器（BankAdapter），将款项从省联赛所属银行划转至赛事组委会账户。  
  4. 银行划拨成功后，系统生成状态为 PAID 的报名单，记录交易流水，并向经办人返回 League ID 与打印凭证入口。

#### **用例 UC07\~UC10：组委会管理端 4 大检索职能**

* **职能 1（查省联赛项目）**：输入 League ID $\\rightarrow$ 输出包含比赛编号、类别（篮球/足球/排球）、级别（初级/中级/高级）的报名单。  
* **职能 2（查比赛参赛省）**：输入 Match Number $\\rightarrow$ 输出报名参加该比赛的所有省联赛全称、地址及成员名单。  
* **职能 3（查特定比赛裁判）**：输入 Match Number $\\rightarrow$ 输出负责执裁该场比赛的主裁判姓名、通信地址与所属单位。  
* **职能 4（查裁判执裁清单）**：输入 Referee Name $\\rightarrow$ 输出该裁判名下执裁的所有比赛编号、类别、级别及开赛时间。

## **四、 系统设计（System Designs）**

### **4.1 用户界面设计（UI 原型与打印版式）**

#### **1\. 省联赛报名与结算向导界面原型**

&nbsp;

&nbsp;

&nbsp;

Plaintext

\+-----------------------------------------------------------------------------------------+  
| 全国体育赛事在线报名平台 (省联赛端)                               \[当前阶段: 开放报名期\] |  
\+-----------------------------------------------------------------------------------------+  
|  \[ 步骤 1: 录入联赛档案 \]  \======\>\>  \[ 步骤 2: 勾选参赛项目 \]  \======\>\>  \[ 步骤 3: 缴费与存根 \] |  
\+-----------------------------------------------------------------------------------------+  
| 联赛全称: \[ 湖北省男子篮球联赛协会                           \]                          |  
| 联络地址: \[ 武汉市武昌区体育馆路特1号                         \]                          |  
| 参赛成员名单 (领队/教练/运动员):                                                         |  
| \+-------------------------------------------------------------------------------------+ |  
| | 领队: 李建军; 主教练: 王立刚; 队员: 张强, 杜威, 孙海, 刘鹏, 赵云... (纯文本录入)      | |  
| \+-------------------------------------------------------------------------------------+ |  
|                                                                                         |  
| 参赛比赛选报 (按类别与级别):                                                            |  
| \--------------------------------------------------------------------------------------- |  
| \[x\] 篮球 (Basketball)  \- \#101 初级 (Beginner)     费用: ¥1000   开赛: 2026-10-20       |  
| \[ \] 篮球 (Basketball)  \- \#103 高级 (Advanced)     费用: ¥2000   开赛: 2026-10-20       |  
| \[x\] 足球 (Football)    \- \#201 初级 (Beginner)     费用: ¥1200   开赛: 2026-10-25       |  
| \[x\] 排球 (Volleyball)  \- \#301 初级 (Beginner)     费用: ¥1000   开赛: 2026-10-30       |  
| \--------------------------------------------------------------------------------------- |  
| 已选比赛: 3 场                                              结算总额: ¥3,200.00 元      |  
|                                                                                         |  
|         \[ 放弃修改 \]                                  \[ 确认并调用银行系统在线支付 \]    |  
\+-----------------------------------------------------------------------------------------+

#### **2\. 报名记录确认凭据打印单（Print-Ready Voucher 原型）**

&nbsp;

&nbsp;

&nbsp;

Plaintext

\===========================================================================================  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;全国体育赛事参赛报名确认凭单  
\-------------------------------------------------------------------------------------------  
&nbsp;参赛省联赛: 湖北省男子篮球联赛协会             系统分配联赛 ID (League ID): 1001  
&nbsp;办事通信地址: 武汉市武昌区体育馆路特1号       报名单流水号: ORD-1726708800-1001  
\-------------------------------------------------------------------------------------------  
&nbsp;参赛成员总览:  
&nbsp;领队: 李建军; 主教练: 王立刚; 队员: 张强, 杜威, 孙海, 刘鹏, 赵云, 钱进。  
\-------------------------------------------------------------------------------------------  
&nbsp;已核准报名的比赛项目清单:  
&nbsp;序号       比赛编号       赛事类别(Category)      赛事级别(Level)       费用状态  
&nbsp;1          \#101           篮球 (Basketball)       初级 (Beginner)       已结算  
&nbsp;2          \#201           足球 (Football)         初级 (Beginner)       已结算  
&nbsp;3          \#301           排球 (Volleyball)       初级 (Beginner)       已结算  
\-------------------------------------------------------------------------------------------  
&nbsp;实收报名费总计: RMB ¥3,200.00 元             资金清算状态: 银行转账划拨核验通过  
&nbsp;安全核验防伪码: AUTH-98A7-B1C2-8800          赛事组委会确认签章: \[ \_\_\_\_\_\_\_\_\_\_\_\_ \]  
\===========================================================================================

### **4.2 结构模型：类图（Class Diagram）**

&nbsp;

&nbsp;

&nbsp;

代码段

classDiagram  
&nbsp;&nbsp;&nbsp;&nbsp;class Counter {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String \_id  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Number seq  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;class ProvinceLeague {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Number leagueId  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String leagueName  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String leagueAddress  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String leagueMemberNames  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Date createdAt  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;class Match {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Number matchNumber  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String category  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String level  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Date startTime  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Number entryFee  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;class Referee {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String refereeName  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Number assignedMatchNumber  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String refereeAddress  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String organization  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;class OrderItem {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Number matchNumber  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String category  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String level  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Number fee  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;class RegistrationOrder {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String orderNumber  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Number leagueId  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+OrderItem\[\] items  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Number totalFee  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Number paidFee  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String status  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Date createdAt  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Date updatedAt  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;class BankTransaction {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String txnId  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String orderNumber  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Number leagueId  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Number amount  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String type  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+String status  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+Date createdAt  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;ProvinceLeague "1" \-- "0..\*" RegistrationOrder : 提交  
&nbsp;&nbsp;&nbsp;&nbsp;RegistrationOrder "1" \*-- "1..\*" OrderItem : 包含  
&nbsp;&nbsp;&nbsp;&nbsp;OrderItem "1" ..\> "1" Match : 关联比赛  
&nbsp;&nbsp;&nbsp;&nbsp;Match "0..\*" \-- "1" Referee : 由裁判执裁  
&nbsp;&nbsp;&nbsp;&nbsp;RegistrationOrder "1" \-- "0..\*" BankTransaction : 关联账务流水

### **4.3 动态模型：顺序图（Sequence Diagrams）**

#### **1\. 初次填报与跨行资金划拨时序图**

&nbsp;

&nbsp;

&nbsp;

代码段

sequenceDiagram  
&nbsp;&nbsp;&nbsp;&nbsp;autonumber  
&nbsp;&nbsp;&nbsp;&nbsp;actor User as 省联赛经办人  
&nbsp;&nbsp;&nbsp;&nbsp;participant UI as React 前端应用  
&nbsp;&nbsp;&nbsp;&nbsp;participant Server as Express 业务服务  
&nbsp;&nbsp;&nbsp;&nbsp;participant DB as MongoDB  
&nbsp;&nbsp;&nbsp;&nbsp;participant Bank as 互联银行系统

&nbsp;&nbsp;&nbsp;&nbsp;User-\>\>UI: 录入联赛信息并勾选比赛条目  
&nbsp;&nbsp;&nbsp;&nbsp;UI-\>\>Server: POST /api/register (档案数据与比赛编号数组)  
&nbsp;&nbsp;&nbsp;&nbsp;activate Server  
&nbsp;&nbsp;&nbsp;&nbsp;Server-\>\>DB: 查询 Counter 生成唯一的数字型 leagueId  
&nbsp;&nbsp;&nbsp;&nbsp;Server-\>\>DB: 写入 ProvinceLeague 档案  
&nbsp;&nbsp;&nbsp;&nbsp;Server-\>\>Server: 汇总计算比赛总额 totalFee  
&nbsp;&nbsp;&nbsp;&nbsp;Server-\>\>Bank: transferPayment(leagueId, totalFee)  
&nbsp;&nbsp;&nbsp;&nbsp;activate Bank  
&nbsp;&nbsp;&nbsp;&nbsp;Bank--\>\>Server: 跨行划拨成功返回 { success: true, txnId }  
&nbsp;&nbsp;&nbsp;&nbsp;deactivate Bank  
&nbsp;&nbsp;&nbsp;&nbsp;Server-\>\>DB: 创建 RegistrationOrder (status='PAID')  
&nbsp;&nbsp;&nbsp;&nbsp;Server-\>\>DB: 记录银行扣款交易流水 BankTransaction  
&nbsp;&nbsp;&nbsp;&nbsp;Server--\>\>UI: 返回 { leagueId, orderNumber, totalFee, items }  
&nbsp;&nbsp;&nbsp;&nbsp;deactivate Server  
&nbsp;&nbsp;&nbsp;&nbsp;UI--\>\>User: 界面提示报名成功，展示分配的 League ID 与打印按钮

#### **2\. 梯级退费算法与取消报名单时序图**

&nbsp;

&nbsp;

&nbsp;

代码段

sequenceDiagram  
&nbsp;&nbsp;&nbsp;&nbsp;autonumber  
&nbsp;&nbsp;&nbsp;&nbsp;actor User as 省联赛经办人  
&nbsp;&nbsp;&nbsp;&nbsp;participant Server as Express 业务服务  
&nbsp;&nbsp;&nbsp;&nbsp;participant Engine as 退费状态机 (FeeEngine)  
&nbsp;&nbsp;&nbsp;&nbsp;participant Bank as 互联银行系统  
&nbsp;&nbsp;&nbsp;&nbsp;participant DB as MongoDB

&nbsp;&nbsp;&nbsp;&nbsp;User-\>\>Server: POST /api/order/cancel (提交 orderNumber)  
&nbsp;&nbsp;&nbsp;&nbsp;activate Server  
&nbsp;&nbsp;&nbsp;&nbsp;Server-\>\>DB: 查询报名单与报名比赛的最早开赛时间  
&nbsp;&nbsp;&nbsp;&nbsp;Server-\>\>Engine: calculateCancellation(paidFee, earliestStartTime, now)  
&nbsp;&nbsp;&nbsp;&nbsp;activate Engine  
&nbsp;&nbsp;&nbsp;&nbsp;alt 当前时间 \<= 开赛前30天 (开放期)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Engine--\>\>Server: 允许全额退费 (100% 原路退还，免违约金)  
&nbsp;&nbsp;&nbsp;&nbsp;else 开赛前30天 \< 当前时间 \< 开赛时间  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Engine--\>\>Server: 扣除 50% 违约金，退还 50% 原始报名费  
&nbsp;&nbsp;&nbsp;&nbsp;else 当前时间 \>= 最早比赛开始时间  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Engine--\>\>Server: 拒绝退款申请 (0% 退款，概不退费)  
&nbsp;&nbsp;&nbsp;&nbsp;end  
&nbsp;&nbsp;&nbsp;&nbsp;deactivate Engine

&nbsp;&nbsp;&nbsp;&nbsp;opt 退款金额 \> 0  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Server-\>\>Bank: transferRefund(leagueId, refundAmount, reason)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;activate Bank  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Bank--\>\>Server: 原路资金退还成功确认 (返回 txnId)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;deactivate Bank  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Server-\>\>DB: 更新报名单状态 status \= 'CANCELLED'  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Server-\>\>DB: 写入负向退费流水记录 BankTransaction  
&nbsp;&nbsp;&nbsp;&nbsp;end

&nbsp;&nbsp;&nbsp;&nbsp;Server--\>\>User: 返回退款明细状态、退款比率与实际到账金额  
&nbsp;&nbsp;&nbsp;&nbsp;deactivate Server

### **4.4 持久化数据设计（MongoDB 架构设计）**

| 集合名 (Collection) | 业务模型映射 | 字段类型与设计规格 | 索引定义 |
| :---- | :---- | :---- | :---- |
| counters | 全局计数器 | \_id: String, seq: Number | \_id (主键) |
| provinceleagues | 省联赛基本档案 | leagueId: Number, leagueName: String, leagueAddress: String, leagueMemberNames: String, createdAt: Date | leagueId (唯一索引) |
| matches | 比赛字典表 | matchNumber: Number, category: String (枚举), level: String (枚举), startTime: Date, entryFee: Number | matchNumber (唯一索引) |
| referees | 裁判字典与指派 | refereeName: String, assignedMatchNumber: Number, refereeAddress: String, organization: String | refereeName, assignedMatchNumber |
| orders | 报名总订单 | orderNumber: String, leagueId: Number, items: Array\<OrderItem\>, totalFee: Number, paidFee: Number, status: String, createdAt: Date, updatedAt: Date | orderNumber (唯一索引), leagueId, items.matchNumber |
| banktransactions | 银行交易台账 | txnId: String, orderNumber: String, leagueId: Number, amount: Number, type: String (枚举), status: String, createdAt: Date | txnId (唯一索引), orderNumber |

### **4.5 应用程序部署图（Deployment Diagram）**

&nbsp;

&nbsp;

&nbsp;

代码段

graph TB  
&nbsp;&nbsp;&nbsp;&nbsp;subgraph 客户端环境 \[Windows 客户端终端\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Browser\[Web 浏览器 (Chrome / Edge)\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Printer\[本地物理打印机 / PDF 虚拟打印机\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Browser \-.-\>|原生打印管道 window.print| Printer  
&nbsp;&nbsp;&nbsp;&nbsp;end

&nbsp;&nbsp;&nbsp;&nbsp;subgraph 服务器运行环境 \[Windows Server 宿主机\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;subgraph Web 反向代理层  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IIS\[IIS 10.0 / Nginx for Windows\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;end

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;subgraph Node.js 应用程序实例  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ExpressApp\[Express API 服务引擎 (:5000)\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FeeEngine\[梯级退费规则计算引擎\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BankAdapter\[跨行清算互联模拟适配器\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ExpressApp \--- FeeEngine  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ExpressApp \--- BankAdapter  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;end

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;subgraph 数据持久化服务  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;MongoService\[(MongoDB 6.0 数据库服务 :27017)\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;end  
&nbsp;&nbsp;&nbsp;&nbsp;end

&nbsp;&nbsp;&nbsp;&nbsp;subgraph 金融外部网络 \[模拟专网环境\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BankGateway\[各省及组委会互联银行系统 (Mock 资金清算中心)\]  
&nbsp;&nbsp;&nbsp;&nbsp;end

&nbsp;&nbsp;&nbsp;&nbsp;Browser \--\>|HTTP/HTTPS 请求| IIS  
&nbsp;&nbsp;&nbsp;&nbsp;IIS \--\>|本地端口反向代理| ExpressApp  
&nbsp;&nbsp;&nbsp;&nbsp;ExpressApp \--\>|Mongoose 驱动连接| MongoService  
&nbsp;&nbsp;&nbsp;&nbsp;BankAdapter \<---\>|专线网络调用| BankGateway

## **五、 全栈代码研发落地实现**

### **5.1 工程目录结构规范**

&nbsp;

&nbsp;

&nbsp;

Plaintext

sports-registration-system/  
├── client/                     \# 前端 React 18 工程  
│   ├── package.json  
│   ├── public/  
│   │   └── index.html  
│   └── src/  
│       ├── App.jsx             \# 路由容器  
│       ├── index.js            \# 入口文件  
│       └── pages/  
│           ├── RegisterWizard.jsx     \# 极简向导式报名界面  
│           ├── PrintVoucher.jsx       \# 标准凭证打印单组件  
│           └── CommitteeDashboard.jsx  \# 组委会 4 大职能多维看板  
├── server/                     \# 后端 Node.js \+ Express 服务  
│   ├── package.json  
│   ├── server.js               \# 服务启动主入口  
│   ├── seed.js                 \# 赛事与裁判初始种子数据脚本  
│   ├── models/                 \# Mongoose 数据模型  
│   │   ├── Counter.js  
│   │   ├── League.js  
│   │   ├── Match.js  
│   │   ├── Referee.js  
│   │   └── Order.js  
│   ├── services/  
│   │   ├── feeEngine.js        \# 梯级退费状态机服务  
│   │   └── bankAdapter.js      \# 银行跨行清算适配器  
│   └── routes/  
│       └── api.js              \# 核心业务 REST API 路由  
└── README.md

### **5.2 后端数据模型（Mongoose Schemas）**

#### **1\. /server/models/Counter.js**

&nbsp;

&nbsp;

&nbsp;

JavaScript

const mongoose \= require('mongoose');

const counterSchema \= new mongoose.Schema({  
&nbsp;&nbsp;\_id: { type: String, required: true },  
&nbsp;&nbsp;seq: { type: Number, default: 1000 }  
});

module.exports \= mongoose.model('Counter', counterSchema);

#### **2\. /server/models/League.js**

&nbsp;

&nbsp;

&nbsp;

JavaScript

const mongoose \= require('mongoose');

const leagueSchema \= new mongoose.Schema({  
&nbsp;&nbsp;leagueId: { type: Number, unique: true, required: true, index: true },  
&nbsp;&nbsp;leagueName: { type: String, required: true, trim: true },  
&nbsp;&nbsp;leagueAddress: { type: String, required: true },  
&nbsp;&nbsp;leagueMemberNames: { type: String, required: true },  
&nbsp;&nbsp;createdAt: { type: Date, default: Date.now }  
});

module.exports \= mongoose.model('League', leagueSchema);

#### **3\. /server/models/Match.js**

&nbsp;

&nbsp;

&nbsp;

JavaScript

const mongoose \= require('mongoose');

const matchSchema \= new mongoose.Schema({  
&nbsp;&nbsp;matchNumber: { type: Number, required: true, unique: true, index: true },  
&nbsp;&nbsp;category: {&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;type: String,&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;enum: \['Basketball', 'Football', 'Volleyball'\],&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;required: true&nbsp;  
&nbsp;&nbsp;},  
&nbsp;&nbsp;level: {&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;type: String,&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;enum: \['Beginner', 'Intermediate', 'Advanced'\],&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;required: true&nbsp;  
&nbsp;&nbsp;},  
&nbsp;&nbsp;startTime: { type: Date, required: true },  
&nbsp;&nbsp;entryFee: { type: Number, required: true, default: 1000 }  
});

module.exports \= mongoose.model('Match', matchSchema);

#### **4\. /server/models/Referee.js**

&nbsp;

&nbsp;

&nbsp;

JavaScript

const mongoose \= require('mongoose');

const refereeSchema \= new mongoose.Schema({  
&nbsp;&nbsp;refereeName: { type: String, required: true, index: true },  
&nbsp;&nbsp;assignedMatchNumber: { type: Number, required: true, index: true },  
&nbsp;&nbsp;refereeAddress: { type: String, required: true },  
&nbsp;&nbsp;organization: { type: String, required: true }  
});

module.exports \= mongoose.model('Referee', refereeSchema);

#### **5\. /server/models/Order.js**

&nbsp;

&nbsp;

&nbsp;

JavaScript

const mongoose \= require('mongoose');

const orderItemSchema \= new mongoose.Schema({  
&nbsp;&nbsp;matchNumber: { type: Number, required: true },  
&nbsp;&nbsp;category: { type: String, required: true },  
&nbsp;&nbsp;level: { type: String, required: true },  
&nbsp;&nbsp;fee: { type: Number, required: true }  
}, { \_id: false });

const orderSchema \= new mongoose.Schema({  
&nbsp;&nbsp;orderNumber: { type: String, required: true, unique: true, index: true },  
&nbsp;&nbsp;leagueId: { type: Number, required: true, index: true },  
&nbsp;&nbsp;items: \[orderItemSchema\],  
&nbsp;&nbsp;totalFee: { type: Number, required: true },  
&nbsp;&nbsp;paidFee: { type: Number, default: 0 },  
&nbsp;&nbsp;status: {&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;type: String,&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;enum: \['PENDING\_PAY', 'PAID', 'CANCELLED'\],&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;default: 'PENDING\_PAY'&nbsp;  
&nbsp;&nbsp;},  
&nbsp;&nbsp;createdAt: { type: Date, default: Date.now },  
&nbsp;&nbsp;updatedAt: { type: Date, default: Date.now }  
});

const bankTransactionSchema \= new mongoose.Schema({  
&nbsp;&nbsp;txnId: { type: String, required: true, unique: true },  
&nbsp;&nbsp;orderNumber: { type: String, required: true, index: true },  
&nbsp;&nbsp;leagueId: { type: Number, required: true },  
&nbsp;&nbsp;amount: { type: Number, required: true },  
&nbsp;&nbsp;type: {&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;type: String,&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;enum: \['PAYMENT', 'ADDITIONAL\_PAY', 'OPEN\_REFUND', 'CANCEL\_50\_REFUND'\],&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;required: true&nbsp;  
&nbsp;&nbsp;},  
&nbsp;&nbsp;status: { type: String, default: 'SUCCESS' },  
&nbsp;&nbsp;createdAt: { type: Date, default: Date.now }  
});

module.exports \= {  
&nbsp;&nbsp;Order: mongoose.model('Order', orderSchema),  
&nbsp;&nbsp;BankTransaction: mongoose.model('BankTransaction', bankTransactionSchema)  
};

### **5.3 核心业务引擎（状态机与银行适配器）**

#### **1\. /server/services/feeEngine.js**

&nbsp;

&nbsp;

&nbsp;

JavaScript

/\*\*  
&nbsp;\* 梯级退费规则计算引擎  
&nbsp;\*/  
class FeeEngine {  
&nbsp;&nbsp;/\*\*  
&nbsp;&nbsp;&nbsp;\* 判定并计算取消全部报名的退费金额与比例  
&nbsp;&nbsp;&nbsp;\* @param {number} originalPaidFee 原始支付总额  
&nbsp;&nbsp;&nbsp;\* @param {Date} earliestStartTime 报名的所有比赛中最早开赛时间  
&nbsp;&nbsp;&nbsp;\* @param {Date} now 当前系统判定时间  
&nbsp;&nbsp;&nbsp;\*/  
&nbsp;&nbsp;static calculateCancellation(originalPaidFee, earliestStartTime, now \= new Date()) {  
&nbsp;&nbsp;&nbsp;&nbsp;const deadline \= new Date(earliestStartTime.getTime() \- 30 \* 24 \* 60 \* 60 \* 1000);

&nbsp;&nbsp;&nbsp;&nbsp;if (now \<= deadline) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allowed: true,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refundRate: 1.0,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refundAmount: originalPaidFee,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;stage: 'OPEN\_STAGE',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message: '当前处于开放报名期，允许取消报名，按原路全额退还，无罚金。'  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;};  
&nbsp;&nbsp;&nbsp;&nbsp;} else if (now \> deadline && now \< earliestStartTime) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allowed: true,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refundRate: 0.5,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refundAmount: Number((originalPaidFee \* 0.5).toFixed(2)),  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;stage: 'PRE\_MATCH\_STAGE',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message: '报名通道已关闭，按赛事规则扣除 50% 违约金，退还 50% 原始报名费。'  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;};  
&nbsp;&nbsp;&nbsp;&nbsp;} else {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allowed: false,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refundRate: 0.0,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refundAmount: 0,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;stage: 'STARTED\_STAGE',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message: '比赛已正式开始，根据章程概不办理退费。'  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;};  
&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;}

&nbsp;&nbsp;/\*\*  
&nbsp;&nbsp;&nbsp;\* 判定当前时间是否允许单项微调（增减比赛）  
&nbsp;&nbsp;&nbsp;\*/  
&nbsp;&nbsp;static canModifyItems(earliestStartTime, now \= new Date()) {  
&nbsp;&nbsp;&nbsp;&nbsp;const deadline \= new Date(earliestStartTime.getTime() \- 30 \* 24 \* 60 \* 60 \* 1000);  
&nbsp;&nbsp;&nbsp;&nbsp;return now \<= deadline;  
&nbsp;&nbsp;}  
}

module.exports \= FeeEngine;

#### **2\. /server/services/bankAdapter.js**

&nbsp;

&nbsp;

&nbsp;

JavaScript

const crypto \= require('crypto');

/\*\*  
&nbsp;\* 模拟各省银行系统与组委会银行系统的跨行划转与原路退回  
&nbsp;\*/  
class BankAdapter {  
&nbsp;&nbsp;static async transferPayment(leagueId, amount) {  
&nbsp;&nbsp;&nbsp;&nbsp;const randomHex \= crypto.randomBytes(4).toString('hex').toUpperCase();  
&nbsp;&nbsp;&nbsp;&nbsp;const txnId \= \`BANK-PAY-${Date.now()}-${randomHex}\`;  
&nbsp;&nbsp;&nbsp;&nbsp;console.log(\`\[银行清算网关\] 扣款执行: 省联赛 ID=${leagueId} \-\> 组委会专户 | 划转金额: ¥${amount} | 流水号: ${txnId}\`);  
&nbsp;&nbsp;&nbsp;&nbsp;return { success: true, txnId };  
&nbsp;&nbsp;}

&nbsp;&nbsp;static async transferRefund(leagueId, amount, reason) {  
&nbsp;&nbsp;&nbsp;&nbsp;const randomHex \= crypto.randomBytes(4).toString('hex').toUpperCase();  
&nbsp;&nbsp;&nbsp;&nbsp;const txnId \= \`BANK-REF-${Date.now()}-${randomHex}\`;  
&nbsp;&nbsp;&nbsp;&nbsp;console.log(\`\[银行清算网关\] 原路退还: 组委会专户 \-\> 省联赛 ID=${leagueId} | 退款金额: ¥${amount} | 原因: ${reason} | 流水号: ${txnId}\`);  
&nbsp;&nbsp;&nbsp;&nbsp;return { success: true, txnId };  
&nbsp;&nbsp;}  
}

module.exports \= BankAdapter;

### **5.4 后端 API 路由与业务控制器**

#### **/server/routes/api.js**

&nbsp;

&nbsp;

&nbsp;

JavaScript

const express \= require('express');  
const router \= express.Router();  
const League \= require('../models/League');  
const Match \= require('../models/Match');  
const Referee \= require('../models/Referee');  
const { Order, BankTransaction } \= require('../models/Order');  
const Counter \= require('../models/Counter');  
const FeeEngine \= require('../services/feeEngine');  
const BankAdapter \= require('../services/bankAdapter');

async function getNextLeagueId() {  
&nbsp;&nbsp;const counter \= await Counter.findByIdAndUpdate(  
&nbsp;&nbsp;&nbsp;&nbsp;{ \_id: 'leagueId' },  
&nbsp;&nbsp;&nbsp;&nbsp;{ $inc: { seq: 1 } },  
&nbsp;&nbsp;&nbsp;&nbsp;{ new: true, upsert: true }  
&nbsp;&nbsp;);  
&nbsp;&nbsp;return counter.seq;  
}

// \-------------------------------------------------------------  
// 一、省联赛端报名与费用流转接口  
// \-------------------------------------------------------------

router.get('/matches', async (req, res) \=\> {  
&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;const matches \= await Match.find().sort({ matchNumber: 1 });  
&nbsp;&nbsp;&nbsp;&nbsp;res.json(matches);  
&nbsp;&nbsp;} catch (err) {  
&nbsp;&nbsp;&nbsp;&nbsp;res.status(500).json({ error: err.message });  
&nbsp;&nbsp;}  
});

// 1\. 初次填报并调用银行扣款  
router.post('/register', async (req, res) \=\> {  
&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;const { leagueName, leagueAddress, leagueMemberNames, selectedMatchNumbers } \= req.body;

&nbsp;&nbsp;&nbsp;&nbsp;if (\!selectedMatchNumbers || selectedMatchNumbers.length \=== 0) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return res.status(400).json({ error: '请至少选择一场比赛项目。' });  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;const matches \= await Match.find({ matchNumber: { $in: selectedMatchNumbers } });  
&nbsp;&nbsp;&nbsp;&nbsp;if (matches.length \!== selectedMatchNumbers.length) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return res.status(400).json({ error: '所选比赛包含无效项目。' });  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;const leagueId \= await getNextLeagueId();  
&nbsp;&nbsp;&nbsp;&nbsp;const league \= new League({  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueId,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueName,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueAddress,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueMemberNames  
&nbsp;&nbsp;&nbsp;&nbsp;});  
&nbsp;&nbsp;&nbsp;&nbsp;await league.save();

&nbsp;&nbsp;&nbsp;&nbsp;const totalFee \= matches.reduce((sum, m) \=\> sum \+ m.entryFee, 0);  
&nbsp;&nbsp;&nbsp;&nbsp;const orderNumber \= \`ORD-${Date.now()}-${leagueId}\`;

&nbsp;&nbsp;&nbsp;&nbsp;const bankRes \= await BankAdapter.transferPayment(leagueId, totalFee);

&nbsp;&nbsp;&nbsp;&nbsp;const orderItems \= matches.map(m \=\> ({  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;matchNumber: m.matchNumber,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;category: m.category,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;level: m.level,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fee: m.entryFee  
&nbsp;&nbsp;&nbsp;&nbsp;}));

&nbsp;&nbsp;&nbsp;&nbsp;const order \= new Order({  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;orderNumber,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueId,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;items: orderItems,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;totalFee,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;paidFee: totalFee,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;status: 'PAID'  
&nbsp;&nbsp;&nbsp;&nbsp;});  
&nbsp;&nbsp;&nbsp;&nbsp;await order.save();

&nbsp;&nbsp;&nbsp;&nbsp;await BankTransaction.create({  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;txnId: bankRes.txnId,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;orderNumber,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueId,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;amount: totalFee,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: 'PAYMENT',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;status: 'SUCCESS'  
&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;&nbsp;&nbsp;res.json({  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;success: true,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message: '报名登记与银行结算成功',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;data: {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueId,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;orderNumber,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;totalFee,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;items: orderItems  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;&nbsp;&nbsp;});  
&nbsp;&nbsp;} catch (err) {  
&nbsp;&nbsp;&nbsp;&nbsp;res.status(500).json({ error: err.message });  
&nbsp;&nbsp;}  
});

// 2\. 开放期内增减比赛与退补差价  
router.post('/order/modify-items', async (req, res) \=\> {  
&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;const { orderNumber, newMatchNumbers } \= req.body;  
&nbsp;&nbsp;&nbsp;&nbsp;const order \= await Order.findOne({ orderNumber, status: 'PAID' });  
&nbsp;&nbsp;&nbsp;&nbsp;if (\!order) return res.status(404).json({ error: '未找到生效中的报名单。' });

&nbsp;&nbsp;&nbsp;&nbsp;const currentMatches \= await Match.find({ matchNumber: { $in: order.items.map(i \=\> i.matchNumber) } });  
&nbsp;&nbsp;&nbsp;&nbsp;const earliestTime \= new Date(Math.min(...currentMatches.map(m \=\> m.startTime.getTime())));

&nbsp;&nbsp;&nbsp;&nbsp;if (\!FeeEngine.canModifyItems(earliestTime)) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return res.status(400).json({ error: '报名通道已关闭，不可进行单项调整。' });  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;const newMatches \= await Match.find({ matchNumber: { $in: newMatchNumbers } });  
&nbsp;&nbsp;&nbsp;&nbsp;const newTotalFee \= newMatches.reduce((sum, m) \=\> sum \+ m.entryFee, 0);  
&nbsp;&nbsp;&nbsp;&nbsp;const delta \= newTotalFee \- order.paidFee;

&nbsp;&nbsp;&nbsp;&nbsp;if (delta \> 0) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const payRes \= await BankAdapter.transferPayment(order.leagueId, delta);  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;await BankTransaction.create({  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;txnId: payRes.txnId,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;orderNumber,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueId: order.leagueId,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;amount: delta,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: 'ADDITIONAL\_PAY'  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;});  
&nbsp;&nbsp;&nbsp;&nbsp;} else if (delta \< 0) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const refundVal \= Math.abs(delta);  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const refRes \= await BankAdapter.transferRefund(order.leagueId, refundVal, '开放期微调项目退还差额');  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;await BankTransaction.create({  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;txnId: refRes.txnId,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;orderNumber,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueId: order.leagueId,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;amount: \-refundVal,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: 'OPEN\_REFUND'  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;});  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;order.items \= newMatches.map(m \=\> ({  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;matchNumber: m.matchNumber,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;category: m.category,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;level: m.level,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fee: m.entryFee  
&nbsp;&nbsp;&nbsp;&nbsp;}));  
&nbsp;&nbsp;&nbsp;&nbsp;order.totalFee \= newTotalFee;  
&nbsp;&nbsp;&nbsp;&nbsp;order.paidFee \= newTotalFee;  
&nbsp;&nbsp;&nbsp;&nbsp;order.updatedAt \= new Date();  
&nbsp;&nbsp;&nbsp;&nbsp;await order.save();

&nbsp;&nbsp;&nbsp;&nbsp;res.json({ success: true, message: '比赛项目及费用结算变更完成', order });  
&nbsp;&nbsp;} catch (err) {  
&nbsp;&nbsp;&nbsp;&nbsp;res.status(500).json({ error: err.message });  
&nbsp;&nbsp;}  
});

// 3\. 取消全部报名  
router.post('/order/cancel', async (req, res) \=\> {  
&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;const { orderNumber } \= req.body;  
&nbsp;&nbsp;&nbsp;&nbsp;const order \= await Order.findOne({ orderNumber, status: 'PAID' });  
&nbsp;&nbsp;&nbsp;&nbsp;if (\!order) return res.status(404).json({ error: '未找到生效中的报名单。' });

&nbsp;&nbsp;&nbsp;&nbsp;const matches \= await Match.find({ matchNumber: { $in: order.items.map(i \=\> i.matchNumber) } });  
&nbsp;&nbsp;&nbsp;&nbsp;const earliestTime \= new Date(Math.min(...matches.map(m \=\> m.startTime.getTime())));

&nbsp;&nbsp;&nbsp;&nbsp;const decision \= FeeEngine.calculateCancellation(order.paidFee, earliestTime, new Date());  
&nbsp;&nbsp;&nbsp;&nbsp;if (\!decision.allowed && decision.refundAmount \=== 0) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return res.status(400).json({ error: decision.message });  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;const bankRes \= await BankAdapter.transferRefund(order.leagueId, decision.refundAmount, decision.message);

&nbsp;&nbsp;&nbsp;&nbsp;order.status \= 'CANCELLED';  
&nbsp;&nbsp;&nbsp;&nbsp;order.updatedAt \= new Date();  
&nbsp;&nbsp;&nbsp;&nbsp;await order.save();

&nbsp;&nbsp;&nbsp;&nbsp;await BankTransaction.create({  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;txnId: bankRes.txnId,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;orderNumber,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueId: order.leagueId,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;amount: \-decision.refundAmount,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: decision.stage \=== 'OPEN\_STAGE' ? 'OPEN\_REFUND' : 'CANCEL\_50\_REFUND'  
&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;&nbsp;&nbsp;res.json({  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;success: true,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message: decision.message,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refundAmount: decision.refundAmount,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refundRate: decision.refundRate  
&nbsp;&nbsp;&nbsp;&nbsp;});  
&nbsp;&nbsp;} catch (err) {  
&nbsp;&nbsp;&nbsp;&nbsp;res.status(500).json({ error: err.message });  
&nbsp;&nbsp;}  
});

// 4\. 打印凭单查询  
router.get('/voucher/:leagueId', async (req, res) \=\> {  
&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;const league \= await League.findOne({ leagueId: Number(req.params.leagueId) });  
&nbsp;&nbsp;&nbsp;&nbsp;if (\!league) return res.status(404).json({ error: '未找到该省联赛档案。' });

&nbsp;&nbsp;&nbsp;&nbsp;const order \= await Order.findOne({ leagueId: league.leagueId, status: 'PAID' });  
&nbsp;&nbsp;&nbsp;&nbsp;res.json({ league, order });  
&nbsp;&nbsp;} catch (err) {  
&nbsp;&nbsp;&nbsp;&nbsp;res.status(500).json({ error: err.message });  
&nbsp;&nbsp;}  
});

// \-------------------------------------------------------------  
// 二、组委会管理端 4 大检索职能接口  
// \-------------------------------------------------------------

// 职能 1: 某个省联赛已报名的比赛项目（类别和级别）  
router.get('/committee/league-matches/:leagueId', async (req, res) \=\> {  
&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;const order \= await Order.findOne({ leagueId: Number(req.params.leagueId), status: 'PAID' });  
&nbsp;&nbsp;&nbsp;&nbsp;if (\!order) return res.json({ matches: \[\] });  
&nbsp;&nbsp;&nbsp;&nbsp;res.json({ matches: order.items });  
&nbsp;&nbsp;} catch (err) {  
&nbsp;&nbsp;&nbsp;&nbsp;res.status(500).json({ error: err.message });  
&nbsp;&nbsp;}  
});

// 职能 2: 报名参加某场特定比赛（类别和级别）的具体省联赛  
router.get('/committee/match-leagues/:matchNumber', async (req, res) \=\> {  
&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;const matchNo \= Number(req.params.matchNumber);  
&nbsp;&nbsp;&nbsp;&nbsp;const orders \= await Order.find({ 'items.matchNumber': matchNo, status: 'PAID' });  
&nbsp;&nbsp;&nbsp;&nbsp;const leagueIds \= orders.map(o \=\> o.leagueId);  
&nbsp;&nbsp;&nbsp;&nbsp;const leagues \= await League.find({ leagueId: { $in: leagueIds } });  
&nbsp;&nbsp;&nbsp;&nbsp;res.json({ leagues });  
&nbsp;&nbsp;} catch (err) {  
&nbsp;&nbsp;&nbsp;&nbsp;res.status(500).json({ error: err.message });  
&nbsp;&nbsp;}  
});

// 职能 3: 某场特定比赛的裁判是谁  
router.get('/committee/match-referee/:matchNumber', async (req, res) \=\> {  
&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;const matchNo \= Number(req.params.matchNumber);  
&nbsp;&nbsp;&nbsp;&nbsp;const referee \= await Referee.findOne({ assignedMatchNumber: matchNo });  
&nbsp;&nbsp;&nbsp;&nbsp;res.json({ referee });  
&nbsp;&nbsp;} catch (err) {  
&nbsp;&nbsp;&nbsp;&nbsp;res.status(500).json({ error: err.message });  
&nbsp;&nbsp;}  
});

// 职能 4: 某位裁判被分配执裁了哪些比赛  
router.get('/committee/referee-matches', async (req, res) \=\> {  
&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;const { name } \= req.query;  
&nbsp;&nbsp;&nbsp;&nbsp;if (\!name) return res.status(400).json({ error: '请提供裁判姓名。' });

&nbsp;&nbsp;&nbsp;&nbsp;const assignments \= await Referee.find({ refereeName: name });  
&nbsp;&nbsp;&nbsp;&nbsp;const matchNumbers \= assignments.map(a \=\> a.assignedMatchNumber);  
&nbsp;&nbsp;&nbsp;&nbsp;const matches \= await Match.find({ matchNumber: { $in: matchNumbers } });  
&nbsp;&nbsp;&nbsp;&nbsp;res.json({ refereeName: name, matches });  
&nbsp;&nbsp;} catch (err) {  
&nbsp;&nbsp;&nbsp;&nbsp;res.status(500).json({ error: err.message });  
&nbsp;&nbsp;}  
});

module.exports \= router;

#### **/server/server.js (启动入口)**

&nbsp;

&nbsp;

&nbsp;

JavaScript

const express \= require('express');  
const mongoose \= require('mongoose');  
const apiRoutes \= require('./routes/api');

const app \= express();  
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/sports\_competition', {  
&nbsp;&nbsp;useNewUrlParser: true,  
&nbsp;&nbsp;useUnifiedTopology: true  
}).then(() \=\> console.log('\[MongoDB\] 服务连接成功: 127.0.0.1:27017/sports\_competition'))  
&nbsp;&nbsp;.catch(err \=\> console.error('\[MongoDB\] 连接失败:', err));

app.use('/api', apiRoutes);

const PORT \= 5000;  
app.listen(PORT, () \=\> {  
&nbsp;&nbsp;console.log(\`\[Express\] 体育赛事报名服务运行在 Windows 宿主端口: ${PORT}\`);  
});

### **5.5 前端 React 核心页面与原生打印组件**

#### **1\. 前端路由骨架 (/client/src/App.jsx)**

&nbsp;

&nbsp;

&nbsp;

JavaScript

import React from 'react';  
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';  
import { Layout, Menu } from 'antd';  
import RegisterWizard from './pages/RegisterWizard';  
import PrintVoucher from './pages/PrintVoucher';  
import CommitteeDashboard from './pages/CommitteeDashboard';

const { Header, Content } \= Layout;

export default function App() {  
&nbsp;&nbsp;return (  
&nbsp;&nbsp;&nbsp;&nbsp;\<BrowserRouter\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Layout '100vh' minHeight: style\="{{" }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Header 'center' 'flex', alignItems: className\="no-print" display: style\="{{" }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div style\={{ color: '\#fff', fontWeight: 'bold', fontSize: 18, marginRight: 40 }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;全国体育赛事在线报名系统  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Menu defaultSelectedKeys\="{\['1'\]}" mode\="horizontal" theme\="dark"\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Menu.Item key\="1"\>\<Link to\="/"\>省联赛报名通道\</Link\>\</Menu.Item\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Menu.Item key\="2"\>\<Link to\="/committee"\>赛事组委会管理端\</Link\>\</Menu.Item\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Menu\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Header\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Content '\#f5f5f5' '0 24px', backgroundColor: padding: style\="{{" }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Routes\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Route element\="{\<RegisterWizard" path\="/"/\>} /\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Route element\="{\<PrintVoucher" path\="/print-voucher"/\>} /\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Route element\="{\<CommitteeDashboard" path\="/committee"/\>} /\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Routes\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Content\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Layout\>  
&nbsp;&nbsp;&nbsp;&nbsp;\</BrowserRouter\>  
&nbsp;&nbsp;);  
}

#### **2\. 省联赛极简申报向导 (/client/src/pages/RegisterWizard.jsx)**

&nbsp;

&nbsp;

&nbsp;

JavaScript

import React, { useState, useEffect } from 'react';  
import { Form, Input, Card, Checkbox, Button, Steps, Typography, Alert, message, Divider, Space, Tag } from 'antd';  
import { TrophyOutlined, BankOutlined, CheckCircleOutlined, PrinterOutlined } from '@ant-design/icons';  
import axios from 'axios';

const { Title, Text } \= Typography;

export default function RegisterWizard() {  
&nbsp;&nbsp;const \[currentStep, setCurrentStep\] \= useState(0);  
&nbsp;&nbsp;const \[form\] \= Form.useForm();  
&nbsp;&nbsp;const \[matches, setMatches\] \= useState(\[\]);  
&nbsp;&nbsp;const \[selectedMatches, setSelectedMatches\] \= useState(\[\]);  
&nbsp;&nbsp;const \[regResult, setRegResult\] \= useState(null);  
&nbsp;&nbsp;const \[loading, setLoading\] \= useState(false);

&nbsp;&nbsp;useEffect(() \=\> {  
&nbsp;&nbsp;&nbsp;&nbsp;axios.get('/api/matches')  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.then(res \=\> setMatches(res.data))  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.catch(() \=\> message.error('加载比赛字典数据失败'));  
&nbsp;&nbsp;}, \[\]);

&nbsp;&nbsp;const totalFee \= selectedMatches.reduce((sum, matchNo) \=\> {  
&nbsp;&nbsp;&nbsp;&nbsp;const m \= matches.find(item \=\> item.matchNumber \=== matchNo);  
&nbsp;&nbsp;&nbsp;&nbsp;return sum \+ (m ? m.entryFee : 0);  
&nbsp;&nbsp;}, 0);

&nbsp;&nbsp;const handleSubmit \= async (values) \=\> {  
&nbsp;&nbsp;&nbsp;&nbsp;if (selectedMatches.length \=== 0) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return message.error('请至少选报一场比赛项目。');  
&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;&nbsp;&nbsp;setLoading(true);  
&nbsp;&nbsp;&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const payload \= {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueName: values.leagueName,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueAddress: values.leagueAddress,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leagueMemberNames: values.leagueMemberNames,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;selectedMatchNumbers: selectedMatches  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;};  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const res \= await axios.post('/api/register', payload);  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;setRegResult(res.data.data);  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;setCurrentStep(2);  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message.success('报名成功并已完成银行转账支付！');  
&nbsp;&nbsp;&nbsp;&nbsp;} catch (err) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message.error(err.response?.data?.error || '报名提交失败');  
&nbsp;&nbsp;&nbsp;&nbsp;} finally {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;setLoading(false);  
&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;};

&nbsp;&nbsp;return (  
&nbsp;&nbsp;&nbsp;&nbsp;\<div style\={{ maxWidth: 900, margin: '24px auto' }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Card '0 12px 4px bordered\="{false}" boxShadow: rgba(0,0,0,0.06)' style\="{{" }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Title 'center', 28 level\="{3}" marginBottom: style\="{{" textAlign: }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;省联赛参赛报名通道  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Title\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Steps '填写联赛档案' '挑选参赛比赛' '银行交费与凭单' 32 \]} current\="{currentStep}" items\="{\[" marginBottom: style\="{{" title: { } }, }}/\>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Form form\="{form}" layout\="vertical" onFinish\="{handleSubmit}"\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{currentStep \=== 0 && (  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Alert 24 description\="本系统仅用于省联赛报名功能。通道将于开赛前一个月关闭。提交成功后系统将自动生成联赛 ID。" marginBottom: message\="填报须知" showIcon style\="{{" type\="info" }}/\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Form.Item '请输入省联赛全称' label\="省联赛名称" message: name\="leagueName" required: rules\="{\[{" true, }\]}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Input placeholder\="例：湖北省男子篮球联赛协会" size\="large"/\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Form.Item\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Form.Item '请输入通讯地址' label\="省联赛通信地址" message: name\="leagueAddress" required: rules\="{\[{" true, }\]}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Input placeholder\="例：武汉市武昌区体育馆路特1号" size\="large"/\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Form.Item\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Form.Item '请输入队员名单' label\="参赛人员名单 (纯文本型)" message: name\="leagueMemberNames" required: rules\="{\[{" true, }\]}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Input.TextArea placeholder\="格式：领队：XXX；教练：XXX；队员：张三、李四、王五、赵六..." rows\="{4}"/\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Form.Item\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Button onClick\="{()" size\="large" type\="primary"\> form.validateFields().then(() \=\> setCurrentStep(1))}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;下一步：选择比赛项目  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Button\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)}

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{currentStep \=== 1 && (  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Title level\="{4}"\>\<TrophyOutlined/\> 选择参赛项目（类别与级别）\</Title\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{\['Basketball', 'Football', 'Volleyball'\].map(cat \=\> (  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Card 16 key\="{cat}" marginBottom: style\="{{" title\="{\`赛事类别：${cat}\`}" type\="inner" }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Checkbox.Group '100%' onChange\="{setSelectedMatches}" style\="{{" value\="{selectedMatches}" width: }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Space '100%' direction\="vertical" style\="{{" width: }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{matches.filter(m \=\> m.category \=== cat).map(m \=\> (  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Checkbox key\="{m.matchNumber}" value\="{m.matchNumber}"\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Text strong\>\#{m.matchNumber}\</Text\> \- 级别: \<Tag color\="blue"\>{m.level}\</Tag\> \-&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;开赛时间: {new Date(m.startTime).toLocaleDateString()} \-&nbsp;  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Text 12 marginLeft: style\="{{" type\="danger" }}\>规费: ¥{m.entryFee}\</Text\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Checkbox\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;))}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Space\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Checkbox.Group\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Card\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;))}

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Divider/\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div style\={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Text 16 fontSize: style\="{{" }}\>已选场次: \<Text strong\>{selectedMatches.length}\</Text\> 场\</Text\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Title 0 level\="{3}" margin: style\="{{" type\="danger" }}\>总计费用: ¥{totalFee}.00\</Title\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Space\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Button onClick\="{()" size\="large"\> setCurrentStep(0)}\>上一步\</Button\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Button icon\="{\<BankOutlined" size\="large" type\="primary"/\>} htmlType="submit" loading={loading}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;调用银行系统划款支付  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Button\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Space\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)}

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{currentStep \=== 2 && regResult && (  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div style\={{ textAlign: 'center', padding: '24px 0' }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<CheckCircleOutlined '\#52c41a' 72, color: fontSize: style\="{{" }}/\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Title 16 level\="{2}" marginTop: style\="{{" }}\>报名办理完成\</Title\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Alert ${regResult.leagueId}\`} ${regResult.orderNumber} '20px 'left' (League 500, ID ID): auto', description\="{\`报名单编号:" margin: maxWidth: message\="{\`系统分配联赛" showIcon style\="{{" textAlign: type\="success" | }} ¥${regResult.totalFee}.00\`} 银行划拨金额:/\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Space 16 marginTop: style\="{{" }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Button icon\="{\<PrinterOutlined" size\="large" type\="primary"/\>}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;onClick={() \=\> window.open(\`/print-voucher?leagueId=${regResult.leagueId}\`, '\_blank')}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;打印参赛报名凭证记录 (Print Slip)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Button\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Space\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Form\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Card\>  
&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;);  
}

#### **3\. 报名凭据打印单组件 (/client/src/pages/PrintVoucher.jsx)**

&nbsp;

&nbsp;

&nbsp;

JavaScript

import React, { useEffect, useState } from 'react';  
import { useSearchParams } from 'react-router-dom';  
import { Button, Spin, Typography, message } from 'antd';  
import { PrinterOutlined } from '@ant-design/icons';  
import axios from 'axios';

const { Title, Text } \= Typography;

export default function PrintVoucher() {  
&nbsp;&nbsp;const \[params\] \= useSearchParams();  
&nbsp;&nbsp;const leagueId \= params.get('leagueId');  
&nbsp;&nbsp;const \[voucherData, setVoucherData\] \= useState(null);

&nbsp;&nbsp;useEffect(() \=\> {  
&nbsp;&nbsp;&nbsp;&nbsp;if (leagueId) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;axios.get(\`/api/voucher/${leagueId}\`)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.then(res \=\> setVoucherData(res.data))  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.catch(() \=\> message.error('获取报名记录凭证失败'));  
&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;}, \[leagueId\]);

&nbsp;&nbsp;if (\!voucherData) {  
&nbsp;&nbsp;&nbsp;&nbsp;return \<div style\={{ textAlign: 'center', marginTop: 100 }}\>\<Spin size\="large"/\>\</div\>;  
&nbsp;&nbsp;}

&nbsp;&nbsp;const { league, order } \= voucherData;

&nbsp;&nbsp;return (  
&nbsp;&nbsp;&nbsp;&nbsp;\<div style\={{ padding: 24, maxWidth: 840, margin: '0 auto' }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div className\="no-print" style\={{ marginBottom: 16, textAlign: 'right' }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Button icon\="{\<PrinterOutlined" size\="large" type\="primary"/\>} onClick={() \=\> window.print()}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;打印凭证 (Print Slip)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Button\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div className\="voucher-paper" style\={{ border: '2px solid \#111', padding: 36, backgroundColor: '\#fff' }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div style\={{ textAlign: 'center', borderBottom: '2px solid \#111', paddingBottom: 16 }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Title 0, 2 letterSpacing: level\="{2}" margin: style\="{{" }}\>全国体育赛事报名确认单与存根\</Title\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Text type\="secondary"\>NATIONAL SPORTS REGISTRATION CONFIRMATION VOUCHER\</Text\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<table style\={{ width: '100%', marginTop: 24, borderCollapse: 'collapse' }} border\="1" cellPadding\="10"\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<tbody\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<tr\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td style\={{ width: '20%', fontWeight: 'bold', background: '\#fafafa' }}\>联赛分配 ID:\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td style\={{ width: '30%', fontWeight: 'bold', fontSize: 16 }}\>{league.leagueId}\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td style\={{ width: '20%', fontWeight: 'bold', background: '\#fafafa' }}\>单据流水号:\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td style\={{ width: '30%' }}\>{order.orderNumber}\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</tr\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<tr\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td style\={{ fontWeight: 'bold', background: '\#fafafa' }}\>参赛省联赛:\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td colSpan\={3}\>{league.leagueName}\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</tr\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<tr\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td style\={{ fontWeight: 'bold', background: '\#fafafa' }}\>通信地址:\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td colSpan\={3}\>{league.leagueAddress}\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</tr\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<tr\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td style\={{ fontWeight: 'bold', background: '\#fafafa' }}\>参赛人员名单:\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td colSpan\={3} style\={{ whiteSpace: 'pre-wrap' }}\>{league.leagueMemberNames}\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</tr\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</tbody\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</table\>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Title 12 28, level\="{4}" marginBottom: marginTop: style\="{{" }}\>已选报参赛项目明细:\</Title\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<table style\={{ width: '100%', borderCollapse: 'collapse' }} border\="1" cellPadding\="10"\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<thead\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<tr style\={{ background: '\#f5f5f5', textAlign: 'center' }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<th\>比赛编号\</th\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<th\>赛事类别 (Category)\</th\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<th\>赛事级别 (Level)\</th\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<th\>缴费金额\</th\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<th\>状态\</th\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</tr\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</thead\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<tbody\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{order.items.map(item \=\> (  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<tr key\={item.matchNumber} style\={{ textAlign: 'center' }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td\>\#{item.matchNumber}\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td\>{item.category}\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td\>{item.level}\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td\>¥{item.fee}.00\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<td\>银行划转成功\</td\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</tr\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;))}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</tbody\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</table\>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div style\={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<p style\={{ margin: '4px 0' }}\>实缴报名费: \<strong\>RMB ¥{order.paidFee}.00 元\</strong\>\</p\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<p style\={{ margin: '4px 0' }}\>单据生成时间: {new Date(order.createdAt).toLocaleString()}\</p\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<p style\={{ margin: '4px 0', fontSize: 12, color: '\#666' }}\>防伪流水签章: VERIFIED-AUTH-STAMP\</p\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div style\={{ textAlign: 'center', minWidth: 220 }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<p\>全国体育赛事管理委员会 (印章)\</p\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div style\={{ height: 70, borderBottom: '1px dashed \#444' }}\>\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<style\>{\`  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;@media print {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.no-print { display: none \!important; }  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;body { background: \#fff \!important; margin: 0; padding: 0; }  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.voucher-paper { border: none \!important; padding: 0 \!important; }  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\`}\</style\>  
&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;);  
}

#### **4\. 赛事组委会管理端（4 大查询看板） (/client/src/pages/CommitteeDashboard.jsx)**

&nbsp;

&nbsp;

&nbsp;

JavaScript

import React, { useState } from 'react';  
import { Card, Tabs, Input, Button, Table, Typography, Space, message, Tag, Alert } from 'antd';  
import { SearchOutlined, SafetyCertificateOutlined } from '@ant-design/icons';  
import axios from 'axios';

const { Title } \= Typography;

export default function CommitteeDashboard() {  
&nbsp;&nbsp;const \[leagueId, setLeagueId\] \= useState('');  
&nbsp;&nbsp;const \[leagueMatches, setLeagueMatches\] \= useState(\[\]);

&nbsp;&nbsp;const \[matchNumber, setMatchNumber\] \= useState('');  
&nbsp;&nbsp;const \[matchLeagues, setMatchLeagues\] \= useState(\[\]);  
&nbsp;&nbsp;const \[matchReferee, setMatchReferee\] \= useState(null);

&nbsp;&nbsp;const \[refereeName, setRefereeName\] \= useState('');  
&nbsp;&nbsp;const \[refereeMatches, setRefereeMatches\] \= useState(\[\]);

&nbsp;&nbsp;// 1\. 查某省联赛已报项目  
&nbsp;&nbsp;const queryLeagueMatches \= async () \=\> {  
&nbsp;&nbsp;&nbsp;&nbsp;if (\!leagueId) return message.warning('请输入省联赛 ID');  
&nbsp;&nbsp;&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const res \= await axios.get(\`/api/committee/league-matches/${leagueId}\`);  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;setLeagueMatches(res.data.matches);  
&nbsp;&nbsp;&nbsp;&nbsp;} catch {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message.error('检索失败');  
&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;};

&nbsp;&nbsp;// 2 & 3\. 查特定比赛的参赛省联赛与主裁判  
&nbsp;&nbsp;const queryMatchDetails \= async () \=\> {  
&nbsp;&nbsp;&nbsp;&nbsp;if (\!matchNumber) return message.warning('请输入比赛编号');  
&nbsp;&nbsp;&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const \[resLg, resRef\] \= await Promise.all(\[  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;axios.get(\`/api/committee/match-leagues/${matchNumber}\`),  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;axios.get(\`/api/committee/match-referee/${matchNumber}\`)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\]);  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;setMatchLeagues(resLg.data.leagues);  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;setMatchReferee(resRef.data.referee);  
&nbsp;&nbsp;&nbsp;&nbsp;} catch {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message.error('综合检索失败');  
&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;};

&nbsp;&nbsp;// 4\. 查某裁判执裁的比赛  
&nbsp;&nbsp;const queryRefereeMatches \= async () \=\> {  
&nbsp;&nbsp;&nbsp;&nbsp;if (\!refereeName) return message.warning('请输入裁判姓名');  
&nbsp;&nbsp;&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const res \= await axios.get(\`/api/committee/referee-matches?name=${encodeURIComponent(refereeName)}\`);  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;setRefereeMatches(res.data.matches);  
&nbsp;&nbsp;&nbsp;&nbsp;} catch {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message.error('检索裁判比赛失败');  
&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;};

&nbsp;&nbsp;return (  
&nbsp;&nbsp;&nbsp;&nbsp;\<div style\={{ maxWidth: 1000, margin: '24px auto' }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Card\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Title level\="{3}"\>\<SafetyCertificateOutlined/\> 赛事组委会综合检索后台\</Title\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Tabs '1', '1\. ( \<div children: defaultActiveKey\="1" items\="{\[" key: label: { 查询某省联赛已报比赛',\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Space 16 marginBottom: style\="{{" }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Input onChange\="{e" placeholder\="输入省联赛 ID (如 1001)" value\="{leagueId}"\> setLeagueId(e.target.value)} /\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Button icon\="{\<SearchOutlined" type\="primary"/\>} onClick={queryLeagueMatches}\>查询\</Button\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Space\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Table 'matchNumber', '比赛编号', columns\="{\[" dataIndex: dataSource\="{leagueMatches}" render: rowKey\="matchNumber" title: {\> \`\#${t}\` },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ title: '赛事类别 (Category)', dataIndex: 'category' },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ title: '赛事级别 (Level)', dataIndex: 'level', render: l \=\> \<Tag color\="green"\>{l}\</Tag\> },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ title: '单项规费', dataIndex: 'fee', render: f \=\> \`¥${f}.00\` }  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\]}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;key: '2',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;label: '2 & 3\. 比赛详情 (参赛省与主裁)',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;children: (  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Space 16 marginBottom: style\="{{" }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Input onChange\="{e" placeholder\="输入比赛编号 (如 101)" value\="{matchNumber}"\> setMatchNumber(e.target.value)} /\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Button icon\="{\<SearchOutlined" type\="primary"/\>} onClick={queryMatchDetails}\>综合检索\</Button\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Space\>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{matchReferee ? (  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Card '\#f9f9f9' 16, background: marginBottom: style\="{{" title\="职能 3: 执裁主裁判信息" type\="inner" }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<p\>\<strong\>裁判姓名:\</strong\> {matchReferee.refereeName}\</p\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<p\>\<strong\>所属机构/单位:\</strong\> {matchReferee.organization}\</p\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<p\>\<strong\>联络地址:\</strong\> {matchReferee.refereeAddress}\</p\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Card\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) : (  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;matchNumber && \<Alert 16 marginBottom: message\="该场比赛暂未指派裁判或未查到记录" style\="{{" type\="warning" }}/\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)}

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Table title\="{()"\> \<strong\>职能 2: 报名参加该场比赛的具体省联赛\</strong\>}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;rowKey="leagueId"  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;dataSource={matchLeagues}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;columns={\[  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ title: '联赛 ID', dataIndex: 'leagueId' },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ title: '省联赛名称', dataIndex: 'leagueName' },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ title: '地址', dataIndex: 'leagueAddress' },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ title: '参赛人员名单', dataIndex: 'leagueMemberNames', ellipsis: true }  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\]}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;key: '3',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;label: '4. 查询某裁判执裁的比赛',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;children: (  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Space 16 marginBottom: style\="{{" }}\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Input onChange\="{e" placeholder\="输入裁判姓名 (如 张建国)" value\="{refereeName}"\> setRefereeName(e.target.value)} /\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Button icon\="{\<SearchOutlined" type\="primary"/\>} onClick={queryRefereeMatches}\>检索任务\</Button\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Space\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<Table 'matchNumber', '比赛编号', columns\="{\[" dataIndex: dataSource\="{refereeMatches}" render: rowKey\="matchNumber" title: {\> \`\#${t}\` },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ title: '比赛类别', dataIndex: 'category' },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ title: '比赛级别', dataIndex: 'level' },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ title: '开赛时间', dataIndex: 'startTime', render: d \=\> new Date(d).toLocaleString() }  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\]}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\]}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\</Card\>  
&nbsp;&nbsp;&nbsp;&nbsp;\</div\>  
&nbsp;&nbsp;);  
}

### **5.6 数据库初始种子数据导入脚本 (/server/seed.js)**

&nbsp;

&nbsp;

&nbsp;

JavaScript

const mongoose \= require('mongoose');  
const Match \= require('./models/Match');  
const Referee \= require('./models/Referee');

mongoose.connect('mongodb://127.0.0.1:27017/sports\_competition');

async function seedData() {  
&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;await Match.deleteMany({});  
&nbsp;&nbsp;&nbsp;&nbsp;await Referee.deleteMany({});

&nbsp;&nbsp;&nbsp;&nbsp;const now \= Date.now();  
&nbsp;&nbsp;&nbsp;&nbsp;const openDate \= new Date(now \+ 45 \* 24 \* 60 \* 60 \* 1000); // 45天后开赛 (开放期)  
&nbsp;&nbsp;&nbsp;&nbsp;const preMatchDate \= new Date(now \+ 15 \* 24 \* 60 \* 60 \* 1000); // 15天后开赛 (退50%期)

&nbsp;&nbsp;&nbsp;&nbsp;const matches \= \[  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ matchNumber: 101, category: 'Basketball', level: 'Beginner', startTime: openDate, entryFee: 1000 },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ matchNumber: 102, category: 'Basketball', level: 'Intermediate', startTime: openDate, entryFee: 1500 },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ matchNumber: 103, category: 'Basketball', level: 'Advanced', startTime: openDate, entryFee: 2000 },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ matchNumber: 201, category: 'Football', level: 'Beginner', startTime: preMatchDate, entryFee: 1200 },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ matchNumber: 202, category: 'Football', level: 'Intermediate', startTime: openDate, entryFee: 1800 },  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ matchNumber: 301, category: 'Volleyball', level: 'Beginner', startTime: openDate, entryFee: 1000 }  
&nbsp;&nbsp;&nbsp;&nbsp;\];  
&nbsp;&nbsp;&nbsp;&nbsp;await Match.insertMany(matches);

&nbsp;&nbsp;&nbsp;&nbsp;const referees \= \[  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refereeName: '张建国',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;assignedMatchNumber: 101,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refereeAddress: '北京市海淀区中关村南大街1号',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;organization: '中国篮球协会裁判委员会'  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refereeName: '张建国',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;assignedMatchNumber: 102,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refereeAddress: '北京市海淀区中关村南大街1号',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;organization: '中国篮球协会裁判委员会'  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refereeName: '李铁柱',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;assignedMatchNumber: 201,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refereeAddress: '上海市徐汇区漕溪北路零陵路',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;organization: '中国足球协会裁判委员会'  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refereeName: '王立新',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;assignedMatchNumber: 301,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;refereeAddress: '广州市天河区天河路体育中心',  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;organization: '广东省排球协会'  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;&nbsp;&nbsp;\];  
&nbsp;&nbsp;&nbsp;&nbsp;await Referee.insertMany(referees);

&nbsp;&nbsp;&nbsp;&nbsp;console.log('\[Seed\] 基础比赛字典与裁判执裁指派数据初始化完成！');  
&nbsp;&nbsp;&nbsp;&nbsp;process.exit(0);  
&nbsp;&nbsp;} catch (err) {  
&nbsp;&nbsp;&nbsp;&nbsp;console.error('\[Seed\] 数据植入失败:', err);  
&nbsp;&nbsp;&nbsp;&nbsp;process.exit(1);  
&nbsp;&nbsp;}  
}

seedData();

## **六、 课程设计验收自查清单**

在 **9 月 22 日 08:00 前** 正式提交文档与系统前，请对照自查：

* \[x\] **(1) 团队设计方法与成员分工**：已采用面向对象分析设计与敏捷方法，明确列出角色分工、责任矩阵与里程碑节点。  
* \[x\] **(2) 设计目标与设计原则**：界定了“仅负责报名”的业务边界，落实零培训 UI、SRP、开闭原则与资金幂等性。  
* \[x\] **(3) 需求捕获与分析（用例模型）**：  
  * \[x\] 绘制 Mermaid 用例图；  
  * \[x\] 完整实现开放报名期（无罚金退补）、截止后至开赛前（全额退赛退 50%）、比赛开始后（概不退费）三阶段梯级状态机；  
  * \[x\] 落实各省与组委会银行系统的互联转账与原路退回假设。  
* \[x\] **(4) 系统设计（五大必备设计成果）**：  
  * \[x\] **用户界面设计**：给出省联赛向导、A4 凭据打印单、组委会综合看板原型与交互设计；  
  * \[x\] **类图 / 结构模型**：给出涵盖 League, Match, Referee, Order, Transaction 的 Mermaid 类图；  
  * \[x\] **顺序图 / 动态模型**：给出初次报名划扣、梯级退费算法的 2 张完整 Mermaid 顺序图；  
  * \[x\] **持久化数据设计**：提供完整的 Mongoose Schemas 定义，实现数字型 League ID 生成；  
  * \[x\] **应用程序部署图**：给出包含 Windows 客户端、IIS 反向代理、Node/Express 服务、MongoDB 及银行清算网关的部署图。  
* \[x\] **组委会管理端 4 大检索职能验证**：  
  * \[x\] 职能 1：成功查询某省联赛已报名的比赛项目（类别和级别）；  
  * \[x\] 职能 2：成功查询报名参加某场特定比赛的具体省联赛；  
  * \[x\] 职能 3：成功查询某场特定比赛指派的裁判；  
  * \[x\] 职能 4：成功查询某位裁判被分配执裁的所有比赛。  
* \[x\] **工程可执行性**：前后端全部核心代码、种子脚本及 AntD 打印样式无语法缺陷，可直接克隆运行。
