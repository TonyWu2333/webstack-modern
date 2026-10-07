# WebStack Modern

**A beautified, modernized version of [WebStack](https://github.com/WebStackPage/WebStackPage.github.io)** — the popular static link-navigation page (webstack.cc). It keeps WebStack's layout and link collection, and adds a refreshed visual style, smooth motion, dark mode, and a config-file workflow.

## What's different from the original WebStack

| | Original WebStack | WebStack Modern |
|---|---|---|
| Editing links | Hand-edit ~4,300 lines of HTML | Edit one `config.yml` |
| Look | 2017 Xenon admin style | Rounded cards, pill sidebar, frosted sticky top bar, icon headings with link counts |
| Motion | Basic hover lift | Staggered scroll-in, cursor spotlight on cards, eased sidebar submenu open/close, scrollspy highlighting |
| Search | — | Instant filter by name, description or URL with highlighted matches; `/` or `⌘K` to focus, `Enter` opens the first result, `Esc` clears |
| Dark mode | — | Follows the system, with a manual toggle (remembered) |
| Logo | Image only | Text logo from config, or your own image |
| Fonts | Google Fonts (slow in mainland China) | System font stack |
| Third-party code | Author's Baidu/Google analytics, AdSense, referral links | Removed |

Motion respects `prefers-reduced-motion`.

## Editing links

Everything is in [`config.yml`](config.yml):

```yaml
nav:
  - name: 常用推荐          # top-level category
    icon: linecons-star
    links:
      - title: GitHub
        url: https://github.com/
        logo: github.png    # file in assets/images/logos/, or a full image URL
        desc: 代码托管平台
  - name: 常用工具
    icon: linecons-diamond
    children:               # second-level categories
      - name: 在线工具
        badge: Hot          # optional label in the sidebar
        links: [...]
```

- `title` and `url` are required; `desc` and `logo` are optional (missing logo falls back to `default.png`).
- To add a logo, drop the image into `assets/images/logos/` and reference its filename.
- Sidebar icons: see class names in `assets/css/fonts/linecons/css/linecons.css`.
- Site title, name/logo, footer and extra `<head>` HTML (e.g. your own analytics) are under `site:`.
- Accent colors: `--accent` / `--accent-2` at the top of `assets/css/modern.css`.

## Local preview

```bash
npm install
npm run build
npx serve dist
```

## Deploy (Vercel)

Import this repo in Vercel. `vercel.json` already sets the build command (`npm run build`) and output directory (`dist`), so no extra configuration is needed. Every push redeploys automatically.

## Project layout

- `config.yml` — site settings and all links
- `template.html` — page skeleton
- `build.js` — renders `config.yml` into `dist/index.html`
- `assets/css/modern.css`, `assets/js/modern.js` — the modern skin, layered on top of the untouched original WebStack/Xenon assets

## Credits

Based on [WebStack](https://github.com/WebStackPage/WebStackPage.github.io) by Viggo (MIT), built on the Xenon admin template. This project is also MIT licensed.
