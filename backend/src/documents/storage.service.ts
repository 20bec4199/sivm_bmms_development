import { Injectable, Logger } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private blobServiceClient: BlobServiceClient;
  private containerName = 'documents';

  constructor() {
    if (this.isProduction) {
      const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
      if (!connStr) {
        this.logger.warn('AZURE_STORAGE_CONNECTION_STRING is not set');
      } else {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
      }
    } else {
      this.ensureUploadDir();
    }
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;

    if (this.isProduction && this.blobServiceClient) {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      await containerClient.createIfNotExists();
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype }
      });
      return blockBlobClient.url;
    } else {
      const filePath = path.join(this.uploadDir, fileName);
      await fs.writeFile(filePath, file.buffer);
      return `/uploads/${fileName}`;
    }
  }

  async getFileStream(fileUrl: string) {
    if (this.isProduction && fileUrl.startsWith('http')) {
      return { url: fileUrl, type: 'azure' };
    } else {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, fileName);
      return { path: filePath, type: 'local' };
    }
  }
}
