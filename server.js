const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const expressLayouts = require('express-ejs-layouts');

const COMMIT = process.env.RENDER_GIT_COMMIT || 'dev';
app.get('/__health', (req, res) =>
  res.json({ ok: true, commit: COMMIT, time: new Date().toISOString() })
);

// ---- Canonical host + HTTPS redirect (dev-safe) ----
app.set('trust proxy', true); // needed on Render/Cloudflare to read x-forwarded-proto

const CANONICAL_HOST = 'www.paulkniaz.com'; // pick ONE canonical (www or apex) and stick to it
const BYPASS = new Set(['/__health', '/healthz', '/sitemap.xml', '/robots.txt']);
const ALLOWED_DEV_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const ENFORCE = (process.env.ENFORCE_CANONICAL ?? 'true') !== 'false';

app.use((req, res, next) => {
  if (BYPASS.has(req.path)) return next();

  const env = process.env.NODE_ENV || 'development';
  const host = (req.headers.host || '');
  const hostname = host.split(':')[0]; // strip port
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const isRenderDefault = hostname.endsWith('.onrender.com');

  // In dev (or when hitting localhost), don't redirect
  if (env !== 'production' || ALLOWED_DEV_HOSTS.has(hostname)) {
    return next();
  }

  if (!ENFORCE) return next(); // kill switch

  // 1) Force HTTPS
  if (!isHttps) {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }

  // 2) Enforce canonical host (but allow Render preview subdomain)
  if (!isRenderDefault && hostname !== CANONICAL_HOST) {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
  }

  // 3) HSTS in prod
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains; preload');
  next();
});


// ---- App plumbing (after redirects) ----
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(expressLayouts);
app.set('layout', 'base');
app.use(express.urlencoded({ extended: true }));

// Fixed index
app.get('/index.html', (req, res) => res.redirect(301, '/'));

// Legacy redirects → /projects/*
const redirects = {
  '/coding-projects/websites': '/projects/websites',
  '/coding-projects/ux-design': '/projects/ux-design',
  '/coding-projects/coding-projects': '/projects',
  '/coding-projects/habit-tracker': '/projects/habit-tracker',
  '/coding-projects/pdf-to-speech': '/projects/pdf-to-speech',
  '/coding-projects/job-scraper-and-emailer': '/projects/job-scraper',
  '/coding-projects/translator': '/projects/translator',
};
app.use((req, res, next) => {
  const target = redirects[req.path];
  if (target) return res.redirect(301, target);
  next();
});

// Routes
app.get('/', (req, res) => res.render('index', { title: 'Home' }));
app.get('/about', (req, res) => res.render('about', { title: 'About Me' }));
app.get('/contact', (req, res) => res.render('contact', { title: 'Contact' }));
app.post('/submit-contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('Contact:', { name, email, message });
  res.redirect('/thank-you');
});
app.get('/thank-you', (req, res) => res.render('thankyou', { title: 'Thank You' }));

// UX project pages
app.get('/instructor-led-training', (req, res) =>
  res.render('project_pages/ux_projects/instructor-led-training', { title: 'Instructor-Led Training' })
);
app.get('/elearning', (req, res) =>
  res.render('project_pages/ux_projects/elearning', { title: 'elearning' })
);
app.get('/video-solutions', (req, res) =>
  res.render('project_pages/ux_projects/video-solutions', { title: 'video-solutions' })
);
app.get('/other_projects', (req, res) =>
  res.render('project_pages/ux_projects/other_projects', { title: 'other_projects' })
);

app.get('/ux-design', (req, res) => res.render('ux-design', { title: 'ux-design' }));
app.get('/websites', (req, res) => res.render('websites', { title: 'websites' }));
app.get('/blog', (req, res) => res.render('blog', { title: 'blog' }));
app.get('/coding-projects', (req, res) => res.render('coding-projects', { title: 'coding-projects' }));

// Program pages
app.get('/obj_builder', (req, res) => res.render('program_desc/obj_builder', { title: 'obj_builder' }));
app.get('/catholic_blog', (req, res) => res.render('program_desc/catholic_blog', { title: 'catholic_blog' }));

// Old project URLs
app.get('/coding-projects/translator', (req, res) =>
  res.render('project_pages/translator', { title: 'Translator' })
);
app.get('/coding-projects/habit-tracker', (req, res) =>
  res.render('project_pages/habit_tracker', { title: 'Habit Tracker' })
);
app.get('/coding-projects/pdf-to-speech', (req, res) =>
  res.render('project_pages/pdf_to_speech', { title: 'PDF to Speech' })
);
app.get('/coding-projects/job-scraper-and-emailer', (req, res) =>
  res.render('project_pages/job_scraper', { title: 'Job Scraper & Emailer' })
);

// Canonical project URLs
app.get('/projects', (req, res) => res.render('projects', { title: 'Projects' }));
app.get('/projects/websites', (req, res) => res.render('websites', { title: 'websites' }));
app.get('/projects/ux-design', (req, res) => res.render('ux-design', { title: 'ux-design' }));
app.get('/projects/habit-tracker', (req, res) =>
  res.render('project_pages/habit_tracker', { title: 'Habit Tracker' })
);
app.get('/projects/translator', (req, res) =>
  res.render('project_pages/translator', { title: 'Translator' })
);
app.get('/projects/pdf-to-speech', (req, res) =>
  res.render('project_pages/pdf_to_speech', { title: 'PDF to Speech' })
);
app.get('/projects/job-scraper', (req, res) =>
  res.render('project_pages/job_scraper', { title: 'Job Scraper & Emailer' })
);

// Sitemap (use apex host)
app.get('/sitemap.xml', (req, res) => {
  const pages = [
    { url: '/', priority: 1.0 },
    { url: '/about', priority: 0.8 },
    { url: '/contact', priority: 0.8 },
    { url: '/thank-you', priority: 0.5 },
    { url: '/instructor-led-training', priority: 0.8 },
    { url: '/elearning', priority: 0.8 },
    { url: '/video-solutions', priority: 0.8 },
    { url: '/other_projects', priority: 0.7 },
    { url: '/ux-design', priority: 0.8 },
    { url: '/websites', priority: 0.8 },
    { url: '/blog', priority: 0.8 },
    { url: '/coding-projects', priority: 0.8 },
    { url: '/coding-projects/translator', priority: 0.7 },
    { url: '/coding-projects/habit-tracker', priority: 0.7 },
    { url: '/coding-projects/pdf-to-speech', priority: 0.7 },
    { url: '/coding-projects/job-scraper-and-emailer', priority: 0.7 },
    { url: '/projects', priority: 0.8 },
    { url: '/projects/websites', priority: 0.8 },
    { url: '/projects/ux-design', priority: 0.8 },
    { url: '/projects/habit-tracker', priority: 0.7 },
    { url: '/projects/translator', priority: 0.7 },
    { url: '/projects/pdf-to-speech', priority: 0.7 },
    { url: '/projects/job-scraper', priority: 0.7 },
  ];
  res.header('Content-Type', 'application/xml');
  res.render('sitemap', { title: 'Sitemap', pages, layout: false, host: 'https://paulkniaz.com' });
});

// 404
app.use((req, res) => res.status(404).send('Not Found'));

app.listen(port, () => console.log('Server on :', port));
