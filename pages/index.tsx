// pages/login.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; // firebase.tsで初期化済みのauthを使用

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard"); // ログイン成功 → ダッシュボードへ
    } catch (err: any) {
      setError(err.message); // エラー表示
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
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        ログイン
      </button>
    </div>
  );
}
