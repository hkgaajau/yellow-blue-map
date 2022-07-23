# Yellow Blue Map (黃藍地圖)

## Summary

This repo hopes to provide a collaboration platform for anyone who wants to contribute updates on yellow/blue shops in Hong Kong.

## Project Structure

This project has 2 parts:

1. Data importer (in .NET Core) for Google maps .kml to generate data files for the next step

1. Static site generator (using Hugo) for generating the shop lists by shop category, district and colour and any other useful materials

The data files are updated manually and weekly from Google maps. Changes in this repo are published to the [mirror site](https://yellow-blue-map.pages.dev) automatically.

## Mirror site not working?

Some web sites are being taken down by state actors at an incredible pace. When the mirror site is inevitably taken down, you are encouraged to make use of services such as [Wayback Machine](https://web.archive.org/web/https://yellow-blue-map.pages.dev/shops/) or visit the source ([終極黃藍地圖]) directly to get the information you need.

The latest link to the mirror site will be updated on this page as soon as it is available, so do check back often and update your bookmark afterwards.

## Getting Started

To test out the update process (you will need [.NET 6 SDK](https://dotnet.microsoft.com/download) and [Hugo](https://gohugo.io/getting-started/installing/)) (v0.101.0 or newer preferred):

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

- [終極黃藍地圖] for map source data
- [HAD at data.gov.hk](https://data.gov.hk/en-data/dataset/hk-had-json1-hong-kong-administrative-boundaries) for districts boundary data

[終極黃藍地圖]: http://bit.do/yellowbluemap
