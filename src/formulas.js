// Formula reference. `expr` uses the same plain-text syntax <MathText> understands.
// Each formula: [name, expr, description, [[symbol, meaning], ...]]
const F = (name, expr, desc, vars) => ({ name, expr, desc, vars });

export const FORMULA_SUBJECTS = [
  {
    id: "math",
    name: "Mathematics",
    formulas: [
      F("Quadratic formula", "x = (-b ± sqrt(b^2 - 4ac))/(2a)", "Roots of ax^2 + bx + c = 0.", [["a, b, c", "Coefficients of the quadratic"], ["x", "Roots"]]),
      F("Euler's formula", "e^(jθ) = cos θ + j sin θ", "Links complex exponentials to trigonometry; basis of phasors.", [["j", "Imaginary unit, sqrt(-1)"], ["θ", "Angle in radians"]]),
      F("Derivative of a power", "d/dx (x^n) = n x^(n-1)", "Power rule of differentiation.", [["n", "Constant exponent"]]),
      F("Integration by parts", "∫ u dv = uv - ∫ v du", "Used when the integrand is a product of two functions.", [["u, v", "Differentiable functions of x"]]),
      F("Taylor series", "f(x) = Σ (f^(n)(a))/(n!) (x - a)^n", "Expands a function about x = a.", [["a", "Center of expansion"], ["n", "Term index"]]),
      F("Laplace transform", "F(s) = ∫ f(t) e^(-st) dt", "Converts a time function to the s-domain (integral from 0 to ∞).", [["s", "Complex frequency, σ + jω"], ["f(t)", "Time-domain function"]]),
    ],
  },
  {
    id: "circuits",
    name: "DC and AC Circuits",
    formulas: [
      F("Ohm's law", "V = I R", "Voltage across a resistor is proportional to its current.", [["V", "Voltage (V)"], ["I", "Current (A)"], ["R", "Resistance (Ω)"]]),
      F("Power", "P = V I = I^2 R = (V^2)/(R)", "Power dissipated in a resistive element.", [["P", "Power (W)"]]),
      F("Voltage divider", "V_out = (R_2)/(R_1 + R_2) V_in", "Output across R_2 in a two-resistor series string.", [["V_in", "Source voltage"], ["R_1, R_2", "Series resistors"]]),
      F("Parallel resistors", "1/R_eq = 1/R_1 + 1/R_2 + 1/R_3", "Equivalent resistance of parallel branches.", [["R_eq", "Equivalent resistance"]]),
      F("RC time constant", "τ = R C", "Charging or discharging reaches 63.2% (or 36.8%) after one τ.", [["τ", "Time constant (s)"], ["C", "Capacitance (F)"]]),
      F("Capacitive reactance", "X_C = 1/(2*pi*f*C)", "Opposition of a capacitor to AC.", [["f", "Frequency (Hz)"], ["C", "Capacitance (F)"]]),
      F("Inductive reactance", "X_L = 2*pi*f*L", "Opposition of an inductor to AC.", [["L", "Inductance (H)"]]),
      F("Series RLC impedance", "Z = sqrt(R^2 + (X_L - X_C)^2)", "Magnitude of impedance in a series RLC circuit.", [["Z", "Impedance (Ω)"], ["X_L, X_C", "Reactances (Ω)"]]),
      F("Resonant frequency", "f_0 = 1/(2*pi*sqrt(L*C))", "Frequency where X_L = X_C.", [["f_0", "Resonant frequency (Hz)"]]),
      F("Quality factor (series)", "Q = (X_L)/(R) = 1/(R) sqrt(L/C)", "Selectivity of a series resonant circuit.", [["Q", "Quality factor"], ["R", "Series resistance"]]),
      F("AC power factor", "P = V_rms I_rms cos θ", "Real power in an AC circuit.", [["θ", "Phase angle between V and I"], ["cos θ", "Power factor"]]),
    ],
  },
  {
    id: "electronics",
    name: "Electronic Devices and Circuits",
    formulas: [
      F("Shockley diode equation", "I_D = I_S (e^(V_D/(n V_T)) - 1)", "Current through an ideal junction diode.", [["I_S", "Saturation current"], ["V_T", "Thermal voltage, about 26 mV at 300 K"], ["n", "Ideality factor"]]),
      F("BJT current relations", "I_C = β I_B", "Active-region collector current.", [["β", "Current gain"], ["I_B", "Base current"]]),
      F("Alpha and beta", "α = β/(β + 1)", "Relates common-base and common-emitter gains.", [["α", "Common-base current gain"]]),
      F("MOSFET saturation current", "I_D = 1/2 k (V_GS - V_t)^2", "Drain current in saturation.", [["k", "Transconductance parameter"], ["V_t", "Threshold voltage"]]),
      F("Op-amp inverting gain", "A_v = -(R_f)/(R_in)", "Closed-loop gain of the inverting amplifier.", [["R_f", "Feedback resistor"], ["R_in", "Input resistor"]]),
      F("Op-amp non-inverting gain", "A_v = 1 + (R_f)/(R_1)", "Closed-loop gain of the non-inverting amplifier.", [["R_1", "Resistor to ground"]]),
      F("Ripple factor (full-wave)", "r = V_r(rms)/V_dc", "Measure of residual AC in a rectifier output.", [["V_r(rms)", "RMS ripple voltage"], ["V_dc", "DC output"]]),
    ],
  },
  {
    id: "comms",
    name: "Communication Systems",
    formulas: [
      F("Shannon capacity", "C = B log_2(1 + S/N)", "Maximum error-free data rate of a noisy channel.", [["C", "Capacity (bits/s)"], ["B", "Bandwidth (Hz)"], ["S/N", "Signal-to-noise ratio (linear)"]]),
      F("Decibel (power)", "dB = 10 log_10(P_2/P_1)", "Power ratio expressed in decibels.", [["P_1, P_2", "Reference and measured power"]]),
      F("AM modulation index", "m = (E_m)/(E_c)", "Ratio of message to carrier amplitude.", [["E_m", "Message amplitude"], ["E_c", "Carrier amplitude"]]),
      F("Carson's rule", "BW = 2(Δf + f_m)", "Approximate bandwidth of an FM signal.", [["Δf", "Peak frequency deviation"], ["f_m", "Highest modulating frequency"]]),
      F("Free-space path loss", "FSPL = 20 log_10(d) + 20 log_10(f) + 32.44", "Loss in dB with d in km and f in MHz.", [["d", "Distance (km)"], ["f", "Frequency (MHz)"]]),
      F("Wavelength", "λ = c/f", "Wavelength of an electromagnetic wave.", [["c", "3 × 10^8 m/s"], ["f", "Frequency (Hz)"]]),
      F("VSWR", "VSWR = (1 + |Γ|)/(1 - |Γ|)", "Standing-wave ratio from reflection coefficient.", [["Γ", "Reflection coefficient"]]),
      F("Thermal noise power", "N = k T B", "Available noise power of a resistor.", [["k", "1.38 × 10^-23 J/K"], ["T", "Temperature (K)"], ["B", "Bandwidth (Hz)"]]),
    ],
  },
  {
    id: "control",
    name: "Control Systems and Signals",
    formulas: [
      F("Closed-loop transfer function", "T(s) = (G(s))/(1 + G(s) H(s))", "Negative-feedback system.", [["G(s)", "Forward path"], ["H(s)", "Feedback path"]]),
      F("Second-order system poles", "s = -ζ ω_n ± j ω_n sqrt(1 - ζ^2)", "Pole locations of an underdamped second-order system.", [["ζ", "Damping ratio"], ["ω_n", "Natural frequency (rad/s)"]]),
      F("Percent overshoot", "%OS = e^(-ζ*pi/sqrt(1 - ζ^2)) × 100", "Peak overshoot of a step response.", [["ζ", "Damping ratio"]]),
      F("Nyquist sampling theorem", "f_s ≥ 2 f_max", "Minimum sampling rate to avoid aliasing.", [["f_s", "Sampling frequency"], ["f_max", "Highest signal frequency"]]),
      F("Convolution", "y(t) = ∫ x(τ) h(t - τ) dτ", "Output of an LTI system.", [["x(t)", "Input"], ["h(t)", "Impulse response"]]),
    ],
  },
  {
    id: "em",
    name: "Electromagnetics and Physics",
    formulas: [
      F("Coulomb's law", "F = (k q_1 q_2)/(r^2)", "Force between two point charges.", [["k", "8.99 × 10^9 N·m²/C²"], ["q_1, q_2", "Charges (C)"], ["r", "Separation (m)"]]),
      F("Faraday's law", "ε = -N (dΦ)/(dt)", "Induced EMF from changing flux.", [["N", "Number of turns"], ["Φ", "Magnetic flux (Wb)"]]),
      F("Characteristic impedance", "Z_0 = sqrt(L/C)", "Lossless transmission line.", [["L, C", "Per-unit-length inductance and capacitance"]]),
      F("Intrinsic impedance of free space", "η_0 = sqrt(μ_0/ε_0) ≈ 377 Ω", "Ratio of E to H in a plane wave in free space.", [["μ_0", "Permeability of free space"], ["ε_0", "Permittivity of free space"]]),
      F("Kinetic energy", "KE = 1/2 m v^2", "Energy of motion.", [["m", "Mass (kg)"], ["v", "Speed (m/s)"]]),
    ],
  },
];
