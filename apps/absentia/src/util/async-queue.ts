type Resolver<T> = (value: T) => void;

export class AsyncQueue<T> {
  private readonly items: T[] = [];
  private readonly waiters: Resolver<T>[] = [];

  push(item: T): void {
    const w = this.waiters.shift();
    if (w) w(item);
    else this.items.push(item);
  }

  async pop(): Promise<T> {
    const item = this.items.shift();
    if (item !== undefined) return item;
    return new Promise<T>((resolve) => this.waiters.push(resolve));
  }
}
