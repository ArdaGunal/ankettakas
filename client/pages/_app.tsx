import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Eğer zaten ana sayfadaysak butonu gösterme (Gereksiz kalabalık olmasın)
  const isHomePage = router.pathname === '/';

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      
      <Component {...pageProps} />

      {/* --- HER YERDE GÖRÜNEN SABİT BUTON --- */}
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
    </>
  );
}