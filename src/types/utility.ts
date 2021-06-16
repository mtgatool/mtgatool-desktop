export type FilterKeys<D, Condition> = keyof Pick<
  D,
  {
    [Key in keyof D]: D[Key] extends Condition ? Key : never;
  }[keyof D]
>;
