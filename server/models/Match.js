const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  matchNumber: { type: Number, required: true, unique: true, index: true },
  category: {
    type: String,
    enum: ['Basketball', 'Football', 'Volleyball'],
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  startTime: { type: Date, required: true },
  entryFee: { type: Number, required: true, default: 1000 }
});

module.exports = mongoose.model('Match', matchSchema);
