namespace changelog_generator
{
    public class ShopAdded : ShopChanged
    {
        public ShopAdded(string title, string fileName, string district, string colour, string category) : base(title, fileName, district, colour, category)
        {
        }

        public override string ToString() => $"Added shop: {base.ToString()}";
    }
}