const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const DB_FILE = path.join(__dirname, 'database.json');
let data = { users: [], surveys: [] };

// --- YENİ SEVİYE ALGORİTMASI ---

// 1. Belirli bir seviyeye ulaşmak için KAÇ PUAN lazım?
const getPointsForLevel = (level) => {
    if (level <= 1) return 0;
    if (level === 2) return 1;  // Lvl 2 için 1 puan
    if (level === 3) return 3;  // Lvl 3 için 3 puan (fark 2)
    if (level === 4) return 6;  // Lvl 4 için 6 puan (fark 3)
    if (level === 5) return 10; // Lvl 5 için 10 puan (fark 4)
    
    // Level 5'ten sonrası için ZORLAŞAN FORMÜL:
    // Formül: 10 + ((Level - 5) karesi * 5)
    // Örn Lvl 6: 10 + (1*5) = 15 puan
    // Örn Lvl 10: 10 + (25*5) = 135 puan
    return 10 + Math.pow(level - 5, 2) * 5;
};

// 2. Elimdeki puana göre HANGİ SEVİYEDEYİM?
const calculateLevel = (points) => {
    if (points < 1) return 1;
    if (points < 3) return 2;
    if (points < 6) return 3;
    if (points < 10) return 4;
    if (points < 15) return 5; // Lvl 5 ile 6 arası geçiş 10'dan 15'e çekildi

    // 5. Seviyeden sonrası için tersten hesap (Tahmini döngü)
    let level = 5;
    while (true) {
        if (points < getPointsForLevel(level + 1)) {
            return level;
        }
        level++;
        if (level >= 50) return 50; // Maksimum Level sınırı
    }
};

// Boost ve Anket Hakları (Aynı kaldı)
const getDailyBoostLimit = (level) => {
    if (level < 5) return 0;
    if (level < 8) return 1;
    if (level < 15) return 2;
    return 3; 
};

const getSurveyLimit = (level) => {
    if (level < 5) return 1;
    if (level < 10) return 2;
    if (level < 20) return 3;
    if (level < 30) return 5;
    return 10;
};

// Veritabanı Yükle
const loadData = () => {
    if (fs.existsSync(DB_FILE)) {
        try { data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) {}
    } else { saveData(); }
};
const saveData = () => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
loadData();

// Middleware
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
    if (data.users.find(u => u.email === email)) return res.status(400).json({ msg: 'Mail kayıtlı.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { 
        id: Date.now().toString(), username, email, password: hashedPassword, 
        points: 0, lastBoostDate: null, boostsUsedToday: 0
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

// PROFİL BİLGİLERİ (İLERLEME HESABI GÜNCELLENDİ)
app.get('/api/profile', auth, (req, res) => {
    const user = data.users.find(u => u.id === req.user.id);
    const userSurveys = data.surveys.filter(s => s.username === user.username);
    
    const currentLevel = calculateLevel(user.points);
    
    // Progress Bar Hesabı:
    const nextLevel = currentLevel + 1;
    const pointsNeededForNext = getPointsForLevel(nextLevel); // Hedef Puan
    const pointsAtCurrentFloor = getPointsForLevel(currentLevel); // Şu anki levelin taban puanı

    res.json({ 
        user: {
            ...user,
            level: currentLevel,
            boostLimit: getDailyBoostLimit(currentLevel),
            surveyLimit: getSurveyLimit(currentLevel)
        }, 
        surveys: userSurveys,
        progress: {
            current: user.points,
            next: pointsNeededForNext,
            floor: pointsAtCurrentFloor
        }
    });
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
    const user = data.users.find(u => u.id === req.user.id);
    const level = calculateLevel(user.points);
    const limit = getSurveyLimit(level);
    const userSurveyCount = data.surveys.filter(s => s.username === user.username).length;

    if (userSurveyCount >= limit) return res.status(403).json({ msg: `Limit doldu! Seviye ${level} limiti: ${limit}` });

    const newSurvey = {
        _id: Date.now().toString(), ...req.body, clicks: 0, createdAt: new Date(), lastBoostedAt: new Date(),
        username: req.user.username, clickedBy: []
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

app.post('/api/boost/:id', auth, (req, res) => {
    const user = data.users.find(u => u.id === req.user.id);
    const survey = data.surveys.find(s => s._id === req.params.id);
    if (!survey) return res.status(404).json({ msg: 'Yok' });
    if (survey.username !== user.username) return res.status(403).json({ msg: 'Sadece kendi anketin!' });

    const currentLevel = calculateLevel(user.points);
    const dailyLimit = getDailyBoostLimit(currentLevel);
    const today = new Date().toDateString();

    if (user.lastBoostDate !== today) { user.boostsUsedToday = 0; user.lastBoostDate = today; }
    if (user.boostsUsedToday >= dailyLimit) return res.status(400).json({ msg: 'Günlük hak bitti!' });

    user.boostsUsedToday += 1;
    survey.lastBoostedAt = new Date();
    saveData();
    res.json({ msg: '🚀 Boostlandı!', remaining: dailyLimit - user.boostsUsedToday });
});

app.post('/api/click/:id', async (req, res) => {
    const survey = data.surveys.find(s => s._id === req.params.id);
    if(!survey) return res.status(404).json({ msg: 'Yok' });
    const token = req.header('x-auth-token');
    let userId = null;
    if(token) { try { userId = jwt.verify(token, 'gizliSifre123').id; } catch(e) {} }

    if (userId) {
        const historyIndex = survey.clickedBy.findIndex(log => log.userId === userId);
        const TWELVE_HOURS = 12 * 60 * 60 * 1000; 
        if (historyIndex > -1) {
            const timeDiff = Date.now() - survey.clickedBy[historyIndex].timestamp;
            if (timeDiff < TWELVE_HOURS) {
                const rem = Math.ceil((TWELVE_HOURS - timeDiff) / (3600000));
                return res.status(400).json({ msg: `${rem} saat bekle.` });
            } else { survey.clickedBy[historyIndex].timestamp = Date.now(); }
        } else { survey.clickedBy.push({ userId, timestamp: Date.now() }); }

        const user = data.users.find(u => u.id === userId);
        if(user) { user.points += 1; user.surveysFilled += 1; }
    }
    survey.clicks += 1;
    saveData();
    res.json({ msg: 'OK', clicks: survey.clicks });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend ${PORT} portunda YENİ XP SİSTEMİ ile hazır...`));