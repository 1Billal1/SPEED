import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { SubmissionsModule } from './submissions/submissions.module';
import { AuthModule } from './auth/auth.module';
import { EvidenceEntriesModule } from './evidence-entries/evidence-entries.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SubmissionsModule,
    AuthModule,
    EvidenceEntriesModule,
    MongooseModule.forRoot(process.env.DB_URI as string),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
