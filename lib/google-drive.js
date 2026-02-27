// lib/google-drive.js
// Connects to Google Drive via service account and reads CSVs from store folders

import { google } from "googleapis";

let driveClient = null;

function getDriveClient() {
  if (driveClient) return driveClient;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  driveClient = google.drive({ version: "v3", auth });
  return driveClient;
}

// List all CSV files in a folder
async function listCSVsInFolder(folderId) {
  const drive = getDriveClient();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='text/csv' and trashed=false`,
    fields: "files(id, name, modifiedTime)",
    orderBy: "name",
  });
  return res.data.files || [];
}

// Download a file's content as text
async function downloadFile(fileId) {
  const drive = getDriveClient();
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "text" }
  );
  return res.data;
}

// Fetch all CSVs from a store folder → { filename: csvContent }
async function fetchStoreData(folderId) {
  const files = await listCSVsInFolder(folderId);
  const result = {};

  for (const file of files) {
    try {
      const content = await downloadFile(file.id);
      result[file.name] = content;
    } catch (err) {
      console.error(`[Drive] Error downloading ${file.name}:`, err.message);
    }
  }

  return result;
}

// Fetch data from all 3 store folders
export async function fetchAllStoresData() {
  const folders = {
    cp: process.env.DRIVE_FOLDER_COLORPROOF,
    nb: process.env.DRIVE_FOLDER_NEUMABEAUTY,
    n4: process.env.DRIVE_FOLDER_NUMBER4,
  };

  const results = {};

  for (const [key, folderId] of Object.entries(folders)) {
    if (!folderId) {
      console.warn(`[Drive] No folder ID for ${key}, skipping`);
      continue;
    }
    try {
      results[key] = await fetchStoreData(folderId);
    } catch (err) {
      console.error(`[Drive] Error fetching ${key} data:`, err.message);
      results[key] = {};
    }
  }

  return results;
}
