const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { photoTranslate } = require('./PhotoTranslate.js');

// // Increase payload size limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello from App Engine!');
});

app.post('/translate', async (req, res) => {
  if (req.body.image) {
    const base64Image = req.body.image.toString('base64');
    const language = req.body.language;

    const [classification, translatedText] = await photoTranslate(base64Image, language);

    res.json({
      classification: classification,
      translation: translatedText,
    });
  } else {
    res.status(400).send("Please upload a valid image");
  }
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

