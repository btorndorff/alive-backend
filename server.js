const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { photoTranslate } = require('./PhotoTranslate.js');
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://btorndorff:HCI123@cluster0.eyqqnbu.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connect() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error(err);
  }
}

connect();

// // Increase payload size limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello from App Engine!');
});

app.get('/collection/:userid', async (req, res) => {
  try {
    const collection = client.db('alive-db').collection('words');
    const results = await collection.find({userid: req.params.userid}).sort({"classification":1}).toArray();
    res.send(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data");
  }
});

app.delete('/collection', async (req, res) => {
  try {
    const collection = client.db('alive-db').collection('words');
    const result = await collection.deleteMany({});
    console.log(`${result.deletedCount} documents deleted`);
    res.send(`${result.deletedCount} documents deleted`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting data");
  }
});

app.post('/translate', async (req, res) => {
  if (req.body.image) {
    const image = req.body.image.split(",")[1]
    const base64Image = image.toString('base64');
    const language = req.body.language;
    const userid = req.body.userid;

    const [classification, translatedText] = await photoTranslate(base64Image, language);

    const collection = client.db('alive-db').collection('words');
    
    collection.insertOne({
      image: req.body.image,
      classification: classification,
      translation: translatedText,
      userid: userid,
      date: new Date(),
    }, (err, result) => {
      console.log(result)
      if (err) {
        console.error(err);
        res.status(500).send('Error inserting data into database');
      } else {
        res.json({
          classification: classification,
          translation: translatedText,
        });
      }
    }); 
    res.send({
      classification: classification,
      translation: translatedText,
    })
  } else {
    res.status(400).send('Please upload a valid image');
  }
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

