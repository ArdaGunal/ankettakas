// server/models/Survey.js

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

    // --- YENİ EKLENEN SÜRE BİLGİSİ (ADIM 1) ---
    durationValue: { // Süre Değeri (Örn: 5)
        type: Number,
        required: true,
        default: 5,
        min: 1
    },
    durationUnit: { // Süre Birimi (Örn: min veya saat)
        type: String,
        enum: ['min', 'saat'],
        required: true,
        default: 'min'
    },
    // ------------------------------------------
    
  externalLink: { type: String, required: true },
  targetCount: Number,
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Survey', SurveySchema);