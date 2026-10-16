import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ShowroomService } from './showroom.service';
import { Public } from '../../common/decorators/public.decorator';
import { ShowroomView, ShowroomEventRequest, WebEventRequest } from '@marq/shared';

@Controller()
export class ShowroomController {
  constructor(private showroomService: ShowroomService) {}

  @Public()
  @Get('showroom/:token')
  async getShowroom(@Param('token') token: string): Promise<ShowroomView> {
    return this.showroomService.getShowroomView(token);
  }

  @Public()
  @Post('showroom/:token/events')
  async recordShowroomEvent(
    @Param('token') token: string,
    @Body() dto: ShowroomEventRequest,
  ): Promise<ShowroomView> {
    return this.showroomService.recordShowroomEvent(token, dto);
  }

  @Public()
  @Post('public/events')
  @HttpCode(HttpStatus.NO_CONTENT)
  async recordWebEvent(@Body() dto: WebEventRequest): Promise<void> {
    await this.showroomService.recordWebEvent(dto);
  }
}
