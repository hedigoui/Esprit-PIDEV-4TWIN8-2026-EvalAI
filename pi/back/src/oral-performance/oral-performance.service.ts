// src/oral-performance/oral-performance.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Readable } from 'stream';
import { promises as fs } from 'fs';
import { join } from 'path';
import {
  OralPerformance,
  PerformanceStatus,
  ProficiencyLevel,
} from './oral-performance.entity';
import { InstructorRoster } from './instructor-roster.entity';
import type { InstructorRosterRow } from './instructor-roster.entity';
import { CreateOralPerformanceDto } from './dto/oral-performance.dto';
import { GridFSService } from '../gridfs/gridfs.service';
import { Express } from 'express';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import * as XLSX from 'xlsx';

@Injectable()
export class OralPerformanceService {
  constructor(
    @InjectRepository(OralPerformance)
    private oralPerformanceRepository: MongoRepository<OralPerformance>,
    @InjectRepository(InstructorRoster)
    private instructorRosterRepository: MongoRepository<InstructorRoster>,
    private gridFSService: GridFSService,
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  private normalize(value?: string): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  private getRosterStorageDir(): string {
    return join(process.cwd(), 'storage', 'rosters');
  }

  private getRosterStoragePath(instructorId: string): string {
    return join(this.getRosterStorageDir(), `${instructorId}.json`);
  }

  private async readStoredRoster(
    instructorId: string,
  ): Promise<InstructorRoster | null> {
    const filePath = this.getRosterStoragePath(instructorId);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw) as InstructorRoster;
      return parsed;
    } catch {
      return null;
    }
  }

  private async writeStoredRoster(roster: InstructorRoster): Promise<void> {
    const dir = this.getRosterStorageDir();
    await fs.mkdir(dir, { recursive: true });
    const filePath = this.getRosterStoragePath(roster.instructorId);
    await fs.writeFile(filePath, JSON.stringify(roster, null, 2), 'utf8');
  }

  private parseRosterRows(file: Express.Multer.File): InstructorRosterRow[] {
    if (!file?.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Roster file is empty');
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException(
        'Invalid Excel file. Please upload a valid .xlsx or .xls file.',
      );
    }
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new BadRequestException('No worksheet found in uploaded file');
    }

    const sheet = workbook.Sheets[firstSheetName];
    const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      defval: '',
    });

    const norm = (v: unknown) =>
      String(v ?? '')
        .trim()
        .toLowerCase()
        .replace(/[_\-\s]/g, '');

    const firstRow = matrix[0] || [];
    const headerNorm = firstRow.map((cell) => norm(cell));
    const hasHeader = headerNorm.some((h) =>
      ['firstname', 'lastname', 'studentid', 'email', 'cefr', 'cefrlevel'].includes(h),
    );

    const indexOfHeader = (aliases: string[]) => {
      const idx = headerNorm.findIndex((h) => aliases.includes(h));
      return idx >= 0 ? idx : -1;
    };

    const firstNameIndex = hasHeader
      ? indexOfHeader(['firstname', 'prenom', 'givenname'])
      : 0;
    const lastNameIndex = hasHeader
      ? indexOfHeader(['lastname', 'nom', 'familyname'])
      : 1;
    const studentIdIndex = hasHeader
      ? indexOfHeader(['studentid', 'id', 'userid'])
      : 2;
    const emailIndex = hasHeader ? indexOfHeader(['email']) : 3;
    const cefrIndex = hasHeader ? indexOfHeader(['cefr', 'cefrlevel']) : 4;

    const dataRows = hasHeader ? matrix.slice(1) : matrix;

    const getCell = (row: (string | number)[], idx: number) =>
      idx >= 0 ? String(row[idx] ?? '').trim() : '';

    const mapped = dataRows
      .map((row, index) => {
        const firstName = getCell(row, firstNameIndex);
        const lastName = getCell(row, lastNameIndex);
        const studentId = getCell(row, studentIdIndex);
        const email = getCell(row, emailIndex);
        const cefrLevel = getCell(row, cefrIndex);

        return {
          rowNumber: hasHeader ? index + 2 : index + 1,
          firstName,
          lastName,
          studentId,
          email,
          cefrLevel,
        } as InstructorRosterRow;
      })
      .filter((r) => r.firstName || r.lastName || r.studentId || r.email);

    if (mapped.length === 0) {
      throw new BadRequestException(
        'No valid student rows found. Use either headers (firstName,lastName,studentId,email) or a simple 2-column sheet (first name in A, last name in B).',
      );
    }

    return mapped;
  }

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

  async findAllPaginated(page: number, limit: number) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;
    const [data, total] = await Promise.all([
      this.oralPerformanceRepository.find({
        order: { createdAt: 'DESC' as const },
        skip,
        take: safeLimit,
      }),
      this.oralPerformanceRepository.count(),
    ]);
    return { data, total, page: safePage, limit: safeLimit };
  }

  async findByStudent(studentId: string): Promise<OralPerformance[]> {
    return await this.oralPerformanceRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' as const },
    });
  }

  async findByStudentPaginated(studentId: string, page: number, limit: number) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;
    const [data, total] = await Promise.all([
      this.oralPerformanceRepository.find({
        where: { studentId },
        order: { createdAt: 'DESC' as const },
        skip,
        take: safeLimit,
      }),
      this.oralPerformanceRepository.count({ where: { studentId } }),
    ]);
    return { data, total, page: safePage, limit: safeLimit };
  }

  async findByInstructor(instructorId: string): Promise<OralPerformance[]> {
    return await this.oralPerformanceRepository.find({
      where: { instructorId },
      order: { createdAt: 'DESC' as const },
    });
  }

  async findByInstructorPaginated(
    instructorId: string,
    page: number,
    limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;
    const [data, total] = await Promise.all([
      this.oralPerformanceRepository.find({
        where: { instructorId },
        order: { createdAt: 'DESC' as const },
        skip,
        take: safeLimit,
      }),
      this.oralPerformanceRepository.count({ where: { instructorId } }),
    ]);
    return { data, total, page: safePage, limit: safeLimit };
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
      typeof scoresDto.overallScore === 'number'
        ? scoresDto.overallScore
        : scores.reduce((a: number, b: number) => a + b, 0) / scores.length;

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

    if (performance.status === PerformanceStatus.GRADED) {
      throw new ConflictException(
        'This evaluation is already submitted and cannot be submitted again.',
      );
    }
    if (performance.resultEmailSentAt) {
      throw new ConflictException(
        'Result email was already sent for this evaluation.',
      );
    }

    performance.feedback = feedbackDto;
    performance.status = PerformanceStatus.GRADED;
    performance.completedDate = new Date();
    performance.updatedAt = new Date();

    const messageId = await this.sendEvaluationResultEmail(performance);
    performance.resultEmailSentAt = new Date();
    performance.resultEmailMessageId = messageId;

    await this.updateRosterCefrForPerformance(performance, feedbackDto?.cefrLevel);

    return await this.oralPerformanceRepository.save(performance);
  }

  async uploadInstructorRoster(
    instructorId: string,
    file: Express.Multer.File,
  ): Promise<InstructorRoster> {
    const rows = this.parseRosterRows(file);
    const now = new Date();
    const existing = await this.readStoredRoster(instructorId);
    const roster: InstructorRoster = existing || ({
      instructorId,
      _id: undefined as any,
      createdAt: now,
      updatedAt: now,
      originalFilename: '',
      rows: [],
    } as InstructorRoster);

    roster.originalFilename = file.originalname || 'instructor-roster.xlsx';
    roster.rows = rows;
    roster.updatedAt = now;
    if (!roster.createdAt) {
      roster.createdAt = now;
    }

    await this.writeStoredRoster(roster);
    return roster;
  }

  async getInstructorRoster(instructorId: string): Promise<InstructorRoster | null> {
    return this.readStoredRoster(instructorId);
  }

  async exportInstructorRoster(instructorId: string): Promise<{ buffer: Buffer; filename: string }> {
    const roster = await this.getInstructorRoster(instructorId);
    if (!roster) {
      throw new NotFoundException('No roster found for this instructor');
    }

    const rows = (roster.rows || []).map((row) => ({
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      studentId: row.studentId || '',
      email: row.email || '',
      CEFR: row.cefrLevel || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const filename = (roster.originalFilename || 'instructor-roster.xlsx').replace(/\.(xls|xlsx)$/i, '') + '-updated.xlsx';
    return { buffer, filename };
  }

  private async updateRosterCefrForPerformance(
    performance: OralPerformance,
    cefrLevel?: string,
  ): Promise<void> {
    const instructorId = performance.instructorId;
    const level = String(cefrLevel || '').trim();
    if (!instructorId || !level) return;

    const roster = await this.getInstructorRoster(instructorId);
    if (!roster || !Array.isArray(roster.rows) || roster.rows.length === 0) return;

    let matchedIndex = roster.rows.findIndex(
      (row) =>
        row.studentId &&
        performance.studentId &&
        this.normalize(row.studentId) === this.normalize(performance.studentId),
    );

    if (matchedIndex < 0) {
      const normalizedPerformanceStudent = this.normalize(performance.studentId);
      matchedIndex = roster.rows.findIndex((row) => {
        const rowFullName = this.normalize(
          `${row.firstName || ''} ${row.lastName || ''}`,
        );
        return rowFullName && rowFullName === normalizedPerformanceStudent;
      });
    }

    if (matchedIndex < 0) {
      const student = await this.resolveStudentForEmail(performance.studentId).catch(
        () => null,
      );
      const studentFirst = this.normalize(student?.firstName || '');
      const studentLast = this.normalize(student?.lastName || '');
      if (studentFirst || studentLast) {
        matchedIndex = roster.rows.findIndex(
          (row) =>
            this.normalize(row.firstName) === studentFirst &&
            this.normalize(row.lastName) === studentLast,
        );
      }
    }

    if (matchedIndex < 0) return;

    roster.rows[matchedIndex].cefrLevel = level;
    roster.updatedAt = new Date();
    await this.writeStoredRoster(roster);
  }

  private async sendEvaluationResultEmail(
    performance: OralPerformance,
  ): Promise<string> {
    const studentId = performance.studentId;
    if (!studentId) return '';

    try {
      const student = await this.resolveStudentForEmail(studentId);
      if (!student?.email) {
        return '';
      }

      const fullName =
        `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
        student.email;
      return await this.emailService.sendEvaluationResultEmail(
        student.email,
        fullName,
        {
          title: performance.title,
          cefrLevel: performance.feedback?.cefrLevel,
          score: performance.totalScore,
          scoreMax: 100,
          comments: performance.feedback?.generalComments,
        },
      );
    } catch {
      return '';
    }
  }

  private async resolveStudentForEmail(studentIdentifier: string) {
    // Some records may store either Mongo user id or email in studentId.
    if (studentIdentifier.includes('@')) {
      return this.usersService.findByEmail(studentIdentifier);
    }

    try {
      return await this.usersService.findOne(studentIdentifier);
    } catch {
      return this.usersService.findByEmail(studentIdentifier);
    }
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
