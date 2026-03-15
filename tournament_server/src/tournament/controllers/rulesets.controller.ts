import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { RulesetsService } from '../services/rulesets.service';
import { CreateRulesetDto, UpdateRulesetDto } from '../dtos';
import { Public } from '@auth/public.decorator';

@Controller('rulesets')
export class RulesetsController {
  constructor(private readonly service: RulesetsService) {}

  @Post()
  async create(@Body(new ValidationPipe()) dto: CreateRulesetDto) {
    return await this.service.create(dto);
  }

  @Public()
  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.service.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe()) dto: UpdateRulesetDto,
  ) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.service.remove(id);
  }
}
