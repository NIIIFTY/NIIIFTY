export const PROJECT_ID = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
export const GCS_URL = `https://${PROJECT_ID}.appspot.com.storage.googleapis.com`;
export const REGULAR_WIDTH = 1080;
export const SMALL_WIDTH = 400;
export const THUMB_WIDTH = 200;
export const WEB3_STORAGE_API_KEY = process.env.WEB3_STORAGE_API_KEY;
