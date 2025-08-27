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

// ---- Canonical host + HTTPS redirect (dev-safe) ----
app.set('trust proxy', true);

const CANONICAL_HOST = 'www.paulkniaz.com';
const BYPASS = new Set(['/__health', '/healthz', '/sitemap.xml', '/robots.txt']);
const ALLOWED_DEV_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const ENFORCE = (process.env.ENFORCE_CANONICAL ?? 'true') !== 'false';

app.use((req, res, next) => {
  if (BYPASS.has(req.path)) return next();

  const env = process.env.NODE_ENV || 'development';
  const host = req.headers.host || '';
  const hostname = host.split(':')[0];
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const isRenderDefault = hostname.endsWith('.onrender.com');

  if (env !== 'production' || ALLOWED_DEV_HOSTS.has(hostname)) return next();
  if (!ENFORCE) return next();

  if (!isHttps) return res.redirect(301, `https://${host}${req.originalUrl}`);
  if (!isRenderDefault && hostname !== CANONICAL_HOST) {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
  }

  res.setHeader(
    'Strict-Transport-Security',
    'max-age=15552000; includeSubDomains; preload'
  );
  next();
});

// ---- Views / Layouts / Static ----
app.set('views', path.join(__dirname, 'views'));   // ensure Express finds your EJS files
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'base');                         // requires ./views/base.ejs with <%- body %>

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// ---- Default template locals (avoid EJS ReferenceErrors) ----
app.use((req, res, next) => {
  const host = (req.headers.host || CANONICAL_HOST).toLowerCase();
  const proto = (req.secure || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
  const pathOnly = req.originalUrl ? req.originalUrl.split('?')[0] : '/';

  res.locals.title = res.locals.title || 'Paul Kniaz';
  res.locals.canonical = res.locals.canonical || `${proto}://${host}${pathOnly}`;
  res.locals.metaDescription = res.locals.metaDescription
    || 'Portfolio of Paul Kniaz — Full Stack Developer, Instructional Designer, and UX Design enthusiast.';
  res.locals.ogTitle = res.locals.ogTitle || res.locals.title;
  res.locals.ogDescription = res.locals.ogDescription || res.locals.metaDescription;
  res.locals.ogImage = res.locals.ogImage || 'https://paulkniaz.com/images/preview.png';
  res.locals.twitterTitle = res.locals.twitterTitle || res.locals.title;
  res.locals.twitterDescription = res.locals.twitterDescription || res.locals.metaDescription;
  res.locals.twitterImage = res.locals.twitterImage || res.locals.ogImage;
  next();
});

// ---- Convenience redirects ----
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

app.get('/ux-design', (req, res) => res.render('ux-design', { title: 'UX Design' }));
app.get('/websites', (req, res) => res.render('websites', { title: 'Websites' }));
app.get('/blog', (req, res) => res.render('blog', { title: 'Blog' }));
app.get('/coding-projects', (req, res) => res.render('coding-projects', { title: 'Coding Projects' }));

// Program pages
app.get('/obj_builder', (req, res) => res.render('program_desc/obj_builder', { title: 'Objective Builder' }));
app.get('/catholic_blog', (req, res) => res.render('program_desc/catholic_blog', { title: 'Catholic Blog' }));
app.get('/personal_blog', (req, res) => res.render('program_desc/personal_blog', { title: 'Personal Blog' }));

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
app.get('/projects/websites', (req, res) => res.render('websites', { title: 'Websites' }));
app.get('/projects/ux-design', (req, res) => res.render('ux-design', { title: 'UX Design' }));
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

// ---- Sitemap (raw XML, no EJS) ----
app.get('/sitemap.xml', (req, res) => {
  const host = 'https://www.paulkniaz.com';
  const pages = [
    '/', '/about', '/contact', '/thank-you',
    '/instructor-led-training', '/elearning', '/video-solutions', '/other_projects',
    '/ux-design', '/websites', '/blog', '/coding-projects',
    '/coding-projects/translator', '/coding-projects/habit-tracker',
    '/coding-projects/pdf-to-speech', '/coding-projects/job-scraper-and-emailer',
    '/projects', '/projects/websites', '/projects/ux-design',
    '/projects/habit-tracker', '/projects/translator',
    '/projects/pdf-to-speech', '/projects/job-scraper',
  ];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map(p => [
      '  <url>',
      `    <loc>${host}${p}</loc>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.8</priority>',
      '  </url>',
    ].join('\n')),
    '</urlset>',
  ].join('\n');

  res.set('Content-Type', 'application/xml');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(xml);
});

// ---- 404 ----
app.use((req, res) => res.status(404).type('text').send('Not Found'));

// ---- Error handler ----
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).type('text').send('Server error');
});
/* eslint-enable no-unused-vars */

app.listen(port, () => console.log('Server on :', port));
