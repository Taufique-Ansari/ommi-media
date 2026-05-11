export const pageSchema = {
  name: "pageContent",
  title: "Page Content",
  type: "document",
  fields: [
    {
      name: "section",
      title: "Section Identifier",
      type: "string",
      description: "e.g., 'Hero', 'Footer', 'FAQ'",
    },
    {
      name: "heading",
      title: "Heading",
      type: "string",
    },
    {
      name: "subheading",
      title: "Subheading",
      type: "string",
    },
    {
      name: "body",
      title: "Body Text",
      type: "text",
    },
  ],
};
