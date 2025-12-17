declare module "pdf-poppler" {
  export interface ConvertOptions {
    format?: "png" | "jpeg" | "jpg";
    out_dir?: string;
    out_prefix?: string;
    page?: number | null;
    scale?: number;
    density?: number;
  }

  export function convert(file: string, options: ConvertOptions): Promise<void>;
}
