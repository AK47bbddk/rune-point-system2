// pages/excharge.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

type Prize = { id: string; name: string; cost: number };

export default function ExchargePage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [points, setPoints] = useState<number>(0);

  useEffect(() => {
    // 認証とポイント取得
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUser(u);
      const userSnap = await getDoc(doc(db, "users", u.uid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        setPoints(data.points || 0);
      }
    });

    // 景品リスト取得
    (async () => {
      const snap = await getDocs(collection(db, "rewards"));
      setPrizes(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Prize, "id">),
        }))
      );
    })();

    return () => unsub();
  }, []);

  const requestExchange = async (p: Prize) => {
    if (!user || points < p.cost) return;
    // ポイント減算
    await updateDoc(doc(db, "users", user.uid), { points: points - p.cost });
    // 交換申請ドキュメント
    await setDoc(doc(db, "requests", `${user.uid}_${p.id}`), {
      userId: user.uid,
      rewardId: p.id,
      status: "pending",
      requestedAt: new Date(),
    });
    alert("交換申請しました！");
    setPoints(points - p.cost);
  };

  if (!user) {
    return <p className="p-4">Loading…</p>;
  }

  return (
    <div className="p-6">
      <Link href="/dashboard" className="text-blue-500 hover:underline">
        ← ダッシュボードに戻る
      </Link>

      <h1 className="text-2xl font-bold mb-4">景品交換</h1>
      <p className="mb-4">所持ポイント：{points}pt</p>

      <ul className="space-y-4">
        {prizes.map((p) => (
          <li key={p.id} className="border p-4 rounded flex justify-between">
            <span>
              {p.name}（{p.cost}pt）
            </span>
            <button
              onClick={() => requestExchange(p)}
              disabled={points < p.cost}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              交換申請
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

