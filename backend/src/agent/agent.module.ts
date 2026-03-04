/**
 * Agent 模块
 * 负责 AI 智能写作代理的三层架构实现
 *
 * 包含：
 * - Orchestrator: 调度中枢
 * - Planner: 大纲管理（L3）
 * - Character: 角色管理（L2）
 * - Scene: 场景管理（L1）
 * - RAG: 向量检索
 * - Consistency: 一致性检查（规则引擎）
 */

import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { OrchestratorService } from './orchestrator.service';
import { PlannerService } from '../planner/planner.service';
import { CharacterService } from '../character/character.service';
import { SceneService } from '../scene/scene.service';
import { RagService } from '../rag/rag.service';
import { ConsistencyService } from '../consistency/consistency.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AgentController],
  providers: [
    OrchestratorService,
    PlannerService,
    CharacterService,
    SceneService,
    RagService,
    ConsistencyService,
    PrismaService,
  ],
  exports: [
    OrchestratorService,
    PlannerService,
    CharacterService,
    SceneService,
    RagService,
    ConsistencyService,
  ],
})
export class AgentModule {}
