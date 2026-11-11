import crypto from 'crypto';
import { ITemporaryPasswordGenerator } from '../interfaces';

/**
 * Alfabeto Base32 legível (sem caracteres visualmente ambíguos: 0, O, 1, I)
 * Símbolos: exatamente 32 símbolos (2^5 = 32)
 */
export const BASE32_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export class TemporaryPasswordGenerator implements ITemporaryPasswordGenerator {
  private readonly alphabet: string;
  private readonly charCount: number;

  constructor(alphabet: string = BASE32_ALPHABET, charCount = 8) {
    if (alphabet.length !== 32) {
      throw new Error('O alfabeto da senha temporária deve conter exatamente 32 símbolos para garantir zero viés de módulo.');
    }
    this.alphabet = alphabet;
    this.charCount = charCount;
  }

  generate(): { plainText: string; entropyBits: number; format: string } {
    // Coleta bytes aleatórios criptograficamente seguros do sistema operacional
    const bytes = crypto.randomBytes(this.charCount);
    let randomChars = '';

    // Amostragem uniforme exata sem viés de módulo:
    // Como 32 divide perfeitamente 256 (256 / 32 = 8), a máscara bitwise (byte & 0x1F)
    // garante distribuição perfeitamente uniforme P(x) = 1/32 para cada símbolo.
    for (let i = 0; i < this.charCount; i++) {
      const index = bytes[i]! & 0x1F; // máscara dos 5 bits menos significativos (0 a 31)
      randomChars += this.alphabet[index];
    }

    // Formatação visual em dois blocos legíveis: KTC-XXXX-XXXX
    const part1 = randomChars.substring(0, 4);
    const part2 = randomChars.substring(4, 8);
    const formattedPassword = `KTC-${part1}-${part2}`;

    // Cálculo exato da entropia: 8 caracteres * log2(32) = 8 * 5 = 40.0 bits
    const entropyBits = this.charCount * Math.log2(this.alphabet.length);

    return {
      plainText: formattedPassword,
      entropyBits: Number(entropyBits.toFixed(1)),
      format: 'KTC-XXXX-XXXX',
    };
  }
}
