import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EvaluationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('oral_evaluations')
export class OralEvaluation {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  performanceId: string;

  @Column()
  subject: string;

  @Column({ nullable: true })
  transcript?: string;

  @Column('simple-json', { nullable: true })
  speechMetrics?: {
    fluency: number;
    pronunciation: number;
    speakingPace: number;
    confidence: number;
    details: {
      totalWords: number;
      fillerWords: number;
      averagePauseDuration: number;
      wordsPerMinute: number;
      totalSpeakingTime: number;
    };
  };

  @Column('simple-json', { nullable: true })
  contentScores?: {
    contentStructure: number;
    coherence: number;
    topicRelevance: number;
    grammar: number;
    vocabulary: number;
  };

  @Column('simple-json', { nullable: true })
  contentAnalysis?: {
    summary: string;
    keyPoints: string[];
    strengths: string[];
    improvements: string[];
    cefrLevel: string;
  };

  @Column('simple-json', { nullable: true })
  detailedContentFeedback?: {
    structure: string;
    contentGaps: string[];
    vocabularySuggestions: string[];
  };

  @Column({ nullable: true })
  calibratedCefr?: string;

  @Column({ nullable: true })
  cefrConfidence?: number;

  @Column({ default: 'cefr-calibration-v1' })
  calibrationVersion?: string;

  @Column('simple-json', { nullable: true })
  assemblyAIRaw?: any;

  @Column('simple-json', { nullable: true })
  geminiRaw?: any;

  @Column({
    type: 'enum',
    enum: EvaluationStatus,
    default: EvaluationStatus.PENDING,
  })
  status: EvaluationStatus;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ default: 'en' })
  language: string;

  @Column({ nullable: true })
  processingTime?: number;

  @Column({ default: false })
  lowConfidenceFlag?: boolean;

  @Column({ nullable: true })
  lowConfidenceReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  evaluatedAt?: Date;
}
