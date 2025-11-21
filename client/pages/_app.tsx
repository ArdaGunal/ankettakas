import "@/styles/globals.css";
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }) {
  return (
    <main className={inter.className}>
      {/* Bildirim Kutusu Ayarları */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      
      {/* Sayfa İçeriği */}
      <Component {...pageProps} />

      {/* NOT: Yüzen ev butonu buradan kaldırıldı. 
          Artık sayfa altlarındaki butonları kullanacağız. */}
    </main>
  );
}