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

type CreateReclamationInput = {
  title: string;
  description: string;
  category?: string;
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
  ) {}

  async create(studentId: string, input: CreateReclamationInput) {
    const title = (input.title || '').trim();
    const description = (input.description || '').trim();

    if (!title) throw new BadRequestException('Title is required');
    if (!description) throw new BadRequestException('Description is required');

    const now = new Date();
    const rec = this.reclamationsRepo.create({
      studentId,
      title,
      description,
      category: input.category?.trim() || undefined,
      status: ReclamationStatus.OPEN,
      createdAt: now,
      updatedAt: now,
    });

    return await this.reclamationsRepo.save(rec);
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

  async findAll(status?: ReclamationStatus) {
    const where = status ? { status } : undefined;
    const items = await this.reclamationsRepo.find(where ? { where } : {});
    return items.sort(
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

    const privileged =
      params.requesterRole === UserRole.ADMIN ||
      params.requesterRole === UserRole.INSTRUCTOR;

    if (!privileged && rec.studentId !== params.requesterId) {
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
