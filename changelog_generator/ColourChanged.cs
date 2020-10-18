namespace changelog_generator
{
    public class ColourChanged
    {
        public ColourChanged(string title, string fileName, string district, string fromColour, string toColour, string category)
        {
            Title = title;
            FileName = fileName;
            District = district;
            FromColour = fromColour;
            ToColour = toColour;
            Category = category;
        }

        public string Title { get; private set; }

        public string FileName { get; private set; }

        public string District { get; private set; }

        public string Category { get; private set; }

        public string FromColour { get; private set; }

        public string ToColour { get; private set; }

        public override string ToString() => $"Colour change: {Title} {District} {Category}: {FromColour}->{ToColour} at {FileName}";
    }
}