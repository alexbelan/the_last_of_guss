import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body("username") username: string) {
    return this.auth.register(username);
  }

  @Post("login")
  login(@Body() body: { username: string; password: string }) {
    return this.auth.login(body?.username, body?.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: { user: { username: string; role: string } }) {
    return { user: req.user };
  }
}
