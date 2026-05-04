import { Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';

@Injectable()
export class GridFSService {
  private readonly logger = new Logger(GridFSService.name);
  private fileStorage = new Map<string, Buffer>();

  async storeAudio(
    file: any,
    metadata: { filename: string; mimeType: string },
  ) {
    const fileId = Math.random().toString(36).substring(7);
    const buffer = file.buffer || file;
    this.fileStorage.set(fileId, buffer);

    this.logger.log(`✅ Audio stored with ID: ${fileId}`);

    return {
      fileId,
      filename: metadata.filename,
      size: buffer.length,
      mimeType: metadata.mimeType,
      uploadedAt: new Date(),
    };
  }

  async getFileAsBuffer(fileId: string): Promise<Buffer> {
    const buffer = this.fileStorage.get(fileId);
    if (!buffer) {
      throw new Error(`File not found: ${fileId}`);
    }
    return buffer;
  }

  async getAudioStream(fileId: string): Promise<Readable> {
    const buffer = await this.getFileAsBuffer(fileId);
    return Readable.from(buffer);
  }

  async deleteAudio(fileId: string): Promise<void> {
    this.fileStorage.delete(fileId);
    this.logger.log(`✅ Audio deleted: ${fileId}`);
  }

  async getAudioMetadata(fileId: string) {
    const buffer = this.fileStorage.get(fileId);
    if (!buffer) {
      return null;
    }
    return {
      fileId,
      size: buffer.length,
    };
  }
}
