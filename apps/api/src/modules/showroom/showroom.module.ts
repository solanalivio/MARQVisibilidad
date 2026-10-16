import { Module } from '@nestjs/common';
import { ShowroomService } from './showroom.service';
import { ShowroomController } from './showroom.controller';

@Module({
  controllers: [ShowroomController],
  providers: [ShowroomService],
  exports: [ShowroomService],
})
export class ShowroomModule {}
