# Paid Leave Management System (有給管理システム)

日本の労働基準法に準拠した有給休暇管理システム

## 機能

- ✅ 従業員管理（CRUD）
- ✅ 有給付与の自動計算（6ヶ月後10日、その後1年ごとに1日追加）
- ✅ 時効管理（付与から2年で消滅）
- ✅ 有給取得記録
- ✅ 休職期間管理（勤続年数から除外）
- ✅ 時効警告（30日前から表示）

## 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Vercel Postgres)
- **ORM**: Prisma
- **UI**: Tailwind CSS

## ローカル開発

### 前提条件

- Node.js 20以上
- PostgreSQL（またはSQLite for local dev）

### セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してDATABASE_URLを設定

# データベースマイグレーション
npx prisma migrate dev

# 開発サーバーの起動
npm run dev
```

http://localhost:3000 でアクセス

## Vercelへのデプロイ

詳細は [Vercelデプロイガイド](./VERCEL_DEPLOYMENT.md) を参照

### クイックスタート

1. Vercelにログイン: https://vercel.com
2. GitHubリポジトリをインポート
3. Vercel Postgresデータベースを作成
4. デプロイ

## データベーススキーマ

- **Employee**: 従業員情報
- **LeaveGrant**: 有給付与履歴
- **LeaveRequest**: 有給取得記録
- **LeaveOfAbsence**: 休職期間

## ライセンス

MIT
