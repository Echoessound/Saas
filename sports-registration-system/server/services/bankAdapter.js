const crypto = require('crypto');

/**
 * 模拟各省银行系统与组委会银行系统的跨行划转与原路退回
 * （幂等性说明：每笔操作生成全局唯一流水号 txnId，台账唯一索引兜底，
 *   重复请求不会产生重复账务记录）
 */
class BankAdapter {
  static async transferPayment(leagueId, amount) {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const txnId = `BANK-PAY-${Date.now()}-${randomHex}`;
    console.log(`[银行清算网关] 扣款执行: 省联赛 ID=${leagueId} -> 组委会专户 | 划转金额: ¥${amount} | 流水号: ${txnId}`);
    return { success: true, txnId };
  }

  static async transferRefund(leagueId, amount, reason) {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const txnId = `BANK-REF-${Date.now()}-${randomHex}`;
    console.log(`[银行清算网关] 原路退还: 组委会专户 -> 省联赛 ID=${leagueId} | 退款金额: ¥${amount} | 原因: ${reason} | 流水号: ${txnId}`);
    return { success: true, txnId };
  }
}

module.exports = BankAdapter;
