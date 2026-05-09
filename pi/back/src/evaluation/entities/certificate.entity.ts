import { Entity, ObjectIdColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

export enum CertificateStatus {
	PENDING = 'PENDING',
	GENERATED = 'GENERATED',
	SENT = 'SENT',
	FAILED = 'FAILED',
}

@Entity('certificates')
export class Certificate {
	@ObjectIdColumn()
	_id: ObjectId;

	@Column()
	evaluationId: string;

	@Column()
	performanceId: string;

	@Column()
	studentId: string;

	@Column()
	studentName: string;

	@Column()
	studentEmail: string;

	@Column()
	cefrLevel: string;

	@Column()
	certificateNumber: string;

	@Column({ nullable: true })
	fileId?: string;

	@Column({ nullable: true })
	fileName?: string;

	@Column({ default: CertificateStatus.PENDING })
	status: CertificateStatus;

	@Column({ nullable: true })
	issuedDate?: Date;

	@Column({ nullable: true })
	sentDate?: Date;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@Column({ nullable: true })
	errorMessage?: string;
}
