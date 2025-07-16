// pages/admin/attendance.tsx
import { useState } from "react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { QRCodeCanvas as QRCode } from "qrcode.react";

export default function AdminAttendancePage() {
  const [className, setClassName] = useState("");
  const [expireAt, setExpireAt] = useState<string>("");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const generateQRCode = async () => {
    setError("");
    if (!className.trim()) {
      setError("クラス名を入力してください。");
      return;
    }
    setLoading(true);
    try {
      const newToken = uuidv4();
      const expires = expireAt
        ? Timestamp.fromDate(new Date(expireAt))
        : Timestamp.fromDate(new Date(Date.now() + 1000 * 60 * 60));
      await setDoc(doc(db, "attendance", newToken), {
        className: className.trim(),
        issuedAt: Timestamp.now(),
        expiresAt: expires,
      });
      const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      setUrl(`${base}/login?token=${newToken}`);
    } catch (e: any) {
      setError("QRコード発行に失敗しました：" + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/admin/admin-dashboard"className="text-blue-500 hover:underline">← 管理者ダッシュボードに戻る
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">出席用QRコード発行</h1>
      <div className="space-y-4 max-w-md">
        <input
          type="text"
          placeholder="クラス名"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="datetime-local"
          value={expireAt}
          onChange={(e) => setExpireAt(e.target.value)}
          className="w-full border p-2 rounded"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button
          onClick={generateQRCode}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {loading ? "発行中…" : "QRコードを発行"}
        </button>
      </div>
      {url && (
        <div className="mt-8 text-center">
          <QRCode value={url} size={200} />
          <p className="mt-2 break-all">{url}</p>
        </div>
      )}
    </div>
  );
}
