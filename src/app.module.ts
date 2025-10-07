import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FolderModule } from './folder/folder.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [UserModule, PrismaModule, AuthModule, TasksModule, FolderModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
