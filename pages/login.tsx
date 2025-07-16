// pages/login.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, Timestamp, increment, arrayUnion } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const { token } = router.query as { token?: string };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async () => {
    setError("");
    try {
      // 1) 認証
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // 2) QRトークンがあれば付与処理
      if (token) {
        await handleAttendance(uid, token);
      }

      // 3) ダッシュボードへ遷移
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold mb-6">ログイン</h1>

      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 mb-4 w-full max-w-xs"
      />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 mb-4 w-full max-w-xs"
      />

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        onClick={login}
        className="w-full max-w-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        ログイン
      </button>

      <p className="mt-4">
        初めてご利用の方は{" "}
        <Link href="/register" className="text-blue-500 hover:underline">
          こちらから登録
        </Link>
      </p>
    </div>
  );
}

// 当日の初回のみ1pt付与するヘルパー関数
async function handleAttendance(uid: string, token: string) {
  // トークンチェック
  const tokRef = doc(db, "attendance", token);
  const tokSnap = await getDoc(tokRef);
  if (!tokSnap.exists()) throw new Error("無効なQRコードです。");

  const { expiresAt } = tokSnap.data() as { expiresAt: Timestamp };
  if (expiresAt.toDate() < new Date()) throw new Error("このQRコードは期限切れです。");

  // ユーザー情報取得
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("ユーザー情報が見つかりません。");
  const data = userSnap.data() as any;
  const lastDate: string = data.lastAttendanceDate || "";

  // 「東京時間での日付」を計算（8時前は前日扱い）
  const now = new Date();
  const tokyoNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  let attendanceDay = tokyoNow;
  if (tokyoNow.getHours() < 8) {
    attendanceDay.setDate(attendanceDay.getDate() - 1);
  }
  const yy = attendanceDay.getFullYear();
  const mm = String(attendanceDay.getMonth() + 1).padStart(2, "0");
  const dd = String(attendanceDay.getDate()).padStart(2, "0");
  const todayKey = `${yy}-${mm}-${dd}`;  // e.g. "2025-07-16"

  // 当日の初回ならポイント付与＆lastAttendanceDate更新
  if (lastDate !== todayKey) {
    await updateDoc(userRef, {
      points: increment(1),
      lastAttendanceDate: todayKey,
      history: arrayUnion({
        type: "attendance",
        token,
        amount: 100,
        timestamp: Timestamp.now(),
      }),
    });
  }
}




