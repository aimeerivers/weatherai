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
app.use(express.static('public'));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

app.get('/data', async (req, res) => {
  try {
    const currentTime = req.query.currentTime || new Date().toLocaleString();
    let ipaddress = req.ip;
    // Check if the request is coming from localhost
    if (ipaddress === "::1" || ipaddress === "::ffff:127.0.0.1") {
      ipaddress = process.env.FALLBACK_IP_ADDRESS!;
    }

    // Use IP-based geolocation service to determine the user's location
    const geoResponse = await axios.get(`https://ipapi.co/${ipaddress}/json/`);
    const { city, region, country_name } = geoResponse.data;

    // Fetch weather data for the location
    const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city},${country_name}&appid=${process.env.WEATHER_API_KEY}`);
    const weather = weatherResponse.data.weather[0].description;

    // Use OpenAI's GPT-4 to generate an image prompt based on the location and weather
    const gptResponse = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `Generate an imaginative image description based on location, timestamp and weather.
        ###
        location: Copenhagen, Capital Region, Denmark
        timestamp: 25.6.2023 23.12.49
        weather: scattered clouds
        prompt: As the sun sets behind Copenhagen's skyline, the city's nightlife comes alive. Street performers, restaurants and clubs fill the air with sound and motion, welcoming visitors into the city's lively world.
        ###
        location: Adelaide, South Australia, Australia
        timestamp: 14/02/2023 10:00:00
        weather: broken clouds
        prompt: The sun peeks through broken clouds as the day begins in Adelaide. A pleasant breeze rushes through the city, carrying the sound of birds singing and not far off, the chatter of people starting their day.
        ###
        location: ${city}, ${region}, ${country_name}
        timestamp: ${currentTime}
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
      weather,
      imagePrompt,
      image,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
