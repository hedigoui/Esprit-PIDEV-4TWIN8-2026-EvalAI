// src/oral-performance/oral-performance.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Readable } from 'stream';
import {
  OralPerformance,
  PerformanceStatus,
  ProficiencyLevel,
} from './oral-performance.entity';
import { CreateOralPerformanceDto } from './dto/oral-performance.dto';
import { GridFSService } from '../gridfs/gridfs.service';
import { Express } from 'express';

@Injectable()
export class OralPerformanceService {
  constructor(
    @InjectRepository(OralPerformance)
    private oralPerformanceRepository: MongoRepository<OralPerformance>,
    private gridFSService: GridFSService,
  ) {}

  async create(
    createDto: CreateOralPerformanceDto,
    instructorId: string,
  ): Promise<OralPerformance> {
    const newPerformance = this.oralPerformanceRepository.create({
      ...createDto,
      instructorId,
      status: PerformanceStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.oralPerformanceRepository.save(newPerformance);
  }

  async findAll(): Promise<OralPerformance[]> {
    return await this.oralPerformanceRepository.find({
      order: { createdAt: 'DESC' as const },
    });
  }

  async findByStudent(studentId: string): Promise<OralPerformance[]> {
    return await this.oralPerformanceRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' as const },
    });
  }

  async findByInstructor(instructorId: string): Promise<OralPerformance[]> {
    return await this.oralPerformanceRepository.find({
      where: { instructorId },
      order: { createdAt: 'DESC' as const },
    });
  }

  async findOne(id: string): Promise<OralPerformance> {
    if (!ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid ID format: ${id}`);
    }

    const performance = await this.oralPerformanceRepository.findOne({
      where: { _id: new ObjectId(id) },
    });

    if (!performance) {
      throw new NotFoundException(`Oral performance with ID ${id} not found`);
    }

    return performance;
  }

  async addAudioFile(
    id: string,
    file: Express.Multer.File,
    duration?: number,
  ): Promise<OralPerformance> {
    const performance = await this.findOne(id);

    const audioFile = await this.gridFSService.storeAudio(file, {
      filename: file.originalname,
      mimeType: file.mimetype,
    });

    performance.audioFile = {
      fileId: audioFile.fileId,
      filename: file.originalname,
      size: file.size,
      duration,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
    };

    performance.status = PerformanceStatus.IN_PROGRESS;
    performance.updatedAt = new Date();

    return await this.oralPerformanceRepository.save(performance);
  }

  async updateScores(id: string, scoresDto: any): Promise<OralPerformance> {
    const performance = await this.findOne(id);

    const scores = Object.values(scoresDto).filter(
      (score) => typeof score === 'number',
    );
    const totalScore =
      scores.reduce((a: number, b: number) => a + b, 0) / scores.length;

    let overallProficiency: ProficiencyLevel;
    if (totalScore >= 9) overallProficiency = ProficiencyLevel.PROFICIENT;
    else if (totalScore >= 7) overallProficiency = ProficiencyLevel.ADVANCED;
    else if (totalScore >= 5)
      overallProficiency = ProficiencyLevel.INTERMEDIATE;
    else overallProficiency = ProficiencyLevel.BEGINNER;

    performance.scores = scoresDto;
    performance.totalScore = totalScore;
    performance.overallProficiency = overallProficiency;
    performance.updatedAt = new Date();

    return await this.oralPerformanceRepository.save(performance);
  }

  async updateFeedback(id: string, feedbackDto: any): Promise<OralPerformance> {
    const performance = await this.findOne(id);

    performance.feedback = feedbackDto;
    performance.status = PerformanceStatus.GRADED;
    performance.completedDate = new Date();
    performance.updatedAt = new Date();

    return await this.oralPerformanceRepository.save(performance);
  }

  async updateStatus(
    id: string,
    status: PerformanceStatus,
  ): Promise<OralPerformance> {
    const performance = await this.findOne(id);

    performance.status = status;
    performance.updatedAt = new Date();

    if (status === PerformanceStatus.COMPLETED) {
      performance.completedDate = new Date();
    }

    return await this.oralPerformanceRepository.save(performance);
  }

  async remove(id: string): Promise<void> {
    const performance = await this.findOne(id);

    if (performance.audioFile?.fileId) {
      await this.gridFSService.deleteAudio(performance.audioFile.fileId);
    }

    await this.oralPerformanceRepository.delete(performance._id);
  }

  async getAudioStream(id: string): Promise<Readable> {
    const performance = await this.findOne(id);

    if (!performance.audioFile?.fileId) {
      throw new NotFoundException('No audio file found for this performance');
    }

    return await this.gridFSService.getAudioStream(
      performance.audioFile.fileId,
    );
  }

  async getStatistics(studentId?: string, instructorId?: string) {
    const query: any = {};
    if (studentId) query.studentId = studentId;
    if (instructorId) query.instructorId = instructorId;

    const performances = await this.oralPerformanceRepository.find({
      where: query,
    });

    const completedPerformances = performances.filter(
      (p) => p.status === PerformanceStatus.GRADED,
    );

    const averageScore =
      completedPerformances.length > 0
        ? completedPerformances.reduce(
            (sum, p) => sum + (p.totalScore || 0),
            0,
          ) / completedPerformances.length
        : 0;

    const proficiencyDistribution = {
      [ProficiencyLevel.BEGINNER]: 0,
      [ProficiencyLevel.INTERMEDIATE]: 0,
      [ProficiencyLevel.ADVANCED]: 0,
      [ProficiencyLevel.PROFICIENT]: 0,
    };

    completedPerformances.forEach((p) => {
      if (p.overallProficiency) {
        proficiencyDistribution[p.overallProficiency]++;
      }
    });

    return {
      totalPerformances: performances.length,
      completedPerformances: completedPerformances.length,
      pendingPerformances: performances.filter(
        (p) => p.status === PerformanceStatus.PENDING,
      ).length,
      inProgressPerformances: performances.filter(
        (p) => p.status === PerformanceStatus.IN_PROGRESS,
      ).length,
      averageScore,
      proficiencyDistribution,
    };
  }

  async update(
    id: string,
    updateDto: CreateOralPerformanceDto,
  ): Promise<OralPerformance> {
    const performance = await this.findOne(id);

    Object.assign(performance, {
      ...updateDto,
      updatedAt: new Date(),
    });

    return await this.oralPerformanceRepository.save(performance);
  }
}
