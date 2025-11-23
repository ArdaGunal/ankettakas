import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { API_URL } from '../config';

export default function Leaderboard() {
    const [rankings, setRankings] = useState([]);

    useEffect(() => {
        const fetchRankings = async () => {
            try {
                // YENİ ROTA: Backend'den sıralanmış kullanıcı listesini çeker
                const res = await axios.get(`${API_URL}/leaderboard`);
                setRankings(res.data);
            } catch (err) {
                console.error("Lider tablosu yüklenemedi:", err);
            }
        };
        fetchRankings();
    }, []);

    const getRankColor = (index) => {
        if (index === 0) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
        if (index === 1) return 'text-gray-600 bg-gray-200 border-gray-400';
        if (index === 2) return 'text-orange-600 bg-orange-100 border-orange-300';
        return 'text-indigo-600 bg-indigo-100 border-indigo-200';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-10">
            <div className="max-w-xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-6 relative">
                    
                    <Link href="/">
                        <button className="absolute top-6 left-6 text-sm font-bold text-gray-500 hover:text-black">← Ana Sayfa</button>
                    </Link>

                    <h1 className="text-3xl font-bold text-center text-indigo-900 mt-4 mb-2">
                        🏆 Liderlik Tablosu
                    </h1>
                    <p className="text-center text-gray-500 mb-8">
                        En çok puan toplayarak topluluğa katkıda bulunanlar.
                    </p>

                    <div className="space-y-3">
                        {rankings.map((user, index) => (
                            <div 
                                key={user.username} 
                                className={`flex justify-between items-center p-4 rounded-xl border-2 ${getRankColor(index)}`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* SIRALAMA NUMARASI */}
                                    <span className="text-xl font-black w-6 text-center">
                                        #{index + 1}
                                    </span>
                                    <div>
                                        <p className="font-bold text-lg">{user.username}</p>
                                        <p className={`text-xs font-semibold ${index === 0 ? 'text-yellow-700' : 'text-gray-600'}`}>
                                            Seviye {user.level}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-extrabold text-xl">{user.points}</p>
                                    <p className="text-xs text-gray-600">Toplam Puan</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}