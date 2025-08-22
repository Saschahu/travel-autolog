export interface ReportSignature {
  id: string;
  filePath: string;
  mimeType: "image/png" | "image/jpeg";
  width?: number;
  height?: number;
  // Position and scaling relative to signature field (0..1)
  posX: number;
  posY: number;
  scale: number;
  rotation?: number;
  updatedAt: string;
}

export interface SignatureSettings {
  signature: ReportSignature | null;
}