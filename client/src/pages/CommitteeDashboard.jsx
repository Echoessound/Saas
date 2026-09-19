import React, { useState, useEffect } from 'react';
import { Card, Tabs, Input, Button, Table, Space, message, Tag, Alert, Statistic, Row, Col, Progress, Modal, Descriptions, Select, Empty } from 'antd';
import { SearchOutlined, DownloadOutlined, PrinterOutlined, BarChartOutlined } from '@ant-design/icons';
import api from '../api';

const CATEGORY_LABELS = {
  Basketball: '篮球 (Basketball)',
  Football: '足球 (Football)',
  Volleyball: '排球 (Volleyball)'
};

const LEVEL_LABELS = {
  Beginner: '初级',
  Intermediate: '中级',
  Advanced: '高级'
};

const TXN_TYPE_LABELS = {
  PAYMENT: { text: '报名缴费', color: 'green' },
  ADDITIONAL_PAY: { text: '增项补缴', color: 'blue' },
  OPEN_REFUND: { text: '开放期全额退款', color: 'orange' },
  CANCEL_50_REFUND: { text: '截止后违约退费(退50%)', color: 'red' }
};

const ORDER_STATUS_LABELS = {
  PAID: { text: '已结算', color: 'green' },
  CANCELLED: { text: '已取消', color: 'default' },
  NONE: { text: '未报名', color: 'warning' }
};

// 导出 CSV（带 UTF-8 BOM，Excel 打开中文不乱码）
function exportCsv(filename, headers, rows) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + [headers, ...rows].map(r => r.map(escape).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const fmtFee = v => `¥${Number(v).toFixed(2)}`;
const fmtSignedFee = v => (
  <span style={{ color: v >= 0 ? '#0ea472' : '#c0392b', fontWeight: 600 }}>
    {v >= 0 ? '+' : ''}{fmtFee(v)}
  </span>
);

export default function CommitteeDashboard() {
  const [stats, setStats] = useState(null);
  const [allLeagues, setAllLeagues] = useState([]);
  const [allMatches, setAllMatches] = useState([]);

  // 统计卡片明细弹窗
  const [cardModal, setCardModal] = useState({ type: null, data: [], loading: false });
  // 每场比赛详情弹窗
  const [matchModal, setMatchModal] = useState({ match: null, leagues: [], referee: null, loading: false });

  const [leagueId, setLeagueId] = useState(undefined);
  const [leagueMatches, setLeagueMatches] = useState([]);

  const [matchNumber, setMatchNumber] = useState('');
  const [matchLeagues, setMatchLeagues] = useState([]);
  const [matchReferee, setMatchReferee] = useState(null);
  const [matchSearched, setMatchSearched] = useState(false);

  const [refereeName, setRefereeName] = useState('');
  const [refereeMatches, setRefereeMatches] = useState([]);

  useEffect(() => {
    api.get('/api/committee/stats')
      .then(res => setStats(res.data))
      .catch(() => message.error('加载统计数据失败'));
    api.get('/api/committee/leagues')
      .then(res => setAllLeagues(res.data))
      .catch(() => message.error('加载省联赛列表失败'));
    api.get('/api/matches')
      .then(res => setAllMatches(res.data))
      .catch(() => {});
  }, []);

  // ---------- 统计卡片明细 ----------
  const openCardModal = async (type) => {
    setCardModal({ type, data: [], loading: true });
    try {
      let res;
      if (type === 'leagues') res = await api.get('/api/committee/leagues');
      else if (type === 'paid') res = await api.get('/api/committee/orders?status=PAID');
      else if (type === 'cancelled') res = await api.get('/api/committee/orders?status=CANCELLED');
      else if (type === 'revenue') res = await api.get('/api/committee/transactions');
      setCardModal({ type, data: res.data, loading: false });
    } catch {
      message.error('加载明细数据失败');
      setCardModal({ type: null, data: [], loading: false });
    }
  };

  // ---------- 每场比赛详情 ----------
  const openMatchDetail = async (row) => {
    setMatchModal({ match: row, leagues: [], referee: null, loading: true });
    try {
      const [resLg, resRef] = await Promise.all([
        api.get(`/api/committee/match-leagues/${row.matchNumber}`),
        api.get(`/api/committee/match-referee/${row.matchNumber}`)
      ]);
      setMatchModal({ match: row, leagues: resLg.data.leagues, referee: resRef.data.referee, loading: false });
    } catch {
      message.error('加载比赛详情失败');
      setMatchModal({ match: null, leagues: [], referee: null, loading: false });
    }
  };

  // 职能 1: 查某省联赛已报项目
  const queryLeagueMatches = async (id) => {
    const target = id ?? leagueId;
    if (!target) return message.warning('请选择省联赛');
    try {
      const res = await api.get(`/api/committee/league-matches/${target}`);
      setLeagueMatches(res.data.matches);
    } catch {
      message.error('检索失败');
    }
  };

  // 职能 2 & 3: 查特定比赛的参赛省联赛与主裁判
  const queryMatchDetails = async () => {
    if (!matchNumber) return message.warning('请输入比赛编号');
    try {
      const [resLg, resRef] = await Promise.all([
        api.get(`/api/committee/match-leagues/${matchNumber}`),
        api.get(`/api/committee/match-referee/${matchNumber}`)
      ]);
      setMatchLeagues(resLg.data.leagues);
      setMatchReferee(resRef.data.referee);
      setMatchSearched(true);
    } catch {
      message.error('综合检索失败');
    }
  };

  // 职能 4: 查某裁判执裁的比赛
  const queryRefereeMatches = async () => {
    if (!refereeName) return message.warning('请输入裁判姓名');
    try {
      const res = await api.get(`/api/committee/referee-matches?name=${encodeURIComponent(refereeName)}`);
      setRefereeMatches(res.data.matches);
    } catch {
      message.error('检索裁判比赛失败');
    }
  };

  const categoryMaxFee = stats ? Math.max(1, ...stats.perCategory.map(c => c.feeTotal)) : 1;
  const matchInfo = matchModal.match
    ? allMatches.find(m => m.matchNumber === matchModal.match.matchNumber)
    : null;

  // ---------- 统计卡片明细弹窗内容 ----------
  const CARD_MODAL_TITLES = {
    leagues: '参赛省联赛明细',
    paid: '生效报名单明细（与下方每场报名统计口径一致）',
    cancelled: '已取消报名单明细',
    revenue: '实收金额构成明细（全部资金流水）'
  };

  const leagueDetailColumns = [
    { title: '联赛 ID', dataIndex: 'leagueId', width: 90 },
    { title: '省联赛名称', dataIndex: 'leagueName', ellipsis: true },
    { title: '通信地址', dataIndex: 'leagueAddress', ellipsis: true },
    {
      title: '报名单状态', dataIndex: 'orderStatus', width: 110,
      render: s => <Tag color={ORDER_STATUS_LABELS[s]?.color}>{ORDER_STATUS_LABELS[s]?.text || s}</Tag>
    },
    { title: '实缴费用', dataIndex: 'paidFee', width: 110, render: v => v == null ? '-' : fmtFee(v) }
  ];

  const orderDetailColumns = [
    { title: '报名单编号', dataIndex: 'orderNumber', width: 210 },
    { title: '省联赛', render: o => o.league?.leagueName || `#${o.leagueId}`, ellipsis: true },
    { title: '场次', render: o => o.items.length, width: 60 },
    { title: '实缴费用', dataIndex: 'paidFee', width: 110, render: fmtFee },
    {
      title: '报名项目', render: o => o.items.map(i => `#${i.matchNumber}`).join(' '), ellipsis: true
    },
    { title: '时间', dataIndex: 'createdAt', width: 165, render: d => new Date(d).toLocaleString() }
  ];

  const txnDetailColumns = [
    { title: '流水号', dataIndex: 'txnId', ellipsis: true },
    { title: '关联报名单', dataIndex: 'orderNumber', width: 200 },
    {
      title: '流水类型', dataIndex: 'type', width: 170,
      render: t => <Tag color={TXN_TYPE_LABELS[t]?.color}>{TXN_TYPE_LABELS[t]?.text || t}</Tag>
    },
    { title: '金额', dataIndex: 'amount', width: 120, render: fmtSignedFee },
    { title: '时间', dataIndex: 'createdAt', width: 165, render: d => new Date(d).toLocaleString() }
  ];

  const tabItems = [
    {
      key: '0',
      label: <span><BarChartOutlined /> 统计总览</span>,
      children: stats ? (
        <div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card className="stat-card stat-blue" onClick={() => openCardModal('leagues')}>
                <Statistic title="参赛省联赛数（点击查看明细）" value={stats.overview.leagueCount} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="stat-card stat-green" onClick={() => openCardModal('paid')}>
                <Statistic title="生效报名单（点击查看明细）" value={stats.overview.paidCount} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="stat-card stat-amber" onClick={() => openCardModal('cancelled')}>
                <Statistic title="已取消报名单（点击查看明细）" value={stats.overview.cancelledCount} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="stat-card stat-navy" onClick={() => openCardModal('revenue')}>
                <Statistic title="实收金额 (¥)（点击查看明细）" value={stats.overview.netRevenue} precision={2} />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Card
                title="每场比赛报名与收费"
                size="small"
                extra={<Button size="small" icon={<DownloadOutlined />} onClick={() => exportCsv(
                  '比赛报名统计.csv',
                  ['比赛编号', '类别', '级别', '参赛省联赛数', '收费合计(元)'],
                  stats.perMatch.map(m => [`#${m.matchNumber}`, CATEGORY_LABELS[m.category] || m.category, LEVEL_LABELS[m.level] || m.level, m.leagueCount, m.feeTotal])
                )}>导出 CSV</Button>}
              >
                <Table
                  rowKey="matchNumber"
                  size="small"
                  dataSource={stats.perMatch}
                  pagination={false}
                  columns={[
                    { title: '比赛编号', dataIndex: 'matchNumber', render: t => `#${t}` },
                    { title: '类别', dataIndex: 'category', render: c => CATEGORY_LABELS[c] || c },
                    { title: '级别', dataIndex: 'level', render: l => LEVEL_LABELS[l] || l },
                    { title: '参赛省联赛数', dataIndex: 'leagueCount' },
                    { title: '收费合计', dataIndex: 'feeTotal', render: f => fmtFee(f) },
                    {
                      title: '操作', width: 70,
                      render: (_, row) => (
                        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openMatchDetail(row)}>
                          详情
                        </Button>
                      )
                    }
                  ]}
                />
              </Card>
            </Col>
            <Col span={10}>
              <Card title="赛事类别分布（按收费额）" size="small">
                {stats.perCategory.map(c => (
                  <div key={c.category} style={{ marginBottom: 12 }}>
                    <div style={{ marginBottom: 4 }}>
                      {CATEGORY_LABELS[c.category] || c.category} —— {c.itemCount} 项 / {fmtFee(c.feeTotal)}
                    </div>
                    <Progress percent={Math.round(c.feeTotal / categoryMaxFee * 100)} showInfo={false} />
                  </div>
                ))}
              </Card>
              <Card title="资金台账汇总" size="small" style={{ marginTop: 16 }}>
                <Table
                  rowKey="type"
                  size="small"
                  dataSource={stats.transactions}
                  pagination={false}
                  columns={[
                    {
                      title: '流水类型', dataIndex: 'type',
                      render: t => <Tag color={TXN_TYPE_LABELS[t]?.color}>{TXN_TYPE_LABELS[t]?.text || t}</Tag>
                    },
                    { title: '笔数', dataIndex: 'count' },
                    { title: '金额合计', dataIndex: 'total', render: fmtSignedFee }
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ) : <Alert type="info" message="统计数据加载中..." />
    },
    {
      key: '1',
      label: '1. 查询某省联赛已报比赛',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }} className="no-print" wrap>
            <Select
              showSearch
              placeholder="选择省联赛（可输入名称搜索）"
              style={{ width: 380 }}
              value={leagueId}
              onChange={v => { setLeagueId(v); queryLeagueMatches(v); }}
              options={allLeagues.map(l => ({
                value: l.leagueId,
                label: `${l.leagueName}（ID: ${l.leagueId}）`
              }))}
              filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={() => queryLeagueMatches()}>查询</Button>
            <Button icon={<DownloadOutlined />} disabled={leagueMatches.length === 0} onClick={() => exportCsv(
              `省联赛${leagueId}报名项目.csv`,
              ['比赛编号', '赛事类别', '赛事级别', '单项规费(元)'],
              leagueMatches.map(m => [`#${m.matchNumber}`, CATEGORY_LABELS[m.category] || m.category, LEVEL_LABELS[m.level] || m.level, m.fee])
            )}>导出 CSV</Button>
            <Button icon={<PrinterOutlined />} disabled={leagueMatches.length === 0} onClick={() => window.print()}>打印报表</Button>
          </Space>
          <Table
            rowKey="matchNumber"
            dataSource={leagueMatches}
            columns={[
              { title: '比赛编号', dataIndex: 'matchNumber', render: t => `#${t}` },
              { title: '赛事类别 (Category)', dataIndex: 'category', render: c => CATEGORY_LABELS[c] || c },
              { title: '赛事级别 (Level)', dataIndex: 'level', render: l => <Tag color="green">{LEVEL_LABELS[l] || l}</Tag> },
              { title: '单项规费', dataIndex: 'fee', render: fmtFee }
            ]}
          />
        </div>
      )
    },
    {
      key: '2',
      label: '2 & 3. 比赛详情 (参赛省与主裁)',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }} className="no-print">
            <Input
              placeholder="输入比赛编号 (如 101)"
              value={matchNumber}
              onChange={e => setMatchNumber(e.target.value)}
              onPressEnter={queryMatchDetails}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={queryMatchDetails}>综合检索</Button>
            <Button icon={<DownloadOutlined />} disabled={matchLeagues.length === 0} onClick={() => exportCsv(
              `比赛${matchNumber}参赛省联赛.csv`,
              ['联赛ID', '省联赛名称', '地址', '参赛人员名单'],
              matchLeagues.map(l => [l.leagueId, l.leagueName, l.leagueAddress, l.leagueMemberNames])
            )}>导出 CSV</Button>
            <Button icon={<PrinterOutlined />} disabled={!matchSearched} onClick={() => window.print()}>打印报表</Button>
          </Space>

          {matchReferee ? (
            <Card type="inner" title="职能 3: 执裁主裁判信息" style={{ marginBottom: 16, background: '#f9f9f9' }}>
              <p><strong>裁判姓名:</strong> {matchReferee.refereeName}</p>
              <p><strong>所属机构/单位:</strong> {matchReferee.organization}</p>
              <p><strong>联络地址:</strong> {matchReferee.refereeAddress}</p>
            </Card>
          ) : (
            matchSearched && <Alert type="warning" message="该场比赛暂未指派裁判或未查到记录" style={{ marginBottom: 16 }} />
          )}

          <Table
            title={() => <strong>职能 2: 报名参加该场比赛的具体省联赛</strong>}
            rowKey="leagueId"
            dataSource={matchLeagues}
            columns={[
              { title: '联赛 ID', dataIndex: 'leagueId' },
              { title: '省联赛名称', dataIndex: 'leagueName' },
              { title: '地址', dataIndex: 'leagueAddress' },
              { title: '参赛人员名单', dataIndex: 'leagueMemberNames', ellipsis: true }
            ]}
          />
        </div>
      )
    },
    {
      key: '3',
      label: '4. 查询某裁判执裁的比赛',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }} className="no-print">
            <Input
              placeholder="输入裁判姓名 (如 张建国)"
              value={refereeName}
              onChange={e => setRefereeName(e.target.value)}
              onPressEnter={queryRefereeMatches}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={queryRefereeMatches}>检索任务</Button>
            <Button icon={<DownloadOutlined />} disabled={refereeMatches.length === 0} onClick={() => exportCsv(
              `裁判${refereeName}执裁清单.csv`,
              ['比赛编号', '比赛类别', '比赛级别', '开赛时间'],
              refereeMatches.map(m => [`#${m.matchNumber}`, CATEGORY_LABELS[m.category] || m.category, LEVEL_LABELS[m.level] || m.level, new Date(m.startTime).toLocaleString()])
            )}>导出 CSV</Button>
            <Button icon={<PrinterOutlined />} disabled={refereeMatches.length === 0} onClick={() => window.print()}>打印报表</Button>
          </Space>
          <Table
            rowKey="matchNumber"
            dataSource={refereeMatches}
            columns={[
              { title: '比赛编号', dataIndex: 'matchNumber', render: t => `#${t}` },
              { title: '比赛类别', dataIndex: 'category', render: c => CATEGORY_LABELS[c] || c },
              { title: '比赛级别', dataIndex: 'level', render: l => LEVEL_LABELS[l] || l },
              { title: '开赛时间', dataIndex: 'startTime', render: d => new Date(d).toLocaleString() }
            ]}
          />
        </div>
      )
    }
  ];

  return (
    <div className="page-fade" style={{ maxWidth: 1100, margin: '24px auto' }}>
      <div className="page-hero">
        <h3 className="hero-title">赛事组委会综合检索后台</h3>
        <div className="hero-sub">统计总览 · 四大检索职能 · 报表导出与打印</div>
      </div>
      <Card className="pretty-card">
        <Tabs defaultActiveKey="0" items={tabItems} />
      </Card>

      {/* 统计卡片明细弹窗 */}
      <Modal
        title={CARD_MODAL_TITLES[cardModal.type]}
        open={!!cardModal.type}
        onCancel={() => setCardModal({ type: null, data: [], loading: false })}
        footer={null}
        width={920}
      >
        {cardModal.type === 'leagues' && (
          <Table rowKey="leagueId" size="small" loading={cardModal.loading} dataSource={cardModal.data} columns={leagueDetailColumns} pagination={false} />
        )}
        {(cardModal.type === 'paid' || cardModal.type === 'cancelled') && (
          <Table rowKey="orderNumber" size="small" loading={cardModal.loading} dataSource={cardModal.data} columns={orderDetailColumns} pagination={false} />
        )}
        {cardModal.type === 'revenue' && (
          <>
            <Alert
              type="info" showIcon style={{ marginBottom: 12 }}
              message={<span>资金净流入（实收金额）：
                <strong style={{ color: '#0b2447' }}>{stats ? fmtFee(stats.overview.netRevenue) : '-'}</strong>
                　= 全部缴费与补缴之和 − 各类退款之和</span>}
            />
            <Table rowKey="txnId" size="small" loading={cardModal.loading} dataSource={cardModal.data} columns={txnDetailColumns} pagination={{ pageSize: 8 }} />
          </>
        )}
      </Modal>

      {/* 每场比赛详情弹窗 */}
      <Modal
        title={matchModal.match ? `比赛 #${matchModal.match.matchNumber} 详情` : ''}
        open={!!matchModal.match}
        onCancel={() => setMatchModal({ match: null, leagues: [], referee: null, loading: false })}
        footer={null}
        width={860}
      >
        {matchModal.match && (
          <div>
            <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="赛事类别">{CATEGORY_LABELS[matchModal.match.category] || matchModal.match.category}</Descriptions.Item>
              <Descriptions.Item label="赛事级别">{LEVEL_LABELS[matchModal.match.level] || matchModal.match.level}</Descriptions.Item>
              <Descriptions.Item label="单场规费">{matchInfo ? fmtFee(matchInfo.entryFee) : '-'}</Descriptions.Item>
              <Descriptions.Item label="开赛时间">{matchInfo ? new Date(matchInfo.startTime).toLocaleString() : '-'}</Descriptions.Item>
              <Descriptions.Item label="参赛省联赛数">{matchModal.match.leagueCount}</Descriptions.Item>
              <Descriptions.Item label="收费合计">{fmtFee(matchModal.match.feeTotal)}</Descriptions.Item>
            </Descriptions>

            {matchModal.referee ? (
              <Alert
                type="success" showIcon style={{ marginBottom: 16 }}
                message={`执裁裁判：${matchModal.referee.refereeName}（${matchModal.referee.organization}）`}
                description={`通信地址：${matchModal.referee.refereeAddress}`}
              />
            ) : (
              <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="该场比赛暂未指派裁判" />
            )}

            <Table
              title={() => <strong>报名参赛的省联赛（{matchModal.leagues.length} 个，与统计计数一致）</strong>}
              rowKey="leagueId"
              size="small"
              loading={matchModal.loading}
              dataSource={matchModal.leagues}
              pagination={false}
              locale={{ emptyText: <Empty description="暂无省联赛报名该场比赛" /> }}
              columns={[
                { title: '联赛 ID', dataIndex: 'leagueId', width: 90 },
                { title: '省联赛名称', dataIndex: 'leagueName', ellipsis: true },
                { title: '通信地址', dataIndex: 'leagueAddress', ellipsis: true },
                { title: '参赛人员名单', dataIndex: 'leagueMemberNames', ellipsis: true }
              ]}
            />
          </div>
        )}
      </Modal>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .ant-tabs-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
