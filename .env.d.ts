type KVNamespace = import('@cloudflare/workers-types').KVNamespace;

declare namespace App {
  interface Locals {
    env: {
      KV: KVNamespace;
    };
  }
}