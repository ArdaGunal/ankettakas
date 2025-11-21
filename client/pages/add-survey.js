import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

export default function AddSurvey() {
  const [form, setForm] = useState({ title: '', description: '', externalLink: '', category: '' });
  // YENİ SÜRE STATE'LERİ
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

    try {
      await axios.post(`${API_URL}/surveys`, {
          title: form.title,
          description: form.description,
          category: form.category,
          externalLink: form.externalLink,
          // VAR OLAN VERİLERE YENİ ALANLAR EKLENDİ
          durationValue: parseInt(durationValue), 
          durationUnit: durationUnit
      }, {
          headers: { 'x-auth-token': token }
      });
      
      toast.dismiss(loadingToast);
      toast.success('Anketin Yayında! 🚀');
      router.push('/'); 
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Bir hata oluştu.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-300">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">📢 Anketini Paylaş</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Başlık */}
          <input required type="text" placeholder="Başlık" className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, title: e.target.value})} />
          
          {/* Kategori */}
          <div>
            <input required list="categories" placeholder="Kategori (Seç veya Yaz)" className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, category: e.target.value})} />
            <datalist id="categories">
                <option value="Tez / Akademik" /><option value="Oyun" /><option value="Psikoloji" />
            </datalist>
          </div>
          
          {/* SÜRE ALANI (YENİ EKLENEN) */}
          <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                  Ortalama Süre
              </label>
              <div className="flex gap-2">
                  <input
                      className="shadow appearance-none border rounded w-full py-3 px-3 text-gray-900 bg-white leading-tight focus:ring-2 focus:ring-indigo-500 outline-none"
                      type="number" min="1" placeholder="Sayı girin (örn: 5)"
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
          <input required type="url" placeholder="Link (Google Forms)" className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, externalLink: e.target.value})} />
          <textarea placeholder="Açıklama" className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, description: e.target.value})}></textarea>
          
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700">Yayınla</button>
        </form>
      </div>
    </div>
  );
}