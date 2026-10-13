import { useState } from 'react';
import { useStore } from '../state/store';

export function Intro() {
  const { setName } = useStore();
  const [value, setValue] = useState('');

  return (
    <div className="intro">
      <div className="kicker">A Lowcountry Mystery</div>
      <h1>Numbers Don't Lie</h1>
      <p className="intro-lede">
        Charleston, South Carolina, 1947. You write obituaries for the <em>Lowcountry Herald</em>. You're good with words and you gave up on numbers a long time ago.
        Tonight, a homicide detective is about to drop a dead man's ledger on your desk.
      </p>
      <div className="intro-how">
        <div><strong>Read the case.</strong> Every chapter hinges on a piece of math, explained in plain English before you need it.</div>
        <div><strong>Crack the puzzles.</strong> Wrong answers aren't failures. Each one tells you exactly which trap you fell into, and the real test sets the same traps.</div>
        <div><strong>Work the board.</strong> Practice any skill any time. It adapts to you, and brings old skills back for review so they stick until test day.</div>
      </div>
      <form
        className="intro-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) setName(value.trim());
        }}
      >
        <label htmlFor="name">What name goes on your byline?</label>
        <div className="row">
          <input id="name" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Your name" autoFocus maxLength={30} />
          <button className="btn primary" disabled={!value.trim()}>Take the case</button>
        </div>
      </form>
    </div>
  );
}
