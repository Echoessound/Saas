import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Result, Button } from 'antd';
import { UserOutlined, LogoutOutlined, TrophyOutlined } from '@ant-design/icons';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import RegisterWizard from './pages/RegisterWizard';
import OrderManage from './pages/OrderManage';
import PrintVoucher from './pages/PrintVoucher';
import CommitteeDashboard from './pages/CommitteeDashboard';
import AdminManage from './pages/AdminManage';
import Profile from './pages/Profile';

const { Header, Content, Footer } = Layout;

function Forbidden() {
  return (
    <div className="page-fade">
      <Result
        status="403"
        title="403"
        subTitle="当前账号无权访问该页面。"
        extra={<Link to="/"><Button type="primary">返回首页</Button></Link>}
      />
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = user.role === 'COMMITTEE_ADMIN';
  const menuItems = isAdmin
    ? [
        { key: '/committee', label: <Link to="/committee">赛事组委会管理端</Link> },
        { key: '/admin', label: <Link to="/admin">赛事与裁判管理</Link> },
        { key: '/profile', label: <Link to="/profile">个人中心</Link> }
      ]
    : [
        { key: '/', label: <Link to="/">省联赛报名通道</Link> },
        { key: '/manage', label: <Link to="/manage">我的报名 / 退改</Link> },
        { key: '/profile', label: <Link to="/profile">个人中心</Link> }
      ];

  const userMenu = {
    items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: logout }]
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header className="app-header no-print" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="brand">
          <div className="brand-badge"><TrophyOutlined /></div>
          <div>
            <div className="brand-title">全国体育赛事在线报名系统</div>
            <div className="brand-sub">NATIONAL SPORTS REGISTRATION</div>
          </div>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          className="app-menu"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Dropdown menu={userMenu}>
          <div className="header-user">
            <Avatar size="small" icon={<UserOutlined />} style={{ background: 'rgba(255,255,255,0.2)' }} />
            <span>{user.displayName}</span>
          </div>
        </Dropdown>
      </Header>
      <Content style={{ padding: '0 24px', background: 'transparent' }}>
        <Routes>
          {isAdmin ? (
            <>
              <Route path="/" element={<Navigate to="/committee" replace />} />
              <Route path="/committee" element={<CommitteeDashboard />} />
              <Route path="/admin" element={<AdminManage />} />
              <Route path="/manage" element={<Forbidden />} />
            </>
          ) : (
            <>
              <Route path="/" element={<RegisterWizard />} />
              <Route path="/manage" element={<OrderManage />} />
              <Route path="/committee" element={<Forbidden />} />
              <Route path="/admin" element={<Forbidden />} />
            </>
          )}
          <Route path="/profile" element={<Profile />} />
          <Route path="/print-voucher" element={<PrintVoucher />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Content>
      <Footer className="app-footer no-print">
        全国体育赛事在线报名系统 · 软件工程课程设计 · 仅供教学演示
      </Footer>
    </Layout>
  );
}

function Root() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    if (location.pathname !== '/login') return <Navigate to="/login" replace />;
    return <Login />;
  }
  if (location.pathname === '/login') {
    return <Navigate to={user.role === 'COMMITTEE_ADMIN' ? '/committee' : '/'} replace />;
  }
  return <AppLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<Root />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
