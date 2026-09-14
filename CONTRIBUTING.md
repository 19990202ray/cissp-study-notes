# Contribution / Update Workflow

このリポジトリは、Google Driveの `CISSP/CISSP_Study_Notes/` を正本として生成された公開成果物を管理します。生成済みHTML・CSS・JavaScriptや、`publish-manifest.json` で整合性管理されているファイルをGitHub側だけで直接修正しないでください。

## 更新フロー

1. Google Drive側の正本を更新します。
2. Drive側の同期スクリプトで公開成果物を再生成・同期します。
3. `main` を最新化し、更新用ブランチを作成します。

```sh
git switch main
git pull --ff-only
git switch -c update/cissp-notes
```

4. 差分を確認し、更新用ブランチへコミット・pushします。

```sh
git diff --stat
git add -A
git commit -m "Update CISSP study notes from Drive sources"
git push -u origin update/cissp-notes
```

5. `main` 向けPull Requestを作成します。
6. GitHub Actionsの **Syntax and integrity checks** が成功したことを確認します。
7. チェック成功後に `main` へmergeします。Actionsが失敗している変更はmergeしません。
8. `main` への直接pushやforce pushは行いません。

## main branch protection

GitHub側では `main` を対象とするRulesetまたはBranch protectionで、少なくとも次を必須化します。

- Pull Request経由での変更
- **Syntax and integrity checks** の成功
- force pushの禁止

この運用により、構文エラー、JSON不正、公開manifestとのSHA-256不一致、HTML構造不備、ローカルリンク・アンカー不整合を検出した変更は、`main` へ取り込む前に止めます。
