import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Giriş yapılıyor...');

    try {
      // 5 saniye zaman aşımı (timeout) ile istek atıyoru
      const res = await axios.post(`${API_URL}/login`, form, { timeout: 5000 }); 
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.user.username);
      
      toast.dismiss(loadingToast);
      toast.success('Hoş geldin! 🎉');
      router.push('/'); 
    } catch (err) { 
      toast.dismiss(loadingToast);
      
      // Sunucu kapalıysa veya IP yanlışsa bu hata döner
      if (err.code === 'ERR_NETWORK') {
          toast.error("Sunucuya ulaşılamıyor! IP adresini kontrol et.");
      } else {
          toast.error(err.response?.data?.msg || 'Giriş başarısız.');
      }
    }
  };

  const handleGuest = () => {
      localStorage.clear();
      toast.success('Misafir modu aktif. 👀');
      router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">🔑 Giriş Yap</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="E-posta" required className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, email: e.target.value})} />
          <input type="password" placeholder="Şifre" required className="w-full p-3 border rounded text-gray-900 bg-white" onChange={e => setForm({...form, password: e.target.value})} />
          <button className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700 transition">Giriş Yap</button>
        </form>
        
        {/* MİSAFİR BUTONU */}
        <div className="mt-6 pt-4 border-t border-gray-200">
            <button onClick={handleGuest} className="w-full bg-gray-800 text-white py-3 rounded font-bold hover:bg-gray-900 transition flex items-center justify-center gap-2 shadow-md">
                🕵️‍♂️ Üye Olmadan Devam Et
            </button>
        </div>

        <p className="mt-6 text-center text-gray-600">
          Hesabın yok mu? <Link href="/register" className="text-indigo-600 font-bold hover:underline">Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
}