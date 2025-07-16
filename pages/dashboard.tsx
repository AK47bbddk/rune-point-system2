// pages/dashboard.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUsername(data.username);
        setPoints(data.points);
        setHistory(data.history || []);
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) {
    return <p className="p-4">Loading…</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>
      <p>ようこそ、<span className="font-medium">{username}</span> さん！</p>
      <p>現在のポイント: <span className="font-medium">{points}</span>pt</p>

      <div className="flex flex-col space-y-2">
        <Link
          href="/bets"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-center"
        >
          賭けイベント一覧へ
        </Link>
        <Link
          href="/excharge"
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-center"
        >
          景品交換ページへ
        </Link>
      </div>

      <div>
        <h2 className="font-medium mb-2">ポイント履歴</h2>
        <ul className="list-disc list-inside">
          {history.map((h, i) => (
            <li key={i}>
              [{new Date(h.timestamp.seconds * 1000).toLocaleString()}] {h.type}
              {h.amount != null && `：${h.amount}pt`}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded block"
      >
        ログアウト
      </button>
    </div>
  );
}




