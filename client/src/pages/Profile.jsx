import React from 'react';
import { Card, Descriptions, Form, Input, Button, Typography, message, Tag, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../api';
import { useAuth } from '../AuthContext';

const { Title } = Typography;

const ROLE_LABELS = {
  LEAGUE_REP: '省联赛经办人',
  COMMITTEE_ADMIN: '组委会管理员'
};

export default function Profile() {
  const { user } = useAuth();
  const [form] = Form.useForm();

  const changePassword = async (values) => {
    try {
      await api.post('/api/auth/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      message.success('密码修改成功，下次登录请使用新密码');
      form.resetFields();
    } catch (err) {
      message.error(err.response?.data?.error || '修改失败');
    }
  };

  return (
    <div className="page-fade" style={{ maxWidth: 720, margin: '24px auto' }}>
      <div className="page-hero">
        <h3 className="hero-title">个人中心</h3>
        <div className="hero-sub">账号信息查看与密码维护</div>
      </div>
      <Card className="pretty-card">
        <Title level={3}><UserOutlined /> 个人中心</Title>
        <Descriptions bordered column={1} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
          <Descriptions.Item label="姓名 / 单位">{user?.displayName}</Descriptions.Item>
          <Descriptions.Item label="账号角色">
            <Tag color={user?.role === 'COMMITTEE_ADMIN' ? 'geekblue' : 'green'}>
              {ROLE_LABELS[user?.role] || user?.role}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <Divider />
        <Title level={4}><LockOutlined /> 修改密码</Title>
        <Form form={form} layout="vertical" onFinish={changePassword} style={{ maxWidth: 400 }}>
          <Form.Item name="oldPassword" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
            <Input.Password placeholder="原密码" />
          </Form.Item>
          <Form.Item
            name="newPassword" label="新密码"
            rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '新密码至少 6 位' }]}
          >
            <Input.Password placeholder="至少 6 位" />
          </Form.Item>
          <Form.Item
            name="confirm" label="确认新密码" dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator: (_, v) => (!v || v === getFieldValue('newPassword'))
                  ? Promise.resolve() : Promise.reject(new Error('两次输入的密码不一致'))
              })
            ]}
          >
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit">确认修改</Button>
        </Form>
      </Card>
    </div>
  );
}
