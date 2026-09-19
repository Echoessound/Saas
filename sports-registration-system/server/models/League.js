const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
  leagueId: { type: Number, unique: true, required: true, index: true },
  leagueName: { type: String, required: true, trim: true },
  leagueAddress: { type: String, required: true },
  leagueMemberNames: { type: String, required: true },
  ownerUsername: { type: String, index: true, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('League', leagueSchema);
