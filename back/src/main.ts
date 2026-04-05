import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';

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
    done(null, user);
  });
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
  app.use(passport.session());

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3000);
  console.log(`✅ Application is running on: http://localhost:3000`);
  console.log(`🌐 CORS enabled for: ${frontendUrl}`);
}
void bootstrap();
