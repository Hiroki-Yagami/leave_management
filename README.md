# Paid Leave Management System (有給管理システム)

日本の労働基準法に準拠した有給休暇管理システム

## 🔐 認証情報

このアプリケーションはBasic認証で保護されています。

**デフォルトの認証情報:**
- ユーザー名: `admin`
- パスワード: `yukyu2025`

> **注意**: 本番環境では必ず強力なパスワードに変更してください。

## 機能

- ✅ 従業員管理（CRUD）
- ✅ 有給付与の自動計算（6ヶ月後10日、その後1年ごとに1日追加）
- ✅ 時効管理（付与から2年で消滅）
- ✅ 有給取得記録
- ✅ 休職期間管理（勤続年数から除外）
- ✅ 時効警告（30日前から表示）
- ✅ Basic認証によるアクセス制限

## 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Vercel Postgres)
- **ORM**: Prisma
- **UI**: Tailwind CSS
- **Auth**: Basic Authentication (Middleware)

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
# .envファイルを編集してDATABASE_URLと認証情報を設定

# データベースマイグレーション
npx prisma migrate dev

# 開発サーバーの起動
npm run dev
```

http://localhost:3000 でアクセス（認証が求められます）

## Vercelへのデプロイ

### 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：

1. **DATABASE_URL**: PostgreSQL接続文字列
2. **AUTH_USER**: 認証ユーザー名（例: `admin`）
3. **AUTH_PASSWORD**: 認証パスワード（強力なパスワードを設定）

### デプロイ手順

1. Vercelにログイン: https://vercel.com
2. GitHubリポジトリをインポート
3. Vercel Postgresデータベースを作成
4. 環境変数を設定（上記参照）
5. デプロイ

詳細は [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) を参照

## セキュリティ

### パスワードの変更

**ローカル環境:**
`.env`ファイルの`AUTH_PASSWORD`を変更

**Vercel環境:**
1. Settings → Environment Variables
2. `AUTH_PASSWORD`を編集
3. 再デプロイ

### 推奨事項

- 強力なパスワードを使用（12文字以上、英数字記号混在）
- 定期的にパスワードを変更
- パスワードを共有しない

## データベーススキーマ

- **Employee**: 従業員情報
- **LeaveGrant**: 有給付与履歴
- **LeaveRequest**: 有給取得記録
- **LeaveOfAbsence**: 休職期間

## ライセンス

MIT
