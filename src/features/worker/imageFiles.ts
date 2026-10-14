export function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      reject(Error('Usa JPG, PNG o WebP de hasta 2 MB por foto'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(Error('No pudimos leer la foto'));
    reader.readAsDataURL(file);
  });
}
