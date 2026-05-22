import { ConflictError, NotFoundError, ValidationError } from '@server/errors';
import type { Dependency } from '@server/lib/db';
import { dependencies, getDb, tasks } from '@server/lib/db';
import { generateUuid } from '@server/lib/id-generator';
import { and, eq } from 'drizzle-orm';

interface CreateDependencyInput {
  taskId: string;
  dependsOnId: string;
}

type DbOrTx =
  | ReturnType<typeof getDb>
  | Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0];

async function assertTaskExists(db: DbOrTx, taskId: string, label: string): Promise<void> {
  const result = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!result[0]) {
    throw new NotFoundError(label, taskId);
  }
}

async function wouldCreateCycle(db: DbOrTx, taskId: string, dependsOnId: string): Promise<boolean> {
  const visited = new Set<string>();
  const stack = [dependsOnId];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current) {
      continue;
    }

    if (current === taskId) {
      return true;
    }

    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    const deps = await db
      .select({ dependsOnId: dependencies.dependsOnId })
      .from(dependencies)
      .where(eq(dependencies.taskId, current));

    for (const dep of deps) {
      if (!visited.has(dep.dependsOnId)) {
        stack.push(dep.dependsOnId);
      }
    }
  }

  return false;
}

export async function create(input: CreateDependencyInput): Promise<Dependency> {
  const db = getDb();
  const { taskId, dependsOnId } = input;

  if (taskId === dependsOnId) {
    throw new ValidationError('A task cannot depend on itself');
  }

  return await db.transaction(async (tx) => {
    await assertTaskExists(tx, taskId, 'Task');
    await assertTaskExists(tx, dependsOnId, 'Dependency task');

    const existingDep = await tx
      .select()
      .from(dependencies)
      .where(and(eq(dependencies.taskId, taskId), eq(dependencies.dependsOnId, dependsOnId)));

    if (existingDep[0]) {
      throw new ConflictError('Dependency already exists');
    }

    const wouldCycle = await wouldCreateCycle(tx, taskId, dependsOnId);
    if (wouldCycle) {
      throw new ValidationError('Adding this dependency would create a cycle');
    }

    const dependency = {
      id: generateUuid(),
      taskId,
      dependsOnId,
      createdAt: new Date(),
    };

    await tx.insert(dependencies).values(dependency);

    return dependency;
  });
}

export async function remove(taskId: string, dependsOnId: string): Promise<void> {
  const db = getDb();

  // Validate dependency exists
  const existingDep = await db
    .select()
    .from(dependencies)
    .where(and(eq(dependencies.taskId, taskId), eq(dependencies.dependsOnId, dependsOnId)));

  if (!existingDep[0]) {
    throw new NotFoundError('Dependency', `${taskId} -> ${dependsOnId}`);
  }

  await db
    .delete(dependencies)
    .where(and(eq(dependencies.taskId, taskId), eq(dependencies.dependsOnId, dependsOnId)));
}
