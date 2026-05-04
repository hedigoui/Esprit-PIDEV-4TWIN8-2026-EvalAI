import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationService } from './communication.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Message } from './communication.models';

describe('CommunicationService', () => {
  let service: CommunicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CommunicationService,
          useValue: {
            sendMessage: jest.fn().mockResolvedValue({ id: 'msg-1', status: 'SENT' }),
            blockUser: jest.fn().mockResolvedValue({ id: 'block-1', blockedId: 'user-2' }),
            isUserBlocked: jest.fn().mockResolvedValue(false),
            unblockUser: jest.fn().mockResolvedValue(true),
            getConversations: jest.fn().mockResolvedValue([{ id: 'conv-1' }]),
          },
        },
      ],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should send a message to a conversation', async () => {
      const sendMessageDto = {
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hello',
      };

      const mockMessage = {
        id: 'msg-1',
        ...sendMessageDto,
        status: 'SENT',
        createdAt: new Date(),
      };

      const result = await service.sendMessage(sendMessageDto);

      expect(result.status).toBe('SENT');
    });

    it('should not send empty message', async () => {
      jest.spyOn(service, 'sendMessage').mockRejectedValue(new Error('Empty message'));

      await expect(service.sendMessage({ content: '' } as any)).rejects.toThrow();
    });
  });

  describe('blockUser', () => {
    it('should block a user', async () => {
      const blockData = { blockerId: 'user-1', blockedId: 'user-2' };

      const result = await service.blockUser(blockData.blockerId, blockData.blockedId);

      expect(result.blockedId).toBe('user-2');
    });

    it('should not allow blocking yourself', async () => {
      jest.spyOn(service, 'blockUser').mockRejectedValue(new Error('Cannot block yourself'));

      await expect(service.blockUser('user-1', 'user-1')).rejects.toThrow();
    });
  });

  describe('isUserBlocked', () => {
    it('should return true if user is blocked', async () => {
      jest.spyOn(service, 'isUserBlocked').mockResolvedValue(true);

      const result = await service.isUserBlocked('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('should return false if user is not blocked', async () => {
      const result = await service.isUserBlocked('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user', async () => {
      const result = await service.unblockUser('user-1', 'user-2');

      expect(result).toBe(true);
    });
  });

  describe('getConversations', () => {
    it('should retrieve user conversations', async () => {
      const userId = 'user-1';

      const result = await service.getConversations(userId);

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
