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
import { UserRole, Users } from '../users/users.models';
import { OralPerformance } from '../oral-performance/oral-performance.entity';
import { EmailService } from '../email/email.service';

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
    @InjectRepository(Users)
    private readonly usersRepo: MongoRepository<Users>,
    private readonly emailService: EmailService,
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

    const saved = await this.reclamationsRepo.save(rec);
    this.notifyAdminsNewReclamation(saved).catch((err) =>
      console.error('Background admin reclamation email failed:', err?.message),
    );
    return saved;
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

    const saved = await this.reclamationsRepo.save(rec);

    const shouldEmailReporter =
      !!(params.input.responseMessage && params.input.responseMessage.trim()) ||
      params.input.status === ReclamationStatus.RESOLVED ||
      params.input.status === ReclamationStatus.REJECTED;

    if (shouldEmailReporter) {
      this.notifyReporterOfAdminResponse(saved).catch((err) =>
        console.error(
          'Background reporter reclamation email failed:',
          err?.message,
        ),
      );
    }

    return saved;
  }

  private async getActiveAdminEmails(): Promise<string[]> {
    const users = await this.usersRepo.find();
    return users
      .filter((u) => u.role === UserRole.ADMIN && u.isActive !== false)
      .map((u) => u.email)
      .filter(Boolean);
  }

  private async notifyAdminsNewReclamation(rec: Reclamation): Promise<void> {
    const adminEmails = await this.getActiveAdminEmails();
    if (!adminEmails.length) {
      console.warn(
        'No active admin emails found — skipping new reclamation notifications',
      );
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const adminPanelUrl = `${frontendUrl}/admin/reclamations`;
    const id = rec._id?.toString?.() || '';
    const reporterRoleLabel =
      rec.createdByRole === UserRole.INSTRUCTOR
        ? 'Instructor'
        : rec.createdByRole === UserRole.STUDENT
          ? 'Student'
          : String(rec.createdByRole);

    for (const adminEmail of adminEmails) {
      await this.emailService.sendNewReclamationAlertToAdmin({
        adminEmail,
        reporterName: rec.studentName || 'Unknown',
        reporterRoleLabel,
        title: rec.title,
        description: rec.description,
        submittedAt: rec.createdAt || new Date(),
        reclamationId: id,
        adminPanelUrl,
      });
    }
  }

  private statusLabel(status: ReclamationStatus): string {
    switch (status) {
      case ReclamationStatus.OPEN:
        return 'Open';
      case ReclamationStatus.IN_PROGRESS:
        return 'In progress';
      case ReclamationStatus.RESOLVED:
        return 'Resolved';
      case ReclamationStatus.REJECTED:
        return 'Rejected';
      default:
        return String(status);
    }
  }

  private async notifyReporterOfAdminResponse(rec: Reclamation): Promise<void> {
    const reporterId = rec.studentId;
    if (!reporterId || !ObjectId.isValid(reporterId)) {
      console.warn('Cannot email reporter: invalid studentId on reclamation');
      return;
    }

    const user = await this.usersRepo.findOneBy({
      _id: new ObjectId(reporterId),
    });
    if (!user?.email) {
      console.warn(
        `Cannot email reporter: no user/email for id ${reporterId}`,
      );
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const path =
      user.role === UserRole.INSTRUCTOR
        ? '/teacher/reclamations'
        : '/student/reclamations';
    const reclamationsUrl = `${frontendUrl}${path}`;

    const name =
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    await this.emailService.sendReclamationResponseToReporter({
      reporterEmail: user.email,
      reporterName: name,
      title: rec.title,
      statusLabel: this.statusLabel(rec.status),
      responseMessage: rec.responseMessage,
      reclamationsUrl,
    });
  }
}
