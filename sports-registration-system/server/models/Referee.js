const mongoose = require('mongoose');

const refereeSchema = new mongoose.Schema({
  refereeName: { type: String, required: true, index: true },
  assignedMatchNumber: { type: Number, required: true, index: true },
  refereeAddress: { type: String, required: true },
  organization: { type: String, required: true }
});

module.exports = mongoose.model('Referee', refereeSchema);
