import { ImageAnnotatorClient } from "@google-cloud/vision";
import { getGoogleCloudCredentials } from "@/lib/google-cloud-credentials";

let visionClient: ImageAnnotatorClient | undefined;

function getVisionClient() {
  if (visionClient) {
    return visionClient;
  }

  const credentials = getGoogleCloudCredentials();
  visionClient = credentials
    ? new ImageAnnotatorClient({ credentials })
    : new ImageAnnotatorClient();

  return visionClient;
}

export async function extractTextFromImage(
  image: Buffer,
  languageHints: string[],
) {
  const [result] = await getVisionClient().documentTextDetection({
    image: {
      content: image,
    },
    imageContext: {
      languageHints,
    },
  });

  return result.fullTextAnnotation?.text?.trim() ?? "";
}
