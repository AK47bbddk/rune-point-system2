// pages/register.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const register = async () => {
    setError("");
    if (!email || !password || !username) {
      setError("すべての項目を入力してください。");
      return;
    }
    try {
      // 1) Firebase Auth でアカウント作成
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // 2) Firestore にユーザードキュメントを作成（初回100pt付与）
      await setDoc(doc(db, "users", uid), {
        username,
        role: "student",
        points: 100,  // 初期ポイントを100に
        history: [
          {
            type: "registration",
            amount: 100,
            timestamp: Timestamp.now(),
          },
        ],
        // lastAttendanceDate など他フィールドは不要なため省略
      });

      // 3) ダッシュボードへリダイレクト
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold mb-6">新規登録</h1>

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

      <input
        type="text"
        placeholder="ユーザーネーム"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 mb-4 w-full max-w-xs"
      />

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        onClick={register}
        className="w-full max-w-xs bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
      >
        登録して始める
      </button>

      <p className="mt-4">
        既にアカウントをお持ちの方は{" "}
        <Link href="/login" className="text-blue-500 hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
