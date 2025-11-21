import { useState, useEffect } from 'react';
import axios from 'axios';
import SurveyCard from '../components/SurveyCard';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

export default function Home() {
  const [surveys, setSurveys] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSurveys();
    if (localStorage.getItem('token')) setIsLoggedIn(true);
  }, []);

  const fetchSurveys = async () => {
    try {
        const res = await axios.get('http://192.168.1.47:5000/api/surveys');
        setSurveys(res.data);
    } catch(e) { console.log(e) }
  };

  // --- YENİ: AKILLI ANKET EKLEME KONTROLÜ ---
  const handleAddSurveyClick = async () => {
    const token = localStorage.getItem('token');
    
    // 1. Giriş yapmamışsa uyar
    if (!token) {
        toast.error("Anket eklemek için giriş yapmalısın!");
        router.push('/login');
        return;
    }

    const loadingToast = toast.loading('Haklarınız kontrol ediliyor...');

    try {
        // 2. Kullanıcının profilini çek ve limitine bak
        const res = await axios.get('http://192.168.1.47:5000/api/profile', {
            headers: { 'x-auth-token': token }
        });

        const { user, surveys } = res.data;
        const currentCount = surveys.length;
        const limit = user.surveyLimit;

        // 3. Limit Kontrolü
        if (currentCount >= limit) {
            toast.dismiss(loadingToast);
            toast.error(`Anket hakkınız dolmuş! (${currentCount}/${limit})\nYeni eklemek için seviye atlayın veya eski bir anketi silin.`, {
                duration: 5000,
                style: { border: '1px solid #ef4444', padding: '16px', color: '#713200' },
                icon: '🚫',
            });
        } else {
            // 4. Limit uygunsa sayfaya gönder
            toast.dismiss(loadingToast);
            router.push('/add-survey');
        }

    } catch (err) {
        toast.dismiss(loadingToast);
        toast.error('Bağlantı hatası.');
    }
  };

  const handlePointEarn = async (surveyId) => {
    const token = localStorage.getItem('token');
    if(!token) return toast.error("Puan kazanmak için giriş yapmalısın!");

    try {
        await axios.post(`http://192.168.1.47:5000/api/click/${surveyId}`, {}, {
            headers: { 'x-auth-token': token }
        });
        toast.success('Tebrikler! +1 Puan eklendi. 🌟');
    } catch (err) { toast.error(err.response?.data?.msg || 'Hata'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div>
                <h1 className="text-3xl font-bold text-indigo-900">Anket Takas</h1>
                <p className="text-gray-500 text-sm">Dayanışma Platformu</p>
             </div>
             <div className="flex gap-3 mt-4 md:mt-0">
                {isLoggedIn ? (
                    <>
                        <Link href="/profile"><button className="bg-white text-indigo-600 border border-indigo-200 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50">👤 Profilim</button></Link>
                        
                        {/* Link yerine onClick kullanıyoruz */}
                        <button 
                            onClick={handleAddSurveyClick}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg transition"
                        >
                            ➕ Anket Ekle
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login"><button className="text-indigo-600 font-bold px-4">Giriş Yap</button></Link>
                        <Link href="/register"><button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700">Kayıt Ol</button></Link>
                    </>
                )}
             </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map(survey => (
                <SurveyCard key={survey._id} survey={survey} onFill={handlePointEarn} />
            ))}
        </div>
      </div>
    </div>
  );
}