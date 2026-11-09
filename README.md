# 瓷光之间｜唐山骨质瓷设计研究

静态网站由 GitHub Pages 托管，推送到 `main` 分支后会通过 GitHub Actions 自动发布。

## 页面与服务

- `index.html`：主页、骨质瓷互动介绍、定制模拟器、场景调研问卷、定制建议表单、Supabase 共享留言墙。
- `assets/`：网站图片。
- `thanks.html`：表单提交后的确认页。
- `.github/workflows/deploy-pages.yml`：GitHub Pages 发布流程。
- 共享留言墙继续连接 Supabase。
- 定制建议与场景问卷通过现有 Netlify Forms 端点处理，Netlify 负责表单收集；网站页面本身由 GitHub Pages 提供。

## 发布

在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中将 **Source** 设为 **GitHub Actions**。此后推送至 `main` 会自动发布。

> GitHub Pages 的站点默认公开。此仓库不应提交服务端密钥；Supabase publishable key 用于浏览器端，访问控制由 Supabase RLS 策略承担。
