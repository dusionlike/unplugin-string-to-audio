type TaskFn = () => (void | Promise<void>)

export class SimpleQueue {
  private queue: Array<TaskFn> = []
  private isProcessing: boolean = false

  async addTask(task: TaskFn) {
    this.queue.push(task)
    this.processQueue()
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0)
      return

    this.isProcessing = true
    try {
      const task = this.queue.shift()
      if (task)
        await task()
    }
    catch (error) {
      console.error('An error occurred while processing the task:', error)
    }
    finally {
      this.isProcessing = false
      this.processQueue()
    }
  }
}
