using System.Text.Json;
using System.Text.Json.Serialization;

namespace AuctionManagement.API.Converters
{
    public class LocalDateTimeConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var dateString = reader.GetString()!;
            var dateTime = DateTime.Parse(dateString);
            
            // Always treat incoming dates as local time - no conversion
            return DateTime.SpecifyKind(dateTime, DateTimeKind.Local);
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            // Always output as local time without 'Z' suffix
            // This ensures the frontend receives the exact time as stored
            var localValue = value.Kind == DateTimeKind.Utc ? value.ToLocalTime() : value;
            writer.WriteStringValue(localValue.ToString("yyyy-MM-ddTHH:mm:ss"));
        }
    }
}
