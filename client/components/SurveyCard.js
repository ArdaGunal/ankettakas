import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function SurveyCard({ survey, onFill }) {
  const [status, setStatus] = useState('idle'); 
  const [startTime, setStartTime] = useState(null);

  // Sekme Takibi
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'waiting') {
        checkTime();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, startTime]);

  const handleStart = () => {
    setStartTime(Date.now());
    setStatus('waiting');
    window.open(survey.externalLink, '_blank');
  };

  const checkTime = () => {
    if (!startTime) return;
    const timeSpent = Date.now() - startTime;
    const MIN_TIME = 10000; // 10 Saniye

    if (timeSpent < MIN_TIME) {
      // --- SENİN İSTEDİĞİN KIRMIZI UYARI ---
      toast.error('Puan verilemedi. Lütfen anketi doldurduğunuzdan emin olunuz', {
        duration: 5000,
        icon: '🛑'
      });
      setStatus('idle'); 
      setStartTime(null);
    } else {
      toast.success('Süre tamamlandı. Puanını talep edebilirsin.', { duration: 3000 });
      setStatus('ready');
    }
  };

  const handleClaimPoint = async () => {
    try {
        // Backend'e isteği burada atıyoruz ki hata mesajını yakalayalım
        const token = localStorage.getItem('token');
        
        // Eğer token yoksa (Misafir) direkt tıkla
        if(!token) {
           onFill(survey._id); // Ana sayfadaki fonksiyona git
           setStatus('completed');
           return;
        }

        // Eğer üye ise kontrol et
        await axios.post(`http://192.168.1.47:5000/api/click/${survey._id}`, {}, {
            headers: { 'x-auth-token': token }
        });

        // --- SENİN İSTEDİĞİN YEŞİL UYARI ---
        toast.success('Anketi doldurduğunuz için teşekkür ederiz. Puanınızı alabilirsiniz.', {
            duration: 4000,
            icon: '🎉'
        });
        setStatus('completed');

    } catch (err) {
        // 12 Saat hatası burada yakalanır
        toast.error(err.response?.data?.msg || 'Bir hata oluştu.');
        // Butonu tekrar tıklanabilir yapmıyoruz, hata olsa bile completed kalsın mı? 
        // Hayır, belki tekrar denemek ister. 'ready' modunda bırakalım.
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-2">
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">{survey.category}</span>
        <span className="text-gray-500 text-xs">{new Date(survey.createdAt).toLocaleDateString()}</span>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">{survey.title}</h3>
      <p className="text-gray-700 text-sm mb-4 line-clamp-2">{survey.description}</p>

      <div className="flex flex-col gap-3 mt-4 border-t pt-4">
        <div className="text-xs text-gray-500 flex justify-between items-center">
          <span>Sahibi: <b className="text-gray-800">{survey.username || 'Anonim'}</b></span>
          <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold">{survey.clicks || 0} Tık</span>
        </div>

        {status === 'idle' && (
            <button onClick={handleStart} className="w-full py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md">
              Ankete Git & Başla
            </button>
        )}

        {status === 'waiting' && (
            <div className="text-center">
                <p className="text-xs text-gray-500 mb-2 animate-pulse">Anket sekmesi açık...</p>
                <button disabled className="w-full py-2 rounded-lg font-bold text-gray-500 bg-gray-200 cursor-wait border border-gray-300">
                  ⏳ Anketi Doldur ve Dön...
                </button>
            </div>
        )}

        {status === 'ready' && (
            <button onClick={handleClaimPoint} className="w-full py-2 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 animate-bounce shadow-lg">
              ✅ Doldurdum, Puanı Ver!
            </button>
        )}

        {status === 'completed' && (
            <button disabled className="w-full py-2 rounded-lg font-bold text-green-700 bg-green-100 border border-green-200">
              ✓ İşlem Tamam
            </button>
        )}
      </div>
    </div>
  );
}