import { Controller, Get, Param, Res, Post } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import type { Response } from 'express'; // Use 'import type' for isolatedModules

@Controller('certificates')
export class CertificateController {
	constructor(private certificateService: CertificateService) {}

	@Get(':certificateId')
	async getCertificate(@Param('certificateId') certificateId: string) {
		return this.certificateService.getCertificate(certificateId);
	}

	@Get('evaluation/:evaluationId')
	async getCertificateByEvaluation(@Param('evaluationId') evaluationId: string) {
		return this.certificateService.getCertificateByEvaluation(evaluationId);
	}

	@Get('student/:studentId')
	async getCertificatesForStudent(@Param('studentId') studentId: string) {
		return this.certificateService.getCertificatesForStudent(studentId);
	}

	@Get(':certificateId/download')
	async downloadCertificate(@Param('certificateId') certificateId: string, @Res() res: Response) {
		const cert = await this.certificateService.getCertificate(certificateId);
		if (!cert) {
			return res.status(404).send('Certificate not found');
		}
		const buffer = await this.certificateService.downloadCertificate(certificateId);
		res.set({
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${cert.fileName || 'certificate.pdf'}"`,
		});
		res.send(buffer);
	}

	@Post(':certificateId/generate')
	async regenerateCertificate(@Param('certificateId') certificateId: string) {
		// Optionally implement regeneration logic
		return { message: 'Not implemented' };
	}
}