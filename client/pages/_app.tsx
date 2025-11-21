import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Inter } from 'next/font/google'; // Google Font Eklendi

// Inter fontunu ayarlıyoruz
const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isHomePage = router.pathname === '/';

  return (
    // Font sınıfını (className) ana kapsayıcıya ekliyoruz
    <main className={inter.className}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      
      <Component {...pageProps} />

      {/* Ana Menü Butonu */}
      {!isHomePage && (
          <Link href="/">
            <button 
                title="Ana Menüye Dön"
                className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition hover:scale-110 z-50 flex items-center justify-center border-4 border-white"
            >
                <span className="text-2xl">🏠</span>
            </button>
          </Link>
      )}
    </main>
  );
}