import Column from './column';
import Note from './note';
import Serialisable from './serialisable';

export default class Section implements Serialisable {
  public constructor(
    public readonly name = 'New Tab Section',
    public readonly columns: Array<Column> = [],
    public readonly tuning: Note[],
    public readonly bpm: number = 150
  ) {}

  public static create(tuning: Note[]): Section {
    return new Section('New Tab Section', [Column.create(tuning)], tuning);
  }

  public static createFromJson(json: Record<string, unknown>, tuning: Note[]): Section {
    if (typeof json.bpm === 'number' && typeof json.name === 'string' && Array.isArray(json.columns)) {
      return new Section(
        json.name,
        json.columns.map((column) => Column.createFromJson(column, tuning)),
        tuning,
        json.bpm
      );
    }

    throw new Error('Cannot create tab section from json!');
  }

  public isPopulated(): boolean {
    return (
      this.columns.filter((column) => column.positions.filter((position) => position.fret.length > 0).length > 0)
        .length > 0
    );
  }

  public setTuning(tuning: Note[]): Section {
    return new Section(
      this.name,
      this.columns.map((column) => column.setTuning(tuning)),
      tuning,
      this.bpm
    );
  }

  public setBpm(bpm: number): Section {
    return new Section(this.name, this.columns, this.tuning, bpm);
  }

  public addColumn(index: number): Section {
    return new Section(
      this.name,
      [...this.columns.slice(0, index + 1), Column.create(this.tuning), ...this.columns.slice(index + 1)],
      this.tuning,
      this.bpm
    );
  }

  public deleteColumn(index: number): Section {
    return new Section(
      this.name,
      this.columns.filter((_, i) => i !== index),
      this.tuning,
      this.bpm
    );
  }

  public setColumn(column: Column, columnIndex: number): Section {
    return new Section(
      this.name,
      this.columns.map((oldColumn, index) => {
        return index === columnIndex ? column : oldColumn;
      }),
      this.tuning,
      this.bpm
    );
  }

  public updateName(name: string): Section {
    return new Section(name, this.columns, this.tuning, this.bpm);
  }

  public getRootNoteForString(string: number): Note {
    const note = this.tuning.at(string - 1);

    if (note !== undefined) {
      return note;
    }

    throw new Error('No string at position ' + string);
  }

  public toJson(): Record<string, unknown> {
    return {
      name: this.name,
      columns: this.columns.map((column) => column.toJson()),
      bpm: this.bpm,
    };
  }

  public toText(): string {
    return `Section Name: ${this.name}
${this.tuning.reduce((acc, tuning, index) => {
  return acc.concat(
    tuning.asString(),
    '|-',
    this.columns.reduce(
      (acc, column) => acc.concat('-', column.getStringPosition(index + 1).padFret(column.getCharacterWidth())),
      ''
    ),
    '\n'
  );
}, '')}
`;
  }
}
