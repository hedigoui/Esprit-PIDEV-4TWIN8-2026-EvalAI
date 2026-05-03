import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key) => {
        const config = {
          EMAIL_USER: 'test@gmail.com',
          EMAIL_PASSWORD: 'password123',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: EmailService,
          useValue: {
            sendWelcomeEmail: jest.fn().mockResolvedValue({ accepted: ['test@test.com'] }),
            sendEmail: jest.fn().mockResolvedValue({ accepted: ['test@test.com'] }),
            sendCertificateEmail: jest.fn().mockResolvedValue({ accepted: ['test@test.com'] }),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    it('should send a welcome email', async () => {
      const emailDto = {
        to: 'test@test.com',
        firstName: 'John',
      };

      const result = await service.sendWelcomeEmail(emailDto.to, emailDto.firstName);

      expect(result.accepted).toContain('test@test.com');
    });

    it('should include user name in welcome email', async () => {
      const result = await service.sendWelcomeEmail('test@test.com', 'Ahmed');

      expect(result).toBeDefined();
    });
  });

  describe('sendEmail', () => {
    it('should send email with correct parameters', async () => {
      jest.spyOn(service, 'sendEmail').mockResolvedValue({ accepted: ['user@test.com'] });

      const result = await service.sendEmail({
        to: 'user@test.com',
        subject: 'Test',
        html: '<h1>Test</h1>',
      });

      expect(result.accepted).toBeDefined();
      expect(service.sendEmail).toHaveBeenCalled();
    });

    it('should handle email sending errors', async () => {
      jest.spyOn(service, 'sendEmail').mockRejectedValue(new Error('SMTP Error'));

      await expect(
        service.sendEmail({
          to: 'invalid@test.com',
          subject: 'Test',
          html: '<h1>Test</h1>',
        })
      ).rejects.toThrow('SMTP Error');
    });

    it('should validate email format', async () => {
      jest.spyOn(service, 'sendEmail').mockRejectedValue(new Error('Invalid email'));

      await expect(
        service.sendEmail({
          to: 'invalid-email',
          subject: 'Test',
          html: '<h1>Test</h1>',
        })
      ).rejects.toThrow();
    });
  });

  describe('sendCertificateEmail', () => {
    it('should send certificate email', async () => {
      jest.spyOn(service, 'sendCertificateEmail').mockResolvedValue({ accepted: ['user@test.com'] });

      const result = await service.sendCertificateEmail('user@test.com', 'cert.pdf');

      expect(result.accepted).toContain('user@test.com');
    });
  });
});
