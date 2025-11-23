const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());
app.use(cors());

// GÜVENLİK: RATE LIMIT
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Çok fazla istek attınız, lütfen 15 dakika bekleyin." }
});
app.use(limiter);

const DB_FILE = path.join(__dirname, 'database.json');
let data = { users: [], surveys: [] };

// --- YARDIMCI FONKSİYONLAR (SENİN İSTEDİĞİN YENİ SİSTEM) ---

const getPointsForLevel = (level) => {
    if (level <= 1) return 0;

    // İlk 5 seviye: çok kolay geçiş (Senin Tablon)
    // Lvl 2: 1 puan
    // Lvl 3: 3 puan
    // Lvl 4: 5 puan
    // Lvl 5: 7 puan
    const easyLevels = [0, 1, 3, 5, 7]; 
    if (level <= 5) return easyLevels[level - 1];

    // Level 5 sonrası: yumuşak artış formülü
    return 7 + (level - 5) * 8 + ((level - 5) * (level - 6) * 3) / 2;
};

const calculateLevel = (points) => {
    let level = 1;
    // Bir sonraki seviyenin puanına yetiyor mu diye kontrol et
    while (points >= getPointsForLevel(level + 1)) {
        level++;
        if (level >= 50) return 50; // Max Level 50
    }
    return level;
};

const loadData = () => {
    if (fs.existsSync(DB_FILE)) {
        try { data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) {}
    } else { saveData(); }
};

const saveData = () => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("VERİTABANI KAYIT HATASI: JSON yazılırken sorun oluştu.", error.message);
    }
};

loadData(); 

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'Giriş yapmalısınız' });
    try {
        const decoded = jwt.verify(token, 'gizliSifre123');
        req.user = decoded;
        next();
    } catch (e) { res.status(400).json({ msg: 'Geçersiz token' }); }
};

// --- ROTALAR ---

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { return res.status(400).json({ msg: 'Lütfen geçerli bir e-posta adresi girin.' }); }
    if (data.users.find(u => u.email === email)) return res.status(400).json({ msg: 'Mail kayıtlı.' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { 
        id: Date.now().toString(), username, email, password: hashedPassword, 
        points: 0, lastBoostDate: null, boostsUsedToday: 0,
        bonusBoosts: 0, streakCount: 0, streakSurveyIds: [], nextStreakAvailableAt: null
    };
    data.users.push(newUser);
    saveData();
    res.json({ msg: 'Kayıt başarılı!' });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = data.users.find(u => u.email === email);
    if (!user) return res.status(400).json({ msg: 'Kullanıcı yok.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Şifre yanlış.' });
    const token = jwt.sign({ id: user.id, username: user.username }, 'gizliSifre123');
    res.json({ token, user: { username: user.username, points: user.points } });
});

app.get('/api/profile', auth, (req, res) => {
    const user = data.users.find(u => u.id === req.user.id);
    if (!user) return res.status(401).json({ msg: 'Oturum bilgileri bulunamadı.' });

    const userSurveys = data.surveys.filter(s => s.username === user.username);
    const currentLevel = calculateLevel(user.points);

    let totalRating = 0;
    let ratedSurveyCount = 0;
    userSurveys.forEach(s => { if (s.rating) { totalRating += s.rating; ratedSurveyCount++; } });
    const reputation = ratedSurveyCount > 0 ? (totalRating / ratedSurveyCount).toFixed(1) : "Yok";

    // Boost ve Anket Hakları (Seviye ile artan)
    const getDailyBoostLimit = (lvl) => (lvl < 2 ? 0 : lvl < 3 ? 1 : lvl < 5 ? 3 : lvl < 7 ? 5 : lvl < 10 ? 8 : 15);
    const getSurveyLimit = (lvl) => (lvl < 5 ? 2 : lvl < 10 ? 5 : lvl < 20 ? 10 : lvl < 30 ? 15 : 20);

    res.json({ 
        user: { 
            ...user, 
            level: currentLevel, 
            reputation, 
            boostLimit: getDailyBoostLimit(currentLevel), 
            surveyLimit: getSurveyLimit(currentLevel) 
        }, 
        surveys: userSurveys,
        progress: {
            current: user.points,
            next: getPointsForLevel(currentLevel + 1),
            floor: getPointsForLevel(currentLevel)
        }
    });
});

app.get('/api/leaderboard', (req, res) => {
    const leaderboard = [...data.users]
        .sort((a, b) => b.points - a.points)
        .slice(0, 50)
        .map(user => ({
            username: user.username,
            points: user.points,
            level: calculateLevel(user.points)
        }));
    res.json(leaderboard);
});

app.get('/api/surveys', (req, res) => {
    const sortedSurveys = [...data.surveys].sort((a, b) => {
        const dateA = new Date(a.lastBoostedAt || a.createdAt);
        const dateB = new Date(b.lastBoostedAt || b.createdAt);
        return dateB - dateA;
    });
    res.json(sortedSurveys);
});

app.get('/api/surveys/:id', (req, res) => {
    const survey = data.surveys.find(s => s._id === req.params.id);
    if(survey) res.json(survey); else res.status(404).json({ msg: 'Yok' });
});

app.post('/api/surveys', auth, (req, res) => {
    const { title, description, category, externalLink, durationValue, durationUnit } = req.body;
    
    // Tekrar limit hesapla (Güvenlik için)
    const user = data.users.find(u => u.id === req.user.id);
    const level = calculateLevel(user.points);
    const getSurveyLimit = (lvl) => (lvl < 5 ? 2 : lvl < 10 ? 5 : lvl < 20 ? 10 : lvl < 30 ? 15 : 20);
    const limit = getSurveyLimit(level);
    const userSurveyCount = data.surveys.filter(s => s.username === user.username).length;

    if (userSurveyCount >= limit) return res.status(403).json({ msg: `Limit doldu! Seviye ${level} limiti: ${limit}` });

    const newSurvey = {
        _id: Date.now().toString(), title, description, category, externalLink,
        durationValue: parseInt(durationValue) || 5, durationUnit: durationUnit || 'min',       
        clicks: 0, createdAt: new Date(), lastBoostedAt: new Date(),
        username: req.user.username, clickedBy: [], ratings: [], comments: [], rating: 0
    };
    data.surveys.unshift(newSurvey);
    saveData();
    res.json(newSurvey);
});

app.put('/api/surveys/:id', auth, (req, res) => {
    const index = data.surveys.findIndex(s => s._id === req.params.id);
    if (index === -1) return res.status(404).json({ msg: 'Yok' });
    if (data.surveys[index].username !== req.user.username) return res.status(403).json({ msg: 'Yetkisiz' });
    data.surveys[index] = { ...data.surveys[index], ...req.body };
    saveData();
    res.json({ msg: 'Güncellendi' });
});

app.delete('/api/surveys/:id', auth, (req, res) => {
    const index = data.surveys.findIndex(s => s._id === req.params.id);
    if (index === -1) return res.status(404).json({ msg: 'Yok' });
    if (data.surveys[index].username !== req.user.username) return res.status(403).json({ msg: 'Yetkisiz' });
    data.surveys.splice(index, 1);
    saveData();
    res.json({ msg: 'Silindi.' });
});

app.post('/api/boost/:id', auth, (req, res) => {
    const user = data.users.find(u => u.id === req.user.id);
    const survey = data.surveys.find(s => s._id === req.params.id);
    if (!survey) return res.status(404).json({ msg: 'Yok' });
    if (survey.username !== user.username) return res.status(403).json({ msg: 'Sadece kendi anketin!' });

    const currentLevel = calculateLevel(user.points);
    const getDailyBoostLimit = (lvl) => (lvl < 2 ? 0 : lvl < 3 ? 1 : lvl < 5 ? 3 : lvl < 7 ? 5 : lvl < 10 ? 8 : 15);
    const baseLimit = getDailyBoostLimit(currentLevel);
    const totalLimit = baseLimit + (user.bonusBoosts || 0); 
    const today = new Date().toDateString();

    if (user.lastBoostDate !== today) { user.boostsUsedToday = 0; user.lastBoostDate = today; user.bonusBoosts = 0; }
    if (user.boostsUsedToday >= totalLimit) return res.status(400).json({ msg: 'Günlük hak bitti!' });

    user.boostsUsedToday += 1;
    survey.lastBoostedAt = new Date();
    saveData();
    res.json({ msg: '🚀 Boostlandı!', remaining: totalLimit - user.boostsUsedToday });
});

app.post('/api/click/:id', async (req, res) => {
    const survey = data.surveys.find(s => s._id === req.params.id);
    if(!survey) return res.status(404).json({ msg: 'Yok' });
    
    const token = req.header('x-auth-token');
    let userId = null;
    let rewardMessage = '';

    if(token) { try { userId = jwt.verify(token, 'gizliSifre123').id; } catch(e) {} }

    if (userId) {
        const userIndex = data.users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            const user = data.users[userIndex]; 
            const historyIndex = survey.clickedBy.findIndex(log => log.userId === userId);
            const TWELVE_HOURS = 12 * 60 * 60 * 1000; 

            if (historyIndex > -1) {
                const timeDiff = Date.now() - survey.clickedBy[historyIndex].timestamp;
                if (timeDiff < TWELVE_HOURS) {
                    const rem = Math.ceil((TWELVE_HOURS - timeDiff) / (3600000));
                    return res.status(400).json({ msg: `${rem} saat bekle.` });
                } else { survey.clickedBy[historyIndex].timestamp = Date.now(); }
            } else { 
                survey.clickedBy.push({ userId, timestamp: Date.now() }); 
            }

            // PUAN GÜNCELLEMESİ
            data.users[userIndex].points += 1; 
            
            // GÖREV MANTIĞI
            const NOW = Date.now();
            if (!user.nextStreakAvailableAt || NOW > user.nextStreakAvailableAt) {
                if (!user.streakSurveyIds) user.streakSurveyIds = [];
                if (!user.streakSurveyIds.includes(survey._id)) {
                    user.streakCount = (user.streakCount || 0) + 1;
                    user.streakSurveyIds.push(survey._id);

                    if (user.streakCount >= 5) {
                        user.bonusBoosts = (user.bonusBoosts || 0) + 1;
                        user.streakCount = 0;
                        user.streakSurveyIds = [];
                        user.nextStreakAvailableAt = NOW + (2 * 60 * 60 * 1000);
                        rewardMessage = '🎁 TEBRİKLER! +1 Boost Hakkı kazandın!';
                    }
                }
            }
        }
    }

    survey.clicks += 1;
    saveData();
    res.json({ msg: 'OK', clicks: survey.clicks, reward: rewardMessage });
});

// OYLAMA (TEK HAK)
app.post('/api/surveys/:id/review', auth, (req, res) => {
    const { stars } = req.body;
    const survey = data.surveys.find(s => s._id === req.params.id);
    if (!survey) return res.status(404).json({ msg: 'Yok' });

    if (!survey.ratings) survey.ratings = [];
    const existingRate = survey.ratings.find(r => r.username === req.user.username);
    if (existingRate) {
        // 15 DK KONTROLÜ
        const COOLDOWN_MS = 15 * 60 * 1000;
        const lastUpdate = new Date(existingRate.date).getTime();
        if (Date.now() - lastUpdate < COOLDOWN_MS) {
            return res.status(400).json({ msg: 'Oyu değiştirmek için beklemelisin.' });
        }
        existingRate.stars = Number(stars);
        existingRate.date = new Date();
    } else {
        survey.ratings.push({ username: req.user.username, stars: Number(stars), date: new Date() });
    }

    const totalStars = survey.ratings.reduce((acc, r) => acc + r.stars, 0);
    survey.rating = parseFloat((totalStars / survey.ratings.length).toFixed(1));
    
    saveData();
    res.json({ msg: 'Oylama başarılı!', survey });
});

// YORUM GÖNDERME
app.post('/api/surveys/:id/comment', auth, (req, res) => {
    const { text } = req.body;
    const survey = data.surveys.find(s => s._id === req.params.id);
    if (!survey) return res.status(404).json({ msg: 'Yok' });
    if (!text || text.trim().length < 2) return res.status(400).json({ msg: 'Yorum çok kısa.' });

    if (!survey.comments) survey.comments = [];
    survey.comments.unshift({ username: req.user.username, text, date: new Date(), replies: [] });
    saveData();
    res.json({ msg: 'Yorum eklendi!', survey });
});

app.delete('/api/surveys/:id/reviews/:index', auth, (req, res) => {
    const survey = data.surveys.find(s => s._id === req.params.id);
    if (!survey) return res.status(404).json({ msg: 'Yok' });
    if (survey.username !== req.user.username) return res.status(403).json({ msg: 'Yetkisiz' });

    const index = parseInt(req.params.index);
    if (index >= 0 && index < survey.comments.length) { 
        survey.comments.splice(index, 1);
        saveData();
        res.json({ msg: 'Silindi', survey });
    } else { res.status(400).json({ msg: 'Hata' }); }
});

app.post('/api/surveys/:id/reviews/:index/reply', auth, (req, res) => {
    const { text } = req.body;
    const survey = data.surveys.find(s => s._id === req.params.id);
    if (!survey) return res.status(404).json({ msg: 'Yok' });
    const index = parseInt(req.params.index);
    if (index >= 0 && index < survey.comments.length) { 
        const comment = survey.comments[index];
        if (!comment.replies) comment.replies = []; 
        comment.replies.push({ username: req.user.username, text, date: new Date() });
        saveData();
        res.json({ msg: 'Yanıtlandı!', survey });
    } else { res.status(400).json({ msg: 'Hata' }); }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend ${PORT} portunda SEVİYE GÜNCELLEMESİ HAZIR...`));