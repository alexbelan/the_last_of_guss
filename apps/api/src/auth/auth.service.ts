import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../infra/prisma.service";
import bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async register(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new UnauthorizedException(
        "user not found; use seed or create via admin"
      );
    }
    const payload = {
      sub: user.username,
      role: await this.getRoleName(user.roleId),
    };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      user: { username: user.username, role: payload.role },
    };
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException("invalid credentials");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("invalid credentials");
    const payload = { sub: user.username, role: user.role.name };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      user: { username: user.username, role: user.role.name },
    };
  }

  private async getRoleName(roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    return role?.name ?? "survivor";
  }
}
