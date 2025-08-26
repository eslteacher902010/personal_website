// server.js
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const port = process.env.PORT || 3000;

// ---- Health endpoints (must be first) ----
const COMMIT = process.env.RENDER_GIT_COMMIT || 'dev';
const healthHandler = (req, res) =>
  res.json({ ok: true, commit: COMMIT, time: new Date().toISOString() });

app.get('/__health', healthHandler);
app.get('/healthz', healthHandler);

// ---- Canonical host + HTTPS redirect ----
app.set('trust proxy', true);

const CANONICAL_HOST = 'www.paulkniaz.com';
const BYPASS = new Set(['/__health', '/healthz', '/sitemap.xml', '/robots.txt']);

app.use((req, res, next) => {
  if (BYPASS.has(req.path)) return next();

  const host = (req.headers.host || '').toLowerCase();
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const isRenderDefault = host.includes('.onrender.com');

  // allow Render default subdomain for testing
  if (!isRenderDefault && host !== CANONICAL_HOST) {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
  }
  if (!isHttps) {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  next();
});

// ---- Views / Layouts / Static ----
app.set('views', path.join(__dirname, 'views'));   // <— make sure your EJS files are in ./views
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'base');                          // requires ./views/base.ejs to exist

app.use(express.static(path.join(__dirname, 'public'))); // <— make sure assets are in ./public
app.use(express.urlencoded({ extended: true }));

// ---- Quick ping (handy during debugging) ----
app.get('/ping', (req, res) => res.type('text').send('pong'));

// ---- Index redirect convenience ----
app.get('/index.html', (req, res) => res.redirect(301, '/'));

// ---- Legacy redirects → /projects/* ----
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

// ---- Routes ----
app.get('/', (req, res) => res.render('index', { title: 'Home' }));
app.get('/about', (req, res) => res.render('about', { title: 'About Me' }));
app.get('/contact', (req, res) => res.render('contact', { title: 'Contact' }));
app.post('/submit-contact', (req, res) => {
  const { name, email, message } = req.body || {};
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

// Old project URLs (still rendering)
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

// Sitemap (use your canonical host)
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
  res.set('Content-Type', 'application/xml');
  res.set('Cache-Control', 'public, max-age=300');
  res.render('sitemap', { title: 'Sitemap', pages, layout: false, host: 'https://www.paulkniaz.com' });
});

// ---- 404 ----
app.use((req, res) => res.status(404).type('text').send('Not Found'));

// ---- Error handler (shows stacks in Render logs) ----
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).type('text').send('Server error');
});
/* eslint-enable no-unused-vars */

app.listen(port, () => console.log('Server on :', port));
