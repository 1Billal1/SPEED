// backend/src/evidence-entries/evidence-entries.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvidenceEntriesController } from './evidence-entries.controller';
import { EvidenceEntriesService } from './evidence-entries.service';
import { EvidenceEntry, EvidenceEntrySchema } from './schemas/evidence-entry.schema';
import { Submission, SubmissionSchema } from '../submissions/schemas/submission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: EvidenceEntry.name, schema: EvidenceEntrySchema }]),
    MongooseModule.forFeature([{ name: Submission.name, schema: SubmissionSchema }]), 
  ],
  controllers: [EvidenceEntriesController],
  providers: [EvidenceEntriesService],
})
export class EvidenceEntriesModule {}