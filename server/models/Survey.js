const mongoose = require('mongoose');

const SurveySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: String,
  category: { 
    type: String, 
    enum: ['Tez', 'Araştırma', 'Psikoloji', 'Oyun', 'Sosyal', 'İş Dünyası', 'Diğer'],
    default: 'Diğer'
  },
  externalLink: { type: String, required: true },
  targetCount: Number,
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Survey', SurveySchema);