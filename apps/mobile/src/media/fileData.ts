import { File } from 'expo-file-system';

export async function readUriAsDataUri(uri: string, mimeType: string) {
  const file = new File(uri);
  const base64 = await file.base64();

  return `data:${mimeType};base64,${base64}`;
}

export function getFileSizeBytes(uri: string) {
  const file = new File(uri);

  return file.size;
}

export function getResumeFileType(fileName: string, mimeType?: string) {
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith('.pdf') || mimeType === 'application/pdf') {
    return 'pdf' as const;
  }

  if (lowerName.endsWith('.docx')) {
    return 'docx' as const;
  }

  return 'doc' as const;
}
