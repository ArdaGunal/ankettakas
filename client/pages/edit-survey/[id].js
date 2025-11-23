import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { API_URL } from '../../config';

export default function EditSurvey() {
  const router = useRouter();
  const { id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    externalLink: '',
    category: '',
    durationValue: '5',
    durationUnit: 'min'
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const loggedInUser = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

  useEffect(() => {
    if (!id) return;
    
    // GİRİŞ KONTROLÜ
    if (!token) {
      toast.error("Düzenlemek için giriş yapmalısın!");
      router.push('/login');
      return;
    }

    fetchSurvey();
  }, [id, token]);

  const fetchSurvey = async () => {
    try {
      const res = await axios.get(`${API_URL}/surveys/${id}`);
      const survey = res.data;

      // YETKİ KONTROLÜ: Sadece anket sahibi düzenleyebilir
      if (survey.username !== loggedInUser) {
        toast.error("Bu anketi düzenleme yetkin yok! 🚫");
        router.push('/profile');
        return;
      }

      // Formu doldur
      setForm({
        title: survey.title || '',
        description: survey.description || '',
        externalLink: survey.externalLink || '',
        category: survey.category || '',
        durationValue: survey.durationValue?.toString() || '5',
        durationUnit: survey.durationUnit || 'min'
      });

      setLoading(false);
    } catch (err) {
      console.error("Anket yüklenemedi:", err);
      toast.error('Anket bulunamadı!');
      router.push('/profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Güncelleniyor...');

    // Validasyon
    if (!form.title.trim()) {
      toast.dismiss(loadingToast);
      return toast.error("Başlık boş olamaz!");
    }

    if (!form.externalLink.trim() || !form.externalLink.startsWith('http')) {
      toast.dismiss(loadingToast);
      return toast.error("Geçerli bir link girin!");
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      externalLink: form.externalLink.trim(),
      durationValue: parseInt(form.durationValue) || 5,
      durationUnit: form.durationUnit
    };

    try {
      await axios.put(`${API_URL}/surveys/${id}`, payload, {
        headers: { 'x-auth-token': token }
      });

      toast.dismiss(loadingToast);
      toast.success('Anket güncellendi! ✅');
      router.push('/profile');
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error(err);
      toast.error(err.response?.data?.msg || 'Güncelleme başarısız!');
    }
  };

  const handleCancel = () => {
    if (confirm("Değişiklikleri kaydetmeden çıkmak istiyor musun?")) {
      router.push('/profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 font-bold">Anket Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl border border-gray-300">
        
        {/* BAŞLIK */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">✏️ Anketi Düzenle</h2>
          <button 
            onClick={handleCancel} 
            className="text-gray-500 hover:text-red-600 font-bold text-sm"
          >
            ✕ İptal
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* BAŞLIK */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Anket Başlığı <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="Örn: Tez Anketi - Sosyal Medya Kullanımı"
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
            />
          </div>

          {/* KATEGORİ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <input
              required
              list="categories"
              placeholder="Kategori seç veya yaz"
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:border-indigo-500"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
            />
            <datalist id="categories">
              <option value="Tez / Akademik" />
              <option value="Oyun" />
              <option value="Psikoloji" />
              <option value="Teknoloji" />
              <option value="Sağlık" />
              <option value="Eğitim" />
              <option value="Diğer" />
            </datalist>
          </div>

          {/* SÜRE */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Ortalama Süre <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:border-indigo-500"
                type="number"
                min="1"
                placeholder="5"
                value={form.durationValue}
                onChange={e => setForm({...form, durationValue: e.target.value})}
                required
              />
              <select
                className="p-3 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none cursor-pointer"
                value={form.durationUnit}
                onChange={e => setForm({...form, durationUnit: e.target.value})}
              >
                <option value="min">Dakika</option>
                <option value="saat">Saat</option>
              </select>
            </div>
          </div>

          {/* LİNK */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Anket Linki <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="url"
              placeholder="https://forms.gle/..."
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              value={form.externalLink}
              onChange={e => setForm({...form, externalLink: e.target.value})}
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Google Forms, Typeform, SurveyMonkey vb. desteklenir
            </p>
          </div>

          {/* AÇIKLAMA */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              placeholder="Anketin amacı, hedef kitle, vb. hakkında bilgi verin..."
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 min-h-[100px]"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          {/* BUTONLAR */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition border border-gray-300"
            >
              İptal Et
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition"
            >
              Güncelle ✓
            </button>
          </div>
        </form>

        {/* BİLGİ NOTU */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Not:</strong> Anket puanları ve yorumlar değişmeyecektir. 
            Sadece başlık, açıklama ve link güncellenebilir.
          </p>
        </div>
      </div>
    </div>
  );
}