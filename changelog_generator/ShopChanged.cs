namespace changelog_generator
{
    public class ShopChanged
    {
        public ShopChanged(string title, string fileName, string district, string colour, string category)
        {
            Title = title;
            FileName = fileName;
            District = district;
            Colour = colour;
            Category = category;
        }

        public string Title { get; private set; }

        public string FileName { get; private set; }

        public string District { get; private set; }

        public string Colour { get; private set; }

        public string Category { get; private set; }

        public override string ToString() => $"{Title}: {District} {Category} {Colour} at {FileName}";
    }
}