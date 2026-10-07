// Generate dist/index.html from config.yml + template.html
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const root = __dirname;
const out = path.join(root, 'dist');
const { site, nav } = yaml.load(fs.readFileSync(path.join(root, 'config.yml'), 'utf8'));

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const asset = (p) => (/^(https?:)?\/\//.test(p) ? p : p.replace(/^\/+/, ''));
const logoSrc = (logo) => {
  if (!logo) return 'assets/images/logos/default.png';
  if (/^(https?:)?\/\//.test(logo)) return logo;
  if (!fs.existsSync(path.join(root, 'assets/images/logos', logo))) console.warn(`⚠ 找不到图标 assets/images/logos/${logo}`);
  return `assets/images/logos/${logo}`;
};

// every category that holds links gets an anchor id
let n = 0;
for (const item of nav) {
  if (item.links) item.id = `cat-${++n}`;
  for (const child of item.children || []) child.id = `cat-${++n}`;
}

const badge = (b) => (b ? `\n                                    <span class="label label-pink pull-right hidden-collapsed">${esc(b)}</span>` : '');

const menu = nav.map((item) => {
  const icon = `<i class="${esc(item.icon || 'linecons-tag')}"></i>`;
  if (!item.children) {
    return `                    <li>
                        <a href="#${item.id}" class="smooth">
                            ${icon}
                            <span class="title">${esc(item.name)}</span>${badge(item.badge)}
                        </a>
                    </li>`;
  }
  const subs = item.children.map((c) => `                            <li>
                                <a href="#${c.id}" class="smooth">
                                    <span class="title">${esc(c.name)}</span>${badge(c.badge)}
                                </a>
                            </li>`).join('\n');
  return `                    <li>
                        <a>
                            ${icon}
                            <span class="title">${esc(item.name)}</span>
                        </a>
                        <ul>
${subs}
                        </ul>
                    </li>`;
}).join('\n');

const card = (l) => `                <div class="col-sm-3">
                    <div class="xe-widget xe-conversations box2 label-info" onclick="window.open(${esc(JSON.stringify(l.url))}, '_blank')" data-toggle="tooltip" data-placement="bottom" title="" data-original-title="${esc(l.url)}">
                        <div class="xe-comment-entry">
                            <a class="xe-user-img">
                                <img data-src="${esc(logoSrc(l.logo))}" class="lozad img-circle" width="40">
                            </a>
                            <div class="xe-comment">
                                <a href="#" class="xe-user-name overflowClip_1">
                                    <strong>${esc(l.title)}</strong>
                                </a>
                                <p class="overflowClip_2">${esc(l.desc)}</p>
                            </div>
                        </div>
                    </div>
                </div>`;

const section = (c, icon) => `            <h4 class="text-gray"><i class="${esc(icon || 'linecons-tag')}" id="${c.id}"></i>${esc(c.name)}<span class="cat-count">${(c.links || []).length}</span></h4>
            <div class="row">
${(c.links || []).map(card).join('\n')}
            </div>`;

// child categories reuse their parent's icon
const sections = nav.flatMap((item) => (item.children || [item]).map((c) => section(c, item.icon))).join('\n');

// sidebar brand: image logo if configured, otherwise a text logo from site.name
const name = site.name || site.title;
const brand = site.logo
  ? `                        <a href="./" class="logo-expanded">
                            <img src="${esc(asset(site.logo))}" width="100%" alt="" />
                        </a>
                        <a href="./" class="logo-collapsed">
                            <img src="${esc(asset(site.logo_collapsed || site.logo))}" width="40" alt="" />
                        </a>`
  : `                        <a href="./" class="brand">
                            <span class="brand-mark">${esc(site.mark || [...name][0])}</span>
                            <span class="brand-name">${esc(name)}</span>
                        </a>`;

const topLinks = (site.top_links || []).map((l) => `                    <li class="hidden-sm hidden-xs">
                        <a href="${esc(l.url)}" target="_blank">
                            ${l.icon ? `<i class="${esc(l.icon)}"></i>  ` : ''}${esc(l.name)}
                        </a>
                    </li>`).join('\n');

const vars = {
  title: esc(site.title),
  keywords: esc(site.keywords),
  description: esc(site.description),
  favicon: esc(asset(site.favicon || 'assets/images/favicon.png')),
  brand,
  head: site.head || '', // raw HTML, e.g. your own analytics snippet
  footer: site.footer || '', // raw HTML
  top_links: topLinks,
  menu,
  sections,
};

const html = fs.readFileSync(path.join(root, 'template.html'), 'utf8').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
fs.cpSync(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);

const total = nav.flatMap((i) => i.children || [i]).reduce((s, c) => s + (c.links || []).length, 0);
console.log(`✓ dist/index.html 已生成：${n} 个分类，${total} 个链接`);
