import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Typography, Space, message, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TrophyOutlined, SolutionOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api';

const { Title } = Typography;

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

export default function AdminManage() {
  const [matches, setMatches] = useState([]);
  const [referees, setReferees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [matchModal, setMatchModal] = useState({ open: false, editing: null });
  const [refereeModal, setRefereeModal] = useState({ open: false, editing: null });
  const [matchForm] = Form.useForm();
  const [refereeForm] = Form.useForm();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [m, r] = await Promise.all([
        api.get('/api/admin/matches'),
        api.get('/api/admin/referees')
      ]);
      setMatches(m.data);
      setReferees(r.data);
    } catch (err) {
      message.error(err.response?.data?.error || '加载管理数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ---------------- 比赛管理 ----------------

  const openMatchModal = (editing) => {
    setMatchModal({ open: true, editing });
    if (editing) {
      matchForm.setFieldsValue({
        matchNumber: editing.matchNumber,
        category: editing.category,
        level: editing.level,
        startTime: dayjs(editing.startTime),
        entryFee: editing.entryFee
      });
    } else {
      matchForm.resetFields();
    }
  };

  const submitMatch = async (values) => {
    const payload = {
      matchNumber: values.matchNumber,
      category: values.category,
      level: values.level,
      startTime: values.startTime.toISOString(),
      entryFee: values.entryFee
    };
    try {
      if (matchModal.editing) {
        await api.put(`/api/admin/matches/${matchModal.editing.matchNumber}`, payload);
        message.success('比赛信息已更新');
      } else {
        await api.post('/api/admin/matches', payload);
        message.success('新比赛已创建');
      }
      setMatchModal({ open: false, editing: null });
      loadAll();
    } catch (err) {
      message.error(err.response?.data?.error || '保存失败');
    }
  };

  const deleteMatch = async (matchNumber) => {
    try {
      await api.delete(`/api/admin/matches/${matchNumber}`);
      message.success(`比赛 #${matchNumber} 已删除`);
      loadAll();
    } catch (err) {
      message.error(err.response?.data?.error || '删除失败');
    }
  };

  // ---------------- 裁判指派管理 ----------------

  const openRefereeModal = (editing) => {
    setRefereeModal({ open: true, editing });
    if (editing) {
      refereeForm.setFieldsValue({
        refereeName: editing.refereeName,
        assignedMatchNumber: editing.assignedMatchNumber,
        refereeAddress: editing.refereeAddress,
        organization: editing.organization
      });
    } else {
      refereeForm.resetFields();
    }
  };

  const submitReferee = async (values) => {
    try {
      if (refereeModal.editing) {
        await api.put(`/api/admin/referees/${refereeModal.editing._id}`, values);
        message.success('裁判指派已更新');
      } else {
        await api.post('/api/admin/referees', values);
        message.success('裁判指派已创建');
      }
      setRefereeModal({ open: false, editing: null });
      loadAll();
    } catch (err) {
      message.error(err.response?.data?.error || '保存失败');
    }
  };

  const deleteReferee = async (id) => {
    try {
      await api.delete(`/api/admin/referees/${id}`);
      message.success('裁判指派记录已删除');
      loadAll();
    } catch (err) {
      message.error(err.response?.data?.error || '删除失败');
    }
  };

  const matchColumns = [
    { title: '比赛编号', dataIndex: 'matchNumber', render: t => <strong>#{t}</strong>, width: 100 },
    { title: '类别', dataIndex: 'category', render: c => CATEGORY_LABELS[c] || c },
    { title: '级别', dataIndex: 'level', render: l => <Tag color="blue">{LEVEL_LABELS[l] || l}</Tag> },
    { title: '开赛时间', dataIndex: 'startTime', render: d => new Date(d).toLocaleString() },
    { title: '报名费', dataIndex: 'entryFee', render: f => `¥${f}.00` },
    {
      title: '生效报名',
      dataIndex: 'paidOrderRefs',
      render: n => n > 0 ? <Tag color="orange">{n} 笔</Tag> : <Tag color="green">无</Tag>
    },
    {
      title: '操作',
      width: 180,
      render: (_, m) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openMatchModal(m)}>编辑</Button>
          <Popconfirm
            title={`确认删除比赛 #${m.matchNumber}？`}
            description={m.paidOrderRefs > 0 ? '该比赛已有生效报名，后端将拒绝删除。' : '删除后其裁判指派将一并清除。'}
            onConfirm={() => deleteMatch(m.matchNumber)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={m.paidOrderRefs > 0}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const refereeColumns = [
    { title: '裁判姓名', dataIndex: 'refereeName' },
    { title: '指派比赛', dataIndex: 'assignedMatchNumber', render: t => `#${t}` },
    { title: '所属单位', dataIndex: 'organization', ellipsis: true },
    { title: '通信地址', dataIndex: 'refereeAddress', ellipsis: true },
    {
      title: '操作',
      width: 180,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openRefereeModal(r)}>编辑</Button>
          <Popconfirm title="确认删除该裁判指派记录？" onConfirm={() => deleteReferee(r._id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="page-fade" style={{ maxWidth: 1100, margin: '24px auto' }}>
      <div className="page-hero">
        <h3 className="hero-title">赛事与裁判管理</h3>
        <div className="hero-sub">比赛项目字典与裁判执裁指派的维护（有生效报名的比赛受保护）</div>
      </div>
      <Card
        className="pretty-card"
        style={{ marginBottom: 16 }}
        title={<Title level={4} style={{ margin: 0 }}><TrophyOutlined /> 比赛项目管理</Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openMatchModal(null)}>新增比赛</Button>}
      >
        <Table rowKey="matchNumber" loading={loading} dataSource={matches} columns={matchColumns} pagination={false} />
      </Card>

      <Card
        className="pretty-card"
        title={<Title level={4} style={{ margin: 0 }}><SolutionOutlined /> 裁判指派管理</Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openRefereeModal(null)}>新增指派</Button>}
      >
        <Table rowKey="_id" loading={loading} dataSource={referees} columns={refereeColumns} pagination={false} />
      </Card>

      <Modal
        title={matchModal.editing ? `编辑比赛 #${matchModal.editing.matchNumber}` : '新增比赛'}
        open={matchModal.open}
        onCancel={() => setMatchModal({ open: false, editing: null })}
        onOk={() => matchForm.validateFields().then(submitMatch)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={matchForm} layout="vertical">
          <Form.Item name="matchNumber" label="比赛编号" rules={[{ required: true, message: '请输入比赛编号' }]}>
            <InputNumber style={{ width: '100%' }} min={1} disabled={!!matchModal.editing} placeholder="例：401" />
          </Form.Item>
          <Form.Item name="category" label="赛事类别" rules={[{ required: true, message: '请选择类别' }]}>
            <Select options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="level" label="赛事级别" rules={[{ required: true, message: '请选择级别' }]}>
            <Select options={Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="startTime" label="开赛时间" rules={[{ required: true, message: '请选择开赛时间' }]}>
            <DatePicker style={{ width: '100%' }} showTime />
          </Form.Item>
          <Form.Item name="entryFee" label="报名规费 (¥)" rules={[{ required: true, message: '请输入费用' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={100} placeholder="例：1000" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={refereeModal.editing ? '编辑裁判指派' : '新增裁判指派'}
        open={refereeModal.open}
        onCancel={() => setRefereeModal({ open: false, editing: null })}
        onOk={() => refereeForm.validateFields().then(submitReferee)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={refereeForm} layout="vertical">
          <Form.Item name="refereeName" label="裁判姓名" rules={[{ required: true, message: '请输入裁判姓名' }]}>
            <Input placeholder="例：张建国" />
          </Form.Item>
          <Form.Item name="assignedMatchNumber" label="指派比赛" rules={[{ required: true, message: '请选择比赛' }]}>
            <Select
              options={matches.map(m => ({
                value: m.matchNumber,
                label: `#${m.matchNumber} ${CATEGORY_LABELS[m.category]} / ${LEVEL_LABELS[m.level]}`
              }))}
            />
          </Form.Item>
          <Form.Item name="organization" label="所属单位" rules={[{ required: true, message: '请输入所属单位' }]}>
            <Input placeholder="例：中国篮球协会裁判委员会" />
          </Form.Item>
          <Form.Item name="refereeAddress" label="通信地址" rules={[{ required: true, message: '请输入通信地址' }]}>
            <Input placeholder="例：北京市海淀区中关村南大街1号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
