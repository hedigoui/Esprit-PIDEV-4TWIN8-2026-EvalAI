import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import PDFDocument from 'pdfkit';
import { Repository } from 'typeorm';
import { GridFSService } from '../gridfs/gridfs.service';
import { Users } from '../users/users.models';
import { OralPerformance } from '../oral-performance/oral-performance.entity';
import { OralEvaluation } from './entities/oral-evaluation.entity';
import { Certificate, CertificateStatus } from './entities/certificate.entity';

@Injectable()
export class CertificateService {
	private readonly logger = new Logger(CertificateService.name);

	constructor(
		@InjectRepository(Certificate)
		public readonly certificateRepo: Repository<Certificate>,
		@InjectRepository(OralEvaluation)
		private readonly evaluationRepo: Repository<OralEvaluation>,
		@InjectRepository(OralPerformance)
		private readonly performanceRepo: Repository<OralPerformance>,
		@InjectRepository(Users)
		private readonly usersRepo: Repository<Users>,
		private readonly gridFSService: GridFSService,
	) {}

	async generateCertificate(evaluationId: string): Promise<Certificate> {
		const evaluation = await this.evaluationRepo.findOne({
			where: { _id: new ObjectId(evaluationId) },
		});

		if (!evaluation) {
			throw new Error('Evaluation not found');
		}

		const performance = await this.performanceRepo.findOne({
			where: { _id: new ObjectId(evaluation.performanceId) },
		});

		if (!performance) {
			throw new Error('Performance not found');
		}

		const user = await this.usersRepo.findOne({
			where: { _id: new ObjectId(performance.studentId) },
		});

		if (!user) {
			throw new Error('Student not found');
		}

		const certificateNumber = this.generateCertificateNumber();
		const studentName = `${user.firstName} ${user.lastName}`.trim();
		const cefrLevel = evaluation.calibratedCefr || evaluation.contentAnalysis?.cefrLevel || performance.overallProficiency || 'N/A';
		const issuedDate = new Date();
		const pdfBuffer = await this.generatePDF(
			studentName,
			cefrLevel,
			certificateNumber,
			issuedDate,
		);
		const fileName = `certificate-${studentName.replace(/\s+/g, '_')}-${certificateNumber}.pdf`;
		const storedFile = await this.gridFSService.storeAudio(pdfBuffer, {
			filename: fileName,
			mimeType: 'application/pdf',
		});

		const certificate = this.certificateRepo.create({
			evaluationId,
			performanceId: performance._id.toString(),
			studentId: user._id.toString(),
			studentName,
			studentEmail: user.email,
			cefrLevel,
			certificateNumber,
			fileId: storedFile.fileId,
			fileName,
			status: CertificateStatus.GENERATED,
			issuedDate,
		});

		return this.certificateRepo.save(certificate);
	}

	async generatePDF(
		studentName: string,
		cefrLevel: string,
		certificateNumber: string,
		issuedDate: Date,
	): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const doc = new PDFDocument({ size: 'A4', margin: 50 });
			const buffers: Buffer[] = [];

			doc.on('data', (chunk: Buffer) => buffers.push(chunk));
			doc.on('end', () => resolve(Buffer.concat(buffers)));
			doc.on('error', reject);

			doc.rect(0, 0, doc.page.width, doc.page.height).lineWidth(8).stroke('#E31837');
			doc.fontSize(28).fillColor('#E31837').text('Certificate of Achievement', { align: 'center', underline: true });
			doc.moveDown(2);
			doc.font('Helvetica-Bold').fontSize(20).fillColor('#222').text(studentName, { align: 'center' });
			doc.font('Helvetica');
			doc.moveDown(1);
			doc.fontSize(16).fillColor('#444').text(`has achieved CEFR Level: ${cefrLevel}`, { align: 'center' });
			doc.moveDown(2);
			doc.fontSize(12).fillColor('#888').text(`Certificate Number: ${certificateNumber}`, { align: 'center' });
			doc.text(`Issued: ${issuedDate.toLocaleDateString()}`, { align: 'center' });
			doc.moveDown(4);
			doc.fontSize(10).fillColor('#E31837').text('EvalAI - AI-Powered Oral Performance Assessment Platform', { align: 'center' });
			doc.end();
		});
	}

	async getCertificate(certificateId: string): Promise<Certificate | null> {
		return this.certificateRepo.findOne({
			where: { _id: new ObjectId(certificateId) },
		});
	}

	async getCertificateByEvaluation(evaluationId: string): Promise<Certificate | null> {
		return this.certificateRepo.findOne({ where: { evaluationId } });
	}

	async getCertificatesForStudent(studentId: string): Promise<Certificate[]> {
		return this.certificateRepo.find({ where: { studentId } });
	}

	async downloadCertificate(certificateId: string): Promise<Buffer> {
		const cert = await this.getCertificate(certificateId);
		if (!cert || !cert.fileId) {
			throw new Error('Certificate or file not found');
		}

		return this.gridFSService.getFileAsBuffer(cert.fileId);
	}

	async markCertificateAsSent(certificateId: string): Promise<void> {
		await this.certificateRepo.update(
			{ _id: new ObjectId(certificateId) },
			{ status: CertificateStatus.SENT, sentDate: new Date() },
		);
	}

	generateCertificateNumber(): string {
		return `CERT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
	}
}