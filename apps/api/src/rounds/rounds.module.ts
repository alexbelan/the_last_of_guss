import { Module } from "@nestjs/common";
import { RoundsController } from "./rounds.controller";
import { RoundsService } from "./rounds.service";
import { PrismaModule } from "../infra/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [RoundsController],
  providers: [RoundsService],
})
export class RoundsModule {}
