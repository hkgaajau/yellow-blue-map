using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

namespace changelog_generator
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;

            var outputPath = "./";
            var outputDirectory = Directory.CreateDirectory(outputPath);

            var interestedGitDiffHeaderLineRegex = new Regex(@"^diff --git a/hugo/content/shops/[^ ]+ b/hugo/content/shops/[^ ]+", RegexOptions.Compiled);
            var fromColourRegex = new Regex(@"^-(?:黃|藍|綠)店$", RegexOptions.Compiled);
            var toColourRegex = new Regex(@"^\+(?:黃|藍|綠)店$", RegexOptions.Compiled);

            ICollection<ShopAdded> shopAddedList = new List<ShopAdded>();
            ICollection<ShopDeleted> shopDeletedList = new List<ShopDeleted>();
            ICollection<ColourChanged> colourChangedList = new List<ColourChanged>();

            var isRecordDone = false;
            var beforeName = "";
            var afterName = "";
            var title = "";
            var shouldCheckColourChange = false;
            var fromColour = "";
            var toColour = "";
            var district = "";
            var category = "";

            using (var streamReader = new StreamReader("diff.txt"))
            {
                for (var line = streamReader.ReadLine(); line != null; line = streamReader.ReadLine())
                {
                    if (line.StartsWith("diff --git"))
                    {
                        // only interested in hugo shops change
                        if (interestedGitDiffHeaderLineRegex.IsMatch(line))
                        {
                            // start of git diff file record
                            isRecordDone = false;
                            beforeName = "";
                            afterName = "";
                            title = "";
                            shouldCheckColourChange = false;
                            fromColour = "";
                            toColour = "";
                            district = "";
                            category = "";
                        }
                    }

                    if (!isRecordDone)
                    {
                        if (line.StartsWith("--- "))
                        {
                            if (line == "--- /dev/null")
                            {
                                beforeName = null;
                            }
                            else
                            {
                                beforeName = line.Substring(line.LastIndexOf('/') + 1).TrimEnd('"');
                            }
                        }
                        else if (line.StartsWith("+++ "))
                        {
                            if (line == "+++ /dev/null")
                            {
                                afterName = null;
                            }
                            else
                            {
                                afterName = line.Substring(line.LastIndexOf('/') + 1).TrimEnd('"');
                            }
                        }
                        else if (line.StartsWith("-title: "))
                        {
                            title = line.Substring(line.IndexOf(' ', 1) + 1);
                        }
                        else if (line.StartsWith("-districts: "))
                        {
                            district = line.Substring(line.IndexOf(' ', 1) + 1);
                        }
                        else if (line.StartsWith("-colours: "))
                        {
                            fromColour = line.Substring(line.IndexOf(' ', 1) + 1);
                        }
                        else if (line.StartsWith("-categories: "))
                        {
                            if (afterName == null)
                            {
                                // deleted shop
                                category = line.Substring(line.IndexOf(' ', 1) + 1);
                                shopDeletedList.Add(new ShopDeleted(title, beforeName, district, fromColour, category));
                                isRecordDone = true;
                            }
                        }
                        else if (line.StartsWith("+title: "))
                        {
                            title = line.Substring(line.IndexOf(' ', 1) + 1);
                        }
                        else if (line.StartsWith("+districts: "))
                        {
                            district = line.Substring(line.IndexOf(' ', 1) + 1);
                        }
                        else if (line.StartsWith("+colours: "))
                        {
                            toColour = line.Substring(line.IndexOf(' ', 1) + 1);
                        }
                        else if (line.StartsWith("+categories: "))
                        {
                            if (beforeName == null)
                            {
                                // new shop
                                category = line.Substring(line.IndexOf(' ', 1) + 1);
                                shopAddedList.Add(new ShopAdded(title, afterName, district, toColour, category));
                                isRecordDone = true;
                            }
                        }
                        else if (line.StartsWith(" title: "))
                        {
                            title = line.Substring(line.IndexOf(' ', 1) + 1);
                        }
                        else if (line.StartsWith(" districts: "))
                        {
                            district = line.Substring(line.IndexOf(' ', 1)).TrimStart();
                        }
                        else if (line.StartsWith(" categories: "))
                        {
                            category = line.Substring(line.IndexOf(' ', 1)).TrimStart();
                            if (fromColour != "" && toColour != "")
                            {
                                colourChangedList.Add(new ColourChanged(title, afterName, district, fromColour, toColour, category));
                                isRecordDone = true;
                            }
                        }
                        else if (line == " colours: ")
                        {
                            shouldCheckColourChange = true;
                        }
                        else if (shouldCheckColourChange)
                        {
                            if (fromColour == "" && fromColourRegex.IsMatch(line))
                            {
                                fromColour = line.Substring(1);
                            }
                            else if (fromColour != "" && toColour == "" && toColourRegex.IsMatch(line))
                            {
                                shouldCheckColourChange = false;
                                toColour = line.Substring(1);
                            }
                            else
                            {
                                shouldCheckColourChange = false;
                                fromColour = "";
                                toColour = "";
                            }
                        }
                    }
                }
            }

            using (var fileWriter = new StreamWriter(Path.Combine(outputPath, $"{DateTime.Now:yyyy-MM-dd}.md")))
            {
                fileWriter.WriteLine("---");
                fileWriter.WriteLine($"date: {DateTime.UtcNow:u}");
                fileWriter.WriteLine("added:");
                foreach (var shopAdded in shopAddedList)
                {
                    fileWriter.WriteLine($"- title: {shopAdded.Title}");
                    fileWriter.WriteLine($"  file_name: '{shopAdded.FileName.Replace("'", "''")}'");
                    fileWriter.WriteLine($"  district: {shopAdded.District}");
                    fileWriter.WriteLine($"  colour: {shopAdded.Colour}");
                    fileWriter.WriteLine($"  category: {shopAdded.Category}");
                }
                fileWriter.WriteLine("deleted:");
                foreach (var shopDeleted in shopDeletedList)
                {
                    fileWriter.WriteLine($"- title: {shopDeleted.Title}");
                    fileWriter.WriteLine($"  file_name: '{shopDeleted.FileName.Replace("'", "''")}'");
                    fileWriter.WriteLine($"  district: {shopDeleted.District}");
                    fileWriter.WriteLine($"  colour: {shopDeleted.Colour}");
                    fileWriter.WriteLine($"  category: {shopDeleted.Category}");
                }
                fileWriter.WriteLine("changed_colours:");
                foreach (var colourChanged in colourChangedList)
                {
                    fileWriter.WriteLine($"- title: {colourChanged.Title}");
                    fileWriter.WriteLine($"  file_name: '{colourChanged.FileName.Replace("'", "''")}'");
                    fileWriter.WriteLine($"  district: {colourChanged.District}");
                    fileWriter.WriteLine($"  from_colour: {colourChanged.FromColour}");
                    fileWriter.WriteLine($"  to_colour: {colourChanged.ToColour}");
                    fileWriter.WriteLine($"  category: {colourChanged.Category}");
                }
                fileWriter.WriteLine("---");
            }
        }
    }
}
