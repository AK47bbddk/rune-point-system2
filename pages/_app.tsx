// pages/_app.tsx

// Tailwind を使っているならグローバルCSSを読み込む
import '@/styles/globals.css';  
// Next.js が型チェックに使う型をインポート
import type { AppProps } from 'next/app';

// これが「アプリケーション全体のコンポーネント」です
export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
