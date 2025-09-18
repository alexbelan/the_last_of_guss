import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { RoundsService } from "./rounds.service";
import { JwtAuthGuard, OptionalJwtAuthGuard } from "../auth/jwt.guard";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";

@Controller("rounds")
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post()
  create() {
    const cooldownSec = Number(
      process.env.COOLDOWN_DURATION ?? process.env.COOLDOWN_DURATION_SEC ?? 30
    );
    const durationSec = Number(
      process.env.ROUND_DURATION ?? process.env.ROUND_DURATION_SEC ?? 60
    );
    return this.roundsService.createByAdmin(
      new Date(),
      cooldownSec,
      durationSec
    );
  }

  @Get()
  list(
    @Query("status") status?: "active" | "cooldown" | "finished",
    @Query("cursorId") cursorId?: string,
    @Query("limit") limit?: string
  ) {
    return this.roundsService.list(new Date(), {
      status,
      cursorId: cursorId || null,
      limit: limit ? Number(limit) : null,
    });
  }

  @Get("current")
  getCurrent() {
    return this.roundsService.getCurrent();
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.roundsService.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/tap")
  tap(@Param("id") id: string, @Req() req: { user: { username: string } }) {
    return this.roundsService.tap(id, req.user.username);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id/stats")
  stats(@Param("id") id: string, @Req() req: { user?: { username: string } }) {
    return this.roundsService.getRoundStats(id, req.user?.username);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(":id/full")
  full(@Param("id") id: string, @Req() req: { user?: { username: string } }) {
    return this.roundsService.getFull(id, req.user?.username);
  }
}
