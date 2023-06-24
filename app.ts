import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

app.get('/', async (req, res) => {
  try {
    let ipaddress = req.ip;
    // Check if the request is coming from localhost
    if (ipaddress === "::1" || ipaddress === "::ffff:127.0.0.1") {
      ipaddress = process.env.FALLBACK_IP_ADDRESS!;
    }

    // Use IP-based geolocation service to determine the user's location
    const geoResponse = await axios.get(`https://ipapi.co/${ipaddress}/json/`);
    const { city, region, country, latitude, longitude } = geoResponse.data;

    // Fetch weather data for the location
    const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.WEATHER_API_KEY}`);
    const weather = weatherResponse.data.weather[0].description;

    // Use OpenAI's GPT-4 to generate an image prompt based on the location and weather
    const gptResponse = await openai.createCompletion({
      model: 'text-curie-001',
      prompt: `Generate an imaginative image description based on location and weather:
        ###
        location: Copenhagen, Capital Region, DK
        weather: Copenhagen's skyline appears as if a dream set against a canvas of soft, scattered clouds. The city's history blends quietly with a hint of modernism in all the buildings and structures. Despite the tranquil sky, it's impossible to miss the dynamic energy of the city.
        ###
        location: ${city}, ${region}, ${country}
        weather: ${weather}
        prompt:
        `,
      max_tokens: 100,
    });
    const imagePrompt = gptResponse.data.choices[0].text!.trim();

    // Use OpenAI's DALL-E API to generate an image
    const imageResponse = await openai.createImage({
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024'
    });
    const image = imageResponse.data.data[0].url;

    // Send data to the frontend
    res.json({
      city,
      region,
      country,
      weather,
      imagePrompt,
      image,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Fetch new data every hour and update the frontend
setInterval(() => {
  app.get('/');
}, 60 * 60 * 1000);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
