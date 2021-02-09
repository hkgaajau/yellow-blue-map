# update from gmap
cd gmap_importer
curl -o google_export.kmz 'https://www.google.com/maps/d/kml?mid=11zThwHjrFwBlNCStMQavBdryuESKzcdR'
dotnet run
cd ..

# generate diff
git add hugo/content/shops
git -c core.quotePath=false diff --cached --word-diff=porcelain > diff.txt
mv diff.txt changelog_generator/

# generate changelog
cd changelog_generator
dotnet run
mv *.md ../hugo/content/changelogs/
cd ..

# commit newly generated files
git add hugo/content/changelogs
date=$(date +%F)
git commit -m "Update shops info as at $date"
