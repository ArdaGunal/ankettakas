import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://192.168.1.47:5000/api/register', form);
      alert('Kayıt Başarılı! Giriş yapabilirsin.');
      router.push('/login');
    } catch (err) {
      alert(err.response?.data?.msg || 'Kayıt hatası');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">📝 Kayıt Ol</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="Kullanıcı Adı" required 
            className="w-full p-3 border rounded text-gray-900 bg-white"
            onChange={e => setForm({...form, username: e.target.value})} />
            
          <input type="email" placeholder="E-posta Adresi" required 
            className="w-full p-3 border rounded text-gray-900 bg-white"
            onChange={e => setForm({...form, email: e.target.value})} />
            
          <input type="password" placeholder="Şifre" required 
            className="w-full p-3 border rounded text-gray-900 bg-white"
            onChange={e => setForm({...form, password: e.target.value})} />
            
          <button className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700">
            Kayıt Ol
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Zaten hesabın var mı? <Link href="/login" className="text-indigo-600 font-bold">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}