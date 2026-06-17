import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TaskEntity } from '../tasks/entity/task.entity';

@ApiTags('AI')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @UseGuards(JwtAuthGuard)
    @Post('generate-plan')
    @ApiBearerAuth()
    @ApiOkResponse({ type: [TaskEntity] })
    async generatePlan(@Req() req: any, @Body() dto: GeneratePlanDto) {
        return await this.aiService.generatePlan(req.user.id, dto);
    }
}
