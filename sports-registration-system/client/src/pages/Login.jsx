import React, { useState } from 'react';
import { Tabs, Form, Input, Button, Radio, message } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { login } = useAuth();
  const navigate = useNavigate();

  const doLogin = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', values);
      login(res.data.token, res.data.user);
      message.success(`欢迎，${res.data.user.displayName}！`);
      navigate(res.data.user.role === 'COMMITTEE_ADMIN' ? '/committee' : '/', { replace: true });
    } catch (err) {
      message.error(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async (values) => {
    setLoading(true);
    try {
      await axios.post('/api/auth/register', {
        username: values.username,
        password: values.password,
        displayName: values.displayName,
        role: values.role
      });
      message.success('注册成功，请登录');
      setActiveTab('login');
    } catch (err) {
      message.error(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="login-brand-side">
          <div>
            <div className="brand">
              <div className="brand-badge"><TrophyOutlined /></div>
              <div>
                <div className="brand-title">全国体育赛事</div>
                <div className="brand-sub">ONLINE REGISTRATION</div>
              </div>
            </div>
            <div className="slogan">一站式赛事报名<br />与凭证管理平台</div>
            <div className="slogan-en">SIMPLE · SECURE · TRACEABLE</div>
          </div>
          <div>
            <div className="login-feature"><span className="dot" />三步极简报名，银行级资金清算</div>
            <div className="login-feature"><span className="dot" />梯级退费状态机，规则透明可溯</div>
            <div className="login-feature"><span className="dot" />A4 防伪凭单，一键原生打印</div>
          </div>
        </div>

        <div className="login-form-side">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            items={[
              {
                key: 'login',
                label: '登 录',
                children: (
                  <Form layout="vertical" onFinish={doLogin} style={{ marginTop: 8 }}>
                    <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                      <Input prefix={<UserOutlined style={{ color: '#9aa7ba' }} />} placeholder="演示账号: rep001 / admin" size="large" />
                    </Form.Item>
                    <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                      <Input.Password prefix={<LockOutlined style={{ color: '#9aa7ba' }} />} placeholder="rep001: 123456 · admin: admin123" size="large" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ marginTop: 4 }}>
                      登 录
                    </Button>
                  </Form>
                )
              },
              {
                key: 'register',
                label: '注 册',
                children: (
                  <Form layout="vertical" onFinish={doRegister} initialValues={{ role: 'LEAGUE_REP' }} style={{ marginTop: 8 }}>
                    <Form.Item name="displayName" label="姓名 / 单位名称" rules={[{ required: true, message: '请输入姓名或单位名称' }]}>
                      <Input prefix={<IdcardOutlined style={{ color: '#9aa7ba' }} />} placeholder="例：湖北省联赛工作小组" />
                    </Form.Item>
                    <Form.Item
                      name="username" label="用户名"
                      rules={[
                        { required: true, message: '请输入用户名' },
                        { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '3-20 位字母、数字或下划线' }
                      ]}
                    >
                      <Input prefix={<UserOutlined style={{ color: '#9aa7ba' }} />} placeholder="登录用户名" />
                    </Form.Item>
                    <Form.Item
                      name="password" label="密码"
                      rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少 6 位' }]}
                    >
                      <Input.Password prefix={<LockOutlined style={{ color: '#9aa7ba' }} />} placeholder="至少 6 位" />
                    </Form.Item>
                    <Form.Item
                      name="confirm" label="确认密码" dependencies={['password']}
                      rules={[
                        { required: true, message: '请再次输入密码' },
                        ({ getFieldValue }) => ({
                          validator: (_, v) => (!v || v === getFieldValue('password'))
                            ? Promise.resolve() : Promise.reject(new Error('两次输入的密码不一致'))
                        })
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined style={{ color: '#9aa7ba' }} />} placeholder="再次输入密码" />
                    </Form.Item>
                    <Form.Item name="role" label="账号角色" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                      <Radio.Group>
                        <Radio.Button value="LEAGUE_REP">省联赛经办人</Radio.Button>
                        <Radio.Button value="COMMITTEE_ADMIN">组委会管理员</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>注 册</Button>
                  </Form>
                )
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
