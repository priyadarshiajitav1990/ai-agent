// src/task-planner.ts
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './logger.js';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[]; // Task IDs this task depends on
  estimatedTime?: number; // in minutes
  actualTime?: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: string;
  error?: string;
  subtasks?: Task[];
}

export interface TaskPlan {
  planId: string;
  originalRequest: string;
  analysis: {
    intent: string;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedTotalTime: number;
    keyObjectives: string[];
  };
  tasks: Task[];
  createdAt: number;
  completedAt?: number;
  status: 'planning' | 'executing' | 'completed' | 'failed';
}

export class TaskPlanner {
  private logger: Logger;
  private currentPlan: TaskPlan | null = null;

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
  }

  /**
   * Analyze user request and create task plan
   */
  analyzRequest(userRequest: string, aiResponse?: string): TaskPlan {
    const planId = uuidv4();
    const now = Date.now();

    // Simple analysis based on keywords
    const analysis = this.performAnalysis(userRequest, aiResponse);

    // Break down into tasks
    const tasks = this.breakDownIntoTasks(userRequest, analysis);

    const plan: TaskPlan = {
      planId,
      originalRequest: userRequest,
      analysis,
      tasks,
      createdAt: now,
      status: 'planning',
    };

    this.currentPlan = plan;
    this.logger.info(`Created task plan: ${planId}`);

    return plan;
  }

  /**
   * Analyze request to understand intent and complexity
   */
  private performAnalysis(userRequest: string, aiResponse?: string): TaskPlan['analysis'] {
    const requestLower = userRequest.toLowerCase();

    // Detect intent
    let intent = 'general';
    if (requestLower.includes('create') || requestLower.includes('generate')) intent = 'create';
    if (requestLower.includes('analyze') || requestLower.includes('review')) intent = 'analyze';
    if (requestLower.includes('fix') || requestLower.includes('debug')) intent = 'fix';
    if (requestLower.includes('design') || requestLower.includes('architecture')) intent = 'design';
    if (requestLower.includes('research') || requestLower.includes('find')) intent = 'research';
    if (requestLower.includes('plan') || requestLower.includes('organize')) intent = 'plan';

    // Estimate complexity
    const keywordCount = (userRequest.match(/\s+/g) || []).length;
    const complexity =
      keywordCount < 10 ? 'simple' : keywordCount < 30 ? 'moderate' : 'complex';

    // Extract key objectives
    const keyObjectives = this.extractKeyObjectives(userRequest);

    // Estimate time
    const baseTime = complexity === 'simple' ? 5 : complexity === 'moderate' ? 15 : 30;
    const estimatedTotalTime = baseTime * keyObjectives.length;

    return {
      intent,
      complexity,
      estimatedTotalTime,
      keyObjectives,
    };
  }

  /**
   * Extract key objectives from request
   */
  private extractKeyObjectives(request: string): string[] {
    const objectives: string[] = [];

    // Extract using common patterns
    const patterns = [
      /(?:need|want|create|generate|build|make)\s+([^,.]*)/gi,
      /(?:that|which)\s+([^,.]*)/gi,
      /(?:also|and)\s+([^,.]*)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(request))) {
        const objective = match[1].trim();
        if (objective.length > 5 && objective.length < 100 && !objectives.includes(objective)) {
          objectives.push(objective);
        }
      }
    }

    return objectives.slice(0, 5); // Return max 5 objectives
  }

  /**
   * Break down request into executable tasks
   */
  private breakDownIntoTasks(request: string, analysis: TaskPlan['analysis']): Task[] {
    const tasks: Task[] = [];
    const baseTime = analysis.estimatedTotalTime / (analysis.keyObjectives.length || 1);

    // Task 1: Understand requirements
    tasks.push({
      id: uuidv4(),
      title: 'Analyze Requirements',
      description: `Understand the request: ${request.substring(0, 100)}...`,
      status: 'pending',
      priority: 'high',
      estimatedTime: Math.ceil(baseTime * 0.2),
      createdAt: Date.now(),
    });

    // Task 2-N: Execute based on objectives
    for (let i = 0; i < analysis.keyObjectives.length; i++) {
      tasks.push({
        id: uuidv4(),
        title: `Execute: ${analysis.keyObjectives[i].substring(0, 40)}`,
        description: analysis.keyObjectives[i],
        status: 'pending',
        priority: i === 0 ? 'high' : 'medium',
        dependencies: i === 0 ? [tasks[0].id] : [tasks[Math.max(0, i)].id],
        estimatedTime: Math.ceil(baseTime * 0.6),
        createdAt: Date.now(),
      });
    }

    // Task N+1: Validate and review
    tasks.push({
      id: uuidv4(),
      title: 'Validate Results',
      description: 'Review output and ensure it meets requirements',
      status: 'pending',
      priority: 'medium',
      dependencies: tasks.map((t) => t.id),
      estimatedTime: Math.ceil(baseTime * 0.2),
      createdAt: Date.now(),
    });

    return tasks;
  }

  /**
   * Get current plan
   */
  getCurrentPlan(): TaskPlan | null {
    return this.currentPlan;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | null {
    if (!this.currentPlan) return null;
    return this.findTaskInList(taskId, this.currentPlan.tasks);
  }

  /**
   * Find task in list recursively
   */
  private findTaskInList(taskId: string, tasks: Task[]): Task | null {
    for (const task of tasks) {
      if (task.id === taskId) return task;
      if (task.subtasks) {
        const found = this.findTaskInList(taskId, task.subtasks);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Start a task
   */
  startTask(taskId: string): boolean {
    const task = this.getTask(taskId);
    if (!task) return false;

    task.status = 'in-progress';
    task.startedAt = Date.now();
    this.logger.info(`Started task: ${task.title}`);

    return true;
  }

  /**
   * Complete a task
   */
  completeTask(taskId: string, result: string): boolean {
    const task = this.getTask(taskId);
    if (!task) return false;

    task.status = 'completed';
    task.completedAt = Date.now();
    task.result = result;
    if (task.startedAt) {
      task.actualTime = task.completedAt - task.startedAt;
    }

    this.logger.info(`Completed task: ${task.title}`);
    return true;
  }

  /**
   * Fail a task
   */
  failTask(taskId: string, error: string): boolean {
    const task = this.getTask(taskId);
    if (!task) return false;

    task.status = 'failed';
    task.error = error;
    if (task.startedAt) {
      task.actualTime = Date.now() - task.startedAt;
    }

    this.logger.error(`Failed task: ${task.title} - ${error}`);
    return true;
  }

  /**
   * Get next task to execute
   */
  getNextTask(): Task | null {
    if (!this.currentPlan) return null;

    for (const task of this.currentPlan.tasks) {
      if (task.status === 'pending' && this.canExecuteTask(task)) {
        return task;
      }
    }

    return null;
  }

  /**
   * Check if task can be executed (dependencies met)
   */
  private canExecuteTask(task: Task): boolean {
    if (!task.dependencies || task.dependencies.length === 0) return true;

    for (const depId of task.dependencies) {
      const dep = this.getTask(depId);
      if (!dep || dep.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  /**
   * Get plan progress
   */
  getPlanProgress(): {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
    pending: number;
    percentage: number;
  } {
    if (!this.currentPlan) {
      return { total: 0, completed: 0, inProgress: 0, failed: 0, pending: 0, percentage: 0 };
    }

    const tasks = this.currentPlan.tasks;
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const failed = tasks.filter((t) => t.status === 'failed').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, failed, pending, percentage };
  }

  /**
   * Display plan as formatted text
   */
  displayPlan(): string {
    if (!this.currentPlan) {
      return 'No plan currently active';
    }

    const plan = this.currentPlan;
    const lines: string[] = [];

    lines.push('📋 TASK PLAN');
    lines.push('═'.repeat(50));
    lines.push(`Original Request: ${plan.originalRequest}`);
    lines.push('');

    lines.push('📊 Analysis:');
    lines.push(`  Intent: ${plan.analysis.intent}`);
    lines.push(`  Complexity: ${plan.analysis.complexity}`);
    lines.push(`  Estimated Time: ${plan.analysis.estimatedTotalTime} minutes`);
    lines.push(`  Key Objectives: ${plan.analysis.keyObjectives.length}`);
    for (let i = 0; i < plan.analysis.keyObjectives.length; i++) {
      lines.push(`    ${i + 1}. ${plan.analysis.keyObjectives[i]}`);
    }
    lines.push('');

    lines.push('✅ Tasks:');
    for (let i = 0; i < plan.tasks.length; i++) {
      const task = plan.tasks[i];
      const statusIcon = this.getStatusIcon(task.status);
      lines.push(`${statusIcon} [${i + 1}] ${task.title}`);
      if (task.description) {
        lines.push(`     ${task.description}`);
      }
      lines.push(`     Priority: ${task.priority} | Time: ${task.estimatedTime}m`);
    }
    lines.push('');

    const progress = this.getPlanProgress();
    lines.push(`📈 Progress: ${progress.completed}/${progress.total} (${progress.percentage}%)`);

    return lines.join('\n');
  }

  /**
   * Get status icon
   */
  private getStatusIcon(status: Task['status']): string {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in-progress':
        return '⏳';
      case 'failed':
        return '❌';
      case 'pending':
        return '⭕';
      default:
        return '❓';
    }
  }

  /**
   * Reset plan
   */
  resetPlan(): void {
    this.currentPlan = null;
    this.logger.info('Task plan reset');
  }
}
