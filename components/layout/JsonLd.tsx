type JsonLdObject = Record<string, unknown>;

export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const payload = Array.isArray(data) ? data : [data];

  return (
    <>
      {payload.map((item) => {
        const type = String(item["@type"] ?? "JsonLd");

        return (
          <script
            key={type}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(item).replace(/</g, "\\u003c"),
            }}
          />
        );
      })}
    </>
  );
}
