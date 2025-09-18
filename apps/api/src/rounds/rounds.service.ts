import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaService } from "../infra/prisma.service";

type ListFilters = {
  status?: "active" | "cooldown" | "finished";
  cursorId?: string | null;
  limit?: number | null;
};

@Injectable()
export class RoundsService {
  constructor(private readonly prisma: PrismaService) {}

  async createByAdmin(now: Date, cooldownSec: number, durationSec: number) {
    const serverNow = await this.getServerNow();
    const startAt = new Date(serverNow.getTime() + cooldownSec * 1000);
    const endAt = new Date(startAt.getTime() + durationSec * 1000);
    return this.prisma.round.create({ data: { startAt, endAt } });
  }

  async list(now: Date, filters: ListFilters) {
    now = await this.getServerNow();
    const where: Prisma.RoundWhereInput = {};
    if (filters?.status) {
      if (filters.status === "cooldown") {
        where.startAt = { gt: now };
      } else if (filters.status === "active") {
        where.AND = [{ startAt: { lte: now } }, { endAt: { gt: now } }];
      } else if (filters.status === "finished") {
        where.endAt = { lte: now };
      }
    }

    const take = Math.min(Math.max(Number(filters?.limit ?? 20), 1), 50);
    const hasCursor = Boolean(filters?.cursorId);

    const rows = await this.prisma.round.findMany({
      where,
      orderBy: { startAt: "desc" },
      take: take + 1,
      ...(hasCursor
        ? { cursor: { id: filters!.cursorId as string }, skip: 1 }
        : {}),
    });
    const items = rows.slice(0, take);
    const nextCursor = rows.length > take ? rows[rows.length - 1].id : null;
    return { serverTime: now, items, nextCursor };
  }

  async getById(id: string) {
    const round = await this.prisma.round.findUnique({ where: { id } });
    if (!round) throw new NotFoundException("round not found");
    return round;
  }

  async getRoundStats(roundId: string, username?: string) {
    const round = await this.getById(roundId);
    const totals = {
      totalPoints: round.totalPoints,
      totalTaps: round.totalTaps,
    };

    const top = await this.prisma.roundStat.findFirst({
      where: { roundId },
      orderBy: { points: "desc" },
      include: { user: true },
    });

    let my = null as null | { taps: number; points: number };
    if (username) {
      const me = await this.prisma.user.findUnique({ where: { username } });
      if (me) {
        const s = await this.prisma.roundStat.findUnique({
          where: { roundId_userId: { roundId, userId: me.id } },
        });
        if (s) my = { taps: s.taps, points: s.points };
      }
    }

    return {
      totals,
      winner: top
        ? { username: top.user.username, points: top.points, taps: top.taps }
        : null,
      my,
      round,
    };
  }

  async getFull(roundId: string, username?: string) {
    const now = await this.getServerNow();
    const stats = await this.getRoundStats(roundId, username);
    const start = new Date(stats.round.startAt);
    const end = new Date(stats.round.endAt);
    const status =
      now < start
        ? ("cooldown" as const)
        : now >= start && now < end
        ? ("active" as const)
        : ("finished" as const);
    return {
      serverTime: now,
      status,
      round: stats.round,
      totals: stats.totals,
      winner: stats.winner,
      my: stats.my,
    };
  }

  async getServerNow(tx?: PrismaClient) {
    const client: PrismaClient = (tx as PrismaClient) ?? this.prisma;
    const rows = await client.$queryRaw<{ ts: Date }[]>`
      SELECT now() as ts
    `;
    return rows[0].ts;
  }

  async getCurrent() {
    const now = await this.getServerNow();
    const active = await this.prisma.round.findFirst({
      where: { startAt: { lte: now }, endAt: { gt: now } },
      orderBy: { endAt: "asc" },
    });
    if (active)
      return { serverTime: now, round: active, status: "active" as const };

    const upcoming = await this.prisma.round.findFirst({
      where: { startAt: { gt: now } },
      orderBy: { startAt: "asc" },
    });
    if (upcoming)
      return { serverTime: now, round: upcoming, status: "cooldown" as const };

    return { serverTime: now, round: null, status: "none" as const };
  }

  async tap(roundId: string, username: string) {
    const maxRetries = 3;
    let attempt = 0;

    while (true) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const now = await this.getServerNow(tx as PrismaClient);

            const round = await tx.round.findUnique({ where: { id: roundId } });
            if (!round) throw new NotFoundException("round not found");
            const isActive = now >= round.startAt && now < round.endAt;
            if (!isActive) throw new BadRequestException("round is not active");

            const user = await tx.user.findUnique({
              where: { username },
              include: { role: true },
            });
            if (!user) throw new NotFoundException("user not found");
            const isBanned = user.role.name === "banned";

            const stat = isBanned
              ? await tx.roundStat.findUnique({
                  where: { roundId_userId: { roundId, userId: user.id } },
                })
              : await tx.roundStat.upsert({
                  where: { roundId_userId: { roundId, userId: user.id } },
                  update: {},
                  create: { roundId, userId: user.id },
                });

            const nextTap = (stat?.taps ?? 0) + 1;
            const calculatedAward = nextTap % 11 === 0 ? 10 : 1;
            const award = isBanned ? 0 : calculatedAward;

            let myTaps = stat?.taps ?? 0;
            let myPoints = stat?.points ?? 0;
            if (!isBanned) {
              const updatedStat = await tx.roundStat.update({
                where: { id: (stat as { id: string }).id },
                data: { taps: { increment: 1 }, points: { increment: award } },
              });
              myTaps = updatedStat.taps;
              myPoints = updatedStat.points;
            }

            if (!isBanned) {
              await tx.round.update({
                where: { id: round.id, endAt: { gt: now } },
                data: {
                  totalTaps: { increment: 1 },
                  totalPoints: { increment: award },
                },
              });
            }

            const updatedRound = await tx.round.findUnique({
              where: { id: round.id },
            });

            return {
              award,
              my_taps: myTaps,
              my_points: myPoints,
              round_points: updatedRound?.totalPoints ?? 0,
              round_taps: updatedRound?.totalTaps ?? 0,
            };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        );
      } catch (e: unknown) {
        const message =
          (e as { message?: string }).message?.toLowerCase() || "";
        const isSerialization =
          message.includes("could not serialize access due to") ||
          (e as any)?.code === "P2034";
        if (isSerialization && attempt < maxRetries - 1) {
          attempt++;
          continue;
        }
        throw e;
      }
    }
  }
}
