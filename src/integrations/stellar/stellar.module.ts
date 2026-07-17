import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StellarHorizonClient } from './horizon.client';

@Module({
  imports: [HttpModule],
  providers: [StellarHorizonClient],
  exports: [StellarHorizonClient],
})
export class StellarModule {}
