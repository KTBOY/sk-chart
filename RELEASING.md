# 发布指南（Releasing）

本文档说明如何把 **sk-chart-duo** 发布到 npm，包含**首次发布**、**手动发布**与**自动发布（GitHub Actions + OIDC）**三种方式，以及本项目特有的注意事项。

> 维护者文档。使用者请看 [README](./README.md)。

## 包名说明（重要）

- **npm 包名：`sk-chart-duo`**；**仓库名：`sk-chart`**（`https://github.com/KTBOY/sk-chart`）。
- 为什么不用 `sk-chart`：npm 有防仿冒的**相似度校验**，会把包名归一化（转小写、去掉 `-_.`）后与既有包比对。`sk-chart` 归一化后正是 `skchart`，与已存在的 npm 包 `skchart` 完全同名，因此发布时被 `403 Package name too similar to existing package skchart` 拦截。`sk-chart-duo` 归一化为 `skchartduo`，与 `skchart` 有实质差异。
- 改名的连锁影响：`package.json > name`、README 的安装/导入/徽标、工作流里的版本检查（`npm view "sk-chart-duo@$VERSION"`）。仓库名与 GitHub URL 不变。

## 前置条件

- Node.js >= 18（本项目开发环境为 v22）
- 拥有 npm 包 `sk-chart-duo` 的发布权限
- 本地校验全绿：`npm run ci`（typecheck + lint + test + build）

## registry 与登录（重要）

`package.json` 的 `publishConfig` 已把发布目标强制指向官方源，**无需手动切 registry**：

```json
"publishConfig": {
  "access": "public",
  "registry": "https://registry.npmjs.org/"
}
```

发布前确认已登录**官方源**（若本机全局 registry 指向镜像，必须显式指定官方源）：

```powershell
npm whoami --registry=https://registry.npmjs.org
# 未登录则执行：
npm login --registry=https://registry.npmjs.org
```

---

## 一、首次发布（建立 npm 包）

npm 的 Trusted Publisher 需要在**已存在的包**上配置，因此全新包必须先用本地命令发一次 `0.1.0`：

```powershell
# 1. 校验（typecheck + lint + test + build）
npm run ci

# 2. 发布（prepublishOnly 会再跑一遍 typecheck + test + build 并刷新 dist）
npm publish --access public --otp=<6 位验证码或恢复码>

# 3. 推送版本提交与 tag
git push --follow-tags
```

发布成功后再去 npmjs.com 为 `sk-chart-duo` 配置 Trusted Publisher（见第二节），之后所有版本都可以走全自动路径。

### ⚠️ 关于 2FA / OTP

若 npm 账户开启了双因素认证（尤其使用安全密钥 / passkey）：

- `--otp=` 需要传入**验证器 App 的 6 位验证码**，或一个**恢复码**（一次性使用）。
- 尖括号里的内容是**占位符**，必须替换成真实数字，照抄会报 `is not a legal HTTP header value`。
- 在自己终端里不加 `--otp` 直接 `npm publish`，npm 会**交互式提示**输入验证码，比手写更不易出错。
- 验证码约 30 秒过期，无法通过他人/CI 中转，必须在自己的终端完成。
- 恢复码属于敏感凭据，**不要提交到仓库或粘贴到公开场合**；如已暴露，去 npmjs.com 重新生成一组。

---

## 二、自动发布（推荐：Trusted Publishing / OIDC）

GitHub Actions 通过 OIDC 短期身份直接发布，**无需保存任何 NPM_TOKEN**，并自动附带发布溯源（provenance）。仅需一次性配置。

### 1. 在 npm 配置可信发布者（一次性）

登录 npmjs.com → 打开 `sk-chart-duo` 包的 **Settings** → **Trusted Publisher / 可信发布者** → 选择 **GitHub Actions**，填写：

- Organization or user：`KTBOY`
- Repository：`sk-chart`
- Workflow filename：`publish-npm.yml`
- Environment：留空

保存即可（注意 Repository 填的是 GitHub 仓库名 `sk-chart`，不是包名）。

### 2. 工作流已就绪

[`.github/workflows/publish-npm.yml`](./.github/workflows/publish-npm.yml) 已配置为 OIDC 发布：`id-token: write` 权限 + 升级 npm 到最新（OIDC 需 npm >= 11.5.1）+ `npm publish`，**无需任何密钥，也无需改动**。

工作流内置两重守卫：

- **tag 与 `package.json` 版本一致性校验**：不一致直接失败，避免打错 tag 发错版本；
- **版本已存在则跳过发布**：例如首次手动发布过、或工作流重跑，跳过 `npm publish` 只创建 Release，不会报 `EPUBLISHCONFLICT`。

### 3. 发版

```powershell
# 1. 升版本号（只改 package.json 一处）
npm version patch        # 或 minor / major

# 2. 推送版本提交与 tag（npm version 已自动 commit + tag）
git push --follow-tags
```

推送 `v*` tag 即自动触发工作流，它会依次：

1. 安装依赖、`npm run lint`
2. `npm publish`（`prepublishOnly` 自动执行 typecheck + test + build）
3. 发布成功后自动创建 GitHub Release（自动生成 release notes）

全程零手动点击。用 `release.bat` 发版时选 Y 即可走到这一步。

> 测试阶段也可在 Actions 页面手动触发该工作流（`workflow_dispatch`），但注意手动触发不会创建 Release。

---

## 三、手动发布（本地备用路径）

自动发布不可用时（例如 Trusted Publisher 未配置）：

```powershell
npm run ci                     # 本地校验
npm version patch              # 升版本号
npm publish --access public --otp=<验证码或恢复码>
git push --follow-tags
```

`prepublishOnly` 钩子会自动重新校验并构建，无需手动 build。

---

## 版本号规范（SemVer）

遵循 [语义化版本](https://semver.org/lang/zh-CN/)：`主版本.次版本.修订号`

| 类型 | 命令 | 场景 |
| --- | --- | --- |
| patch | `npm version patch` | 修复 Bug，无 API 变化（0.1.0 → 0.1.1） |
| minor | `npm version minor` | 新增图表类型 / 向后兼容的功能（0.1.0 → 0.2.0） |
| major | `npm version major` | 破坏性变更（1.0.0 → 2.0.0） |

> 处于 `0.x` 阶段时 API 视为不稳定，可较灵活地用 minor 承载新功能。

---

## 发布后验证

```powershell
# 查看线上信息
npm view sk-chart-duo --registry=https://registry.npmjs.org

# 在临时目录试装
npm install sk-chart-duo --registry=https://registry.npmjs.org
```

同时确认 npm 包页面正常：https://www.npmjs.com/package/sk-chart-duo

---

## 发布检查清单

- [ ] `npm run ci` 全绿（typecheck / lint / test / build）
- [ ] README 的 API 表格与新能力同步
- [ ] 按 SemVer 正确升级了版本号
- [ ] `npm publish` 成功（或 tag 触发的 OIDC 工作流成功）
- [ ] `git push --follow-tags` 已推送版本提交与 tag
- [ ] `npm view sk-chart-duo` 显示新版本

---

## 常见坑速查

| 现象 | 原因 | 解法 |
| --- | --- | --- |
| `403 Package name too similar to existing package` | npm 相似度校验（归一化后与既有包同名） | 改名（参考本文开头的「包名说明」），或改用 `@scope/name` |
| `EOTP` / 发布要求验证码 | 账户开启 2FA | `npm publish --otp=<验证码>`，或在自己终端直接跑让 npm 提示输入 |
| `is not a legal HTTP header value` | `--otp=` 后面照抄了占位符 | 换成真实的 6 位数字 |
| `E403` 无权限 / 404 源只读 | registry 指向了镜像源 | 用 `--registry=https://registry.npmjs.org`，或依赖 `publishConfig` |
| `EPUBLISHCONFLICT` 版本已存在 | 版本号没升 | `npm version patch` 后重发；工作流里已有守卫会自动跳过 |
| CI 发布报 OIDC 相关错误 | npm 版本过低 / Trusted Publisher 未配置 | 工作流已升级 npm；核对 Settings 里的仓库名与工作流文件名 |
| tag 已存在 | 版本号没升就重复发版 | 升 `package.json` 版本后重来 |
| 装到旧版本 | 本地走镜像源有缓存 | `npm install sk-chart-duo@latest --registry=https://registry.npmjs.org` |
