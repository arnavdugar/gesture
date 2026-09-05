import * as styles from "./Slider.css";

type SliderProps = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
};

export function Slider({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
  formatValue = String,
}: SliderProps) {
  return (
    <div>
      <div class={styles.label}>
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{formatValue(value)}</output>
      </div>
      <input
        class={styles.input}
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
    </div>
  );
}
