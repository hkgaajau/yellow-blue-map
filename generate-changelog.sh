#!/bin/sh

# allow running under later dotnet version
export DOTNET_ROLL_FORWARD=Major

# find previous commit with shop update
previous_commit=$(git log --grep='Update shops info' --grep='Generate changelog' --format='%H' | head -1)

# generate diff against previous commit
git -c core.quotePath=false diff --word-diff=porcelain $previous_commit..HEAD > diff.txt
mv diff.txt changelog_generator/

# generate changelog
cd changelog_generator
dotnet run
mv *.md ../hugo/content/changelogs/
cd ..

# commit newly generated files
git add hugo/content/changelogs
date=$(date +%F)
git commit -m "Generate changelog as at $date"
