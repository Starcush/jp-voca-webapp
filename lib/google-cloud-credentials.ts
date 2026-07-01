export type GoogleCloudCredentials = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
};

export function getGoogleCloudCredentials() {
  const rawCredentials = process.env.GOOGLE_CLOUD_CREDENTIALS;

  if (!rawCredentials) {
    return undefined;
  }

  const credentials = JSON.parse(rawCredentials) as GoogleCloudCredentials;

  return {
    ...credentials,
    private_key: credentials.private_key?.replace(/\\n/g, "\n"),
  };
}
