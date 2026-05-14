import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { createServer } from 'node:net';

// Load environment variables immediately
dotenv.config();

console.log('🚀 Starting application...');
console.log('📧 Email Configuration:');
console.log('  - USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
console.log(
  '  - PASSWORD:',
  process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set',
);
console.log(
  '  - JWT_SECRET:',
  process.env.JWT_SECRET ? '✅ Set' : '❌ Not set',
);

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    // Do not force host here; match Nest/Node default binding behavior (:: / any).
    server.listen(port);
  });
}

async function resolveAvailablePort(basePort: number, maxAttempts: number): Promise<number> {
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = basePort + i;
    const free = await isPortFree(candidate);
    if (free) return candidate;
  }
  throw new Error(
    `Unable to start server. No free port found from ${basePort} to ${basePort + maxAttempts - 1}.`,
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    session({
      secret:
        process.env.SESSION_SECRET ||
        process.env.JWT_SECRET ||
        'dev-session-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 15 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
      },
    }),
  );
  app.use(passport.initialize());
  passport.serializeUser((user: any, done) => {
    done(null, {
      email: user?.email,
      firstName: user?.firstName,
      lastName: user?.lastName,
      provider: user?.provider,
    });
  });
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
  app.use(passport.session());

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3001', 'http://localhost:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const basePort = Number(process.env.PORT || 3000);
  const maxAttempts = 15;
  const activePort = await resolveAvailablePort(basePort, maxAttempts);
  if (activePort !== basePort) {
    console.warn(
      `⚠️ Port ${basePort} is in use. Starting on port ${activePort} instead.`,
    );
  }

  await app.listen(activePort);

  console.log(`✅ Application is running on: http://localhost:${activePort}`);
  console.log(`🌐 CORS enabled for: ${frontendUrl}`);
}
void bootstrap();
