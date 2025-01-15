// ----------------------------------for azure-----------------------------------------
// require("dotenv").config();
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");
const mime = require("mime-types");
const config = require("../config/config");

const accountName = config.azure_storage_account_name;
const accountKey = config.azure_storage_account_key;
const containerName = "hwrfstorage"; // The container name in Azure Blob Storage

// Create a BlobServiceClient using Azure account name and account key
const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);
const blobServiceClient = new BlobServiceClient(
  https://${accountName}.blob.core.windows.net,
  sharedKeyCredential
);

const containerClient = blobServiceClient.getContainerClient(containerName);

// Upload file to Azure Blob Storage
const uploadFile = async (file, key) => {
  try {
    // Determine the Content-Type based on the file's extension
    const ContentType =
      mime.lookup(file.originalname) || "application/octet-stream";

    // Generate the SAS token for the blob
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 10); // SAS token expiry in 10 minutes

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );
    const blobServiceClient = new BlobServiceClient(
      https://${accountName}.blob.core.windows.net,
      sharedKeyCredential
    );

    // Get the BlockBlobClient for the blob
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    // Generate the SAS URL for the blob (with write permissions)
    const sasToken = await blockBlobClient.generateSasUrl({
      expiresOn: expiryTime,
      permissions: "w", // Write permission
    });

    // Construct the upload URL by combining the SAS token
    const uploadUrl = ${sasToken};
    console.log("uploadUrl in function: ", uploadUrl);

    // Return the SAS URL (with the SAS token)
    return uploadUrl;
  } catch (error) {
    console.error("Error generating SAS URL:", error);
    return { success: false, error: error.message };
  }
};

// Get file from Azure Blob Storage
// Get file from Azure Blob Storage (private container)
const getFile = async (key) => {
  try {
    // Get the BlockBlobClient for the blob
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    // Set the expiration time for the SAS token
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 5); // SAS token expiry in 30 minutes

    // Generate the SAS URL for the blob (with read permission)
    const sasToken = await blockBlobClient.generateSasUrl({
      expiresOn: expiryTime,
      permissions: "r", // Read permission
    });

    // Construct the complete URL by combining the SAS token
    const fileUrl = ${sasToken};

    return fileUrl; // Return the SAS URL for accessing the file
  } catch (error) {
    console.error("Error getting file:", error);
    return { success: false, error: error.message };
  }
};

// Get a list of files from Azure Blob Storage (list blobs in a container or folder)
const getFilesList = async (keyPath) => {
  const files = [];

  try {
    // List blobs (non-hierarchical, flat listing)
    const blobsIterator = containerClient.listBlobsFlat({ prefix: keyPath });

    for await (const blob of blobsIterator) {
      const name = blob.name.split("/").pop(); // Get the file name
      const type = name.split(".").pop(); // Get the file extension (type)

      files.push({
        name: name,
        type: type,
        size: blob.properties.contentLength,
        lastModifiedDate: blob.properties.lastModified,
        id: blob.name,
        key: blob.name,
      });
    }

    return files;
  } catch (error) {
    console.error("Error listing files:", error);
    return { success: false, error: error.message };
  }
};

// Delete file from Azure Blob Storage
const deleteFileFromAzure = async (key) => {
  const blockBlobClient = containerClient.getBlockBlobClient(key);

  try {
    await blockBlobClient.delete();
    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, error: error.message };
  }
};

const getProjectStorage = async (project_id) => {
  const folderPath = Pelta/Projects/${project_id};
  const maxStorage = 2 * 1024 * 1024 * 1024; // 2GB in bytes (2 * 1024MB * 1024KB * 1024B)

  try {
    // Get the list of files in the folder (including nested files)
    const files = await getFilesList(folderPath);

    // Check if the response is successful
    if (!files || files.success === false) {
      throw new Error(files.error || "Failed to fetch files list.");
    }

    // Calculate the total size by summing up the size of each file
    const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
    const percentage = Math.min((totalSize / maxStorage) * 100, 100);

    return {
      totalSize,
      percentage: percentage.toFixed(2), // Percentage used, capped at 100

      readableSize: ${(totalSize / (1024 * 1024)).toFixed(2)} MB, // Convert bytes to MB for readability
    };
  } catch (error) {
    console.error("Error calculating folder storage size:", error);
    return null;
  }
};

module.exports = {
  uploadFile,
  getFile,
  getFilesList,
  deleteFileFromAzure,
  getProjectStorage,
};