import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function AddSurvey() {
  const [form, setForm] = useState({ title: '', description: '', externalLink: '', category: '' });
  const router = useRouter();

  useEffect(() => {
      if(!localStorage.getItem('token')) {
          toast.error("Misafirler anket yayınlayamaz!");
          router.push('/register');
      }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const loadingToast = toast.loading('Anket yayınlanıyor...');

    try {
      await axios.post('http://192.168.1.47:5000/api/surveys', form, {
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
          <input required type="text" placeholder="Başlık" className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, title: e.target.value})} />
          
          {/* ÖZGÜR KATEGORİ SEÇİMİ */}
          <div>
            <input 
                required 
                list="categories" 
                placeholder="Kategori (Seç veya Yaz)" 
                className="w-full p-3 border rounded text-gray-900 bg-white"
                onChange={e => setForm({...form, category: e.target.value})}
            />
            <datalist id="categories">
                <option value="Tez / Akademik" />
                <option value="Oyun" />
                <option value="Psikoloji" />
                <option value="Pazar Araştırması" />
                <option value="Sosyal Sorumluluk" />
                <option value="Eğitim" />
            </datalist>
          </div>

          <input required type="url" placeholder="Link (Google Forms vb.)" className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, externalLink: e.target.value})} />
          <textarea placeholder="Açıklama" className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, description: e.target.value})}></textarea>
          
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700">Yayınla</button>
        </form>
      </div>
    </div>
  );
}