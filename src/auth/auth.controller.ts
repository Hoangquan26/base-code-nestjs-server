import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { AuthService } from './auth.service';
import {
    ForgotPasswordDto,
    OtpRequestDto,
    OtpVerifyDto,
    RefreshTokenDto,
    RegisterDto,
    ResetPasswordDto,
    TwoFactorDisableDto,
    TwoFactorSetupDto,
    TwoFactorVerifyDto,
} from './dto';
import { type AuthRequest } from './types/auth-request';
import { type Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    profile(@Req() req: AuthRequest) {
        return this.authService.loginUser(req.user)
    }

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.registerLocal(dto);
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    login(@Req() req: AuthRequest) {
        return this.authService.loginUser(req.user);
    }

    @Post('refresh')
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshTokens(dto.refreshToken);
    }

    @Post('forgot-password')
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.requestPasswordReset(dto.email);
    }

    @Post('reset-password')
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }

    @Post('otp/request')
    requestOtp(@Body() dto: OtpRequestDto) {
        return this.authService.requestEmailOtp(dto.email);
    }

    @Post('otp/verify')
    verifyOtp(@Body() dto: OtpVerifyDto) {
        return this.authService.verifyEmailOtp(dto.email, dto.code);
    }

    @Post('2fa/setup')
    setupTwoFactor(@Body() dto: TwoFactorSetupDto) {
        return this.authService.setupTwoFactor(dto.userId);
    }

    @Post('2fa/verify')
    verifyTwoFactor(@Body() dto: TwoFactorVerifyDto) {
        return this.authService.verifyTwoFactor(dto.userId, dto.code);
    }

    @Post('2fa/disable')
    disableTwoFactor(@Body() dto: TwoFactorDisableDto) {
        return this.authService.disableTwoFactor(dto.userId, dto.code);
    }

    @UseGuards(GoogleAuthGuard)
    @Get('google')
    googleAuth() {
        return { message: 'Redirecting to Google' };
    }

    @UseGuards(GoogleAuthGuard)
    @Get('google/callback')
    async googleCallback(@Req() req: AuthRequest, @Res() res: Response) {
        const session = await this.authService.loginUser(req.user)

        const redirectUrl =
            `${process.env.APP_URL}/oauth/callback` +
            `?accessToken=${encodeURIComponent(session.accessToken)}` +
            `&refreshToken=${encodeURIComponent(session.refreshToken)}` +
            `&expiresIn=${session.expiresIn}` +
            `&provider=google`

        return res.redirect(302, redirectUrl)
    }

    @UseGuards(FacebookAuthGuard)
    @Get('facebook')
    facebookAuth() {
        return { message: 'Redirecting to Facebook' };
    }

    @UseGuards(FacebookAuthGuard)
    @Get('facebook/callback')
    async facebookCallback(@Req() req: AuthRequest, @Res() res: Response) {
        const session = await this.authService.loginUser(req.user)

        const redirectUrl =
            `${process.env.APP_URL}/oauth/callback` +
            `?accessToken=${encodeURIComponent(session.accessToken)}` +
            `&refreshToken=${encodeURIComponent(session.refreshToken)}` +
            `&expiresIn=${session.expiresIn}` +
            `&provider=facebook`

        return res.redirect(302, redirectUrl)
    }
}
