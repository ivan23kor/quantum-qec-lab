# Quantum QEC Lab

Interactive project for learning quantum error correction with a hands-on 3-qubit bit-flip code simulation.

## Features
- Step-by-step cycle view: encode, noise, syndrome measurement, decode/correct.
- Visual syndrome readout (`s1`, `s2`) and decoder action.
- Adjustable physical error rate and noise model.
- Monte Carlo experiment comparing unencoded vs encoded reliability.
- Responsive UI for desktop/mobile.

## Run
```bash
cd quantum-qec-lab
bun install
bun run dev
```

Then open `http://localhost:3000`.

## Notes
- This lab focuses on intuition for the classicalized bit-flip code behavior used in QEC.
- It does not simulate full amplitudes or continuous-time quantum dynamics.
