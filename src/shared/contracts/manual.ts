// La forma de los archivos del manual que arma tools/manual/ desde docs/manual/ y lee la pantalla
// del manual (diseño del manual, § 2). Son archivos fijos del mismo origen, no una ruta de /api.
export type Device = 'computer' | 'phone';

export const devices: Device[] = ['computer', 'phone'];

// La marca de una tarea: entera en «Todos los pasos», corta en la lista («La más rápida»).
export type Tag = { long: string; short: string };

export type TaskSummary = {
  id: string;
  device: Device;
  title: string;
  icon: string;
  tag?: Tag;
  clip?: string;
  steps: number;
};

// Un renglón de la lista: escrito (con sus tareas), que falta o que lleva a tareas de otro capítulo.
export type ChapterEntry = {
  id: string;
  name: string;
  icon: string;
  tasks?: TaskSummary[];
  goesTo?: { chapter: string; tasks: Partial<Record<Device, string>> };
};

export type ManualIndex = { version: string; chapters: ChapterEntry[] };

// Dónde está el punto que se señala, en porcentaje de la captura, y su tamaño en píxeles.
export type Capture = {
  scene: string;
  device: Device;
  width: number;
  height: number;
  point: [number, number];
  label: string;
};

export type Step = { text: string; icon: string; capture?: Capture };

export type Task = Omit<TaskSummary, 'steps'> & {
  note?: string;
  steps: Step[];
  tips: string[];
};

export type Chapter = { id: string; name: string; intro: Record<Device, string>; tasks: Task[] };

// Lo que recorre el buscador, por tarea: los pasos y después los consejos, con el texto original.
export type SearchTask = {
  chapter: string;
  task: string;
  title: string;
  note?: string;
  texts: string[];
};

// Los nombres de los archivos que arma, dentro de /manual/.
export const manualFiles = {
  index: 'index.json',
  chapter: (id: string) => `${id}.json`,
  search: (device: Device) => `search-${device}.json`,
  media: (file: string) => `media/${file}`,
};
