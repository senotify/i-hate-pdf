declare module "node-qpdf2" {
  export interface EncryptOptions {
    input: string;
    output: string;
    password: string;
    keyLength?: 40 | 128 | 256;
    restrictions?: string[];
  }

  export interface DecryptOptions {
    input: string;
    output: string;
    password: string;
  }

  export function encrypt(options: EncryptOptions): Promise<void>;
  export function decrypt(options: DecryptOptions): Promise<void>;
}
