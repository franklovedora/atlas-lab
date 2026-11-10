# 账期 Atlas 独立版
中文银行账户和信用卡任务管理。账号同步配置见文末。网页只使用随包提供的 HTML、CSS 和 JavaScript。无需 ChatGPT、API Key、数据库或 Node.js。

## Docker / NAS
解压，在 compose.yaml 所在目录运行：
```sh
docker compose up -d
```
在宿主机打开 http://127.0.0.1:8080 。NAS 上若要在家中手机或电脑访问，改为指定 NAS 的实际局域网 IP，例如：
```sh
ATLAS_BIND=192.168.1.50 docker compose up -d
```
手机连同一局域网，打开 http://192.168.1.50:8080 。无需公网端口映射。首次启动需要拉取 nginx 镜像。停止用 docker compose down。

## Linux
解压后进入 atlas-lab 目录：
```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory docs
```
打开 http://127.0.0.1:8080 。Ctrl+C 停止。

## 安卓本机
将 atlas-lab.zip 放入手机下载目录，安装 Termux（https://termux.dev/en/）。打开 Termux：
```sh
pkg install python unzip
termux-setup-storage
```
授予文件访问权限，然后运行：
```sh
cd ~
unzip ~/storage/downloads/atlas-lab.zip
cd ~/atlas-lab
python -m http.server 8080 --bind 127.0.0.1 --directory docs
```
在安卓浏览器打开 http://127.0.0.1:8080 。再次使用时只需运行最后两行。网页加载时本地服务必须运行。

## GitHub / GitHub Pages
将解压目录内的 README.md、compose.yaml 和 docs 目录提交到自己的仓库。仅保存源码即可用私有仓库。若要发布网页，到仓库 Settings → Pages，选择 Deploy from a branch、main、/docs，保存后使用 GitHub 给出的网址。GitHub Free 可用公开仓库发布 Pages。只提交项目文件；JSON 备份包含个人记录。
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 数据与提醒
同一浏览器、同一网址可持续使用自己的账本。不同设备、浏览器、协议、主机名或端口各有独立存储。Docker 卷提供网页文件，个人记录保存在浏览器。打开「账本备份与迁移」，导出 JSON 到自己选择的位置；在新设备上导入即可合并。示例数据不参与备份。
旧版 ChatGPT 网站的记录不会自动迁移。若已录入许多任务，可以在旧站的同一浏览器打开开发者工具，在 Console 输入下面的只读表达式，将返回的 JSON 文本内容（不含控制台外层引号）保存为 UTF-8 文本 atlas.json 并导入。不要把 JSON 提交到仓库。
```js
localStorage.getItem('atlas-personal-v1') || '[]'
```
「导出日历」生成当前未完成任务的 ICS 快照。导入支持提醒的日历后，请确认通知已开启。文件包含提前 3 天和 1 天的提醒。日期或任务变更后请同步更新日历。月度 DD 和还款可在任务内手动创建下一期。

## 账号同步版 · 首次部署
网页可由 GitHub Pages、Docker 或本地 Linux/安卓提供，所有设备需要连接同一个 Supabase 项目。使用 HTTPS 托管登录界面；纯本机测试可用 localhost。如果只打开示例或本地账本，可以跳过云端配置。

1. 在自己的 Supabase 项目打开 SQL Editor，完整运行仓库根目录的 schema.sql。它创建账本表，并通过 PostgreSQL 行级安全规则限制每个登录用户只能读写自己的记录。
2. 到 Authentication → Sign In / Providers 开启 Email/Password，可保留邮件验证。在 Authentication → URL Configuration 把 Site URL 设成自己的正式网页地址（GitHub 项目页要包含仓库路径）。
3. 编辑 docs/config.js，填写项目 HTTPS URL 和 **publishable key**。该 key 设计用于浏览器；不要填写 secret key、service_role、数据库密码或用户密码。确保项目对 Data API 开放 public schema。
4. 按上面的方式部署 docs，并在两台设备打开网页。点「账号登录」→ 填邮箱和密码 →「注册账号」。按邮件验证后，在两台设备用同一账号登录。若 SMTP 未配置而注册邮件无法发出，可在 Authentication → Users 中由管理员创建并确认自己的用户，再登录使用。
5. 在设备 A 新建任务，设备 B 切回已登录的页面即可刷新，前台页面每 30 秒也会更新。编辑时暂停拉取，同时修改会提示重新打开，避免覆盖另一台设备的修改。网络错误会提示保存失败。关闭或刷新网页、登录凭证过期后需重新登录；个人云端记录继续保留。
6. 旧版本数据迁移：先在原浏览器导出 JSON，再登录目标账号，从「账本备份与迁移」导入。云端账号与本地示例、未登录的本地账本分别存储。ICS 日历是快照，设备系统日历需自行维护通知。

原创建模与样式：琥珀辉光数字管、格网、CRT 扫描纹理。没有使用动画截图、角色形象、官方图标、音频或字体文件。
