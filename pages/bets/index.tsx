// pages/bets/index.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  DocumentData,
  Timestamp,
} from "firebase/firestore";

type BetEvent = {
  id: string;
  question: string;
  deadline: Timestamp;
};

export default function BetsListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<BetEvent[]>([]);

  useEffect(() => {
    // 未ログイン時はリダイレクト
    onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/login");
    });

    // bets コレクションをリアルタイム購読
    const unsub = onSnapshot(collection(db, "bets"), (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          question: data.question,
          deadline: data.deadline as Timestamp,
        };
      });
      setEvents(list);
    });

    return () => unsub();
  }, [router]);

  // 現在時刻
  const now = new Date();

  // 開催中（締切前）／受付終了（締切後）に分類
  const openEvents = events.filter((e) => e.deadline.toDate() > now);
  const closedEvents = events.filter((e) => e.deadline.toDate() <= now);

  return (
    <div className="p-6 space-y-6">
      <Link href="/dashboard" className="text-blue-500 hover:underline">
        ← ダッシュボードに戻る
      </Link>

      <h1 className="text-2xl font-bold">賭けイベント一覧</h1>

      {/* 賭け受付中 */}
      <section>
        <h2 className="text-xl font-semibold mb-2">受付中の賭け</h2>
        {openEvents.length > 0 ? (
          <ul className="space-y-2">
            {openEvents.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/bets/${e.id}`}
                  className="block p-4 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium">{e.question}</div>
                  <div className="text-sm text-gray-600">
                    締切: {e.deadline.toDate().toLocaleString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">現在受付中の賭けはありません。</p>
        )}
      </section>

      {/* 受付終了 */}
      <section>
        <h2 className="text-xl font-semibold mb-2">受付終了の賭け</h2>
        {closedEvents.length > 0 ? (
          <ul className="space-y-2">
            {closedEvents.map((e) => (
              <li key={e.id}>
                <div className="p-4 border rounded bg-gray-50">
                  <div className="font-medium text-gray-700">{e.question}</div>
                  <div className="text-sm text-gray-500">
                    締切: {e.deadline.toDate().toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">まだ受付終了の賭けはありません。</p>
        )}
      </section>
    </div>
  );
}


