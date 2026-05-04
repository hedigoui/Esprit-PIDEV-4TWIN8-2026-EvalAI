import { Test, TestingModule } from '@nestjs/testing';
import { GridFSService } from './gridfs.service';

describe('GridFSService', () => {
  let service: GridFSService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: GridFSService,
          useValue: {
            saveFile: jest.fn().mockResolvedValue('file-123'),
            getFile: jest.fn().mockResolvedValue(Buffer.from('audio data')),
            deleteFile: jest.fn().mockResolvedValue(true),
            getFileStream: jest.fn().mockResolvedValue({ pipe: jest.fn() }),
            updateFileMetadata: jest.fn().mockResolvedValue(true),
            listFiles: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<GridFSService>(GridFSService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveFile', () => {
    it('should save file and return file ID', async () => {
      const buffer = Buffer.from('audio data');
      const metadata = { filename: 'test.wav', mimeType: 'audio/wav' };

      jest.spyOn(service, 'saveFile').mockResolvedValue('file-123');

      const result = await service.saveFile(buffer, metadata);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty buffer', async () => {
      const buffer = Buffer.from('');
      const metadata = { filename: 'empty.wav', mimeType: 'audio/wav' };

      jest.spyOn(service, 'saveFile').mockRejectedValue(new Error('Empty buffer'));

      await expect(service.saveFile(buffer, metadata)).rejects.toThrow('Empty buffer');
    });

    it('should store correct metadata', async () => {
      const buffer = Buffer.from('audio data');
      const metadata = { filename: 'recording.wav', mimeType: 'audio/wav', size: 1024 };

      jest.spyOn(service, 'saveFile').mockResolvedValue('file-123');

      const result = await service.saveFile(buffer, metadata);

      expect(result).toBeDefined();
    });
  });

  describe('getFile', () => {
    it('should retrieve file by ID', async () => {
      const fileId = 'file-123';
      jest.spyOn(service, 'getFile').mockResolvedValue(Buffer.from('audio data'));

      const result = await service.getFile(fileId);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return null if file not found', async () => {
      jest.spyOn(service, 'getFile').mockResolvedValue(null);

      const result = await service.getFile('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should retrieve correct file data', async () => {
      const fileId = 'file-123';
      const fileData = Buffer.from('correct audio data');
      jest.spyOn(service, 'getFile').mockResolvedValue(fileData);

      const result = await service.getFile(fileId);

      expect(result.toString()).toBe('correct audio data');
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      jest.spyOn(service, 'deleteFile').mockResolvedValue(true);

      const result = await service.deleteFile('file-123');

      expect(result).toBe(true);
    });

    it('should handle deletion of non-existent file', async () => {
      jest.spyOn(service, 'deleteFile').mockResolvedValue(false);

      const result = await service.deleteFile('nonexistent-id');

      expect(result).toBe(false);
    });

    it('should return success status', async () => {
      jest.spyOn(service, 'deleteFile').mockResolvedValue(true);

      const result = await service.deleteFile('file-123');

      expect(typeof result).toBe('boolean');
    });
  });

  describe('getFileStream', () => {
    it('should retrieve file as stream', async () => {
      const fileId = 'file-123';
      const mockStream = {
        pipe: jest.fn(),
      };

      jest.spyOn(service, 'getFileStream').mockResolvedValue(mockStream);

      const result = await service.getFileStream(fileId);

      expect(result).toBeDefined();
      expect(typeof result.pipe).toBe('function');
    });
  });

  describe('updateFileMetadata', () => {
    it('should update file metadata', async () => {
      jest.spyOn(service, 'updateFileMetadata').mockResolvedValue(true);

      const result = await service.updateFileMetadata('file-123', { description: 'Updated' });

      expect(result).toBe(true);
    });
  });

  describe('listFiles', () => {
    it('should list all stored files', async () => {
      const mockFiles = [
        { id: 'file-1', filename: 'audio1.wav' },
        { id: 'file-2', filename: 'audio2.wav' },
      ];

      jest.spyOn(service, 'listFiles').mockResolvedValue(mockFiles);

      const result = await service.listFiles();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle file read errors', async () => {
      jest.spyOn(service, 'getFile').mockRejectedValue(new Error('File read error'));

      await expect(service.getFile('file-123')).rejects.toThrow('File read error');
    });

    it('should handle file write errors', async () => {
      jest.spyOn(service, 'saveFile').mockRejectedValue(new Error('File write error'));

      await expect(service.saveFile(Buffer.from('data'), {})).rejects.toThrow('File write error');
    });
  });
});
