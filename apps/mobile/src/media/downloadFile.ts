import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function downloadAndShareFile(url: string, fileName: string) {
  const safeName = sanitizeFileName(fileName || 'cato-file');
  const localUri = `${FileSystem.cacheDirectory}${safeName}`;
  const result = await FileSystem.downloadAsync(url, localUri);

  if (!(await Sharing.isAvailableAsync())) {
    return result.uri;
  }

  await Sharing.shareAsync(result.uri, {
    dialogTitle: 'Save file'
  });

  return result.uri;
}
