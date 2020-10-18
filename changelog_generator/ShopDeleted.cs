namespace changelog_generator
{
    public class ShopDeleted : ShopChanged
    {
        public ShopDeleted(string title, string fileName, string district, string colour, string category) : base(title, fileName, district, colour, category)
        {
        }

        public override string ToString() => $"Deleted shop: {base.ToString()}";
    }
}