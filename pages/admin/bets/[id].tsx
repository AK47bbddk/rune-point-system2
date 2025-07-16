// pages/admin/bets/[id].tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "../../../lib/firebase";
import {
  doc,
  getDoc,
  writeBatch,
  Timestamp,
  increment,
  arrayUnion,
} from "firebase/firestore";

type BetRecord = {
  choice: number;
  amount: number;
};

export default function AdminBetResultPage() {
  const router = useRouter();
  const rawId = router.query.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [event, setEvent] = useState<{
    question: string;
    choices: string[];
    deadline: Timestamp;
    bets: Record<string, BetRecord>;
    result: number | null;
  } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof id !== "string") return;
    (async () => {
      const snap = await getDoc(doc(db, "bets", id));
      if (snap.exists()) {
        setEvent(snap.data() as any);
      } else {
        setError("イベントが見つかりません");
      }
    })();
  }, [id]);

  const confirmResult = async () => {
    if (typeof id !== "string" || !event || selected === null) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const eventRef = doc(db, "bets", id);

      const bets = event.bets || {};

      // 各選択肢に賭けられた総額を計算
      const totals: number[] = event.choices.map((_, idx) =>
        Object.values(bets).reduce(
          (sum: number, record: BetRecord) =>
            record.choice === idx ? sum + record.amount : sum,
          0
        )
      );

      // 全体の合計賭け金
      const sumAll: number = totals.reduce(
        (acc: number, curr: number) => acc + curr,
        0
      );

      // オッズを計算
      const odds: number[] = totals.map((t: number) =>
        t > 0 ? sumAll / t : 0
      );

      // 勝った人にポイント配布
      for (const [uid, record] of Object.entries(bets)) {
        if (record.choice === selected) {
          const payout = Math.floor(record.amount * odds[record.choice]);
          const userRef = doc(db, "users", uid);
          batch.update(userRef, {
            points: increment(payout),
            history: arrayUnion({
              type: "bet-win",
              eventId: id,
              amount: payout,
              timestamp: Timestamp.now(),
            }),
          });
        }
      }

      // イベントに結果情報を保存
      batch.update(eventRef, {
        result: selected,
        resolvedAt: Timestamp.now(),
      });

      await batch.commit();
      router.push("/admin/admin-dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Link href="/admin/admin-dashboard" className="text-blue-500 hover:underline">
          ← 管理者ダッシュボードに戻る
        </Link>
        <p className="text-red-500 mt-4">{error}</p>
      </div>
    );
  }

  if (!event) {
    return <p className="p-6">Loading…</p>;
  }

  return (
    <div className="p-6 space-y-4">
      <Link href="/admin/admin-dashboard" className="text-blue-500 hover:underline">
        ← 管理者ダッシュボードに戻る
      </Link>

      <h1 className="text-2xl font-bold">{event.question}</h1>
      <p className="text-sm text-gray-600">
        締切日時: {event.deadline.toDate().toLocaleString()}
      </p>

      <div className="space-y-2">
        {event.choices.map((choiceText, idx) => (
          <label key={idx} className="flex items-center space-x-2">
            <input
              type="radio"
              name="result"
              value={idx}
              checked={selected === idx}
              onChange={() => setSelected(idx)}
            />
            <span>{choiceText}</span>
          </label>
        ))}
      </div>

      <button
    onClick={async () => {
      await confirmResult();
      router.push("/admin/admin-dashboard");
    }}
    disabled={loading || selected === null}
    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
  >
    {loading ? "処理中…" : "勝敗を確定して配布"}
  </button>
    </div>
  );
}
