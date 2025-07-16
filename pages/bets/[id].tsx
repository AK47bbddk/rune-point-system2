// pages/bets/[id].tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  onSnapshot,
  runTransaction,
  Timestamp,
  increment,
  DocumentData,
} from "firebase/firestore";

export default function BetEventPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [user, setUser] = useState<User | null>(null);
  const [points, setPoints] = useState(0);
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [bets, setBets] = useState<Record<string, { choice: number; amount: number }>>({});
  const [totals, setTotals] = useState<number[]>([]);
  const [odds, setOdds] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (!u) router.replace("/login");
      else {
        setUser(u);
        const userRef = doc(db, "users", u.uid);
        onSnapshot(userRef, (snap) => {
          const data = snap.data() as DocumentData;
          setPoints(data.points || 0);
        });
      }
    });
  }, [router]);

  useEffect(() => {
    if (!id) return;
    const eventRef = doc(db, "bets", id);
    const unsub = onSnapshot(eventRef, (snap) => {
      if (!snap.exists()) {
        setMessage("イベントが見つかりません。");
        return;
      }
      const data = snap.data();
      setQuestion(data.question);
      setChoices(data.choices);
      setDeadline(data.deadline.toDate());
      setBets(data.bets || {});
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    const c = choices.length;
    const tot = Array(c).fill(0);
    Object.values(bets).forEach(({ choice, amount }) => {
      tot[choice] += amount;
    });
    setTotals(tot);
    const sum = tot.reduce((a, b) => a + b, 0);
    setOdds(tot.map((t) => (t > 0 ? Number((sum / t).toFixed(2)) : 0)));
  }, [bets, choices]);

  const placeBet = async () => {
    if (selected === null) {
      setMessage("選択肢を選んでください。");
      return;
    }
    if (amount <= 0 || amount > points) {
      setMessage("適切な金額を入力してください。");
      return;
    }
    if (!id || !user) return;

    try {
      await runTransaction(db, async (tx) => {
        const eventRef = doc(db, "bets", id);
        const userRef = doc(db, "users", user.uid);
        const eventSnap = await tx.get(eventRef);
        const userSnap = await tx.get(userRef);
        if (!eventSnap.exists() || !userSnap.exists()) throw new Error("データがありません。");
        const eventData = eventSnap.data();
        const userData = userSnap.data();
        if (eventData.bets?.[user.uid]) throw new Error("既にベット済みです。");
        if ((userData.points || 0) < amount) throw new Error("ポイント不足です。");
        tx.update(eventRef, { [`bets.${user.uid}`]: { choice: selected, amount } });
        tx.update(userRef, { points: increment(-amount) });
      });
      setMessage("ベット完了！");
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  if (!user || !deadline) return <p>Loading…</p>;
  if (new Date() > deadline)
    return (
      <div className="p-6">
        <Link href="/bets" className="text-blue-500 hover:underline">← 賭け一覧に戻る
        </Link>
        <h1 className="text-xl font-bold mt-4">イベント終了</h1>
        <p>締切を過ぎています。</p>
      </div>
    );

  return (
    <div className="p-6 space-y-4">
      <div>
        <Link href="/bets"className="text-blue-500 hover:underline">← 賭け一覧に戻る
        </Link>
      </div>
      <h1 className="text-2xl font-bold">{question}</h1>
      {choices.map((c, i) => (
        <label key={i} className="flex items-center space-x-2">
          <input
            type="radio"
            checked={selected === i}
            onChange={() => setSelected(i)}
          />
          <span>{c}</span>
          <span className="ml-auto">
            {totals[i]}pt 投票中 | オッズ:{odds[i] || "-"}
          </span>
        </label>
      ))}
      <div>
        <input
          type="number"
          min={1}
          max={points}
          placeholder={`1～${points}pt`}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="border p-2 rounded w-32"
        />
      </div>
      <button
        onClick={placeBet}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
      >
        この内容でベット
      </button>
      {message && <p className="text-red-500 mt-2">{message}</p>}
    </div>
  );
}
