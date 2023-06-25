import express, { type Request, type Response } from 'express'
import bodyParser from 'body-parser'
import axios from 'axios'
import { Configuration, OpenAIApi } from 'openai'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY ?? ''
})
const openai = new OpenAIApi(configuration)

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.get('/data', async (req: Request, res: Response) => {
  try {
    const currentTime: string = req.query.currentTime?.toString() ?? new Date().toLocaleString()
    let ipaddress = req.ip
    // Check if the request is coming from localhost
    if (ipaddress === '::1' || ipaddress === '::ffff:127.0.0.1') {
      ipaddress = '185.166.85.234'
    }

    // Use IP-based geolocation service to determine the user's location
    const geoResponse = await axios.get(`https://ipapi.co/${ipaddress}/json/`)
    const city: string = geoResponse.data.city
    const region: string = geoResponse.data.region
    const countryName: string = geoResponse.data.country_name

    // Fetch weather data for the location
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city},${countryName}&units=metric&appid=${
        process.env.WEATHER_API_KEY ?? ''
      }`
    )
    const weather: string = weatherResponse.data.weather[0].description
    const temperature: number = weatherResponse.data.main.feels_like.toFixed(0)

    // Use OpenAI's GPT-4 to generate an image prompt based on the location and weather
    const gptResponse = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `Generate an imaginative image description based on location, timestamp, weather and temperature. Make sure to describe appropriate weather for the time of day, season and location. The description should be 2-3 sentences long and should be written in a way that makes it easy to imagine the scene.
        ###
        location: Copenhagen, Capital Region, Denmark
        timestamp: 25.6.2023 23.12.49
        weather: scattered clouds
        temperature: 18 degrees celsius
        prompt: As the sun sets behind Copenhagen's skyline, the city's nightlife comes alive. Street performers, restaurants and clubs fill the air with sound and motion, welcoming visitors into the city's lively world.
        ###
        location: Adelaide, South Australia, Australia
        timestamp: 14/02/2023 10:00:00
        weather: broken clouds
        temperature: 14 degrees celsius
        prompt: The sun peeks through broken clouds as the day begins in Adelaide. A pleasant breeze rushes through the city, carrying the sound of birds singing and not far off, the chatter of people starting their day.
        ###
        location: Yokohama, Kanagawa, Japan
        timestamp: 2023-06-25 17:10
        weather: few clouds
        temperature: 31 degrees celsius
        prompt: The temperature begins to cool as the day draws to a close in Yokohama. Few clouds drift lazily above, giving the city a dreamy appearance. The streets below are alive with people chatting and enjoying the twilight hours before nightfall.
        ###
        location: ${city}, ${region}, ${countryName}
        timestamp: ${currentTime}
        weather: ${weather}
        temperature: ${temperature} degrees celsius
        prompt:
        `,
      max_tokens: 100
    })
    const imagePrompt: string =
      gptResponse.data.choices[0]?.text?.trim() ??
      `The weather in ${city}, ${region} is ${weather} and the temperature is ${temperature} degrees celsius.`

    // Use OpenAI's DALL-E API to generate an image
    const imageResponse = await openai.createImage({
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024'
    })
    const image = imageResponse.data.data[0].url

    // Send data to the frontend
    res.json({
      city,
      region,
      weather,
      temperature,
      imagePrompt,
      image
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch data' })
  }
})

const port = process.env.PORT ?? 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
