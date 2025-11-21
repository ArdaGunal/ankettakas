import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { API_URL } from '../../config'; // <-- EKLENDİ (Dikkat: iki nokta ../../)

export default function EditSurvey() {
  const [form, setForm] = useState({ title: '', description: '', externalLink: '', category: '' });
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if(!router.isReady) return;
    const fetchSurvey = async () => {
        try {
            // ADRES GÜNCELLENDİ
            const res = await axios.get(`${API_URL}/surveys/${id}`);
            setForm(res.data);
        } catch (err) {
            toast.error('Anket bulunamadı!');
            router.push('/profile');
        }
    };
    fetchSurvey();
  }, [router.isReady]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const loadingToast = toast.loading('Güncelleniyor...');

    try {
      // ADRES GÜNCELLENDİ
      await axios.put(`${API_URL}/surveys/${id}`, form, {
          headers: { 'x-auth-token': token }
      });
      
      toast.dismiss(loadingToast);
      toast.success('Anket Güncellendi! ✅');
      router.push('/profile'); 
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.msg || 'Hata oluştu.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-yellow-400 border-t-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">✏️ Anketi Düzenle</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div><label className="text-xs font-bold text-gray-500 uppercase">Başlık</label><input required type="text" value={form.title} className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Kategori</label><input required list="categories" value={form.category} className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, category: e.target.value})} /><datalist id="categories"><option value="Tez" /><option value="Oyun" /></datalist></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Link</label><input required type="url" value={form.externalLink} className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, externalLink: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Açıklama</label><textarea value={form.description} className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, description: e.target.value})}></textarea></div>
          <div className="flex gap-2"><button type="button" onClick={() => router.back()} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded font-bold hover:bg-gray-300">İptal</button><button type="submit" className="flex-1 bg-yellow-500 text-white py-3 rounded font-bold hover:bg-yellow-600">Güncelle</button></div>
        </form>
      </div>
    </div>
  );
}