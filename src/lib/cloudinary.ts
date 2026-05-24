import { v2 as cloudinary } from "cloudinary";

// Check if Cloudinary is configured in environment variables and are not placeholder values.
// This prevents runtime crashes or 401 errors during static generation if placeholder keys are set.
const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
  process.env.CLOUDINARY_API_KEY !== "your_api_key" &&
  process.env.CLOUDINARY_API_SECRET !== "your_api_secret"
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface CloudinaryVideoItem {
  src: string;
  poster: string;
  alt: string;
}

/**
 * Fetches all video resources from Cloudinary, optionally filtered by a folder.
 * Returns an array of formatted video sources with custom optimized thumbnails.
 */
export async function getCloudinaryVideos(folderName?: string): Promise<CloudinaryVideoItem[]> {
  if (!isConfigured) {
    console.warn(
      "Cloudinary credentials are not configured in environment variables. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file."
    );
    return [];
  }

  try {
    // Build search expression. Filter by folder if name is provided.
    const folderQuery = folderName ? `folder:"${folderName}" AND ` : "";
    const expression = `${folderQuery}resource_type:video`;

    const result = await cloudinary.search
      .expression(expression)
      .sort_by("created_at", "desc")
      .max_results(30)
      .execute();

    if (!result || !result.resources) {
      return [];
    }

    return result.resources.map((resource: any) => {
      const secureUrl = resource.secure_url;
      
      // Leverage Cloudinary's dynamic transformation URL structure:
      // Replace "/video/upload/" with "/video/upload/so_auto,w_400/" and set extension to .jpg
      // to serve a light, fast auto-thumbnail image for the card carousel poster.
      const posterUrl = secureUrl
        .replace("/video/upload/", "/video/upload/so_auto,w_400/")
        .replace(/\.[^/.]+$/, ".jpg");

      // Generate a clean, user-friendly alt text from the asset public ID
      const baseName = resource.public_id.split("/").pop() || "Portfolio Video";
      const cleanAlt = baseName
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char: string) => char.toUpperCase());

      return {
        src: secureUrl,
        poster: posterUrl,
        alt: cleanAlt,
      };
    });
  } catch (error) {
    console.error("Failed to fetch videos from Cloudinary search API:", error);
    return [];
  }
}
