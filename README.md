# Yellow Blue Map (黃藍地圖)

## Update (2023-09-17)

Data update will be resumed slowly. Data source for new shops will be displayed for readers' judgement. Feel free to make contributions via Issues.

同路人仍在努力，這邊也會繼續更新。所有新加入的店舖都會顯示資料來源供讀者自行判斷。歡迎到Issues報料。人手有限，更新需時，請見諒。

## Important Notice (2023-07-09)

Data file update has been suspended due to source map data being taken down by its owner. This project will remain here as an archive. Ideas on the future of this project are welcome in the issues section. Make sure you have taken steps to protect your identity (e.g. create a new GitHub account that isn't linked to your personal identity in real life) before posting here.

由於終極黃藍地圖團隊已經移除Google Maps的終極黃藍地圖，這邊亦會暫停更新，但這裏的一切會留下，為歷史做個見證。

有咩意見可以喺Issues提出，強烈建議開個新GitHub account先好出post，唔好洩露自己個人身份。記住好好保護自己！

感謝黃藍地圖Admin呢幾年嘅付出，希望大家平安。香港人，加油！

## Summary

This repo hopes to provide a collaboration platform for anyone who wants to contribute updates on yellow/blue shops in Hong Kong.

## Project Structure

This project has 2 parts:

1. Data importer (in .NET Core) for Google maps .kml to generate data files for the next step

1. Static site generator (using Hugo) for generating the shop lists by shop category, district and colour and any other useful materials

This repo has been published to the [mirror site](https://yellow-blue-map.pages.dev).

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

## Credits

- [終極黃藍地圖] for map source data (link not working anymore)
- [HAD at data.gov.hk](https://data.gov.hk/en-data/dataset/hk-had-json1-hong-kong-administrative-boundaries) for districts boundary data

[終極黃藍地圖]: https://bit.ly/yellowbluemap
