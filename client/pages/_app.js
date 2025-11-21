import "@/styles/globals.css";
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google';
import Link from 'next/link'; // Kullanılmasa bile kalsın
import { useRouter } from 'next/router'; // Kullanılmasa bile kalsın

const inter = Inter({ subsets: ['latin'] });

// Artık temiz JS kodu: Component ve pageProps'a kızmayacak
export default function App({ Component, pageProps }) {
  return (
    <main className={inter.className}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Component {...pageProps} />
    </main>
  );
}