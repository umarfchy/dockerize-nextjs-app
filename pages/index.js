import { useState } from "react";
import styles from "../styles/Index.module.css";

export default function Index() {
  const [count, setCount] = useState(0);
  const increase = () => setCount((prevCount) => prevCount + 1);
  const decrease = () => setCount((prevCount) => prevCount - 1);
  const reset = () => setCount(0);

  return (
    <>
      <h3>Count: {count}</h3>
      <>
        <button className={styles.button} onClick={increase}>
          +
        </button>
        <button onClick={reset}>RESET</button>
        <button className={styles.button} onClick={decrease}>
          -
        </button>
      </>
    </>
  );
}
