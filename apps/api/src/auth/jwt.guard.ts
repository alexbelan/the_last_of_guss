import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req: {
      headers: Record<string, string | string[] | undefined>;
      user?: { username: string; role: string };
    } = context.switchToHttp().getRequest();
    const auth = req.headers["authorization"];
    if (!auth || typeof auth !== "string" || !auth.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing Bearer token");
    }
    const token = auth.slice("Bearer ".length);
    try {
      const payload = this.jwt.verify<{ sub: string; role: string }>(token);
      req.user = { username: payload.sub, role: payload.role };
      return true;
    } catch (e) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req: {
      headers: Record<string, string | string[] | undefined>;
      user?: { username: string; role: string };
    } = context.switchToHttp().getRequest();
    const auth = req.headers["authorization"];
    if (auth && typeof auth === "string" && auth.startsWith("Bearer ")) {
      const token = auth.slice("Bearer ".length);
      try {
        const payload = this.jwt.verify<{ sub: string; role: string }>(token);
        req.user = { username: payload.sub, role: payload.role };
      } catch {
        // ignore invalid token, behave as anonymous
      }
    }
    return true;
  }
}
