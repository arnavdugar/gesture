import type { GenericEventHandler } from "preact";

import * as styles from "./Dropdown.css";

type DropdownOption<Type extends string | number> = {
  label: string;
  value: Type;
};

type DropdownProps<Type extends string | number> = {
  label: string;
  onChange: GenericEventHandler<HTMLSelectElement>;
  options: ReadonlyArray<DropdownOption<Type>>;
  value: Type;
};

export function Dropdown<Type extends string | number>({
  label,
  onChange,
  options,
  value,
}: DropdownProps<Type>) {
  return (
    <label class={styles.label}>
      <span>{label}</span>
      <span class={styles.wrapper}>
        <select
          aria-label={label}
          class={styles.select}
          value={value}
          onChange={onChange}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}
