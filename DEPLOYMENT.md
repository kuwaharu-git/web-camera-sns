# デプロイメントガイド (Deployment Guide)

## GitHub Pagesへのデプロイ

このアプリケーションはGitHub Actionsを使用してGitHub Pagesに自動デプロイされます。

### 初回セットアップ

1. **GitHub Pagesの有効化**
   - GitHubリポジトリの Settings > Pages に移動
   - Source を "GitHub Actions" に設定

2. **ブランチへのプッシュ**
   ```bash
   git push origin main
   ```

3. **デプロイの確認**
   - Actions タブでワークフローの実行を確認
   - デプロイが完了したら、`https://[ユーザー名].github.io/web-camera-sns/` でアクセス可能

### 重要な注意事項

#### HTTPSの必要性
- カメラAPIはセキュリティ上の理由から、HTTPSまたはlocalhostでのみ動作します
- GitHub PagesはHTTPSを自動的に提供するため、本番環境では問題ありません
- ローカル開発では `localhost` を使用してください

#### カメラの許可
- 初回アクセス時、ブラウザがカメラへのアクセス許可を求めます
- ユーザーは許可を与える必要があります

#### X(Twitter)への投稿
- Twitter Web Intent APIを使用
- 画像の直接アップロードはサポートされていません
- ユーザーは以下のいずれかの方法で画像を添付できます：
  1. 「ダウンロード」ボタンで画像を保存し、Twitterに手動でアップロード
  2. デバイスのスクリーンショット機能を使用

### トラブルシューティング

#### カメラが起動しない場合
1. ブラウザのカメラ許可を確認
2. HTTPSまたはlocalhostで実行されているか確認
3. デバイスにカメラが接続されているか確認

#### デプロイが失敗する場合
1. GitHub Actions のログを確認
2. `npm run build` がローカルで成功するか確認
3. repository の Permissions 設定を確認（Actions に write 権限が必要）

### ローカル開発

```bash
# 開発サーバーの起動
npm run dev

# ビルドのテスト
npm run build

# ビルド結果のプレビュー
npm run preview
```

### カスタマイズ

#### ハッシュタグの変更
`src/App.tsx` の `HASHTAG` 定数を編集：

```typescript
const HASHTAG = '#WebCameraSNS'; // ここを変更
```

#### ベースURLの変更
別のリポジトリ名を使用する場合、`vite.config.ts` を更新：

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/あなたのリポジトリ名/',
})
```
