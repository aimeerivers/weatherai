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
  organization: "org-aclFE4ntvukyvGUOQM2GT8c3",
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.get('/', async (req, res) => {
  try {
    // Use IP-based geolocation service to determine the user's location
    const geoResponse = await axios.get(`https://ipapi.co/${req.ip}/json/`);
    const { city, region, country } = geoResponse.data;

    // Fetch weather data for the location
    const weatherResponse = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${process.env.WEATHER_API_KEY}`);
    const weather = weatherResponse.data.weather[0].main;

    // Use OpenAI's GPT-4 to generate an image prompt based on the location and weather
    const gptResponse = await openai.createCompletion({
      model: 'text-davinci-004',
      prompt: `Generate an imaginative image description based on this location: ${city}, ${region}, ${country} with the current weather: ${weather}.`,
      max_tokens: 100,
    });
    const imagePrompt = gptResponse.data.choices[0].text.trim();

    // Use OpenAI's DALL-E API to generate an image
    // Currently, OpenAI's DALL-E API is not publicly available, so this is a placeholder
    const image = "https://example.com/placeholder.png";

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
