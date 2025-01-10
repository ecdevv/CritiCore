# CritiCore - Review Aggregator of OpenCritic and Steam Reviews

CritiCore is a web project aimed at presenting API endpoint data in an intuitive and visually engaging way. The platform focuses on creating a seamless and user-friendly experience, making complex data accessible and easy to navigate.

### Features

- Dynamic game pages based on a game's name
- User-friendly dynamic searches (only works for Steam searchs due to limited OpenCritic API calls)
- Responsive design for optimal viewing on various devices
- Dynamically generated blur data to improve perceived performance by displaying low-resolution placeholders for images while high-resolution images load, enhancing the user experience with faster visual feedback
- All data is cached using upstash/redit, with blur data and Steam's applist cached in-memory with automated cleanup and pages/api calls cached using next revalidation
- OpenCritic official API calls are using cache: 'force-cache' due to limited API calls, so not sure when the cache truly expires
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

- Attempted to make everything reusable and from scratch
- I limited the use of external libraries to these: sharp for blur data generation, date-fns for date formatting, damerau-levenshtein algorithm for searches, ioredis for caching, steamgriddb for backup images, and cheerio for basic web scraping
- Tried to utilize web scraping minimally; only used to scrape for data for searches due to the length of time it takes to search the applist/appindex and search for games that has a page but is not in the applist/appindex (e.g. soon to be released games)
- Release dates prioritize OC release dates, then Steam
- Homepage does not load Steam Data for the games due to Vercel free tier plan having a 10s timeout limit for API calls
- Deployed version may not be as optimal as local version due to limitations such as the above
- Deployed version is quite slow compared to my locally built version

### Potential Improvements

- Could definitely improve upon the look and appeal overall
- Handle invalid data/errors better

## Credits

<strong>Tools & Frameworks:</strong> HTML, CSS, Typescript, Next.js, React

<strong>Libraries Used:</strong> sharp, damerau-levenshtein, date-fns, ioredis, steamgriddb, cheerio 

### Images
  - ocLogo.svg: OpenCritic Inc, Public domain, via Wikimedia Commons