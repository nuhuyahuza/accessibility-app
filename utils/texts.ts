import * as FileSystem from 'expo-file-system';

export const getAllNotes = async (): Promise<{ uri: string, note: string }[]> => {
  const notesDir = `${FileSystem.documentDirectory}notes/`;
  const files = await FileSystem.readDirectoryAsync(notesDir);

  const notes = await Promise.all(
    files.map(async (file) => {
      const uri = `${notesDir}${file}`;
      const content = await FileSystem.readAsStringAsync(uri);
      return { uri, note: JSON.parse(content).note };
    })
  );

  return notes;
};


export const saveNote = async (note: string): Promise<string> => {
  const notesDir = `${FileSystem.documentDirectory}notes/`;
  await FileSystem.makeDirectoryAsync(notesDir, { intermediates: true });

  const fileName = `note_${Date.now()}.json`;
  const filePath = `${notesDir}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, JSON.stringify({ note }));

  return filePath;
};



export const deleteNote = async (uri: string): Promise<void> => {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(uri);
  } else {
    throw new Error('Note not found');
  }
};

export const viewNote = async (uri: string): Promise<string> => {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) throw new Error('Note not found');

  const content = await FileSystem.readAsStringAsync(uri);
  return JSON.parse(content).note;
};