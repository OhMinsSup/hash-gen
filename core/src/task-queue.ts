type Task = (() => Promise<void>) | (() => void);

export class TaskQueue {
  private concurrency: number;
  private autoStart: boolean;
  private tasks: any[];
  private runningTasks: number;

  constructor({ concurrency = 1, autoStart = true } = {}) {
    this.concurrency = concurrency;
    this.autoStart = autoStart;
    this.tasks = [];
    this.runningTasks = 0;
  }

  add(task: Task) {
    return new Promise<void>((resolve, reject) => {
      const taskWrapper = async () => {
        try {
          await task();
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          this.runningTasks--;
          this.runNextTask();
        }
      };

      this.tasks.push(taskWrapper);

      if (this.autoStart) {
        this.runNextTask();
      }
    });
  }

  runNextTask() {
    if (this.runningTasks >= this.concurrency || this.tasks.length === 0) {
      return;
    }

    const task = this.tasks.shift();
    this.runningTasks++;
    task();
  }
}
