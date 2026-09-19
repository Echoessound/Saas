import React, { useState, useEffect } from 'react';
import { Card, Tabs, Input, Button, Table, Space, message, Tag, Alert, Statistic, Row, Col, Progress } from 'antd';
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

export default function CommitteeDashboard() {
  const [stats, setStats] = useState(null);

  const [leagueId, setLeagueId] = useState('');
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
  }, []);

  // 职能 1: 查某省联赛已报项目
  const queryLeagueMatches = async () => {
    if (!leagueId) return message.warning('请输入省联赛 ID');
    try {
      const res = await api.get(`/api/committee/league-matches/${leagueId}`);
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

  const tabItems = [
    {
      key: '0',
      label: <span><BarChartOutlined /> 统计总览</span>,
      children: stats ? (
        <div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}><Card className="stat-card stat-blue"><Statistic title="参赛省联赛数" value={stats.overview.leagueCount} /></Card></Col>
            <Col span={6}><Card className="stat-card stat-green"><Statistic title="生效报名单" value={stats.overview.paidCount} /></Card></Col>
            <Col span={6}><Card className="stat-card stat-amber"><Statistic title="已取消报名单" value={stats.overview.cancelledCount} /></Card></Col>
            <Col span={6}><Card className="stat-card stat-navy"><Statistic title="实收金额 (¥)" value={stats.overview.netRevenue} precision={2} /></Card></Col>
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
                    { title: '收费合计', dataIndex: 'feeTotal', render: f => `¥${f}.00` }
                  ]}
                />
              </Card>
            </Col>
            <Col span={10}>
              <Card title="赛事类别分布（按收费额）" size="small">
                {stats.perCategory.map(c => (
                  <div key={c.category} style={{ marginBottom: 12 }}>
                    <div style={{ marginBottom: 4 }}>
                      {CATEGORY_LABELS[c.category] || c.category} —— {c.itemCount} 项 / ¥{c.feeTotal}.00
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
                    { title: '流水类型', dataIndex: 'type', render: t => <Tag>{t}</Tag> },
                    { title: '笔数', dataIndex: 'count' },
                    { title: '金额合计', dataIndex: 'total', render: t => `¥${t}.00` }
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
          <Space style={{ marginBottom: 16 }} className="no-print">
            <Input
              placeholder="输入省联赛 ID (如 1001)"
              value={leagueId}
              onChange={e => setLeagueId(e.target.value)}
              onPressEnter={queryLeagueMatches}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={queryLeagueMatches}>查询</Button>
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
              { title: '单项规费', dataIndex: 'fee', render: f => `¥${f}.00` }
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
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .ant-tabs-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
