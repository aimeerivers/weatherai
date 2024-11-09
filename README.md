# WeatherAI

Generates AI images based on your location, weather conditions and time of day

## Getting started

Add a `.env` file and add some environment variables:

    OPENAI_API_KEY=<your OpenAI key>
    WEATHER_API_KEY=<your OpenWeather key>

Install npm dependencies

    npm install

## Build the source code

    npm run build

## Run the server locally

    npm run start

Visit http://localhost:3000 in your browser

## Run in development mode

    npm run dev

This will automatically rebuild the source code and restart the server for you.

## Format code

The project uses ESLint and Prettier to ensure consistent coding standards.

    npm run package:lint
    npm run lint
    npm run format

- `package:lint` will ensure the `package.json` file confirms to conventions.
- `lint` will check for errors and fix formatting in `.ts` and `.js` files.
- `format` will apply format rules to all possible files.
