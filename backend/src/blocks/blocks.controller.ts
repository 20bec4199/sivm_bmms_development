import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { BlockQueryDto } from './dto/block-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Blocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Property' })
  @ApiOperation({ summary: 'Create a block' })
  create(@CurrentUser() user: any, @Body() createBlockDto: CreateBlockDto) {
    return this.blocksService.create(user.organizationId, createBlockDto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'Property' })
  @ApiOperation({ summary: 'Get all blocks with pagination, property filter, and search' })
  findAll(@CurrentUser() user: any, @Query() query: BlockQueryDto) {
    return this.blocksService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'READ', subject: 'Property' })
  @ApiOperation({ summary: 'Get a single block by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.blocksService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'Property' })
  @ApiOperation({ summary: 'Update a block' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateBlockDto: UpdateBlockDto) {
    return this.blocksService.update(user.organizationId, id, updateBlockDto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'Property' })
  @ApiOperation({ summary: 'Delete a block' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.blocksService.remove(user.organizationId, id);
  }
}
