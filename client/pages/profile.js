import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Profile() {
  const [data, setData] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const router = useRouter();

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if(!token) { router.push('/login'); return; }

    try {
      const res = await axios.get('http://192.168.1.47:5000/api/profile', {
          headers: { 'x-auth-token': token }
      });
      setData(res.data);
    } catch (err) {
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // --- ÇIKIŞ YAPMA FONKSİYONU ---
  const handleLogout = () => {
      localStorage.removeItem('token'); // Anahtarı çöpe at
      localStorage.removeItem('username');
      toast.success('Başarıyla çıkış yapıldı. 👋');
      router.push('/login'); // Giriş ekranına yolla
  };

  const handleBoost = async (surveyId) => {
      const token = localStorage.getItem('token');
      setLoadingId(surveyId);
      try {
          const res = await axios.post(`http://192.168.1.47:5000/api/boost/${surveyId}`, {}, {
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* --- ÜST KART (Profil Bilgileri) --- */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-indigo-100 relative">
            
            {/* ÇIKIŞ BUTONU (SAĞ ÜST KÖŞE) */}
            <button 
                onClick={handleLogout}
                className="absolute top-6 right-6 text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg border border-red-100 hover:bg-red-100 transition flex items-center gap-1"
            >
                🚪 Çıkış Yap
            </button>

            <div className="flex items-center justify-between mb-6 mt-2">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl text-white font-bold shadow-md">
                        {data.user.username[0].toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{data.user.username}</h1>
                        <p className="text-sm text-gray-500">Toplam Puan: <b>{data.user.points}</b></p>
                    </div>
                </div>
                {/* Seviye Göstergesi (Çıkış butonunun altında kalmasın diye margin ayarı) */}
                <div className="text-right mr-0 md:mr-32"> 
                    <span className="block text-xs text-gray-500 uppercase font-bold">Seviye</span>
                    <span className="text-4xl font-black text-indigo-600">{data.user.level}</span>
                </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                        Sonraki Seviye İçin
                    </span>
                    <span className="text-xs font-semibold inline-block text-indigo-600">
                        {Math.round(percent)}%
                    </span>
                </div>
                <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-indigo-100">
                    <div style={{ width: `${percent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"></div>
                </div>
            </div>
        </div>

        {/* --- HAK BİLGİLERİ --- */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <h3 className="text-gray-500 text-xs font-bold uppercase">Anket Hakkı</h3>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                    {data.surveys.length} / <span className="text-indigo-600">{data.user.surveyLimit}</span>
                </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <h3 className="text-gray-500 text-xs font-bold uppercase">Günlük Üste Çıkarma</h3>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                    {data.user.boostLimit - data.user.boostsUsedToday} / <span className="text-green-600">{data.user.boostLimit}</span>
                </p>
            </div>
        </div>

        {/* --- ANKET LİSTESİ --- */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📂 Anket Yönetimi</h2>
        
        <div className="space-y-4">
            {data.surveys.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                    Henüz anketin yok.
                 </div>
            ) : (
                data.surveys.map(survey => (
                    <div key={survey._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold">{survey.category}</span>
                                <span className="text-xs text-gray-400">
                                    Son işlem: {new Date(survey.lastBoostedAt || survey.createdAt).toLocaleTimeString()}
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mt-1">{survey.title}</h3>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handleBoost(survey._id)}
                                disabled={loadingId === survey._id || (data.user.boostLimit - data.user.boostsUsedToday) <= 0}
                                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1 transition
                                    ${loadingId === survey._id ? 'bg-gray-300' : 
                                    (data.user.boostLimit - data.user.boostsUsedToday) > 0 ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                                {loadingId === survey._id ? '...' : '🚀 Üste Çıkar'}
                            </button>

                            <Link href={`/edit-survey/${survey._id}`}>
                                <button className="bg-yellow-100 text-yellow-700 border border-yellow-300 px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-200 transition">
                                    ✏️ Düzenle
                                </button>
                            </Link>
                        </div>
                    </div>
                ))
            )}
        </div>
        
        <div className="mt-10 text-center">
            <Link href="/"><button className="text-gray-500 hover:text-black font-bold">← Ana Sayfa</button></Link>
        </div>
      </div>
    </div>
  );
}