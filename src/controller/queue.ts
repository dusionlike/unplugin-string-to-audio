type TaskFn = () => (void | Promise<void>)

interface QueueItem {
  task: TaskFn
  resolve: () => void
  reject: (error: unknown) => void
}

export class SimpleQueue {
  private queue: QueueItem[] = []
  private isProcessing: boolean = false

  addTask(task: TaskFn): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject })
      void this.processQueue()
    })
  }

  private async processQueue() {
    if (this.isProcessing)
      return

    this.isProcessing = true
    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift()
        if (!item)
          break
        try {
          await item.task()
          item.resolve()
        }
        catch (error) {
          item.reject(error)
        }
      }
    }
    finally {
      this.isProcessing = false
    }
  }
}
