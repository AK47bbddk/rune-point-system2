// pages/admin/bets.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { QRCodeCanvas as QRCode } from "qrcode.react";

export default function AdminBetsPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<string[]>(["", ""]);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventUrl, setEventUrl] = useState<string | null>(null);

  const addChoice = () => {
    if (choices.length < 3) setChoices([...choices, ""]);
  };

  const updateChoice = (i: number, v: string) => {
    const a = [...choices];
    a[i] = v;
    setChoices(a);
  };

  const createEvent = async () => {
    setError("");
    if (!question.trim() || choices.some((c) => !c.trim()) || !deadline) {
      setError("すべての項目を入力してください。");
      return;
    }
    setLoading(true);
    try {
      const id = uuidv4();
      await setDoc(doc(db, "bets", id), {
        question: question.trim(),
        choices: choices.map((c) => c.trim()),
        deadline: Timestamp.fromDate(new Date(deadline)),
        bets: {},
        result: null,
      });
      const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      setEventId(id);
      setEventUrl(`${base}/admin/bets/${id}`);

      setNotice(`Adminが「${question.trim()}」の賭けを開始しました`);
      setTimeout(() => setNotice(""), 5000);
    } catch (e: any) {
      setError("イベント作成に失敗しました：" + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Link href="/admin/admin-dashboard" className="text-blue-500 hover:underline">
        ← 管理者ダッシュボードに戻る
      </Link>

      {notice && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-300 text-gray-800 px-6 py-2 rounded shadow-lg z-50">
          {notice}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">賭けイベント作成</h1>
      <div className="space-y-4 max-w-lg">
        <div>
          <input
            className="w-full border p-2 rounded"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="質問文"
          />
        </div>
        {choices.map((c, i) => (
          <div key={i}>
            <input
              className="w-full border p-2 rounded"
              value={c}
              onChange={(e) => updateChoice(i, e.target.value)}
              placeholder={`選択肢 ${i + 1}`}
            />
          </div>
        ))}
        {choices.length < 3 && (
          <button onClick={addChoice} className="text-blue-500">
            ＋ 選択肢を追加
          </button>
        )}
        <div>
          <input
            type="datetime-local"
            className="w-full border p-2 rounded"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <button
          onClick={createEvent}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          {loading ? "作成中…" : "イベントを作成"}
        </button>

        {eventUrl && (
          <div className="mt-6 space-y-2">
            <p>管理者用結果入力ページURL:</p>
            <Link href={eventUrl} className="text-blue-600 break-all hover:underline">
              {eventUrl}
            </Link>
            {/* ここに結果入力ページへ直接飛ぶボタンを追加 */}
            {eventId && (
              <button
                onClick={() => router.push(`/admin/bets/${eventId}`)}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                結果入力ページへ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
