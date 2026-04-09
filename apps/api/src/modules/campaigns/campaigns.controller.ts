import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common'
import { CampaignsService } from './campaigns.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from './dto/update-campaign.dto'
import { ScheduleCampaignDto } from './dto/schedule-campaign.dto'
import { Auth } from '../auth/auth.guard'
import { Public } from '../auth/decorators/public.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { AuthUser, Campaign, CampaignStats, PaginatedCampaigns, PaginationQuery, PaginationQuerySchema } from '@repo/schemas'
import { ZodValidationPipe } from 'nestjs-zod'

@Controller('campaigns')
@Auth()
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQuery,
  ): Promise<PaginatedCampaigns> {
    return this.campaignsService.findAll(user.id, query)
  }

  @Post()
  create(
    @Body() dto: CreateCampaignDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Campaign> {
    return this.campaignsService.create(dto, user.id)
  }

  @Get('open/:tracking_token')
  @Public()
  @HttpCode(204)
  markOpened(@Param('tracking_token') trackingToken: string): Promise<void> {
    return this.campaignsService.markOpened(trackingToken)
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Campaign & { stats: CampaignStats }> {
    return this.campaignsService.findOne(id, user.id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Campaign> {
    return this.campaignsService.update(id, dto, user.id)
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.campaignsService.remove(id, user.id)
  }

  @Post(':id/schedule')
  schedule(
    @Param('id') id: string,
    @Body() dto: ScheduleCampaignDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Campaign> {
    return this.campaignsService.schedule(id, dto, user.id)
  }

  @Post(':id/send')
  @HttpCode(200)
  send(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Campaign> {
    return this.campaignsService.send(id, user.id)
  }

  @Get(':id/stats')
  getStats(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<CampaignStats> {
    return this.campaignsService.stats(id, user.id)
  }
}
