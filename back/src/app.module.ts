// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GridFSModule } from './gridfs/gridfs.module';
import { OralPerformanceModule } from './oral-performance/oral-performance.module';
import { Users } from './users/users.models';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { OralPerformance } from './oral-performance/oral-performance.entity';
import { EvaluationModule } from './evaluation/evaluation.module';
import { OralEvaluation } from './evaluation/entities/oral-evaluation.entity';
import { UsersModule } from './users/users.module';
import { GeminiModule } from './gemini/gemini.module'; // Add this

@Module({
  imports: [
    // MongooseModule.forRoot('mongodb://localhost:27017/your-database-name'),
    // TypeOrmModule.forRoot({
    //   type: 'mongodb',
    //   host: 'localhost',
    //   port: 27017,
    //   database: 'evalAI',
    //   entities: [Users, OralPerformance, OralEvaluation],
    //   synchronize: true,
    // }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name'),
TypeOrmModule.forRoot({
  type: 'mongodb',
  host: process.env.MONGODB_HOST || 'localhost',
  port: process.env.MONGODB_PORT ? parseInt(process.env.MONGODB_PORT) : 27017,
  database: 'evalAI',
  entities: [Users, OralPerformance, OralEvaluation],
  synchronize: true,
}),
    JwtModule.register({
      secret: 'your-secret-key-change-this-in-production',
      signOptions: { expiresIn: '1d' },
    }),
    GridFSModule,
    OralPerformanceModule,
    EvaluationModule,
    UsersModule,
    GeminiModule, // Add this
  ],
})
export class AppModule {}