# Vercel Deployment Instructions

## ⚠️ 重要: デプロイ前の設定

### 1. Vercel Postgresデータベースを作成

デプロイ**前**に必ずデータベースを作成してください：

1. Vercelダッシュボードで「Storage」タブをクリック
2. 「Create Database」→「Postgres」を選択
3. データベース名: `paid-leave-db`
4. Region: **Tokyo (iad1)**
5. 「Create」をクリック
6. 「Connect Project」でプロジェクトに接続
7. 環境変数 `DATABASE_URL` が自動的に追加されます

### 2. 環境変数の確認

プロジェクト設定で以下の環境変数が設定されていることを確認：

- `DATABASE_URL`: PostgreSQL接続文字列（Vercel Postgresで自動設定）

### 3. デプロイ

「Deploy」ボタンをクリック

### 4. デプロイ後のマイグレーション

デプロイが成功したら、データベースにテーブルを作成：

```bash
# Vercel CLIをインストール（初回のみ）
npm i -g vercel

# ログイン
vercel login

# プロジェクトにリンク
vercel link

# 本番環境の環境変数を取得
vercel env pull .env.production

# マイグレーションを実行
npx prisma migrate deploy
```

## トラブルシューティング

### エラー: "Environment variable not found: DATABASE_URL"

**原因**: データベースが作成されていない、または環境変数が設定されていない

**解決方法**:
1. Vercelダッシュボード → Storage → Create Database
2. Postgres を選択して作成
3. プロジェクトに接続
4. 再デプロイ

### エラー: "Can't reach database server"

**原因**: DATABASE_URLが正しくない

**解決方法**:
1. Vercelダッシュボード → Settings → Environment Variables
2. DATABASE_URLの値を確認
3. 正しい接続文字列に更新

### ビルドは成功するがアプリが動作しない

**原因**: マイグレーションが実行されていない

**解決方法**:
上記「デプロイ後のマイグレーション」を実行

## 代替方法: Supabaseを使用

Vercel Postgresの代わりにSupabaseを使用する場合：

1. https://supabase.com でプロジェクト作成
2. Settings → Database → Connection string (Pooling) をコピー
3. Vercel → Settings → Environment Variables
4. `DATABASE_URL` を追加（コピーした接続文字列）
5. 再デプロイ
