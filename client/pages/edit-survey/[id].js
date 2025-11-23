import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { API_URL } from '../../config';

export default function SurveyDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle'); 
  const [startTime, setStartTime] = useState(null);
  
  // Formlar
  const [commentText, setCommentText] = useState('');
  const [ratingStars, setRatingStars] = useState(5);
  const [replyText, setReplyText] = useState('');
  const [replyingToIndex, setReplyingToIndex] = useState(null);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [cooldownInterval, setCooldownInterval] = useState(null);

  // Kullanıcı ve Yetki
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const loggedInUser = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

  const fetchSurvey = async () => {
      try {
          const res = await axios.get(`${API_URL}/surveys/${id}`);
          setSurvey(res.data);
          setLoading(false);
          return res.data;
      } catch (err) {
          console.error("Anket yüklenemedi:", err);
          toast.error('Anket bulunamadı veya sunucu hatası.');
          setLoading(false);
      }
  };

  useEffect(() => {
    if (!router.isReady || !id) return;
    
    const loadAndCheck = async () => {
        const currentSurvey = await fetchSurvey();
        
        // Cooldown Kontrolü
        if (currentSurvey && token && loggedInUser) {
            const myRating = currentSurvey.ratings?.find(r => r.username === loggedInUser);
            if (myRating) {
                const lastRatingTime = new Date(myRating.date).getTime();
                const COOLDOWN_MS = 15 * 60 * 1000;
                const timeDiff = Date.now() - lastRatingTime;

                if (timeDiff < COOLDOWN_MS) {
                    setCooldownTime(COOLDOWN_MS - timeDiff);
                }
            }
        }
    };
    loadAndCheck();

    return () => { if (cooldownInterval) clearInterval(cooldownInterval); }; 
  }, [router.isReady, id, token]); // Token değişirse tekrar kontrol et

  // Timer for Cooldown
  useEffect(() => {
    if (cooldownTime > 0) {
        if (cooldownInterval) clearInterval(cooldownInterval);
        const interval = setInterval(() => {
            setCooldownTime(prev => (prev <= 1000 ? 0 : prev - 1000));
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [cooldownTime]);


  const checkTime = () => {
    if (!startTime) return;
    const timeSpent = Date.now() - startTime;
    if (timeSpent < 5000) { toast.error('🛑 Çok hızlı döndün! Sayılmadı.'); setStatus('idle'); setStartTime(null); } 
    else { toast.success('Süre tamam. Puanını alabilirsin. 👍'); setStatus('ready'); }
  };

  const handleStart = () => {
    if (!survey?.externalLink) return toast.error("Link bozuk.");
    setStartTime(Date.now());
    setStatus('waiting');
    window.open(survey.externalLink, '_blank');
  };

  const handleClaimPoint = async () => {
    try {
        if(!token) { setStatus('completed'); return; }
        const res = await axios.post(`${API_URL}/click/${survey._id}`, {}, { headers: { 'x-auth-token': token } });
        toast.success('Tebrikler! Puan eklendi. 🎉');
        if (res.data.reward) {
            toast(res.data.reward, { duration: 6000, icon: '🎁', style: { border: '2px solid #10B981', padding: '16px', color: '#065F46', background: '#D1FAE5' } });
        }
        setStatus('completed');
    } catch (err) { toast.error(err.response?.data?.msg || 'Hata'); }
  };

  const handleSendComment = async (e) => {
      e.preventDefault();
      if(!token) return toast.error("Yorum yapmak için üye olmalısın!");
      if(!commentText.trim()) return toast.error("Lütfen yorum metni girin.");

      try {
          const res = await axios.post(`${API_URL}/surveys/${survey._id}/comment`, { text: commentText }, { headers: { 'x-auth-token': token } });
          toast.success("Yorumun eklendi!");
          setSurvey(res.data.survey);
          setCommentText(''); 
      } catch (err) { toast.error(err.response?.data?.msg || "Hata oluştu."); }
  };

  const handleRateSubmit = async () => {
      if (!token) return toast.error("Oylama yapmak için üye olmalısın!");
      if (cooldownTime > 0) return toast.error("Lütfen sürenin dolmasını bekle.");

      try {
          const res = await axios.post(`${API_URL}/surveys/${survey._id}/rate`, { stars: ratingStars }, { headers: { 'x-auth-token': token } });
          toast.success("Oyunuz kaydedildi! ✅");
          setSurvey(res.data.survey);
          setCooldownTime(15 * 60 * 1000); 
      } catch (err) { 
          toast.error(err.response?.data?.msg || "Oylama sırasında hata oluştu!"); 
      }
  };

  const handleSendReply = async (e, index) => {
      e.preventDefault();
      if(!token) return toast.error("Yanıtlamak için üye olmalısın!");
      if(!replyText.trim()) return toast.error("Lütfen yanıt metni girin.");
      try {
          const res = await axios.post(`${API_URL}/surveys/${survey._id}/reviews/${index}/reply`, { text: replyText }, { headers: { 'x-auth-token': token } });
          toast.success("Yanıt eklendi!");
          setSurvey(res.data.survey);
          setReplyingToIndex(null); setReplyText('');
      } catch (err) { toast.error("Hata oluştu."); }
  };

  const handleDeleteComment = async (index) => {
      if(!confirm("Silmek istiyor musun?")) return;
      try {
          const res = await axios.delete(`${API_URL}/surveys/${survey._id}/reviews/${index}`, { headers: { 'x-auth-token': token } });
          toast.success("Silindi.");
          setSurvey(res.data.survey);
      } catch (err) { toast.error("Hata."); }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}dk ${seconds}sn`;
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-indigo-600 font-bold">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
        <p>Anket Verileri Getiriliyor...</p>
    </div>
  );

  if (!survey && !loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800">
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Anket Bulunamadı</h2>
            <button onClick={() => router.push('/')} className="text-indigo-600 hover:underline">Ana Sayfaya Dön</button>
        </div>
    </div>
  );
  
  const isOwner = loggedInUser === survey?.username;
  const hasRated = survey?.ratings && survey.ratings.some(r => r.username === loggedInUser);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-300">
        
        {/* ÜST KISIM */}
        <div className="bg-indigo-900 p-8 text-white text-center relative">
            <button onClick={() => router.push('/')} className="absolute top-4 left-4 bg-indigo-800 hover:bg-indigo-700 px-3 py-1 rounded text-sm border border-indigo-600">← Geri Dön</button>
            
            <div className="flex justify-center items-center gap-2 mb-3">
                <span className="bg-indigo-700 text-xs px-2 py-1 rounded-full uppercase tracking-wide border border-indigo-500">{survey.category || 'Genel'}</span>
                <span className="bg-indigo-800 text-indigo-100 text-xs px-2 py-1 rounded-full border border-indigo-600 flex items-center gap-1">
                    🕒 {survey.durationValue || 5} {survey.durationUnit === 'min' ? 'dk' : 'Saat'}
                </span>
            </div>

            <h1 className="text-3xl font-bold mb-2">{survey.title}</h1>
            
            <div className="flex justify-center items-center gap-4 text-indigo-200 text-sm">
                <span>Sahibi: <b>{survey.username || 'Anonim'}</b></span>
                <span>•</span>
                <span>{new Date(survey.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="mt-4 inline-block bg-white text-indigo-900 px-4 py-2 rounded-lg font-bold shadow-lg">
                {survey.rating > 0 ? (
                    <>⭐ {survey.rating} / 5 <span className="text-xs font-normal">({survey.ratings?.length || 0} Oy)</span></>
                ) : (
                    <span className="text-sm text-gray-500 font-normal">Henüz Puanlanmadı</span>
                )}
            </div>
        </div>

        {/* ORTA KISIM */}
        <div className="p-8 text-center border-b border-gray-200">
            <p className="text-gray-900 text-lg mb-8 leading-relaxed font-medium">{survey.description}</p>
            <div className="max-w-md mx-auto">
                {status === 'idle' && <button onClick={handleStart} className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg text-lg transform hover:scale-105">🚀 Ankete Git ve Başla</button>}
                {status === 'waiting' && <button disabled className="w-full py-4 rounded-xl font-bold text-gray-600 bg-gray-200 border border-gray-300 cursor-wait text-lg">⏳ Sekme Açık, Dönüş Bekleniyor...</button>}
                {status === 'ready' && <button onClick={handleClaimPoint} className="w-full py-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 animate-bounce shadow-lg text-lg">✅ Doldurdum, Puanı Ver!</button>}
                {status === 'completed' && <button disabled className="w-full py-4 rounded-xl font-bold text-green-800 bg-green-100 border border-green-300 text-lg">✓ İşlem Tamamlandı</button>}
            </div>
            {!token && <p className="text-xs text-red-500 font-bold mt-3">Puan kazanmak ve yorum yapmak için giriş yapmalısın.</p>}
        </div>

        {/* ALT KISIM - YORUMLAR & OYLAMA */}
        <div className="p-8 bg-gray-50">
            <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2 border-gray-300">💬 Yorumlar ve Puanlama</h3>

            {/* OYLAMA KISMI */}
            {token && (
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-200 mb-6 flex items-center justify-between">
                     <p className="font-bold text-gray-800">{hasRated ? 'Oyu Güncelle' : 'Anketi Oyla'}:</p>
                     
                     {cooldownTime > 0 ? (
                         <div className="text-sm font-bold text-red-600 bg-red-100 px-3 py-1 rounded-lg">⏳ {formatTime(cooldownTime)} Bekle</div>
                     ) : (
                        <div className="flex items-center gap-2">
                            <select className="border border-gray-400 rounded-lg p-2 bg-white text-black font-medium" value={ratingStars} onChange={e => setReviewForm({...reviewForm, stars: e.target.value})}>
                                <option value="5">5 ⭐</option><option value="4">4 ⭐</option><option value="3">3 ⭐</option><option value="2">2 ⭐</option><option value="1">1 ⭐</option>
                            </select>
                            <button onClick={handleRateSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition text-sm">
                                {hasRated ? 'Oyu Güncelle' : 'Oyu Kullan'}
                            </button>
                        </div>
                     )}
                 </div>
            )}
            
            {/* YORUM EKLEME */}
            {token && (
                 <form onSubmit={handleSendComment} className="bg-white p-4 rounded-xl shadow-sm border border-gray-300 mb-8">
                     <input type="text" placeholder="Görüşlerini yaz..." required className="w-full border border-gray-400 rounded-lg p-2 mb-2 text-black placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none bg-white" value={reviewForm.text} onChange={e => setReviewForm({...reviewForm, text: e.target.value})} />
                     <button className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-black transition text-sm shadow-md">Yorumu Gönder</button>
                 </form>
            )}

            {/* YORUM LİSTESİ */}
            <div className="space-y-4">
                {survey.comments && survey.comments.length > 0 ? (
                    survey.comments.map((rev, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-300">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-bold text-gray-900 text-md">{rev.username}</span>
                                    <p className="text-gray-800 mt-1 font-medium">{rev.text}</p>
                                </div>
                                <div className="flex gap-2 text-xs font-bold">
                                    {token && <button onClick={() => setReplyingToIndex(replyingToIndex === i ? null : i)} className="text-indigo-700 hover:underline">Yanıtla</button>}
                                    {isOwner && <button onClick={() => handleDeleteComment(i)} className="text-red-600 hover:underline">Sil</button>}
                                </div>
                            </div>
                            
                            {replyingToIndex === i && (
                                <form onSubmit={(e) => handleSendReply(e, i)} className="mt-3 flex gap-2 pl-4 border-l-4 border-indigo-200">
                                    <input autoFocus type="text" placeholder="Yanıtın..." className="flex-1 border border-gray-400 rounded p-2 text-sm text-black bg-white" value={replyText} onChange={e => setReplyText(e.target.value)} />
                                    <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-bold">Yolla</button>
                                </form>
                            )}

                            {rev.replies && rev.replies.length > 0 && (
                                <div className="mt-3 space-y-2 pl-4 border-l-4 border-gray-200">
                                    {rev.replies.map((reply, rIndex) => (
                                        <div key={rIndex} className="bg-gray-100 p-2 rounded text-sm text-gray-800 border border-gray-200">
                                            <span className="font-bold text-black">{reply.username}: </span>
                                            {reply.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 font-medium py-4 bg-white rounded-xl">Henüz yorum yok. İlk yorumu sen yap!</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}