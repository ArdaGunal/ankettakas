import { useState, useEffect } from 'react';
import axios from 'axios';
import SurveyCard from '../components/SurveyCard';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { API_URL } from '../config';

export default function Home() {
  const [surveys, setSurveys] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSurveys();
    // Token varsa giriş yapmıştır
    if (localStorage.getItem('token')) setIsLoggedIn(true);
  }, []);

  const fetchSurveys = async () => {
    try {
        const res = await axios.get(`${API_URL}/surveys`);
        setSurveys(res.data);
    } catch(e) { console.log(e) }
  };

  const handleAddSurveyClick = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        toast.error("Anket eklemek için üye olmalısın!");
        router.push('/login');
        return;
    }
    // ... (Limit kontrol kodları burada çalışır, backendden)
    router.push('/add-survey'); 
  };

  // Ana sayfada puan kazanma fonksiyonu (SurveyCard bunu tetikler)
  const handlePointEarn = async (surveyId) => {
    const token = localStorage.getItem('token');
    
    // --- MİSAFİR KONTROLÜ (BURADA PUAN VERMİYORUZ) ---
    if(!token) {
        toast('Misafir modundasın. Puan kazanmak için giriş yapmalısın.', {
            icon: '👻',
            style: { border: '1px solid #713200', padding: '16px', color: '#713200' },
        });
        return;
    }

    try {
        await axios.post(`${API_URL}/click/${surveyId}`, {}, {
            headers: { 'x-auth-token': token }
        });
        toast.success('Tebrikler! +1 Puan eklendi. 🌟');
    } catch (err) { toast.error(err.response?.data?.msg || 'Hata'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* --- ÜST HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div>
                <h1 className="text-3xl font-bold text-indigo-900">Anket Takas</h1>
                <p className="text-gray-500 text-sm">Dayanışma Platformu</p>
             </div>
             
             <div className="flex gap-3 mt-4 md:mt-0">
                {isLoggedIn ? (
                    // GİRİŞ YAPMIŞSA BU BUTONLAR
                    <>
                        <Link href="/profile">
                            <button className="bg-white text-indigo-600 border border-indigo-200 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition">
                                👤 Profilim
                            </button>
                        </Link>
                        <button onClick={handleAddSurveyClick} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg transition">
                            ➕ Anket Ekle
                        </button>
                    </>
                ) : (
                    // MİSAFİR İSE BU BUTONLAR
                    <>
                        <Link href="/login">
                            <button className="text-indigo-600 font-bold px-4 py-2 hover:bg-indigo-50 rounded-lg transition">
                                Giriş Yap
                            </button>
                        </Link>
                        <Link href="/register">
                            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md">
                                Kayıt Ol
                            </button>
                        </Link>
                    </>
                )}
             </div>
        </header>
        
        {/* --- ANKET LİSTESİ --- */}
        {surveys.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
                <p className="text-xl">Henüz hiç anket yok.</p>
                {!isLoggedIn && <p className="text-sm mt-2">İlk anketi eklemek için giriş yap!</p>}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {surveys.map(survey => (
                    <SurveyCard key={survey._id} survey={survey} onFill={handlePointEarn} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
}