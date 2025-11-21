import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast'; // Kütüphaneyi çağırdık

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Giriş yapılıyor...'); // Yükleniyor efekti

    try {
      const res = await axios.post('http://192.168.1.47:5000/api/login', form);
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.user.username);
      
      toast.dismiss(loadingToast); // Yükleniyor'u kapat
      toast.success('Hoş geldin! Başarıyla giriş yaptın. 🎉'); // YEŞİL MESAJ
      
      router.push('/'); 
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.msg || 'Giriş başarısız! Bilgileri kontrol et.'); // KIRMIZI MESAJ
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">🔑 Giriş Yap</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="E-posta" required 
            className="w-full p-3 border rounded text-gray-900 bg-white"
            onChange={e => setForm({...form, email: e.target.value})} />
            
          <input type="password" placeholder="Şifre" required 
            className="w-full p-3 border rounded text-gray-900 bg-white"
            onChange={e => setForm({...form, password: e.target.value})} />
            
          <button className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700 transition">
            Giriş Yap
          </button>
        </form>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500 mb-2">Üye olmak istemiyor musun?</p>
            <button 
                onClick={() => { 
                    localStorage.clear();
                    toast('Misafir girişi yapıldı', { icon: '🕵️‍♂️' });
                    router.push('/');
                }}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded font-bold hover:bg-gray-300 transition flex items-center justify-center gap-2"
            >
                🕵️‍♂️ Misafir Olarak Devam Et
            </button>
        </div>

        <p className="mt-6 text-center text-gray-600">
          Hesabın yok mu? <Link href="/register" className="text-indigo-600 font-bold hover:underline">Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
}