# webstack-nav

A static link-navigation site based on [WebStack](https://github.com/WebStackPage/WebStackPage.github.io). The page looks the same as the original, but all links live in a single config file instead of hand-written HTML.

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
- Site title, logo, footer and extra `<head>` HTML (e.g. your own analytics) are under `site:`.

## Local preview

```bash
npm install
npm run build
npx serve dist
```

## Deploy (Vercel)

Import this repo in Vercel. `vercel.json` already sets the build command (`npm run build`) and output directory (`dist`), so no extra configuration is needed. Every push redeploys automatically.

## Credits

Theme by [WebStack](https://github.com/WebStackPage/WebStackPage.github.io) (MIT), built on the Xenon admin template.
