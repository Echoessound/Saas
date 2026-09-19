import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorInfo: '#2563eb',
          borderRadius: 8,
          colorBgLayout: '#eef2f8',
          colorTextBase: '#1f2d3d',
          fontSize: 14
        },
        components: {
          Layout: { headerBg: 'transparent', headerHeight: 64 },
          Card: { paddingLG: 24 },
          Menu: { darkItemBg: 'transparent', darkSubMenuItemBg: 'transparent' },
          Button: { fontWeight: 500 }
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
