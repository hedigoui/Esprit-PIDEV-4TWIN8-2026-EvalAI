import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PerformanceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  GRADED = 'graded',
}

export enum ProficiencyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  PROFICIENT = 'proficient',
}

/* Embedded Classes */

class AudioFile {
  @Column()
  fileId: string;

  @Column()
  filename: string;

  @Column()
  size: number;

  @Column()
  mimeType: string;

  @Column()
  uploadedAt: Date;

  @Column()
  duration?: number;
}

class Scores {
  @Column()
  pronunciation?: number;

  @Column()
  fluency?: number;

  @Column()
  vocabulary?: number;

  @Column()
  grammar?: number;

  @Column()
  comprehension?: number;

  @Column()
  contentOrganization?: number;
}

class Feedback {
  @Column()
  strengths?: string[];

  @Column()
  weaknesses?: string[];

  @Column()
  generalComments?: string;

  @Column()
  recommendations?: string[];
}

class Metadata {
  @Column()
  sessionDuration?: number;

  @Column()
  recordingQuality?: string;

  @Column()
  deviceInfo?: string;

  @Column()
  location?: string;

  @Column()
  tags?: string[];
}

/* Main Entity */

@Entity('oral_performances')
export class OralPerformance {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  studentId: string;

  @Column()
  instructorId: string;

  @Column()
  title: string;

  @Column()
  description?: string;

  @Column(() => AudioFile)
  audioFile?: AudioFile;

  @Column(() => Scores)
  scores?: Scores;

  @Column(() => Feedback)
  feedback?: Feedback;

  @Column({
    type: 'enum',
    enum: ProficiencyLevel,
  })
  overallProficiency?: ProficiencyLevel;

  @Column()
  totalScore?: number;

  @Column({
    type: 'enum',
    enum: PerformanceStatus,
    default: PerformanceStatus.PENDING,
  })
  status: PerformanceStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  scheduledDate?: Date;

  @Column()
  completedDate?: Date;

  @Column(() => Metadata)
  metadata?: Metadata;
}
