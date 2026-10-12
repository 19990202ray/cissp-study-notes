# Versioning / Tag Management

このリポジトリでは、Git tag と GitHub Release を「公開版の固定点」として使用します。

## Version format

`vMAJOR.MINOR.PATCH` を使用します。

- `PATCH`: 誤字、説明、リンク、軽微なUI修正など、小さな修正
- `MINOR`: Domain追加など、学習コンテンツの大きな追加
- `MAJOR`: サイト構造、公開方式、データ構造などの大幅な変更

例:

- `v1.0.0`: 最初の基準版
- `v1.0.1`: Domain 1の軽微な修正
- `v1.1.0`: Domain 2追加
- `v1.2.0`: Domain 3追加
- `v2.0.0`: 全体構造の大幅変更

## When to create a tag

すべてのコミットにはタグを付けません。戻したくなる可能性がある公開版、または大きな節目だけをタグ化します。

タグは `main` の最新コミットに対してのみ作成します。既存タグは移動・上書きしません。

## Release flow

1. Google Drive側の正本を更新します。
2. 作業ブランチからPRを作成します。
3. `Syntax and integrity checks` が成功してから `main` にmergeします。
4. GitHubの **Actions** から **Create tagged release** を開きます。
5. **Run workflow** を選び、`version` に `v1.0.0` のような値を入力します。
6. 必要なら `title` と `notes` を入力します。`notes` を空にするとGitHubがRelease notesを自動生成します。
7. workflowは `main` の検証成功を確認し、annotated tag と GitHub Releaseを作成します。

## Rules

- tagは `vMAJOR.MINOR.PATCH` 形式のみ
- tagは `main` にのみ作成
- Actionsの検証が成功していない `main` にはtagを作成しない
- 既存tagの上書きは禁止
- `main` への直接pushは行わない
