// ----------------------------------for azure-----------------------------------------
// require("dotenv").config();
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const mime = require('mime-types');
const config = require('../config/config');

const accountName = config.azure_storage_account_name;
const accountKey = config.azure_storage_account_key;
const containerName = 'hwrfprodstorage'; // The container name in Azure Blob Storage

// Create a BlobServiceClient using Azure account name and account key
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);

const containerClient = blobServiceClient.getContainerClient(containerName);

// Upload file to Azure Blob Storage
// const uploadFile = async (file, key) => {
//   try {
//     // Determine the Content-Type based on the file's extension
//     const ContentType =
//       mime.lookup(file.originalname) || "application/octet-stream";

//     // Generate the SAS token for the blob
//     const expiryTime = new Date();
//     expiryTime.setMinutes(expiryTime.getMinutes() + 10); // SAS token expiry in 10 minutes

//     const sharedKeyCredential = new StorageSharedKeyCredential(
//       accountName,
//       accountKey
//     );
//     const blobServiceClient = new BlobServiceClient(
//       `https://${accountName}.blob.core.windows.net`,
//       sharedKeyCredential
//     );

//     // Get the BlockBlobClient for the blob
//     const blockBlobClient = containerClient.getBlockBlobClient(key);

//     // Generate the SAS URL for the blob (with write permissions)
//     const sasToken = await blockBlobClient.generateSasUrl({
//       expiresOn: expiryTime,
//       permissions: "w", // Write permission
//     });

//     // Construct the upload URL by combining the SAS token
//     const uploadUrl = ${sasToken};
//     console.log("uploadUrl in function: ", uploadUrl);

//     // Return the SAS URL (with the SAS token)
//     return uploadUrl;
//   } catch (error) {
//     console.error("Error generating SAS URL:", error);
//     return { success: false, error: error.message };
//   }
// };

const uploadFile = async (file, key) => {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    // Determine the Content-Type based on the file's extension
    const ContentType = mime.lookup(file.originalname) || 'application/octet-stream';

    // Upload file directly to Azure Blob Storage
    const uploadResponse = await blockBlobClient.uploadFile(file.path, {
      blobHTTPHeaders: { blobContentType: ContentType },
    });

    console.log(`Uploaded file to Azure: ${key}`);

    return { success: true, key }; // Return only the key (path) to store in DB
  } catch (error) {
    console.error('Error uploading file to Azure:', error);
    return { success: false, error: error.message };
  }
};

// Get file from Azure Blob Storage
// Get file from Azure Blob Storage (private container)
// const getFile = async (key) => {
//   try {
//     // Get the BlockBlobClient for the blob
//     const blockBlobClient = containerClient.getBlockBlobClient(key);

//     // Set the expiration time for the SAS token
//     const expiryTime = new Date();
//     expiryTime.setMinutes(expiryTime.getMinutes() + 5); // SAS token expiry in 30 minutes

//     // Generate the SAS URL for the blob (with read permission)
//     const sasToken = await blockBlobClient.generateSasUrl({
//       expiresOn: expiryTime,
//       permissions: "r", // Read permission
//     });

//     // Construct the complete URL by combining the SAS token
//     const fileUrl = `${sasToken}`;

//     return fileUrl; // Return the SAS URL for accessing the file
//   } catch (error) {
//     console.error("Error getting file:", error);
//     return { success: false, error: error.message };
//   }
// };
const getFile = async (key, res) => {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    const downloadResponse = await blockBlobClient.download();

    if (!downloadResponse.readableStreamBody) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Set headers to properly stream the file
    res.setHeader('Content-Type', downloadResponse.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${key.split('/').pop()}"`);

    // Pipe the stream from Azure Blob Storage directly to response
    const readableStream = downloadResponse.readableStreamBody;

    readableStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error streaming file' });
      }
      res.end();
    });

    readableStream.pipe(res).on('finish', () => {
      console.log('File streaming completed successfully');
    });

  } catch (error) {
    console.error('Error fetching file:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
    res.end();
  }
};


// Get a list of files from Azure Blob Storage (list blobs in a container or folder)
const getFilesList = async (keyPath) => {
  const files = [];

  try {
    // List blobs (non-hierarchical, flat listing)
    const blobsIterator = containerClient.listBlobsFlat({ prefix: keyPath });

    for await (const blob of blobsIterator) {
      const name = blob.name.split('/').pop(); // Get the file name
      const type = name.split('.').pop(); // Get the file extension (type)

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
    console.error('Error listing files:', error);
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
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  uploadFile,
  getFile,
  getFilesList,
  deleteFileFromAzure,
};
