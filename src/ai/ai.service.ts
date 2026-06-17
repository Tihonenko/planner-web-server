import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TasksService } from '../tasks/tasks.service';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { TaskEntity } from '../tasks/entity/task.entity';
import { HttpMessages } from '@src/common/i18n/http-messages';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(
        private readonly tasksService: TasksService,
        private readonly configService: ConfigService,
    ) {
        const apiKey = this.configService.get<string>('app.ai.geminiApiKey');
        if (!apiKey) {
            console.warn('GEMINI_API_KEY is not set');
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        }
    }

    async generatePlan(userId: string, dto: GeneratePlanDto) {
        if (!this.model) {
            throw new InternalServerErrorException(HttpMessages.aiNotConfigured);
        }

        const currentDate = new Date().toISOString();
        const prompt = `
      Current date and time: ${currentDate}
      User plan: "${dto.planText}"

      Based on the user's plan, generate a list of tasks to be added to their calendar.
      Return ONLY a JSON array of objects. Each object should have the following fields:
      - title: string (summary of the task)
      - content: string (optional description)
      - dateTimeStart: string (ISO 8601 format)
      - dateTimeEnd: string (ISO 8601 format, estimate duration if not specified, default to 1 hour)
      - priority: "Low" | "Medium" | "High" (infer from context, default Low)

      Example output:
      [
        {
          "title": "Meeting with John",
          "content": "Discuss project details",
          "dateTimeStart": "2023-10-27T10:00:00.000Z",
          "dateTimeEnd": "2023-10-27T11:00:00.000Z",
          "priority": "Medium"
        }
      ]
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Clean up markdown code blocks if present
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const tasksData = JSON.parse(text);

            const createdTasks: TaskEntity[] = [];
            for (const taskData of tasksData) {
                const createTaskDto: CreateTaskDto = {
                    title: taskData.title,
                    content: taskData.content,
                    dateTimeStart: taskData.dateTimeStart,
                    dateTimeEnd: taskData.dateTimeEnd,
                    priority: taskData.priority,
                    isDone: false,
                    isShared: false,
                };
                const task = await this.tasksService.create(userId, createTaskDto);
                createdTasks.push(task);
            }

            return createdTasks;
        } catch (error) {
            console.error('Error generating plan:', error);
            throw new InternalServerErrorException(HttpMessages.aiPlanGenerationFailed);
        }
    }
}
