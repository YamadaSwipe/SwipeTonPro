export function timer(callback: () => void, delay: number): void {
  setTimeout(callback, delay);
}