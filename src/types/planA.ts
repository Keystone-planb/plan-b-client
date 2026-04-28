export type DayOption = {
  id: number;
  label: string;
};

export type MemoItem = {
  id: string;
  text: string;
};

export type PlaceItem = {
  id: string;
  name: string;
  time: string;
  memos: MemoItem[];
};

export type PlacesByDay = Record<number, PlaceItem[]>;

export type SelectedPlaceParam = {
  id: string;
  name: string;
  time?: string;
  day?: number;
};
