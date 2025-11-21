import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast'; // Eklendi

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Kayıt olunuyor...');

    try {
      await axios.post('http://192.168.1.47:5000/api/register', form);
      
      toast.dismiss(loadingToast);
      toast.success('Kayıt Başarılı! Şimdi giriş yapabilirsin. ✅');
      
      router.push('/login');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.msg || 'Kayıt sırasında hata oluştu! ❌');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">📝 Kayıt Ol</h2>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Kullanıcı Adı</label>
             <input type="text" required className="w-full p-3 border rounded text-gray-900 bg-white"
               placeholder="Örn: Arda"
               onChange={e => setForm({...form, username: e.target.value})} />
          </div>
            
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">E-posta</label>
             <input type="email" required className="w-full p-3 border rounded text-gray-900 bg-white"
               placeholder="mail@ornek.com"
               onChange={e => setForm({...form, email: e.target.value})} />
          </div>
            
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Şifre</label>
             <input type="password" required className="w-full p-3 border rounded text-gray-900 bg-white"
               placeholder="******"
               onChange={e => setForm({...form, password: e.target.value})} />
          </div>
            
          <button className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700 transition shadow-md">
            Kayıt Ol
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Zaten hesabın var mı? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}