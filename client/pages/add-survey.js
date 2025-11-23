import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

export default function AddSurvey() {
  const [form, setForm] = useState({ title: '', description: '', externalLink: '', category: '' });
  // Varsayılan değerleri string olarak veriyoruz
  const [durationValue, setDurationValue] = useState('5');
  const [durationUnit, setDurationUnit] = useState('min');
  const router = useRouter();

  useEffect(() => {
      if(!localStorage.getItem('token')) {
          toast.error("Anket eklemek için giriş yapmalısın!");
          router.push('/register');
      }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const loadingToast = toast.loading('Anket yayınlanıyor...');

    // Değerleri güvenli hale getir
    const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        externalLink: form.externalLink,
        durationValue: parseInt(durationValue) || 5, // Sayıya çevir, boşsa 5 yap
        durationUnit: durationUnit || 'min'
    };

    try {
      await axios.post(`${API_URL}/surveys`, payload, {
          headers: { 'x-auth-token': token }
      });
      
      toast.dismiss(loadingToast);
      toast.success('Anketin Yayında! 🚀');
      router.push('/'); 
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error(err); // Hatayı konsola yaz ki görebilelim
      toast.error(err.response?.data?.msg || 'Bir hata oluştu. Sunucuyu kontrol edin.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-300">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">📢 Anketini Paylaş</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Başlık */}
          <input required type="text" placeholder="Başlık" className="w-full p-3 border rounded text-gray-900 bg-white outline-none focus:border-indigo-500" onChange={e => setForm({...form, title: e.target.value})} />
          
          {/* Kategori */}
          <div>
            <input required list="categories" placeholder="Kategori (Seç veya Yaz)" className="w-full p-3 border rounded text-gray-900 bg-white outline-none focus:border-indigo-500" onChange={e => setForm({...form, category: e.target.value})} />
            <datalist id="categories">
                <option value="Tez / Akademik" /><option value="Oyun" /><option value="Psikoloji" />
            </datalist>
          </div>
          
          {/* SÜRE ALANI */}
          <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">Ortalama Süre</label>
              <div className="flex gap-2">
                  <input
                      className="shadow appearance-none border rounded w-full py-3 px-3 text-gray-900 bg-white leading-tight focus:ring-2 focus:ring-indigo-500 outline-none"
                      type="number" min="1" placeholder="5"
                      value={durationValue}
                      onChange={(e) => setDurationValue(e.target.value)}
                      required
                  />
                  <select
                      className="shadow border rounded py-3 px-3 text-gray-900 bg-white leading-tight cursor-pointer"
                      value={durationUnit}
                      onChange={(e) => setDurationUnit(e.target.value)}
                  >
                      <option value="min">Dakika (dk)</option>
                      <option value="saat">Saat</option>
                  </select>
              </div>
          </div>

          {/* Link ve Açıklama */}
          <input required type="url" placeholder="Link (Google Forms)" className="w-full p-3 border rounded text-gray-900 bg-white outline-none focus:border-indigo-500" onChange={e => setForm({...form, externalLink: e.target.value})} />
          <textarea placeholder="Açıklama" className="w-full p-3 border rounded text-gray-900 bg-white outline-none focus:border-indigo-500" onChange={e => setForm({...form, description: e.target.value})}></textarea>
          
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700 shadow-md transition">Yayınla</button>
        </form>
      </div>
    </div>
  );
}