import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PrismaService } from "./infra/prisma.service";
import { RoundsModule } from "./rounds/rounds.module";

@Module({
  imports: [AuthModule, RoundsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
