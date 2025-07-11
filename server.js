const express = require('express');
const app = express();
const port = 3000;
const expressLayouts = require('express-ejs-layouts');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(expressLayouts);
app.set('layout', 'base');


app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About Me' });
});

app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact' });
});

app.post('/submit-contact', (req, res) => {
  const { name, email, message } = req.body;

  console.log('Received contact form submission:');
  console.log('Name:', name);
  console.log('Email:', email);
  console.log('Message:', message);

  res.redirect('/thank-you');
});

app.get('/thank-you', (req, res) => {
  res.render('thankyou', { title: 'Thank You' });
});

app.get('/instructor-led-training', (req, res) => {
  res.render('project_pages/ux_projects/instructor-led-training', {
    title: 'Instructor-Led Training'
  });
});

app.get('/elearning/', (req, res) => {
  res.render('project_pages/ux_projects/elearning', {
    title: 'elearning'
  });
});

app.get('/video-solutions', (req, res) => {
  res.render('project_pages/ux_projects/video-solutions', {
    title: 'video-solutions'
  });
});


app.get('/other_projects/', (req, res) => {
  res.render('project_pages/ux_projects/other_projects', {
    title: 'other_projects'
  });
});

app.get('/ux-design', (req, res) => {
  res.render('ux-design', { title: 'ux-design' });
});

app.get('/websites', (req, res) => {
  res.render('websites', { title: 'websites' });
});

app.get('/blog', (req, res) => {
  res.render('blog', { title: 'blog' });
});

app.get('/coding-projects', (req, res) => {
  res.render('coding-projects', { title: 'coding-projects' });
});

app.get('/coding-projects/translator', (req, res) => {
  res.render('coding-projects/translator', { title: 'Translator' });
});

app.get('/coding-projects/habit-tracker', (req, res) => {
  res.render('coding-projects/habit_tracker', { title: 'Habit Tracker' });
});

app.get('/coding-projects/pdf-to-speech', (req, res) => {
  res.render('coding-projects/pdf_to_speech', { title: 'PDF to Speech' });
});

app.get('/coding-projects/job-scraper-and-emailer', (req, res) => {
  res.render('coding-projects/job_scraper', { title: 'Job Scraper & Emailer' });
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
