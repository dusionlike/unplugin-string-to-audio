import { describe, expect, it } from 'vitest'
import { SimpleQueue } from '../src/controller/queue'

describe('simple queue', () => {
  it('runs concurrent tasks in order and waits for their completion', async () => {
    const queue = new SimpleQueue()
    const calls: number[] = []

    const first = queue.addTask(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      calls.push(1)
    })
    const second = queue.addTask(() => {
      calls.push(2)
    })

    await Promise.all([first, second])
    expect(calls).toEqual([1, 2])
  })

  it('rejects a failed task and continues processing', async () => {
    const queue = new SimpleQueue()
    const error = new Error('failed')

    const failed = queue.addTask(() => {
      throw error
    })
    const next = queue.addTask(() => {})

    await expect(failed).rejects.toBe(error)
    await expect(next).resolves.toBeUndefined()
  })
})
