/**
 * 梯级退费规则计算引擎
 *
 * 业务时态状态机（以报名单所包含比赛的最早开赛时间 T_earliest 为基准）：
 *   阶段 A（开放报名期）: now <= T_earliest - 30天  -> 100% 差额退补，免罚金
 *   阶段 B（截止后至开赛前）: T_earliest - 30天 < now < T_earliest -> 仅可整单取消，退 50%
 *   阶段 C（比赛开始后）: now >= T_earliest -> 完全锁定，0% 退款
 */
class FeeEngine {
  /**
   * 判定并计算取消全部报名的退费金额与比例
   * @param {number} originalPaidFee 原始支付总额
   * @param {Date} earliestStartTime 报名的所有比赛中最早开赛时间
   * @param {Date} now 当前系统判定时间
   */
  static calculateCancellation(originalPaidFee, earliestStartTime, now = new Date()) {
    const deadline = new Date(earliestStartTime.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (now <= deadline) {
      return {
        allowed: true,
        refundRate: 1.0,
        refundAmount: originalPaidFee,
        stage: 'OPEN_STAGE',
        message: '当前处于开放报名期，允许取消报名，按原路全额退还，无罚金。'
      };
    } else if (now > deadline && now < earliestStartTime) {
      return {
        allowed: true,
        refundRate: 0.5,
        refundAmount: Number((originalPaidFee * 0.5).toFixed(2)),
        stage: 'PRE_MATCH_STAGE',
        message: '报名通道已关闭，按赛事规则扣除 50% 违约金，退还 50% 原始报名费。'
      };
    } else {
      return {
        allowed: false,
        refundRate: 0.0,
        refundAmount: 0,
        stage: 'STARTED_STAGE',
        message: '比赛已正式开始，根据章程概不办理退费。'
      };
    }
  }

  /**
   * 判定当前所处业务阶段（用于前端展示与操作约束）
   */
  static getStage(earliestStartTime, now = new Date()) {
    const deadline = new Date(earliestStartTime.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (now <= deadline) return 'OPEN_STAGE';
    if (now < earliestStartTime) return 'PRE_MATCH_STAGE';
    return 'STARTED_STAGE';
  }

  /**
   * 判定当前时间是否允许单项微调（增减比赛）
   */
  static canModifyItems(earliestStartTime, now = new Date()) {
    return FeeEngine.getStage(earliestStartTime, now) === 'OPEN_STAGE';
  }
}

module.exports = FeeEngine;
