import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Spin, Typography, message } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import api from '../api';
import crypto from 'crypto-js';

const { Title, Text } = Typography;

const CATEGORY_LABELS = {
  Basketball: '篮球 (Basketball)',
  Football: '足球 (Football)',
  Volleyball: '排球 (Volleyball)'
};

const LEVEL_LABELS = {
  Beginner: '初级 (Beginner)',
  Intermediate: '中级 (Intermediate)',
  Advanced: '高级 (Advanced)'
};

function makeAuthCode(orderNumber, leagueId) {
  const hex = crypto.MD5(`${orderNumber}|${leagueId}|NATIONAL-SPORTS`).toString().toUpperCase();
  return `AUTH-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

export default function PrintVoucher() {
  const [params] = useSearchParams();
  const leagueId = params.get('leagueId');
  const [voucherData, setVoucherData] = useState(null);

  useEffect(() => {
    if (leagueId) {
      api.get(`/api/voucher/${leagueId}`)
        .then(res => setVoucherData(res.data))
        .catch(() => message.error('获取报名记录凭证失败'));
    }
  }, [leagueId]);

  if (!voucherData) {
    return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;
  }

  const { league, order } = voucherData;

  if (!order) {
    return (
      <div style={{ textAlign: 'center', marginTop: 100 }}>
        <Title level={4}>该省联赛当前没有生效中的报名单（可能已取消）</Title>
      </div>
    );
  }

  return (
    <div className="page-fade" style={{ padding: 24, maxWidth: 840, margin: '0 auto' }}>
      <div className="no-print" style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" size="large" icon={<PrinterOutlined />} onClick={() => window.print()}>
          打印凭证 (Print Slip)
        </Button>
      </div>

      <div className="voucher-paper" style={{ padding: 40, backgroundColor: '#fff' }}>
        <div className="voucher-head">
          <Title level={2} style={{ margin: 0, letterSpacing: 6, color: '#1a3a6b' }}>全国体育赛事报名确认单与存根</Title>
          <Text style={{ color: '#5a7099', letterSpacing: 2, fontSize: 12 }}>NATIONAL SPORTS REGISTRATION CONFIRMATION VOUCHER</Text>
        </div>

        <table className="voucher-table" style={{ width: '100%', marginTop: 24, borderCollapse: 'collapse' }} border="1" cellPadding="10">
          <tbody>
            <tr>
              <td style={{ width: '20%', fontWeight: 'bold', background: '#f4f7fc', color: '#1a3a6b' }}>联赛分配 ID:</td>
              <td style={{ width: '30%', fontWeight: 'bold', fontSize: 16 }}>{league.leagueId}</td>
              <td style={{ width: '20%', fontWeight: 'bold', background: '#f4f7fc', color: '#1a3a6b' }}>单据流水号:</td>
              <td style={{ width: '30%' }}>{order.orderNumber}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', background: '#f4f7fc', color: '#1a3a6b' }}>参赛省联赛:</td>
              <td colSpan={3}>{league.leagueName}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', background: '#f4f7fc', color: '#1a3a6b' }}>通信地址:</td>
              <td colSpan={3}>{league.leagueAddress}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', background: '#f4f7fc', color: '#1a3a6b' }}>参赛人员名单:</td>
              <td colSpan={3} style={{ whiteSpace: 'pre-wrap' }}>{league.leagueMemberNames}</td>
            </tr>
          </tbody>
        </table>

        <Title level={4} style={{ marginTop: 28, marginBottom: 12, color: '#1a3a6b' }}>已选报参赛项目明细</Title>
        <table className="voucher-table" style={{ width: '100%', borderCollapse: 'collapse' }} border="1" cellPadding="10">
          <thead>
            <tr style={{ background: '#eef3fb', textAlign: 'center', color: '#1a3a6b' }}>
              <th>比赛编号</th>
              <th>赛事类别 (Category)</th>
              <th>赛事级别 (Level)</th>
              <th>缴费金额</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.matchNumber} style={{ textAlign: 'center' }}>
                <td>#{item.matchNumber}</td>
                <td>{CATEGORY_LABELS[item.category] || item.category}</td>
                <td>{LEVEL_LABELS[item.level] || item.level}</td>
                <td>¥{item.fee}.00</td>
                <td>银行划转成功</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ margin: '6px 0', fontSize: 15 }}>实缴报名费: <strong style={{ color: '#c0392b' }}>RMB ¥{order.paidFee}.00 元</strong></p>
            <p style={{ margin: '6px 0' }}>单据生成时间: {new Date(order.createdAt).toLocaleString()}</p>
            <p style={{ margin: '6px 0', fontSize: 12, color: '#5a7099', letterSpacing: 1 }}>
              安全核验防伪码: {makeAuthCode(order.orderNumber, league.leagueId)}
            </p>
          </div>
          <div className="voucher-seal">
            全国体育赛事<br />管理委员会<br />（盖章处）
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; margin: 0; padding: 0; }
          .voucher-paper { box-shadow: none !important; }
        }
        @page { size: A4; margin: 18mm; }
      `}</style>
    </div>
  );
}
