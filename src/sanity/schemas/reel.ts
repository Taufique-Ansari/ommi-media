export const reelSchema = {
  name: "reel",
  title: "Carousel Reels",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      description: "Internal reference name for this video",
    },
    {
      name: "videoUrl",
      title: "Video Link (Google Drive, MP4, YouTube, Vimeo)",
      type: "url",
      description: "Paste a direct MP4 link, or a Google Drive share link here.",
    },
    {
      name: "fallbackImage",
      title: "Fallback Image",
      type: "image",
      description: "Optional: An image to show while the video loads, or if it fails.",
      options: {
        hotspot: true,
      },
    },
  ],
};
