using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using NetTopologySuite.Algorithm.Locate;
using NetTopologySuite.Geometries;
using SharpKml.Dom;
using SharpKml.Engine;

namespace gmap_importer
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;

            var inputFile = "google_export.kmz";

            var outputPath = "../hugo/content/shops/";
            var outputDirectory = Directory.CreateDirectory(outputPath);

            Console.WriteLine("Cleaning up old files...");
            foreach (var file in outputDirectory.EnumerateFiles("*.html")) {
                file.Delete();
            }
            Console.WriteLine("Done.");

            var generatedPostDateString = "2019-06-09";

            var colourMapping = getShopColourMapping();
            var shopTypeMapping = getShopTypeMapping();

            var districtBoundaryJson = File.ReadAllText("hksar_18_district_boundary.json", Encoding.UTF8);
            var geoJsonReader = new NetTopologySuite.IO.GeoJsonReader();
            var featureCollection = geoJsonReader.Read<NetTopologySuite.Features.FeatureCollection>(districtBoundaryJson);
            var districtLocators = new Dictionary<string, IPointOnGeometryLocator>(featureCollection.Count + 1);

            // custom polygon for shops on map that have no physical presence
            var virtualShopCoordinates = new Coordinate[] {
                new Coordinate(114.0555709, 22.308328),
                new Coordinate(114.0567725, 22.2557509),
                new Coordinate(114.1012328, 22.2557509),
                new Coordinate(114.1359084, 22.3081692),
                new Coordinate(114.0555709, 22.308328)
            };
            var virtualShopPolygon = new NetTopologySuite.Geometries.Polygon(new NetTopologySuite.Geometries.LinearRing(virtualShopCoordinates));
            districtLocators.Add("網上商店", new IndexedPointInAreaLocator(virtualShopPolygon));

            foreach (NetTopologySuite.Features.Feature feature in featureCollection)
            {
                districtLocators.Add(feature.Attributes["地區"].ToString(), new IndexedPointInAreaLocator(feature.Geometry));
            }

            Stopwatch sw = Stopwatch.StartNew();
            var counter = 0;
            {
                KmlFile kmlFile;

                using (var zipStream = File.OpenRead(inputFile))
                using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Read))
                {
                    var entry = archive.GetEntry("doc.kml");
                    using (var kmlStream = entry.Open())
                    using (var kmlStreamReader = new StreamReader(kmlStream))
                    using (var memoryStream = new MemoryStream())
                    using (var memoryStreamWriter = new StreamWriter(memoryStream))
                    {
                        char[] buffer = new char[1024];
                        var bufferSpan = new Span<char>(buffer);

                        int charactersRead;
                        while ((charactersRead = kmlStreamReader.Read(bufferSpan)) > 0)
                        {
                            foreach (var character in bufferSpan.Slice(0, charactersRead))
                            {
                                // remove invalid control characters from XML
                                if (!Char.IsControl(character))
                                {
                                    memoryStreamWriter.Write(character);
                                }
                            }
                        }

                        memoryStreamWriter.Flush();
                        memoryStream.Seek(0, SeekOrigin.Begin);
                        kmlFile = KmlFile.Load(memoryStream);
                    }
                }

                if (kmlFile.Root is Kml kml)
                {
                    // sample styleUrl: #icon-1507-0288D1
                    var styleUrlRegex = new Regex(@"^#icon-(\d+)-(\w+)");

                    // handle shop name collision cases
                    var nameCountDict = new Dictionary<string, int>();

                    var invalidFileNameChars = new char[] { '<', '>', ':', '"', '/', '\\', '|', '?', '*', '#', '.' };

                    var reasonToEndRegex = new Regex(@"\b(原因|官方資訊)[\s\S]+", RegexOptions.Compiled);

                    var hyperlinkRegex = new Regex(@"\b(https?://[^ <>()""]+)", RegexOptions.Compiled);

                    foreach (var placemark in kml.Flatten().OfType<Placemark>()) // for testing: .Take(200))
                    {
                        // remove newlines from name
                        var name = placemark.Name.Replace("\r", "").Replace("\n", "");

                        // remove invalid char from file name
                        var fileName = string.Concat(name.Split(invalidFileNameChars)).Replace(' ', '-');

                        // truncate file name to avoid crashing netlify build
                        var fileNameStringInfo = new StringInfo(fileName);
                        if (fileNameStringInfo.LengthInTextElements > 70)
                        {
                            fileName = fileNameStringInfo.SubstringByTextElements(0, 70) + "…";
                        }

                        if (nameCountDict.TryGetValue(fileName, out int existingCount))
                        {
                            int count = existingCount + 1;
                            nameCountDict[fileName] = count;
                            fileName = $"{fileName}-{count}";
                        }
                        else
                        {
                            nameCountDict[fileName] = 1;
                        }

                        var colour = "";
                        var type = "";

                        string styleUrlString = placemark.StyleUrl.ToString();
                        var match = styleUrlRegex.Match(styleUrlString);
                        if (match.Success)
                        {
                            // 1: shop type
                            if (shopTypeMapping.TryGetValue(match.Groups[1].Value, out string shopType))
                            {
                                type = shopType;
                            }
                            else
                            {
                                Console.WriteLine($"Unknown shop type: {match.Groups[1].Value} for {name}");
                                type = "種類不明";
                            }

                            // 2: shop colour
                            colour = colourMapping[match.Groups[2].Value];
                        }

                        var lat = 0.0;
                        var lng = 0.0;
                        var district = "不詳";
                        if (placemark.Geometry is SharpKml.Dom.Point point)
                        {
                            lat = point.Coordinate.Latitude;
                            lng = point.Coordinate.Longitude;

                            foreach (var entry in districtLocators)
                            {
                                if (PointOnGeometryLocatorExtensions.Intersects(entry.Value, new NetTopologySuite.Geometries.Coordinate(lng, lat)))
                                {
                                    district = entry.Key;
                                    break;
                                }
                            }
                        }

                        var description = placemark.Description?.Text;
                        if (description == null)
                        {
                            Console.WriteLine($"Warning: Null description encountered: {name}");
                            description = "";
                        }

                        using (var fileWriter = new StreamWriter(Path.Combine(outputPath, $"{fileName}.html"), false))
                        {
                            // front matter
                            fileWriter.WriteLine("---");
                            fileWriter.WriteLine($"title: '{name.Replace("'", "''")}'");
                            fileWriter.WriteLine($"date: {generatedPostDateString}");
                            fileWriter.WriteLine($"districts: {district}");
                            fileWriter.WriteLine($"colours: {colour}");
                            fileWriter.WriteLine($"categories: {type}");
                            fileWriter.WriteLine($"lat: {lat}");
                            fileWriter.WriteLine($"lng: {lng}");
                            fileWriter.WriteLine("---");

                            description = hyperlinkRegex.Replace(description, "<a href=\"$1\">$1</a>");

                            // description HTML
                            if (colour == "黃店") {
                                fileWriter.WriteLine(reasonToEndRegex.Replace(description, ""));
                            } else {
                                fileWriter.WriteLine(description);
                            }
                        }

                        if (++counter % 100 == 0)
                        {
                            Console.WriteLine($"Processed {counter} records");
                        }
                    }
                }
            }
            sw.Stop();

            Console.WriteLine($"Total time taken to process {counter} records: {sw.Elapsed.TotalSeconds} seconds");
        }

        private static ImmutableDictionary<string, String> getShopColourMapping()
        {
            var colourMappingBuilder = ImmutableDictionary.CreateBuilder<string, string>();
            colourMappingBuilder.Add("FFD600", "黃店");
            colourMappingBuilder.Add("FFEA00", "黃店"); // temp fix for incorrect colour in source file
            colourMappingBuilder.Add("0288D1", "藍店");
            colourMappingBuilder.Add("558B2F", "綠店");
            return colourMappingBuilder.ToImmutable();
        }

        private static ImmutableDictionary<string, string> getShopTypeMapping()
        {
            var shopTypeMappingBuilder = ImmutableDictionary.CreateBuilder<string, string>();
            shopTypeMappingBuilder.Add("1503", "成人");
            shopTypeMappingBuilder.Add("1504", "旅遊");
            shopTypeMappingBuilder.Add("1507", "寵物");
            shopTypeMappingBuilder.Add("1509", "畫室");
            shopTypeMappingBuilder.Add("1511", "氣球");
            shopTypeMappingBuilder.Add("1512", "保險");
            shopTypeMappingBuilder.Add("1516", "髮廊");
            shopTypeMappingBuilder.Add("1517", "飲品");
            shopTypeMappingBuilder.Add("1522", "單車");
            shopTypeMappingBuilder.Add("1526", "書店");
            shopTypeMappingBuilder.Add("1531", "營銷");
            shopTypeMappingBuilder.Add("1534", "咖啡");
            shopTypeMappingBuilder.Add("1535", "攝影");
            shopTypeMappingBuilder.Add("1538", "汽車");
            shopTypeMappingBuilder.Add("1539", "洗車");
            shopTypeMappingBuilder.Add("1540", "遊戲");
            shopTypeMappingBuilder.Add("1546", "物業");
            shopTypeMappingBuilder.Add("1549", "服裝");
            shopTypeMappingBuilder.Add("1553", "肉類");
            shopTypeMappingBuilder.Add("1555", "找換");
            shopTypeMappingBuilder.Add("1557", "牙醫");
            shopTypeMappingBuilder.Add("1558", "醫療");
            shopTypeMappingBuilder.Add("1566", "農場");
            shopTypeMappingBuilder.Add("1567", "食品");
            shopTypeMappingBuilder.Add("1572", "魚類");
            shopTypeMappingBuilder.Add("1573", "魚類");
            shopTypeMappingBuilder.Add("1577", "食肆");
            shopTypeMappingBuilder.Add("1578", "雜貨");
            shopTypeMappingBuilder.Add("1581", "燃油");
            shopTypeMappingBuilder.Add("1582", "花店");
            shopTypeMappingBuilder.Add("1584", "生活精品");
            shopTypeMappingBuilder.Add("1588", "War Game");
            shopTypeMappingBuilder.Add("1589", "健身");
            shopTypeMappingBuilder.Add("1590", "維修");
            shopTypeMappingBuilder.Add("1592", "結婚");
            shopTypeMappingBuilder.Add("1594", "占卜");
            shopTypeMappingBuilder.Add("1596", "行山");
            shopTypeMappingBuilder.Add("1597", "背囊");
            shopTypeMappingBuilder.Add("1602", "休息");
            shopTypeMappingBuilder.Add("1603", "家品");
            shopTypeMappingBuilder.Add("1604", "工作坊");
            shopTypeMappingBuilder.Add("1609", "網頁設計");
            shopTypeMappingBuilder.Add("1613", "珠寶");
            shopTypeMappingBuilder.Add("1635", "話劇");
            shopTypeMappingBuilder.Add("1637", "音樂");
            shopTypeMappingBuilder.Add("1639", "發展中心");
            shopTypeMappingBuilder.Add("1643", "視光");
            shopTypeMappingBuilder.Add("1647", "電子");
            shopTypeMappingBuilder.Add("1665", "裝修");
            shopTypeMappingBuilder.Add("1670", "教堂");
            shopTypeMappingBuilder.Add("1683", "鞋店");
            shopTypeMappingBuilder.Add("1684", "其它");
            shopTypeMappingBuilder.Add("1696", "足球");
            shopTypeMappingBuilder.Add("1699", "行李");
            shopTypeMappingBuilder.Add("1701", "游泳");
            shopTypeMappingBuilder.Add("1707", "網球");
            shopTypeMappingBuilder.Add("1722", "運輸");
            shopTypeMappingBuilder.Add("1725", "網吧");
            shopTypeMappingBuilder.Add("1727", "戲院");
            shopTypeMappingBuilder.Add("1737", "美容");
            shopTypeMappingBuilder.Add("1742", "BB");
            shopTypeMappingBuilder.Add("1752", "射箭");
            shopTypeMappingBuilder.Add("1762", "甜品");
            shopTypeMappingBuilder.Add("1764", "燒烤");
            shopTypeMappingBuilder.Add("1765", "行山");
            shopTypeMappingBuilder.Add("1773", "跳舞");
            shopTypeMappingBuilder.Add("1777", "潛水");
            shopTypeMappingBuilder.Add("1778", "寵物");
            shopTypeMappingBuilder.Add("1788", "劍擊");
            shopTypeMappingBuilder.Add("1800", "烹飪");
            shopTypeMappingBuilder.Add("1820", "電腦");
            shopTypeMappingBuilder.Add("1821", "洗衣");
            shopTypeMappingBuilder.Add("1838", "行山");
            shopTypeMappingBuilder.Add("1845", "印刷");
            shopTypeMappingBuilder.Add("1847", "寵物");
            shopTypeMappingBuilder.Add("1849", "球拍");
            shopTypeMappingBuilder.Add("1854", "模型");
            shopTypeMappingBuilder.Add("1855", "製造");
            shopTypeMappingBuilder.Add("1860", "教育");
            shopTypeMappingBuilder.Add("1868", "煙");
            shopTypeMappingBuilder.Add("1870", "潛水");
            shopTypeMappingBuilder.Add("1875", "壁球");
            shopTypeMappingBuilder.Add("1879", "酒類");
            shopTypeMappingBuilder.Add("1880", "滑浪");
            shopTypeMappingBuilder.Add("1886", "蔬果");
            shopTypeMappingBuilder.Add("1890", "排球");
            return shopTypeMappingBuilder.ToImmutable();
        }
    }
}
