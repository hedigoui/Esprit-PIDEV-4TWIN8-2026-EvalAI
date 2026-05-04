import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface InstructorRosterRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  studentId?: string;
  email?: string;
  cefrLevel?: string;
}

@Entity('instructor_rosters')
export class InstructorRoster {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  instructorId: string;

  @Column()
  originalFilename: string;

  @Column()
  rows: InstructorRosterRow[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
