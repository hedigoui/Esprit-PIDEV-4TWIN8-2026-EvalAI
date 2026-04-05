import {
  Column,
  Entity,
  ObjectId,
  ObjectIdColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from '../users/users.models';

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  VOICE_NOTE = 'voice_note',
  FEEDBACK = 'feedback',
  ANNOUNCEMENT = 'announcement',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Entity()
export class Message {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  content: string;

  @Column()
  type: MessageType;

  @Column()
  status: MessageStatus;

  @Column({ nullable: true })
  fileName?: string;

  @Column({ nullable: true })
  fileUrl?: string;

  @Column({ nullable: true })
  fileSize?: number;

  @Column({ nullable: true })
  duration?: number; // For voice notes in seconds

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Users)
  @JoinColumn()
  sender: Users;

  @ManyToOne(() => Users)
  @JoinColumn()
  receiver: Users;

  @Column()
  senderId: string;

  @Column()
  receiverId: string;
}

@Entity()
export class Conversation {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  participantIds: string[]; // Array of user IDs

  @Column({ nullable: true })
  lastMessageId?: string;

  @Column({ nullable: true })
  lastMessageContent?: string;

  @Column({ nullable: true })
  lastMessageTime?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Users)
  @JoinColumn()
  lastMessageSender?: Users;
}

@Entity()
export class Appointment {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'timestamp' })
  scheduledTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ default: 'scheduled' })
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

  @Column({ nullable: true })
  meetingLink?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Users)
  @JoinColumn()
  teacher: Users;

  @ManyToOne(() => Users)
  @JoinColumn()
  student: Users;

  @Column()
  teacherId: string;

  @Column()
  studentId: string;
}

@Entity()
export class Notification {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ default: 'unread' })
  status: 'read' | 'unread';

  @Column({ nullable: true })
  relatedEntityId?: string; // Message ID, Appointment ID, etc.

  @Column({ nullable: true })
  relatedEntityType?: 'message' | 'appointment' | 'feedback' | 'announcement';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Users)
  @JoinColumn()
  user: Users;

  @Column()
  userId: string;
}
