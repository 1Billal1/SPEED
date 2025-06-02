import { Module } from '@nestjs/common'; 
import { AppController } from './app.controller'; 
import { AppService } from './app.service'; 
import { MongooseModule } from '@nestjs/mongoose'; 
import { ConfigModule } from '@nestjs/config';
<<<<<<< Updated upstream
=======
import { SubmissionsModule } from './submissions/submissions.module';
import { AuthModule } from './auth/auth.module'; 
>>>>>>> Stashed changes

@Module({
  imports: [
    ConfigModule.forRoot(),
<<<<<<< Updated upstream
=======
    SubmissionsModule,
    AuthModule,
>>>>>>> Stashed changes
    MongooseModule.forRoot(process.env.DB_URI as string),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}