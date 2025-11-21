import Link from 'next/link';

export default function SurveyCard({ survey }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full group relative">
      
      {/* Kategori ve Puan */}
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
             <span className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                {survey.category}
             </span>
             {/* SÜRE BİLGİSİ BURAYA GELDİ */}
             <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                🕒 {survey.durationValue} {survey.durationUnit === 'min' ? 'dk' : 'saat'}
             </span>
         </div>

         {/* PUAN MANTIĞI DÜZELTİLDİ */}
         <div className={`flex items-center font-bold text-sm px-2 py-1 rounded border ${survey.rating > 0 ? 'text-yellow-500 bg-yellow-50 border-yellow-100' : 'text-gray-400 bg-gray-50 border-gray-200'}`}>
             {survey.rating > 0 ? (
                 <>⭐ {survey.rating}</>
             ) : (
                 <span className="text-xs font-normal">Puanlanmadı</span>
             )}
         </div>
      </div>

      {/* Başlık */}
      <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">
          {survey.title}
      </h3>
      
      <p className="text-gray-600 text-sm mb-6 line-clamp-3 flex-grow">
          {survey.description}
      </p>

      {/* Alt Bilgi ve Buton */}
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
              <p>Sahibi: <span className="font-bold text-gray-700">{survey.username || 'Anonim'}</span></p>
              <p className="mt-0.5">{new Date(survey.createdAt).toLocaleDateString()}</p>
          </div>

          <Link href={`/survey/${survey._id}`}>
              <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                  İncele & Kazan →
              </button>
          </Link>
      </div>
    </div>
  );
}