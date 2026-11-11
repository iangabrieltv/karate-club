import crypto from 'crypto';
import { IBootstrapSecretValidator } from '../interfaces';

const HEX_64_REGEX = /^[0-9a-fA-F]{64}$/;

export class BootstrapSecretValidator implements IBootstrapSecretValidator {
  private readonly configuredSecret: string | undefined;

  constructor(configuredSecret?: string) {
    this.configuredSecret = configuredSecret ?? process.env.SERVER_BOOTSTRAP_SECRET;
  }

  validate(providedSecret: string | undefined): boolean {
    const configured = this.configuredSecret?.trim();

    // 1. O servidor deve ter o segredo configurado com exatamente 64 caracteres hexadecimais (32 bytes)
    if (!configured || configured.length !== 64 || !HEX_64_REGEX.test(configured)) {
      return false;
    }

    // 2. A entrada fornecida deve existir e ter exatamente 64 caracteres hexadecimais
    if (!providedSecret || typeof providedSecret !== 'string') {
      return false;
    }

    const provided = providedSecret.trim();
    if (provided.length !== 64 || !HEX_64_REGEX.test(provided)) {
      return false;
    }

    // 3. Conversão para buffers de 32 bytes de tamanho fixo
    const configuredBuffer = Buffer.from(configured, 'hex');
    const providedBuffer = Buffer.from(provided, 'hex');

    // 4. Comparação em tempo constante (evita timing attacks)
    return crypto.timingSafeEqual(configuredBuffer, providedBuffer);
  }
}
