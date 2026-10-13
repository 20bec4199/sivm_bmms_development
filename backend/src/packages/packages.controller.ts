import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { CreatePackageDto, UpdatePackageDto, PackageQueryDto, AddModuleDto } from './dto/package.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Packages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_SUPER_ADMIN')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new package definition' })
  create(@Body() dto: CreatePackageDto) {
    return this.packagesService.create(dto);
  }

  @Get('available-modules')
  @ApiOperation({ summary: 'Get all available master modules' })
  getAvailableModules() {
    return this.packagesService.getAvailableModules();
  }

  @Get()
  @ApiOperation({ summary: 'Search and list packages' })
  findAll(@Query() query: PackageQueryDto) {
    return this.packagesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get package details' })
  findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update package details' })
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packagesService.update(id, dto);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate package' })
  activate(@Param('id') id: string) {
    return this.packagesService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate package' })
  deactivate(@Param('id') id: string) {
    return this.packagesService.deactivate(id);
  }

  @Get(':id/modules')
  @ApiOperation({ summary: 'Get all modules in a package' })
  getPackageModules(@Param('id') id: string) {
    return this.packagesService.getPackageModules(id);
  }

  @Post(':id/modules')
  @ApiOperation({ summary: 'Add a module to a package' })
  addModule(@Param('id') id: string, @Body() dto: AddModuleDto) {
    return this.packagesService.addModule(id, dto.moduleId);
  }

  @Delete(':id/modules/:moduleId')
  @ApiOperation({ summary: 'Remove a module from a package' })
  removeModule(@Param('id') id: string, @Param('moduleId') moduleId: string) {
    return this.packagesService.removeModule(id, moduleId);
  }
}
