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


app.get('/projects', (req, res) => {
  res.render('projects', { title: 'Projects' });
});

app.get('/projects/translator', (req, res) => {
  res.render('project_pages/translator', { title: 'Translator' });
});

app.get('/projects/habit-tracker', (req, res) => {
  res.render('project_pages/habit_tracker', { title: 'Habit Tracker' });
});

app.get('/projects/pdf-to-speech', (req, res) => {
  res.render('project_pages/pdf_to_speech', { title: 'PDF to Speech' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
