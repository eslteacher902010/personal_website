const express = require('express');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');         // Enable EJS
app.use(express.static('public'));     // Serve static files

app.get('/', (req, res) => {
  res.render('index', { name: 'Paul' }); // Render views/index.ejs
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
console.log("Node.js is working!");
