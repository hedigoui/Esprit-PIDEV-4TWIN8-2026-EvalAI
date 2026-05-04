import { Module } from '@nestjs/common';
import { GridFSService } from './gridfs.service';

@Module({
  providers: [GridFSService],
  exports: [GridFSService],
})
export class GridFSModule {}
