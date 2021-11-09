# Yellow Blue Map (黃藍地圖)

## Summary

This repo hopes to provide a collaboration platform for anyone who wants to contribute updates on yellow/blue shops in Hong Kong.

## Project Structure

This project has 2 parts:

1. Data importer (in .NET Core) for Google maps .kml to generate data files for the next step

1. Static site generator (using Hugo) for generating the shop lists by shop category, district and colour and any other useful materials

The data files are updated manually and weekly from Google maps. Changes in this repo are published to [netlify mirror](https://yellow-blue-map.netlify.app) automatically.

## Getting Started

To test out the update process (you will need [.NET 6 SDK](https://dotnet.microsoft.com/download) and [Hugo](https://gohugo.io/getting-started/installing/)):

1. Run `update.sh`
1. Data files are generated in hugo/content/shops/
1. Go to hugo/ and run `hugo server`
1. The files are served at http://localhost:1313

Feel free to look around the code and make suggestions/pull requests. All contributions are welcome!

## To-do

1. JSON generation for use by other existing apps
1. Add machine-readable metadata (e.g. RDFa) for easier consumption
1. Transition from Google My Maps to this repo for collaboration
   - Add admins from original project
   - Stop importing from Google
   - Prepare template for new shop addition
   - Process pull requests here

## Credits

- [黃藍地圖] for map source data
- [HAD at data.gov.hk](https://data.gov.hk/en-data/dataset/hk-had-json1-hong-kong-administrative-boundaries) for districts boundary data

[黃藍地圖]: http://bit.do/yellowbluemap
