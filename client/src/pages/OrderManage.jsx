import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Table, Typography, Space, message, Tag, Alert, Checkbox, Divider, Popconfirm, Descriptions } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api';

const { Title, Text } = Typography;

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

const STAGE_INFO = {
  OPEN_STAGE: { color: 'green', short: '开放报名期', text: '阶段 A：开放报名期 —— 可自由增删比赛，差额 100% 退补，免罚金' },
  PRE_MATCH_STAGE: { color: 'orange', short: '截止后至开赛前', text: '阶段 B：截止后至开赛前 —— 禁止增删单项，仅可整单取消并退还 50%' },
  STARTED_STAGE: { color: 'red', short: '比赛已开始', text: '阶段 C：比赛已开始 —— 系统锁定，禁止任何变更，概不退费' }
};

export default function OrderManage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [detail, setDetail] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newSelection, setNewSelection] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/matches')
      .then(res => setAllMatches(res.data))
      .catch(() => message.error('加载比赛字典数据失败'));
    loadMyOrders();
  }, []);

  const loadMyOrders = async () => {
    setListLoading(true);
    try {
      const res = await api.get('/api/my/orders');
      setMyOrders(res.data.items);
    } catch (err) {
      message.error(err.response?.data?.error || '加载我的报名失败');
    } finally {
      setListLoading(false);
    }
  };

  const loadOrder = async (orderNo) => {
    try {
      const res = await api.get(`/api/order/${encodeURIComponent(orderNo)}`);
      setDetail(res.data);
      setOrderNumber(orderNo);
      setEditMode(false);
      setNewSelection(res.data.order.items.map(i => i.matchNumber));
    } catch (err) {
      setDetail(null);
      message.error(err.response?.data?.error || '查询失败');
    }
  };

  const queryOrder = async () => {
    if (!orderNumber) return message.warning('请输入报名单编号');
    loadOrder(orderNumber.trim());
  };

  const handleModify = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/order/modify-items', {
        orderNumber,
        newMatchNumbers: newSelection
      });
      const delta = res.data.delta;
      if (delta > 0) message.success(`调整成功，已通过银行补扣差额 ¥${delta}.00`);
      else if (delta < 0) message.success(`调整成功，差额 ¥${Math.abs(delta)}.00 已原路退回`);
      else message.success('调整成功，费用无变化');
      setEditMode(false);
      loadOrder(orderNumber);
      loadMyOrders();
    } catch (err) {
      message.error(err.response?.data?.error || '调整失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/order/cancel', { orderNumber });
      message.success(`${res.data.message} 实际退款：¥${res.data.refundAmount}.00（${res.data.refundRate * 100}%）`);
      loadOrder(orderNumber);
      loadMyOrders();
    } catch (err) {
      message.error(err.response?.data?.error || '取消失败');
    } finally {
      setLoading(false);
    }
  };

  const newTotalFee = newSelection.reduce((sum, no) => {
    const m = allMatches.find(item => item.matchNumber === no);
    return sum + (m ? m.entryFee : 0);
  }, 0);

  const order = detail?.order;
  const stage = detail?.stage;
  const stageInfo = stage ? STAGE_INFO[stage] : null;

  return (
    <div className="page-fade" style={{ maxWidth: 1000, margin: '24px auto' }}>
      <div className="page-hero">
        <h3 className="hero-title">我的报名 / 退改管理</h3>
        <div className="hero-sub">本账号名下全部报名单一览，按当前业务阶段执行增删项目或梯级退费</div>
      </div>
      <Card className="pretty-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>我的报名单</Title>
          <Button icon={<ReloadOutlined />} onClick={loadMyOrders} loading={listLoading}>刷新</Button>
        </div>
        <Table
          rowKey={r => r.order.orderNumber}
          size="middle"
          loading={listLoading}
          dataSource={myOrders}
          pagination={false}
          locale={{ emptyText: '当前账号还没有报名记录，请前往"省联赛报名通道"提交报名。' }}
          onRow={r => ({ onClick: () => loadOrder(r.order.orderNumber), style: { cursor: 'pointer' } })}
          columns={[
            { title: '报名单编号', dataIndex: ['order', 'orderNumber'] },
            { title: '省联赛名称', dataIndex: ['league', 'leagueName'], ellipsis: true },
            { title: '场次', render: r => r.order.items.length },
            { title: '实缴费用', render: r => `¥${r.order.paidFee}.00` },
            {
              title: '状态',
              render: r => r.order.status === 'PAID'
                ? <Tag color="green">已结算</Tag>
                : <Tag>已取消</Tag>
            },
            {
              title: '当前阶段',
              render: r => r.stage
                ? <Tag color={STAGE_INFO[r.stage].color}>{STAGE_INFO[r.stage].short}</Tag>
                : '-'
            },
            { title: '报名时间', render: r => new Date(r.order.createdAt).toLocaleString() }
          ]}
        />
      </Card>

      <Card className="pretty-card">
        <Title level={4}>报名单退改管理</Title>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="也可手动输入报名单编号查询"
            style={{ width: 360 }}
            value={orderNumber}
            onChange={e => setOrderNumber(e.target.value)}
            onPressEnter={queryOrder}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={queryOrder}>查询报名单</Button>
        </Space>

        {detail && order && (
          <div>
            {stageInfo && <Alert type="info" showIcon message={<Tag color={stageInfo.color}>{stageInfo.text}</Tag>} style={{ marginBottom: 16 }} />}
            {order.status === 'CANCELLED' && (
              <Alert type="warning" showIcon message="该报名单已取消，相关退费已按规则原路退回。" style={{ marginBottom: 16 }} />
            )}

            <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="报名单编号" span={2}>{order.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={order.status === 'PAID' ? 'green' : 'default'}>{order.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="联赛 ID">{order.leagueId}</Descriptions.Item>
              <Descriptions.Item label="省联赛名称" span={2}>{detail.league?.leagueName}</Descriptions.Item>
              <Descriptions.Item label="实缴费用">¥{order.paidFee}.00</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{new Date(order.createdAt).toLocaleString()}</Descriptions.Item>
            </Descriptions>

            {!editMode ? (
              <Table
                rowKey="matchNumber"
                dataSource={order.items}
                pagination={false}
                style={{ marginBottom: 16 }}
                columns={[
                  { title: '比赛编号', dataIndex: 'matchNumber', render: t => `#${t}` },
                  { title: '赛事类别', dataIndex: 'category', render: c => CATEGORY_LABELS[c] || c },
                  { title: '赛事级别', dataIndex: 'level', render: l => <Tag color="blue">{LEVEL_LABELS[l] || l}</Tag> },
                  { title: '单项规费', dataIndex: 'fee', render: f => `¥${f}.00` }
                ]}
              />
            ) : (
              <Card type="inner" title="调整参赛项目（开放报名期内免罚金差额退补）" style={{ marginBottom: 16 }}>
                <Checkbox.Group style={{ width: '100%' }} value={newSelection} onChange={setNewSelection}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {allMatches.map(m => (
                      <Checkbox key={m.matchNumber} value={m.matchNumber}>
                        <Text strong>#{m.matchNumber}</Text> {CATEGORY_LABELS[m.category]} -
                        级别: <Tag color="blue">{LEVEL_LABELS[m.level]}</Tag> -
                        开赛: {new Date(m.startTime).toLocaleDateString()} -
                        <Text type="danger">¥{m.entryFee}</Text>
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
                <Divider />
                <Text>调整后合计: <Text strong type="danger">¥{newTotalFee}.00</Text>
                  {newTotalFee > order.paidFee && `（需补缴 ¥${newTotalFee - order.paidFee}.00）`}
                  {newTotalFee < order.paidFee && `（将退回 ¥${order.paidFee - newTotalFee}.00）`}
                </Text>
              </Card>
            )}

            {order.status === 'PAID' && (
              <Space>
                {stage === 'OPEN_STAGE' && !editMode && (
                  <Button icon={<EditOutlined />} onClick={() => setEditMode(true)}>增删比赛项目</Button>
                )}
                {editMode && (
                  <>
                    <Button type="primary" loading={loading} onClick={handleModify}>确认调整并结算差额</Button>
                    <Button onClick={() => setEditMode(false)}>放弃修改</Button>
                  </>
                )}
                {!editMode && (
                  <Popconfirm
                    title="确认取消全部报名？"
                    description={
                      stage === 'OPEN_STAGE' ? '开放报名期内取消将 100% 全额退款，免罚金。' :
                      stage === 'PRE_MATCH_STAGE' ? '当前阶段取消将扣除 50% 违约金，仅退还 50% 报名费。' :
                      '比赛已开始，取消将不予退款。'
                    }
                    onConfirm={handleCancel}
                    okText="确认取消报名"
                    cancelText="再想想"
                  >
                    <Button danger icon={<DeleteOutlined />} loading={loading}>取消全部报名</Button>
                  </Popconfirm>
                )}
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => window.open(`/print-voucher?leagueId=${order.leagueId}`, '_blank')}
                >
                  打印报名凭证
                </Button>
              </Space>
            )}

            {detail.transactions?.length > 0 && (
              <>
                <Divider />
                <Title level={5}>银行资金流水台账</Title>
                <Table
                  rowKey="txnId"
                  size="small"
                  dataSource={detail.transactions}
                  pagination={false}
                  columns={[
                    { title: '流水号', dataIndex: 'txnId', ellipsis: true },
                    { title: '类型', dataIndex: 'type', render: t => <Tag>{t}</Tag> },
                    { title: '金额', dataIndex: 'amount', render: a => `¥${a}.00` },
                    { title: '状态', dataIndex: 'status' },
                    { title: '时间', dataIndex: 'createdAt', render: d => new Date(d).toLocaleString() }
                  ]}
                />
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
