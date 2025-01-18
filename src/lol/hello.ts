import { ping } from "@/hi/ping";

export function hello(): string {
  return `${ping()} World!`;
}
