import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

export default function Profile() {
  const [data, setData] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const router = useRouter();

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if(!token) { router.push('/login'); return; }

    try {
      const res = await axios.get(`${API_URL}/profile`, {
          headers: { 'x-auth-token': token }
      });
      setData(res.data);
    } catch (err) {
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleLogout = () => {
      localStorage.removeItem('token'); localStorage.removeItem('username');
      toast.success('Başarıyla çıkış yapıldı. 👋');
      router.push('/login'); 
  };

  // --- MERKEZİ VE DİKKAT ÇEKİCİ SİLME ONAYI ---
  const handleDeleteSurvey = (surveyId) => {
      toast((t) => (
        <div className="flex flex-col items-center text-center gap-3 w-full">
          
          {/* Büyük Çöp Kutusu İkonu */}
          <div className="bg-red-100 p-3 rounded-full">
            <span className="text-3xl">🗑️</span>
          </div>

          <div>
            <p className="font-black text-gray-900 text-lg">
              Anketi Silmek Üzeresin!
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Bu işlem geri alınamaz ve tüm yorumlar/puanlar silinir. Emin misin?
            </p>
          </div>

          <div className="flex gap-3 mt-2 w-full">
            {/* VAZGEÇ BUTONU */}
            <button 
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition border border-gray-300"
            >
              Vazgeç
            </button>
            
            {/* SİL BUTONU */}
            <button 
              onClick={async () => {
                  toast.dismiss(t.id);
                  const token = localStorage.getItem('token');
                  try {
                      await axios.delete(`${API_URL}/surveys/${surveyId}`, {
                          headers: { 'x-auth-token': token }
                      });
                      toast.success("Anket kalıcı olarak silindi.");
                      fetchProfile(); 
                  } catch (err) {
                      toast.error("Silinemedi: " + (err.response?.data?.msg || "Hata"));
                  }
              }}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition shadow-lg shadow-red-200"
            >
              Evet, Sil
            </button>
          </div>
        </div>
      ), {
        duration: Infinity, // Kullanıcı tıklayana kadar kapanmaz
        position: 'top-center', // Başlangıç noktası
        
        // --- BURASI KUTUYU ORTAYA ALIR ---
        style: {
            marginTop: '20vh', // Ekranın %20'si kadar aşağı it (Ortalar)
            minWidth: '320px', // Genişlik
            padding: '24px',   // İç boşluk
            background: '#FFFFFF',
            color: '#1F2937',
            border: '1px solid #E5E7EB',
            // Derin Gölge Efekti (Daha dikkat çekici)
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 100vw rgba(0,0,0,0.3)' 
            // Sondaki `0 0 0 100vw rgba(0,0,0,0.3)` kodu arka planı hafif karartır!
        },
      });
  };

  const handleBoost = async (surveyId) => {
      const token = localStorage.getItem('token');
      setLoadingId(surveyId);
      try {
          const res = await axios.post(`${API_URL}/boost/${surveyId}`, {}, {
            headers: { 'x-auth-token': token }
          });
          toast.success("Anket başarıyla üste taşındı! 🔥");
          fetchProfile();
      } catch (err) {
          toast.error(err.response?.data?.msg || 'Hata');
      } finally {
          setLoadingId(null);
      }
  };

  if (!data) return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;

  const { current, next, floor } = data.progress;
  const totalNeeded = next - floor;
  const currentProgress = current - floor;
  const percent = Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));

  // GÖREV HESAPLAMALARI
  const streak = data.user.streakCount || 0;
  const streakPercent = (streak / 5) * 100;
  const isCooldown = data.user.nextStreakAvailableAt && new Date(data.user.nextStreakAvailableAt) > new Date();
  
  let cooldownText = "";
  if (isCooldown) {
      const diff = new Date(data.user.nextStreakAvailableAt) - new Date();
      const minutes = Math.ceil(diff / 60000);
      cooldownText = `${minutes} dk`;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* ÜST KART */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-indigo-100 relative">
            <button onClick={handleLogout} className="absolute top-6 right-6 text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg border border-red-100 hover:bg-red-100 transition flex items-center gap-1">🚪 Çıkış Yap</button>
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 mt-2">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl text-white font-bold shadow-md">{data.user.username[0].toUpperCase()}</div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{data.user.username}</h1>
                        <p className="text-sm text-gray-500">Toplam Puan: <b>{data.user.points}</b></p>
                    </div>
                    <div className="text-center bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200 ml-4 hidden md:block">
                        <p className="text-[10px] uppercase text-yellow-800 font-bold tracking-wider">Kalite Puanı</p>
                        <p className="text-2xl font-black text-yellow-600 mt-1">⭐ {data.user.reputation || '-'}</p>
                    </div>
                </div>
                <div className="text-right mt-4 md:mt-0 mr-0 md:mr-32"> 
                    <span className="block text-xs text-gray-500 uppercase font-bold">Seviye</span>
                    <span className="text-4xl font-black text-indigo-600">{data.user.level}</span>
                </div>
            </div>
            <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">Sonraki Seviye</span>
                    <span className="text-xs font-semibold inline-block text-indigo-600">{Math.round(percent)}%</span>
                </div>
                <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-indigo-100">
                    <div style={{ width: `${percent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"></div>
                </div>
            </div>
        </div>

        {/* GÜNLÜK GÖREV KARTI */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-white opacity-10"></div>
            
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2">🎯 Ekstra Hak Görevi</h3>
                {isCooldown ? (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">⏳ Bekle: {cooldownText}</span>
                ) : (
                    <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-xs font-bold">AKTİF</span>
                )}
            </div>
            
            <p className="text-sm text-indigo-100 mb-4">
                {isCooldown ? "Ödülü aldın! Yeni görev için sürenin dolmasını bekle." : "5 Farklı anketi doldur, 1 adet ücretsiz 'Üste Çıkarma' hakkı kazan!"}
            </p>

            <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                    <span className="text-xs font-semibold inline-block uppercase">
                        {streak} / 5 Tamamlandı
                    </span>
                </div>
                <div className="overflow-hidden h-3 mb-1 text-xs flex rounded bg-black/20">
                    <div style={{ width: `${streakPercent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-400 transition-all duration-500"></div>
                </div>
            </div>
        </div>

        {/* HAK BİLGİLERİ */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <h3 className="text-gray-500 text-xs font-bold uppercase">Anket Hakkı</h3>
                <p className="text-2xl font-bold text-gray-800 mt-1">{data.surveys.length} / <span className="text-indigo-600">{data.user.surveyLimit}</span></p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <h3 className="text-gray-500 text-xs font-bold uppercase">Günlük Üste Çıkarma</h3>
                <p className="text-2xl font-bold text-gray-800 mt-1">{data.user.boostLimit - data.user.boostsUsedToday} / <span className="text-green-600">{data.user.boostLimit}</span></p>
            </div>
        </div>

        {/* ANKET LİSTESİ */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📂 Anket Yönetimi</h2>
        <div className="space-y-4">
            {data.surveys.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">Henüz anketin yok.</div>
            ) : (
                data.surveys.map(survey => (
                    <div key={survey._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row justify-between items-center gap-4">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold">{survey.category}</span>
                                <span className="text-xs text-gray-400">Son işlem: {new Date(survey.lastBoostedAt || survey.createdAt).toLocaleTimeString()}</span>
                                <span className="text-xs text-yellow-600 font-bold flex items-center border border-yellow-200 px-1 rounded">⭐ {survey.rating || 0}</span>
                            </div>
                            {/* Tıklanabilir Başlık */}
                            <Link href={`/survey/${survey._id}`}>
                                <h3 className="font-bold text-gray-900 text-lg hover:text-indigo-600 hover:underline cursor-pointer transition inline-block">
                                    {survey.title} ↗
                                </h3>
                            </Link>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                            <button onClick={() => handleBoost(survey._id)} disabled={loadingId === survey._id || (data.user.boostLimit - data.user.boostsUsedToday) <= 0} className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition ${loadingId === survey._id ? 'bg-gray-300' : (data.user.boostLimit - data.user.boostsUsedToday) > 0 ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                {loadingId === survey._id ? '...' : '🚀 Üste Çıkar'}
                            </button>
                            <Link href={`/edit-survey/${survey._id}`}><button className="bg-yellow-100 text-yellow-700 border border-yellow-300 px-3 py-2 rounded-lg font-bold text-xs hover:bg-yellow-200 transition">✏️ Düzenle</button></Link>
                            
                            {/* SİL BUTONU GERİ GELDİ */}
                            <button onClick={() => handleDeleteSurvey(survey._id)} className="bg-red-100 text-red-700 border border-red-300 px-3 py-2 rounded-lg font-bold text-xs hover:bg-red-200 transition flex items-center gap-1">🗑️ Sil</button>
                        </div>
                    </div>
                ))
            )}
        </div>
        <div className="mt-10 text-center"><Link href="/"><button className="text-gray-500 hover:text-black font-bold">← Ana Sayfa</button></Link></div>
      </div>
    </div>
  );
}