import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Reclamation, ReclamationStatus } from './reclamations.models';
import { UserRole } from '../users/users.models';
import { OralPerformance } from '../oral-performance/oral-performance.entity';

type CreateReclamationInput = {
  title: string;
  description: string;
  category?: string;
  studentName?: string;
  studentId?: string;
  /** Optional: student’s instructor; otherwise inferred from latest oral performance */
  targetInstructorId?: string;
};

type UpdateReclamationStatusInput = {
  status: ReclamationStatus;
  responseMessage?: string;
};

@Injectable()
export class ReclamationsService {
  constructor(
    @InjectRepository(Reclamation)
    private readonly reclamationsRepo: MongoRepository<Reclamation>,
    @InjectRepository(OralPerformance)
    private readonly performanceRepo: MongoRepository<OralPerformance>,
  ) {}

  async create(
    studentId: string,
    input: CreateReclamationInput,
    createdByRole: UserRole,
    createdById?: string,
  ) {
    const title = (input.title || '').trim();
    const description = (input.description || '').trim();
    const studentName = (input.studentName || '').trim();

    if (!title) throw new BadRequestException('Title is required');
    if (!description) throw new BadRequestException('Description is required');
    if (!studentName) throw new BadRequestException('Student name is required');

    let targetInstructorId: string | undefined;
    if (createdByRole === UserRole.STUDENT) {
      const hint = input.targetInstructorId?.trim();
      targetInstructorId =
        hint ||
        (await this.resolveInstructorIdForStudent(studentId)) ||
        undefined;
    }

    const now = new Date();
    const rec = this.reclamationsRepo.create({
      studentId,
      studentName,
      title,
      description,
      category: input.category?.trim() || undefined,
      status: ReclamationStatus.OPEN,
      createdByRole,
      createdById: createdById || studentId,
      targetInstructorId,
      createdAt: now,
      updatedAt: now,
    });

    return await this.reclamationsRepo.save(rec);
  }

  private async resolveInstructorIdForStudent(
    studentId: string,
  ): Promise<string | undefined> {
    const performances = await this.performanceRepo.find({
      where: { studentId: studentId as any },
    });
    const sorted = performances.sort(
      (a, b) =>
        (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0),
    );
    for (const p of sorted) {
      const id = (p.instructorId || '').trim();
      if (id && id !== 'unknown-instructor') return id;
    }
    return undefined;
  }

  /** Ticket from instructor to platform admins (studentId stores reporter id for uniqueness). */
  async createInstructorToAdmin(
    instructorId: string,
    reporterDisplayName: string,
    input: { title: string; description: string; category?: string },
  ) {
    return this.create(
      instructorId,
      {
        title: input.title,
        description: input.description,
        category: input.category?.trim() || 'instructor_to_admin',
        studentName: reporterDisplayName,
      },
      UserRole.INSTRUCTOR,
      instructorId,
    );
  }

  async findMine(studentId: string) {
    const items = await this.reclamationsRepo.find({
      where: { studentId },
    });
    return items.sort(
      (a, b) =>
        (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0),
    );
  }

  /** Student reclamations routed to this instructor + this instructor’s own tickets to admins. */
  async findInstructorInbox(instructorId: string) {
    const fromStudents = await this.reclamationsRepo.find({
      where: {
        targetInstructorId: instructorId,
        createdByRole: UserRole.STUDENT,
      } as any,
    });
    const ownToAdmin = await this.reclamationsRepo.find({
      where: {
        studentId: instructorId,
        createdByRole: UserRole.INSTRUCTOR,
      } as any,
    });
    const byId = new Map<string, Reclamation>();
    for (const r of [...fromStudents, ...ownToAdmin]) {
      byId.set(r._id.toString(), r);
    }
    return [...byId.values()].sort(
      (a, b) =>
        (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0),
    );
  }

  async findAll(status?: ReclamationStatus) {
    const where = status ? { status } : undefined;
    const items = await this.reclamationsRepo.find(where ? { where } : {});
    // Return with student names for admin/teacher visibility
    return items
      .map((item) => ({
        ...item,
        displayName: item.studentName || 'Unknown Student',
      }))
      .sort(
        (a, b) =>
          (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0),
      );
  }

  async findOneForUser(params: {
    reclamationId: string;
    requesterId: string;
    requesterRole: UserRole;
  }) {
    if (!ObjectId.isValid(params.reclamationId)) {
      throw new BadRequestException('Invalid reclamation ID format');
    }

    const rec = await this.reclamationsRepo.findOneBy({
      _id: new ObjectId(params.reclamationId),
    });

    if (!rec) throw new NotFoundException('Reclamation not found');

    const isAdmin = params.requesterRole === UserRole.ADMIN;
    const isOwner = rec.studentId === params.requesterId;
    const isAssignedInstructor =
      params.requesterRole === UserRole.INSTRUCTOR &&
      rec.targetInstructorId === params.requesterId &&
      rec.createdByRole === UserRole.STUDENT;

    if (!isAdmin && !isOwner && !isAssignedInstructor) {
      throw new ForbiddenException('Access denied');
    }

    return rec;
  }

  async updateStatus(params: {
    reclamationId: string;
    handlerId: string;
    input: UpdateReclamationStatusInput;
  }) {
    if (!ObjectId.isValid(params.reclamationId)) {
      throw new BadRequestException('Invalid reclamation ID format');
    }

    const rec = await this.reclamationsRepo.findOneBy({
      _id: new ObjectId(params.reclamationId),
    });

    if (!rec) throw new NotFoundException('Reclamation not found');

    rec.status = params.input.status;
    rec.responseMessage = params.input.responseMessage?.trim() || undefined;
    rec.handledById = params.handlerId;
    rec.updatedAt = new Date();

    return await this.reclamationsRepo.save(rec);
  }
}
