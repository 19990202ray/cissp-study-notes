# CISSP Study Notes

CISSP Domain 1〜8の普段の復習用参考書を閲覧するための公開リポジトリです。現在はDomain 1を収録しています。

- トップ: https://19990202ray.github.io/cissp-study-notes/
- Domain 1: https://19990202ray.github.io/cissp-study-notes/domain1/

URLはPagesの公開設定が有効になり、配信が完了すると利用できます。

## 正本と公開用ファイル

正本はGoogle Driveの `CISSP/CISSP_Study_Notes/` にあるMarkdown、`book.json`、共通UIと生成スクリプトです。
このリポジトリのHTML・CSS・JavaScriptを独自に編集しないでください。表示の修正もDrive側の `ui/` または `build/` へ反映してから再生成します。

`site/` の中身をリポジトリ直下へ同期します。6つのHTMLページ、共通 `assets/`、`.nojekyll`、更新補助スクリプトと照合用の `publish-manifest.json` を管理します。Domain 2以降も同じ共通ファイルを利用します。

## 初回のPages設定

GitHub → このリポジトリ → Settings → Pages → Build and deployment:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/(root)**
- **Save**

Pages配信自体に独自のデプロイ用GitHub Actionsは不要です。`.nojekyll` により生成済みHTMLを配信します。GitHub内部のPages配信処理がActionsに表示される場合があります。

公開前の品質確認には `.github/workflows/validate.yml` を使用します。`main` 向けPull Requestと `main` へのpushで、JavaScript/MJS、JSON、公開manifest、HTML構造、ローカルリンク・アンカーを自動検査します。

## 更新する

Node.js 22以降を使用します。パッケージの追加インストールは不要です。

1. Driveの最新フォルダ一式を取得し、ローカルに展開します。古いZIPだけを最新正本とみなさず、更新日時を確認します。
2. 本文は `content/domainN/` のMarkdown、見た目は `ui/`、登録情報は `book.json` で更新します。
3. 公開リポジトリの `main` を最新にしてから、更新用ブランチを作成し、Drive正本のコピーにあるスクリプトを実行します。

```sh
git switch main
git pull --ff-only
git switch -c update/cissp-notes
node /path/to/CISSP_Study_Notes/publishing/sync-site.mjs /path/to/CISSP_Study_Notes /path/to/cissp-study-notes
```

4. 正本の変更と再生成された `site/` を、Google Driveの同じファイルへ保存します。Drive保存を済ませてから公開します。
5. 差分とブラウザ表示を確認し、更新用ブランチへコミット・pushします。`main` へ直接pushしません。

```sh
git diff --stat
git add -A
git commit -m "Update CISSP study notes from Drive sources"
git push -u origin update/cissp-notes
```

6. GitHubで `main` 向けPull Requestを作成します。GitHub Actionsの **Syntax and integrity checks** が成功したことを確認してから `main` へmergeします。Actionsが失敗している変更はmergeしません。

GitHub側では `main` を対象とするRulesetまたはBranch protectionを設定し、少なくとも次を必須化します。

- Pull Request経由での変更
- **Syntax and integrity checks** の成功
- force pushの禁止

`tools/sync-from-drive.mjs` はDrive正本の `publishing/sync-site.mjs` のコピーです。修正する場合は正本から行います。
同期処理はMarkdownから再生成し、相対リンクとアンカーを検査し、ソースと成果物のSHA-256を記録します。前回の同期後に公開ファイルだけを変更していた場合は、乖離を防ぐため停止します。必要な変更を正本へ戻し、公開側を前回のコミットの状態へ戻してから再実行してください。
自動的にGoogle Driveを監視・取得する仕組みではありません。

## Domain 2を追加する

1. Drive側のテンプレートから `content/domain2/CISSP_Domain2_Master.md` を作成します。
2. `book.json` のDomain 2へ `source` と `output: "domain2/index.html"` を登録します。
3. 必要なCoverage Matrix等を作り、資料ページを `pages` 配列に登録します。
4. 上の同期・Drive保存・コミット手順を実行します。共通ナビゲーションにDomain 2が追加されます。

## 閲覧と確認

PC用目次、モバイル用の折りたたみ目次、横スクロール表、本文検索、ダークモードを備えます。JavaScriptを無効にしても本文・目次・リンクは利用できます。
本文は既存ノートを保持しています。全演習履歴の照合状況など、内容の制約は履歴・出典ページを参照してください。
公開後はトップとDomain 1を開き、PC幅とiPhone Safariで目次・表・検索・配色を確認します。HTTP応答や静的検査のみで、実機確認済みとは扱いません。
