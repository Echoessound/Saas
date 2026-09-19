const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  matchNumber: { type: Number, required: true },
  category: { type: String, required: true },
  level: { type: String, required: true },
  fee: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  leagueId: { type: Number, required: true, index: true },
  items: [orderItemSchema],
  totalFee: { type: Number, required: true },
  paidFee: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['PENDING_PAY', 'PAID', 'CANCELLED'],
    default: 'PENDING_PAY'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const bankTransactionSchema = new mongoose.Schema({
  txnId: { type: String, required: true, unique: true },
  orderNumber: { type: String, required: true, index: true },
  leagueId: { type: Number, required: true },
  amount: { type: Number, required: true },
  type: {
    type: String,
    enum: ['PAYMENT', 'ADDITIONAL_PAY', 'OPEN_REFUND', 'CANCEL_50_REFUND'],
    required: true
  },
  status: { type: String, default: 'SUCCESS' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Order: mongoose.model('Order', orderSchema),
  BankTransaction: mongoose.model('BankTransaction', bankTransactionSchema)
};
