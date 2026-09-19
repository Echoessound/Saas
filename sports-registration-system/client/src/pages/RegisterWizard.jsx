import React, { useState, useEffect } from 'react';
import { Form, Input, Card, Checkbox, Button, Steps, Typography, Alert, message, Divider, Space, Tag } from 'antd';
import { TrophyOutlined, BankOutlined, CheckCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
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

export default function RegisterWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [regResult, setRegResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/matches')
      .then(res => setMatches(res.data))
      .catch(() => message.error('加载比赛字典数据失败'));
  }, []);

  const totalFee = selectedMatches.reduce((sum, matchNo) => {
    const m = matches.find(item => item.matchNumber === matchNo);
    return sum + (m ? m.entryFee : 0);
  }, 0);

  const handleSubmit = async (values) => {
    if (selectedMatches.length === 0) {
      return message.error('请至少选报一场比赛项目。');
    }
    setLoading(true);
    try {
      const payload = {
        leagueName: values.leagueName,
        leagueAddress: values.leagueAddress,
        leagueMemberNames: values.leagueMemberNames,
        selectedMatchNumbers: selectedMatches
      };
      const res = await api.post('/api/register', payload);
      setRegResult(res.data.data);
      setCurrentStep(2);
      message.success('报名成功并已完成银行转账支付！');
    } catch (err) {
      message.error(err.response?.data?.error || '报名提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-fade" style={{ maxWidth: 900, margin: '24px auto' }}>
      <div className="page-hero">
        <h3 className="hero-title">省联赛参赛报名通道</h3>
        <div className="hero-sub">填写联赛档案 · 勾选参赛项目 · 银行在线划扣，三步完成报名</div>
      </div>
      <Card className="pretty-card" bordered={false}>
        <Steps
          current={currentStep}
          style={{ marginBottom: 32, marginTop: 8 }}
          items={[
            { title: '填写联赛档案' },
            { title: '挑选参赛比赛' },
            { title: '银行交费与凭单' }
          ]}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {currentStep === 0 && (
            <div>
              <Alert
                type="info"
                showIcon
                message="填报须知"
                description="本系统仅用于省联赛报名功能。开放报名期（开赛前 30 天以上）内可自由增删比赛并差额退补；距开赛 30 天内仅可整单取消并退还 50%；开赛后概不退费。提交成功后系统将自动生成联赛 ID。"
                style={{ marginBottom: 24 }}
              />
              <Form.Item
                name="leagueName"
                label="省联赛名称"
                rules={[{ required: true, message: '请输入省联赛全称' }]}
              >
                <Input placeholder="例：湖北省男子篮球联赛协会" size="large" />
              </Form.Item>
              <Form.Item
                name="leagueAddress"
                label="省联赛通信地址"
                rules={[{ required: true, message: '请输入通讯地址' }]}
              >
                <Input placeholder="例：武汉市武昌区体育馆路特1号" size="large" />
              </Form.Item>
              <Form.Item
                name="leagueMemberNames"
                label="参赛人员名单 (纯文本型)"
                rules={[{ required: true, message: '请输入队员名单' }]}
              >
                <Input.TextArea
                  placeholder="格式：领队：XXX；教练：XXX；队员：张三、李四、王五、赵六..."
                  rows={4}
                />
              </Form.Item>
              <Button type="primary" size="large" onClick={() => form.validateFields().then(() => setCurrentStep(1))}>
                下一步：选择比赛项目
              </Button>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <Title level={4}><TrophyOutlined /> 选择参赛项目（类别与级别）</Title>
              {['Basketball', 'Football', 'Volleyball'].map(cat => (
                <Card
                  key={cat}
                  type="inner"
                  className="match-category-card"
                  title={`赛事类别：${CATEGORY_LABELS[cat]}`}
                  style={{ marginBottom: 16 }}
                >
                  <Checkbox.Group
                    className="match-list"
                    style={{ width: '100%' }}
                    value={selectedMatches}
                    onChange={setSelectedMatches}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {matches.filter(m => m.category === cat).map(m => (
                        <Checkbox key={m.matchNumber} value={m.matchNumber} style={{ width: '100%' }}>
                          <div className={`match-option ${selectedMatches.includes(m.matchNumber) ? 'checked' : ''}`}>
                            <Text strong style={{ minWidth: 56 }}>#{m.matchNumber}</Text>
                            <Tag color="blue">{LEVEL_LABELS[m.level] || m.level}</Tag>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              开赛 {new Date(m.startTime).toLocaleDateString()}
                            </Text>
                            <Text type="danger" strong style={{ marginLeft: 'auto' }}>¥{m.entryFee}.00</Text>
                          </div>
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                </Card>
              ))}

              <Divider />
              <div className="checkout-bar">
                <div>
                  <Text style={{ fontSize: 15 }}>已选场次 <Text strong>{selectedMatches.length}</Text> 场</Text>
                  <Title level={3} type="danger" style={{ margin: 0 }}>总计费用 ¥{totalFee}.00</Title>
                </div>
                <Space>
                  <Button size="large" onClick={() => setCurrentStep(0)}>上一步</Button>
                  <Button type="primary" size="large" htmlType="submit" icon={<BankOutlined />} loading={loading}>
                    调用银行系统划款支付
                  </Button>
                </Space>
              </div>
            </div>
          )}

          {currentStep === 2 && regResult && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckCircleOutlined style={{ fontSize: 72, color: '#52c41a' }} />
              <Title level={2} style={{ marginTop: 16 }}>报名办理完成</Title>
              <Alert
                type="success"
                showIcon
                message={`系统分配联赛 ID (League ID): ${regResult.leagueId}`}
                description={`报名单编号: ${regResult.orderNumber} | 银行划拨金额: ¥${regResult.totalFee}.00 —— 请妥善保存联赛 ID 与报名单编号，可用于"我的报名 / 退改"页面随时查询、调整或取消。`}
                style={{ maxWidth: 560, margin: '20px auto', textAlign: 'left' }}
              />
              <Space style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PrinterOutlined />}
                  onClick={() => window.open(`/print-voucher?leagueId=${regResult.leagueId}`, '_blank')}
                >
                  打印参赛报名凭证记录 (Print Slip)
                </Button>
                <Button size="large" onClick={() => navigate('/manage')}>
                  前往我的报名
                </Button>
                <Button size="large" onClick={() => { form.resetFields(); setSelectedMatches([]); setRegResult(null); setCurrentStep(0); }}>
                  继续新的报名
                </Button>
              </Space>
            </div>
          )}
        </Form>
      </Card>
    </div>
  );
}
