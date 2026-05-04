import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';
import { UserRole } from '../users/users.models';

export enum ReclamationStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

@Entity()
export class Reclamation {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  studentId: string;

  @Column()
  studentName: string; // Full name or email of the student

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  category?: string;

  @Column()
  status: ReclamationStatus;

  @Column()
  createdByRole: UserRole; // Who created this reclamation (STUDENT or INSTRUCTOR)

  @Column({ nullable: true })
  createdById?: string; // ID of instructor if created by teacher, same as studentId if by student

  @Column({ nullable: true })
  handledById?: string; // Admin/Instructor handling the reclamation

  /** When a student files a reclamation, copy is visible to this instructor (their latest oral-performance instructor). */
  @Column({ nullable: true })
  targetInstructorId?: string;

  @Column({ nullable: true })
  responseMessage?: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;
}
