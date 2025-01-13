# CritiCore - Review Aggregator of OpenCritic and Steam Reviews

CritiCore is a personal web project designed to enhance my development skills by presenting API endpoint data in an intuitive and visually engaging way. The platform focuses on creating a seamless, user-friendly experience, allowing me to practice building features that make complex data accessible and easy to navigate. This project serves as a hands-on opportunity to refine my abilities in web development, API integration, and user interface design.

### Features

- Dynamic game pages based on a game's name
- User-friendly dynamic searches (only works for Steam searchs due to limited OpenCritic API calls)
- Responsive design for optimal viewing on various devices
- Dynamically generated blur data to improve perceived performance by displaying low-resolution placeholders for images while high-resolution images load, enhancing the user experience with faster visual feedback
- All data is cached using Upstash/Redis, while pages are caching using next revalidation
- Implemented metadata and sitemap to improve SEO by providing crucial information about the website to search engines, such as the title, description, opengraph, and keywords. This allows search engines to better understand the content of the website and rank it more appropriately in search results

## Installation

```bash
# Clone the repository:
$ git clone https://github.com/ecdevv/CritiCore.git

# Navigate into the repository:
$ cd /CritiCore

# Install dependencies:
$ npm install

# Run the app:
$ npm start or npm run dev
```

## Notes/Potential Improvements/Known Issues

### Notes

- Made everything from scratch
- I limited the use of external libraries to these: sharp for blur data generation, date-fns for date formatting, damerau-levenshtein algorithm for searches, ioredis for caching, steamgriddb for backup images, and cheerio for basic web scraping
- Tried to utilize web scraping minimally; only used to scrape for data for searches due to the length of time it takes to search the applist/appindex and search for games that has a page but is not in the applist/appindex (e.g. soon to be released games)
- OpenCritic official API calls are using cache: 'force-cache' due to limited API calls, so not sure when the cache truly expires
- Upstash free tier only allows 10k commands per day, and there is currently minimal error handling when this limit is reached
- Blur data urls are cached using Upstash and runs a lot of commands; the 10k limit is not optimal at all
- Deployed version not as optimal/fast as local version due to limitations from the free tier plans of Vercel and Upstash
- Loading and Not-found pages are incomplete

### Potential Improvements

- Could definitely improve upon the look and appeal overall
- Add additional features
- Handle invalid data/errors better

## Credits

<strong>Tools & Frameworks:</strong> HTML, CSS, Typescript, Next.js, React

<strong>Libraries Used:</strong> sharp, damerau-levenshtein, date-fns, ioredis, steamgriddb, cheerio

### Data Sources
  - [OpenCritic](https://rapidapi.com/opencritic-opencritic-default/api/opencritic-api): For game metadata, ratings, reviews, media elements, and related data.
  - [Steam](https://steamcommunity.com/dev): For game metadata, ratings, reviews, media elements, and related data.
  - [SteamGridDB](https://www.steamgriddb.com/api/v2): For media elements.

### Images
  - ocLogo.svg: OpenCritic Inc, Public domain, via Wikimedia Commons