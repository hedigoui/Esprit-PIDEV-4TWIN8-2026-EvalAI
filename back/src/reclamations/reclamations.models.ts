import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

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
  title: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  category?: string;

  @Column()
  status: ReclamationStatus;

  @Column({ nullable: true })
  handledById?: string;

  @Column({ nullable: true })
  responseMessage?: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;
}
