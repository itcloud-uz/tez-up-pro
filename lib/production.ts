/**
 * Production State Machine for Tez Up Pro
 *
 * Stage pipeline:
 *   RECEIVING → CUTTING → ASSEMBLY → SEWING → PACKAGING → COMPLETED
 */

import { prisma } from '@/lib/prisma'
import { ProductionStage } from '@prisma/client'
import type { ProductionBatch } from '@prisma/client'

// Re-export for convenience
export { ProductionStage }

// ──────────────────────────────────────────────
// Stage order
// ──────────────────────────────────────────────

/** Ordered array of all production stages from first to last. */
export const STAGE_ORDER: ProductionStage[] = [
  ProductionStage.RECEIVING,
  ProductionStage.CUTTING,
  ProductionStage.ASSEMBLY,
  ProductionStage.SEWING,
  ProductionStage.PACKAGING,
  ProductionStage.COMPLETED,
]

// ──────────────────────────────────────────────
// Stage labels (English)
// ──────────────────────────────────────────────

/** Human-readable English labels for each production stage. */
export const STAGE_LABELS: Record<ProductionStage, string> = {
  [ProductionStage.RECEIVING]: 'Receiving',
  [ProductionStage.CUTTING]: 'Cutting',
  [ProductionStage.ASSEMBLY]: 'Assembly',
  [ProductionStage.SEWING]: 'Sewing',
  [ProductionStage.PACKAGING]: 'Packaging',
  [ProductionStage.COMPLETED]: 'Completed',
}

/** Human-readable Uzbek labels for each production stage. */
export const STAGE_LABELS_UZ: Record<ProductionStage, string> = {
  [ProductionStage.RECEIVING]: 'Qabul qilish',
  [ProductionStage.CUTTING]: 'Kesish',
  [ProductionStage.ASSEMBLY]: 'Yig\'ish',
  [ProductionStage.SEWING]: 'Tikish',
  [ProductionStage.PACKAGING]: 'Qadoqlash',
  [ProductionStage.COMPLETED]: 'Tugallangan',
}

// ──────────────────────────────────────────────
// Stage navigation helpers
// ──────────────────────────────────────────────

/**
 * Returns the stage immediately following the given stage,
 * or null if the given stage is COMPLETED (last stage).
 */
export function getNextStage(current: ProductionStage): ProductionStage | null {
  const idx = STAGE_ORDER.indexOf(current)
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null
  return STAGE_ORDER[idx + 1]
}

/**
 * Returns the stage immediately preceding the given stage,
 * or null if the given stage is RECEIVING (first stage).
 */
export function getPrevStage(current: ProductionStage): ProductionStage | null {
  const idx = STAGE_ORDER.indexOf(current)
  if (idx <= 0) return null
  return STAGE_ORDER[idx - 1]
}

/**
 * Returns true if the batch can advance to the next stage
 * (i.e. it is NOT already at COMPLETED).
 */
export function canAdvance(current: ProductionStage): boolean {
  return current !== ProductionStage.COMPLETED
}

/**
 * Returns the zero-based index of the stage in the pipeline.
 * Useful for progress bars (0–5).
 */
export function getStageIndex(stage: ProductionStage): number {
  return STAGE_ORDER.indexOf(stage)
}

/**
 * Returns the percentage completion of a batch (0–100).
 */
export function getStageProgress(stage: ProductionStage): number {
  const idx = getStageIndex(stage)
  return Math.round((idx / (STAGE_ORDER.length - 1)) * 100)
}

// ──────────────────────────────────────────────
// DB operations
// ──────────────────────────────────────────────

/**
 * Advances a production batch to the next stage.
 *
 * - Validates the batch exists
 * - Throws if already COMPLETED
 * - Creates a StageLog entry
 * - Updates the batch's currentStage (and sets completedAt if reaching COMPLETED)
 *
 * @param batchId    - ID of the ProductionBatch to advance
 * @param employeeId - ID of the User performing the transition
 * @param notes      - Optional notes for the stage log
 * @returns The updated ProductionBatch
 */
export async function advanceBatch(
  batchId: string,
  employeeId: string,
  notes?: string,
): Promise<ProductionBatch> {
  // Load the batch
  const batch = await prisma.productionBatch.findUnique({
    where: { id: batchId },
  })

  if (!batch) {
    throw new Error(`Production batch not found: ${batchId}`)
  }

  if (batch.currentStage === ProductionStage.COMPLETED) {
    throw new Error(
      `Batch "${batchId}" is already COMPLETED and cannot be advanced further.`,
    )
  }

  const fromStage = batch.currentStage
  const toStage = getNextStage(fromStage)

  if (!toStage) {
    // Shouldn't happen given the COMPLETED check above, but guard anyway
    throw new Error(`No next stage exists after "${fromStage}"`)
  }

  const isCompleting = toStage === ProductionStage.COMPLETED

  // Run both writes in a transaction for atomicity
  const [, updatedBatch] = await prisma.$transaction([
    // 1. Create stage log
    prisma.stageLog.create({
      data: {
        batchId,
        fromStage,
        toStage,
        employeeId,
        notes: notes ?? null,
      },
    }),

    // 2. Update batch
    prisma.productionBatch.update({
      where: { id: batchId },
      data: {
        currentStage: toStage,
        assignedEmployeeId: employeeId,
        completedAt: isCompleting ? new Date() : undefined,
        updatedAt: new Date(),
      },
    }),
  ])

  return updatedBatch
}

/**
 * Fetches a production batch with full stage log history.
 */
export async function getBatchWithHistory(batchId: string) {
  return prisma.productionBatch.findUnique({
    where: { id: batchId },
    include: {
      product: true,
      assignedEmployee: {
        select: { id: true, name: true, phone: true },
      },
      stageLogs: {
        orderBy: { createdAt: 'asc' },
        include: {
          employee: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })
}

/**
 * Returns all active (non-completed) batches, grouped by stage.
 */
export async function getActiveBatches() {
  return prisma.productionBatch.findMany({
    where: {
      currentStage: { not: ProductionStage.COMPLETED },
    },
    include: {
      product: { select: { id: true, name: true, images: true } },
      assignedEmployee: { select: { id: true, name: true } },
    },
    orderBy: { startedAt: 'asc' },
  })
}
