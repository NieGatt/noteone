import { BadRequestException, Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { NextFunction, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { JwtService } from "src/services/jwt.service";
import { PrismaService } from "src/services/prisma.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService
    ) { }
    async use(req: any, res: Response, next: NextFunction) {
        const accessToken = <string>req.cookies["accessToken"];

        if (!accessToken)
            return next(new UnauthorizedException("Access token is missing."));

        try {
            const { sub, iat, intent, isVerified } = this.jwt.validate(accessToken);

            if (!isVerified)
                return next(new UnauthorizedException("User not verified."));

            if (intent !== "access")
                return next(new UnauthorizedException("Wrong access token."));

            const user = await this.prisma.user.findUnique({
                where: { id: sub },
                include: { Login: true }
            });

            if (!user) throw new BadRequestException("User not found.");

            if (user?.Login?.lastLogout) {
                if (iat * 1000 < user.Login.lastLogout.valueOf()) {
                    res.clearCookie("accessToken");
                    return next(new UnauthorizedException("Unauthorized access token."));
                }
            };
            req.user = { id: sub };
            return next()
        } catch (error) {
            if (error instanceof JsonWebTokenError) {
                if (error instanceof TokenExpiredError) {
                    return next(new UnauthorizedException("This token has expired."));
                }
                return next(new UnauthorizedException("Invalid access token."));
            };
            return next(error);
        }
    }
}