import argon2 from 'argon2';
import { IPasswordHasher } from '../interfaces';
import { InternalServerError } from '../domain/errors';

/**
 * Opções de configuração do algoritmo Argon2id
 * Parâmetros de calibração para containers de 512 MB de RAM:
 * m = 32768 KiB (32 MiB)
 * t = 3 iterações
 * p = 1 thread
 */
export interface Argon2Options {
  memoryCost: number; // em KiB
  timeCost: number; // iterações
  parallelism: number; // threads
}

export class Argon2PasswordHasher implements IPasswordHasher {
  private readonly options: Argon2Options;
  private runningHashes = 0;
  private readonly maxConcurrentHashes: number;

  constructor(
    options: Partial<Argon2Options> = {},
    maxConcurrentHashes = 4
  ) {
    this.options = {
      memoryCost: options.memoryCost ?? 32768, // 32 MiB
      timeCost: options.timeCost ?? 3,
      parallelism: options.parallelism ?? 1,
    };
    this.maxConcurrentHashes = maxConcurrentHashes;
  }

  async hash(plainText: string): Promise<string> {
    if (!plainText || typeof plainText !== 'string') {
      throw new Error('A senha em texto puro é obrigatória para gerar o hash.');
    }

    if (this.runningHashes >= this.maxConcurrentHashes) {
      throw new InternalServerError('Capacidade máxima de processamento criptográfico temporariamente atingida. Tente novamente em instantes.');
    }

    this.runningHashes++;
    try {
      return await argon2.hash(plainText, {
        type: argon2.argon2id,
        memoryCost: this.options.memoryCost,
        timeCost: this.options.timeCost,
        parallelism: this.options.parallelism,
      });
    } catch (err: unknown) {
      throw new InternalServerError(`Falha no cálculo do hash Argon2id: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.runningHashes--;
    }
  }

  async verify(plainText: string, hash: string): Promise<boolean> {
    if (!plainText || !hash) {
      return false;
    }

    try {
      return await argon2.verify(hash, plainText);
    } catch {
      // Retorna false em caso de formato inválido de hash ou falha de verificação
      return false;
    }
  }

  getRunningHashesCount(): number {
    return this.runningHashes;
  }
}
