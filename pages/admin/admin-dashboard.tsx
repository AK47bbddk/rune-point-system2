// pages/admin/dashboard.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, DocumentData } from "firebase/firestore";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<{ id: string; question: string }[]>([]);

  // 認証チェック
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/login");
    });
    return () => unsub();
  }, [router]);

  // bets コレクションを購読してイベント一覧を取得
  useEffect(() => {
    const q = collection(db, "bets");
    const unsub = onSnapshot(q, (snap) => {
      setEvents(
        snap.docs.map((d) => ({
          id: d.id,
          question: (d.data() as DocumentData).question || "",
        }))
      );
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>

      <div className="flex space-x-4">
        <Link href="/admin/attendance" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          QR発行ページへ
        </Link>
        <Link href="/admin/bets" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
          賭けイベント作成
        </Link>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-2">作成済みイベント</h2>
        {events.length > 0 ? (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/admin/bets/${e.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {e.question}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">まだイベントが作成されていません。</p>
        )}
      </section>

      <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
      >
        ログアウト
      </button>
    </div>
  );
}



