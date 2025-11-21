const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  points: { type: Number, default: 0 }, // Sıralamayı belirleyen ana puan
  surveysFilled: { type: Number, default: 0 }, // İstatistik
  level: { type: String, enum: ['Bronz', 'Gümüş', 'Altın'], default: 'Bronz' },
  premium: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Seviye güncelleme metodu
UserSchema.methods.updateLevel = function() {
  if (this.points >= 75) this.level = 'Altın';
  else if (this.points >= 20) this.level = 'Gümüş';
  else this.level = 'Bronz';
};

module.exports = mongoose.model('User', UserSchema);