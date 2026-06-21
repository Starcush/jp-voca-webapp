import { ImageAnnotatorClient } from "@google-cloud/vision";

type GoogleCredentials = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
};

let visionClient: ImageAnnotatorClient | undefined;

function parseCredentials() {
  const rawCredentials = process.env.GOOGLE_CLOUD_CREDENTIALS;

  if (!rawCredentials) {
    return undefined;
  }

  const credentials = JSON.parse(rawCredentials) as GoogleCredentials;

  return {
    ...credentials,
    private_key: credentials.private_key?.replace(/\\n/g, "\n"),
  };
}

function getVisionClient() {
  if (visionClient) {
    return visionClient;
  }

  const credentials = parseCredentials();
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
