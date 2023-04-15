const { GoogleAuth } = require('google-auth-library');

const photoTranslate = async (base64Image, language) => {
  const axios = require('axios');

  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
    projectId: 'alive-hci'
  });
  const accessToken = await auth.getAccessToken();

  // get best guess classification from google cloud vision api
  const requestJson = `{
    "requests": [
      {
        "image": {
          "content": "${base64Image}"
        },
        "features": [
          {
            "maxResults": 10,
            "type": "WEB_DETECTION"
          }
        ]
      }
    ]
  }`;

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://vision.googleapis.com/v1/images:annotate',
    headers: {
      'x-goog-user-project': 'alive-hci',
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${accessToken}`
    },
    data: requestJson
  };

  try {
    const response = await axios.request(config);
    const classification = response.data.responses[0].webDetection.bestGuessLabels[0].label;
    // translate classification to target language
    const url = 'https://api-free.deepl.com/v2/translate';
    const text = classification;
    const targetLang = language;
    const authKey = '3534deeb-a97f-abbe-2869-91555979b7fb:fx';

    try {
      const response = await axios.post(url, {
        text: text.split(' '),
        target_lang: targetLang,
      }, {
        headers: {
          Authorization: `DeepL-Auth-Key ${authKey}`,
        },
      });
      // Extract translated text from response
      const translations = response.data.translations;
      let translatedText = '';
      for (let i = 0; i < translations.length; i++) {
        translatedText += translations[i].text + ' ';
      }
      return [classification, translatedText.trim()];
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
}

exports.photoTranslate = photoTranslate;