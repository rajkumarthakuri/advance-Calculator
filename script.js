// ═══════════════════════════════════════════════════════════════════
//  ST Solution Scientific Calculator — script.js
// ═══════════════════════════════════════════════════════════════════

const display = document.getElementById('result');

// ═══════════════════════════════════════════════════════════════════
//Global state and storage for SHIFT functions, angle mode, matrices, vectors
// ═══════════════════════════════════════════════════════════════════
let ansValue    = "0";
let isShiftActive = false;
let angleMode   = 'DEG'; 

//---------------------------------------------
// Storage for matrix and vector registers
//---------------------------------------------

let matrices = { A: null, B: null };
let vectors  = { A: null, B: null };

// ═══════════════════════════════════════════════════════════════════
// ── Utility helpers ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// Rounding floating-point value (e.g. 0.9999999999999999 → 1)

function formatResult(value) {
    if (isNaN(value) || !isFinite(value)) return "Error";
    return Number(value.toFixed(12));
}

function getDisplayValue() {
    let val = parseFloat(display.value);
    return isNaN(val) ? 0 : val;
}

// ═══════════════════════════════════════════════════════════════════
// Convert input angle to radians based on current angleMode
// ═══════════════════════════════════════════════════════════════════

function toRad(val) {
    if (angleMode === 'DEG')  return val * (Math.PI / 180);
    if (angleMode === 'GRAD') return val * (Math.PI / 200);
    return val; 
}

// Update the angle-mode label in the display area
function updateAngleModeLabel() {
    const label = document.getElementById('angle-mode-label');
    if (label) label.textContent = angleMode;
}

// ═══════════════════════════════════════════════════════════════════
// ── Factorial ────
// ═══════════════════════════════════════════════════════════════════

function getFactorial(num) {
    if (num < 0) return NaN;
    if (num === 0 || num === 1) return 1;
    let f = 1;
    for (let i = 2; i <= num; i++) f *= i;
    return f;
}

// ═══════════════════════════════════════════════════════════════════
// Permutation and Combination
// ═══════════════════════════════════════════════════════════════════

function calculatePermutation(n, r) {
    if (n < r || n < 0 || r < 0) return "Error";
    return getFactorial(n) / getFactorial(n - r);
}
function calculateCombination(n, r) {
    if (n < r || n < 0 || r < 0) return "Error";
    return getFactorial(n) / (getFactorial(r) * getFactorial(n - r));
}

// ═══════════════════════════════════════════════════════════════════
// Normal CDF approximation for distribution calculations
// ═══════════════════════════════════════════════════════════════════

function normalCDF(z) {
    let sign = z < 0 ? -1 : 1;
    let x  = Math.abs(z) / Math.sqrt(2.0);
    let t  = 1.0 / (1.0 + 0.3275911 * x);
    let a1 =  0.254829592, a2 = -0.284496736, a3 =  1.421413741;
    let a4 = -1.453152027, a5 =  1.061405429;
    let erf = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t * Math.exp(-x*x);
    return 0.5 * (1.0 + sign * erf);
}

// ═══════════════════════════════════════════════════════════════════
// Parse comma-separated stats values from display
// ═══════════════════════════════════════════════════════════════════

function getStatsArray() {
    let raw   = display.value;
    let clean = raw.replace(/,$/, "").trim();
    if (!clean) return [];
    return clean.split(",")
                .map(n => parseFloat(n.trim()))
                .filter(n => !isNaN(n));
}

// ═══════════════════════════════════════════════════════════════════
// Complex expression evaluator
// ═══════════════════════════════════════════════════════════════════

function evaluateComplexExpression(expr) {
    let formatted = expr.replace(/[\s()]/g, '').replace(/i/g, 'I');
    try {
        if (!expr.includes('i')) return eval(expr);
        let tokens     = formatted.split(/([+-])/);
        let totalReal  = 0;
        let totalImag  = 0;
        let currentSign = 1;

        for (let token of tokens) {
            if (token === '+') { currentSign =  1; continue; }
            if (token === '-') { currentSign = -1; continue; }
            if (!token) continue;

            if (token.includes('I')) {
                let coeffStr = token.replace('I', '');
                let coeff = coeffStr === '' ? 1 : parseFloat(coeffStr);
                totalImag += currentSign * coeff;
            } else {
                totalReal += currentSign * parseFloat(token);
            }
        }

        if (totalImag === 0) return totalReal;
        let imagSign = totalImag >= 0 ? "+" : "-";
        return `${totalReal}${imagSign}${Math.abs(totalImag)}i`;
    } catch(e) {
        return "Error";
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── SHIFT toggle ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function toggleShift() {
    isShiftActive = !isShiftActive;
    const shiftBtn = document.getElementById('shift-btn');
    const shiftLed = document.getElementById('shift-indicator');

    if (isShiftActive) {
        if (shiftBtn) shiftBtn.style.backgroundColor = "#b45309";
        if (shiftLed) shiftLed.classList.add('active');
    } else {
        if (shiftBtn) shiftBtn.style.backgroundColor = "#d97706";
        if (shiftLed) shiftLed.classList.remove('active');
    }
}

function resetShift() {
    isShiftActive = false;
    const shiftBtn = document.getElementById('shift-btn');
    const shiftLed = document.getElementById('shift-indicator');
    if (shiftBtn) shiftBtn.style.backgroundColor = "#d97706";
    if (shiftLed) shiftLed.classList.remove('active');
}

// ═══════════════════════════════════════════════════════════════════
// ── SHIFT secondary function dispatcher ─────────────────────────
// ═══════════════════════════════════════════════════════════════════

function executeSecondaryFunction(label) {
    resetShift();
    let data = getStatsArray();

    switch (label) {
        
        case 'M':
            // Mega prefix: insert 1,000,000
            dis('1000000');
            break;
        case 'G':
            // Giga prefix: insert 1,000,000,000
            dis('1000000000');
            break;
        case 'T':
            // Tera prefix: insert 1,000,000,000,000
            dis('1000000000000');
            break;
       case 'π': {
            let pi = Math.PI.toFixed(10);
            let lastChar = display.value.slice(-1);
            
            if (display.value === "0" || display.value === "Error" || display.value === "") {                
                display.value = pi;
            } else if (/[0-9]/.test(lastChar)) {               
                display.value += '*' + pi;
            } else {                
                display.value += pi;
            }
            break;
        }
        
        case 'OFF':            
            display.value = '';
            display.placeholder = '0';
            break;
       
        case 'MAT':
            openMatrixModal();
            break;
        case 'VCT':
            openVectorModal();
            break;
        case 'K':
            // Kilo: multiply current value by 1000
            display.value = formatResult(getDisplayValue() * 1000);
            break;
        case 'nPr': display.value += 'P';
            break;        
        case 'nCr': display.value += 'C';
            break;
        
        case 'S-SUM': {
            if (data.length === 0) { display.value = "Data Error: Ex: 2,4,6"; return; }
            let sumX  = data.reduce((a, b) => a + b, 0);
            let sumX2 = data.reduce((a, b) => a + (b * b), 0);
            display.value = `Σx:${sumX} | Σx²:${sumX2}`;
            break;
        }
        case 'S-VAR': {
            if (data.length === 0) { display.value = "Data Error: Ex: 2,4,6"; return; }
            let n       = data.length;
            let mean    = data.reduce((a, b) => a + b, 0) / n;
            let variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
            let stdDev  = Math.sqrt(variance);
            display.value = `n:${n} | Mean:${formatResult(mean)} | σx:${formatResult(stdDev)}`;
            break;
        }
        case 'DISTR':
            openDistrModal();
            break;
        case 'e=0': {           
            let val = getDisplayValue();
            if (display.value.includes('e')) {               
                display.value = formatResult(val);
            } else {                
                display.value = val.toExponential();
            }
            ansValue = display.value;
            break;
        }
        case 'a+bi':
            // Append imaginary unit
            if (display.value === "0" || display.value === "Error") display.value = "i";
            else display.value += "i";
            break;
        
        case 'RND':           
            display.value = parseFloat(getDisplayValue().toPrecision(6));
            break;
        case 'RAN#':            
            display.value = formatResult(Math.random());
            break;
        case '!@':            
            factorial();
            break;
        case 'DRG':
            //mode: DEG → RAD → GRAD → DEG
            if (angleMode === 'DEG')       angleMode = 'RAD';
            else if (angleMode === 'RAD')  angleMode = 'GRAD';
            else                           angleMode = 'DEG';
            updateAngleModeLabel();            
            let prev = display.value;
            display.value = `Mode: ${angleMode}`;
            setTimeout(() => { display.value = prev; }, 1000);
            break;
        case 'Re-IM': {            
            let complexStr = display.value;
            if (complexStr.includes('i')) {               
                let match = complexStr.match(/^([+-]?\d*\.?\d+)\s*([+-])\s*(\d*\.?\d+)i$/);
                if (match) {
                    display.value = `Real:${match[1]} | Imag:${match[2]}${match[3]}i`;
                } else {
                    display.value = `Real:0 | Imag:${complexStr}`;
                }
            } else {                
                display.value = `Real:${complexStr} | Imag:0i`;
            }
            break;
        }      

        default:
            break;
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── Core input dispatcher ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function dis(val) {
    // Intercept number/operator keys when SHIFT is active
    if (isShiftActive) {
        if (val === '(') { executeSecondaryFunction('M');     return; }
        if (val === ')') { executeSecondaryFunction('G');     return; }
        if (val === '7') { executeSecondaryFunction('MAT');   return; }
        if (val === '8') { executeSecondaryFunction('VCT');   return; }
        if (val === '9') { executeSecondaryFunction('K');     return; }
        if (val === '4') { executeSecondaryFunction('S-SUM'); return; }
        if (val === '5') { executeSecondaryFunction('S-VAR'); return; }
        if (val === '6') { executeSecondaryFunction('DISTR'); return; }
        if (val === '1') { executeSecondaryFunction('RND');   return; }
        if (val === '2') { executeSecondaryFunction('RAN#');  return; }
        if (val === '3') { executeSecondaryFunction('!@');    return; } 
        if (val === '*') { executeSecondaryFunction('e=0');   return; }
        if (val === '/') { executeSecondaryFunction('a+bi');  return; }
        if (val === '+') { executeSecondaryFunction('DRG');   return; }
        if (val === '-') { executeSecondaryFunction('Re-IM'); return; }
        if (val === '.') { executeSecondaryFunction('π'); return; }
    }

    if (display.value.includes('e+') || display.value.includes('e-')) {
        display.value = val;
        return;
    }

    //------------------------------------
    // Comma needed for stats data entry
   // ------------------------------------

    if (val === ',') {
        display.value += ',';
        return;
    }

    //-----------------------------------------------------------
    // Clear "Error" or "0" placeholder before typing a new value
    //-----------------------------------------------------------

    if (display.value === "Error" || display.value === "0") {
        display.value = val;
    } else {
        display.value += val;
    }
}

function brct(value) {
    if (isShiftActive) {
        if (value === '(') { executeSecondaryFunction('M'); return; }
        if (value === ')') { executeSecondaryFunction('G'); return; }
    }
    if (display.value === "0") display.value = value;
    else display.value += value;
}

function percentage() {
    if (isShiftActive) { executeSecondaryFunction('T'); return; }
    let expr = display.value;
    if (!expr || expr === "0" || expr === "Error") return;
    let match = expr.match(/(\d+\.?\d*)$/);
    if (match) {
        let percentageValue = parseFloat(match[1]) / 100;
        display.value = expr.slice(0, -match[1].length) + percentageValue;
    } else {
        display.value = formatResult(getDisplayValue() / 100);
    }
}

function negate() {
    if (isShiftActive) { resetShift(); return; }
    display.value = -getDisplayValue();
}
    

function bkspc() {
    if (isShiftActive) { executeSecondaryFunction('OFF'); return; }
    display.value = display.value.slice(0, -1);
    if (display.value === "") display.value = "0";
}

function del() {
    if (isShiftActive) { executeSecondaryFunction('nPr'); return; }
    display.value = '';
    display.placeholder = '0';
    ansValue = "0";
    matrices = { A: null, B: null };
    vectors  = { A: null, B: null };
    resetShift();
}

function clearCurrent() {
    if (isShiftActive) { executeSecondaryFunction('nCr'); return; }
    display.value = '0';
}

function factorial() {
    let num = parseInt(display.value);
    if (isNaN(num) || num < 0) { display.value = "Error"; return; }
    display.value = getFactorial(num);
    ansValue = display.value;
}

// ═══════════════════════════════════════════════════════════════════
// ── Master evaluation engine ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function solve() {
    try {
        if (display.value === "") return;
        let expression = display.value;

        if (expression.includes('MatA') || expression.includes('MatB')) {
            display.value = evaluateMatrixMath(expression);
            ansValue = display.value;
            return;
        }
        if (expression.includes('VctA') || expression.includes('VctB')) {
            display.value = evaluateVectorMath(expression);
            ansValue = display.value;
            return;
        }
        if (expression.includes('i')) {
            display.value = evaluateComplexExpression(expression);
            ansValue = display.value;
            return;
        }

        //-------------------------------------------------------
        // Handle nPr and nCr inline notation (e.g. 5P2, 5C2)
        //--------------------------------------------------------

        expression = expression.replace(/(\d+)P(\d+)/g,
            (_, n, r) => calculatePermutation(parseInt(n), parseInt(r)));
        expression = expression.replace(/(\d+)C(\d+)/g,
            (_, n, r) => calculateCombination(parseInt(n), parseInt(r)));

        let result     = eval(expression);
        let finalOutput = formatResult(result);
        display.value  = finalOutput;
        ansValue       = finalOutput;
    } catch (error) {
        display.value = "Error";
    }
}

function ans() {
    if (display.value === "" || display.value === "0" || display.value === "Error") {
        display.value = ansValue;
        return;
    }
    if (display.value.includes('Saved') || display.value.includes('Normal')) {
        display.value = ansValue;
        return;
    }
    let lastChar = display.value.slice(-1);
    if (/[0-9.iI)]/.test(lastChar)) {
        display.value += "*" + ansValue;
    } else {
        display.value += ansValue;
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── Power functions ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function x2() { display.value = formatResult(Math.pow(getDisplayValue(), 2)); }
function x3() { display.value = formatResult(Math.pow(getDisplayValue(), 3)); }
function x4() { display.value = formatResult(Math.pow(getDisplayValue(), 4)); }
function x5() { display.value = formatResult(Math.pow(getDisplayValue(), 5)); }
function x6() { display.value = formatResult(Math.pow(getDisplayValue(), 6)); }
function x7() { display.value = formatResult(Math.pow(getDisplayValue(), 7)); }
function x9() { display.value = formatResult(Math.pow(getDisplayValue(), 9)); }

// ═══════════════════════════════════════════════════════════════════
// ── Root functions ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function sqrt()    { display.value = formatResult(Math.sqrt(getDisplayValue())); }
function cuberut() { display.value = formatResult(Math.cbrt(getDisplayValue())); }
function fourrut() { display.value = formatResult(Math.pow(getDisplayValue(), 1/4)); }
function fiverut() { display.value = formatResult(Math.pow(getDisplayValue(), 1/5)); }

// ═══════════════════════════════════════════════════════════════════
// ── Trigonometric (respects angleMode) ─────────────────────────
// ═══════════════════════════════════════════════════════════════════

function sin() { display.value = formatResult(Math.sin(toRad(getDisplayValue()))); }
function cos() { display.value = formatResult(Math.cos(toRad(getDisplayValue()))); }
function tan() { display.value = formatResult(Math.tan(toRad(getDisplayValue()))); } 
function cot() { display.value = formatResult(1 / Math.tan(toRad(getDisplayValue()))); } 

// ═══════════════════════════════════════════════════════════════════
// ── Hyperbolic ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function sinh() { display.value = formatResult(Math.sinh(getDisplayValue())); }
function cosh() { display.value = formatResult(Math.cosh(getDisplayValue())); }
function tanh() { display.value = formatResult(Math.tanh(getDisplayValue())); }
function coth() { display.value = formatResult(1 / Math.tanh(getDisplayValue())); } 

// ═══════════════════════════════════════════════════════════════════
// ── Inverse trig — with domain validation ──────────────────────
// ═══════════════════════════════════════════════════════════════════

function asin() {
    let val = getDisplayValue();
    if (val < -1 || val > 1) { display.value = "Domain Error: [-1, 1]"; return; }
    display.value = formatResult(Math.asin(val));
}
function acos() {
    let val = getDisplayValue();
    if (val < -1 || val > 1) { display.value = "Domain Error: [-1, 1]"; return; }
    display.value = formatResult(Math.acos(val));
}
function atan() {
    display.value = formatResult(Math.atan(getDisplayValue()));
}

// ═══════════════════════════════════════════════════════════════════
// ── Inverse hyperbolic ────
// ═══════════════════════════════════════════════════════════════════

function asinh() {
    display.value = formatResult(Math.asinh(getDisplayValue()));
}
function acosh() {
    let val = getDisplayValue();
    if (val < 1) { display.value = "Domain Error: [1, ∞)"; return; }
    display.value = formatResult(Math.acosh(val));
}
function atanh() {
    let val = getDisplayValue();
    if (val <= -1 || val >= 1) { display.value = "Domain Error: (-1, 1)"; return; }
    display.value = formatResult(Math.atanh(val));
}

// ═══════════════════════════════════════════════════════════════════
// ── Logarithm and exponential ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function log() { display.value = formatResult(Math.log10(getDisplayValue())); }
function ln()  { display.value = formatResult(Math.log(getDisplayValue())); }
function e()   { display.value = formatResult(Math.exp(getDisplayValue())); }

// ═══════════════════════════════════════════════════════════════════
// ── Keyboard shortcuts ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('keydown', function(event) {
    const key = event.key;

    // Ignore keypresses when any modal is open
    const matrixModalOpen = document.getElementById('matrix-modal') &&
                            document.getElementById('matrix-modal').style.display === 'flex';
    const vectorModalOpen = document.getElementById('vector-modal') &&
                            document.getElementById('vector-modal').style.display === 'flex';
    if (matrixModalOpen || vectorModalOpen) return;

    if (/[0-9.]/.test(key))                        { dis(key);       return; }
    if (['+','-','*','/'].includes(key))            { dis(key);       return; }
    if (key === '(' || key === ')')                 { brct(key);      return; }
    if (key === '%')                                { percentage();   return; }
    if (key === 'Backspace')                        { bkspc();        return; }
    if (key === 'Enter' || key === '=')             { event.preventDefault(); solve(); return; }
    if (key === 'Escape')                           { del();          return; }
    if (key.toLowerCase() === 's')                  { toggleShift();  return; }
    if (key === ',')                                { dis(',');       return; } // stats comma
});

// ═══════════════════════════════════════════════════════════════════
//  MATRIX  ── modal, grid generation, math engine
// ═══════════════════════════════════════════════════════════════════

function openMatrixModal() {
    document.getElementById('matrix-modal').style.display = 'flex';
    generateMatrixGrid();
}
function closeMatrixModal() {
    document.getElementById('matrix-modal').style.display = 'none';
}
function generateMatrixGrid() {
    const rows = parseInt(document.getElementById('matrix-rows').value);
    const cols = parseInt(document.getElementById('matrix-cols').value);
    const container = document.getElementById('matrix-dynamic-grid');
    container.innerHTML = '';
    container.style.gridTemplateRows    = `repeat(${rows}, 1fr)`;
    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let input = document.createElement('input');
            input.type = 'number';
            input.className   = 'matrix-cell';
            input.placeholder = '0';
            input.id = `cell-${r}-${c}`;
            container.appendChild(input);
        }
    }
}
function formatMatrixOutput(matrix) {
    return matrix.map(row => `[${row.join(',')}]`).join(' ');
}
function saveMatrixData() {
    const target = document.getElementById('matrix-target').value;
    const rows   = parseInt(document.getElementById('matrix-rows').value);
    const cols   = parseInt(document.getElementById('matrix-cols').value);
    let tempMatrix = [];
    for (let r = 0; r < rows; r++) {
        let rowData = [];
        for (let c = 0; c < cols; c++) {
            let val = parseFloat(document.getElementById(`cell-${r}-${c}`).value);
            rowData.push(isNaN(val) ? 0 : val);
        }
        tempMatrix.push(rowData);
    }
    matrices[target] = tempMatrix;
    if (display.value === "0" || display.value === "Error" || display.value === "") {
        display.value = `Mat${target}`;
    } else {
        display.value += `Mat${target}`;
    }
    closeMatrixModal();
}
function evaluateMatrixMath(expr) {
    try {
        let match = expr.match(/MatA\s*([\+\-\*])\s*MatB/);
        if (!match) return "Matrix Error";
        let op   = match[1];
        let matA = matrices.A;
        let matB = matrices.B;
        if (!matA || !matB) return "Missing Matrix Data";
        let rowsA = matA.length, colsA = matA[0].length;
        let rowsB = matB.length, colsB = matB[0].length;

        if (op === '+' || op === '-') {
            if (rowsA !== rowsB || colsA !== colsB) return "Dim Mismatch";
            return formatMatrixOutput(
                matA.map((row, r) =>
                    row.map((val, c) => op === '+' ? val + matB[r][c] : val - matB[r][c])
                )
            );
        }
        if (op === '*') {
            if (colsA !== rowsB) return "Dim Mismatch";
            let result = [];
            for (let r = 0; r < rowsA; r++) {
                let row = [];
                for (let c = 0; c < colsB; c++) {
                    let sum = 0;
                    for (let k = 0; k < colsA; k++) sum += matA[r][k] * matB[k][c];
                    row.push(sum);
                }
                result.push(row);
            }
            return formatMatrixOutput(result);
        }
    } catch(e) { return "Error"; }
}

// ═══════════════════════════════════════════════════════════════════
//  VECTOR  ── modal, grid generation, math engine
// ═══════════════════════════════════════════════════════════════════

function openVectorModal() {
    document.getElementById('vector-modal').style.display = 'flex';
    generateVectorGrid();
}
function closeVectorModal() {
    document.getElementById('vector-modal').style.display = 'none';
}
function generateVectorGrid() {
    const size = parseInt(document.getElementById('vector-size').value);
    const container = document.getElementById('vector-dynamic-grid');
    container.innerHTML = '';
    container.style.gridTemplateRows    = "1fr";
    container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    const labels = ['X','Y','Z'];
    for (let i = 0; i < size; i++) {
        let input = document.createElement('input');
        input.type = 'number';
        input.className   = 'matrix-cell';
        input.placeholder = labels[i];
        input.id = `vcell-${i}`;
        container.appendChild(input);
    }
}
function saveVectorData() {
    const target = document.getElementById('vector-target').value;
    const size   = parseInt(document.getElementById('vector-size').value);
    let tempVector = [];
    for (let i = 0; i < size; i++) {
        let val = parseFloat(document.getElementById(`vcell-${i}`).value);
        tempVector.push(isNaN(val) ? 0 : val);
    }
    vectors[target] = tempVector;
    if (display.value === "0" || display.value === "Error" || display.value === "") {
        display.value = `Vct${target}`;
    } else {
        display.value += `Vct${target}`;
    }
    closeVectorModal();
}
function evaluateVectorMath(expr) {
    try {
        let match = expr.match(/VctA\s*([\+\-\*])\s*VctB/);
        if (!match) return "Vector Error";
        let op   = match[1];
        let vctA = vectors.A;
        let vctB = vectors.B;
        if (!vctA || !vctB) return "Missing Vector Data";
        if (vctA.length !== vctB.length) return "Dimension Mismatch";

        if (op === '+' || op === '-') {
            let result = vctA.map((v, i) => op === '+' ? v + vctB[i] : v - vctB[i]);
            return `[${result.join(',')}]`;
        }
        if (op === '*') {
            // Dot product
            let dot = vctA.reduce((sum, v, i) => sum + v * vctB[i], 0);
            return formatResult(dot);
        }
    } catch(e) { return "Error"; }
}

// ═══════════════════════════════════════════════════════════════════
//  DISTRIBUTION  ── modal and calculation engine
// ═══════════════════════════════════════════════════════════════════

function openDistrModal() {
    document.getElementById('distr-modal').style.display = 'flex';
    let currentInput = parseFloat(display.value);
    if (!isNaN(currentInput)) {
        document.getElementById('distr-val').value = currentInput;
    }
    toggleDistrInputs();
}
function closeDistrModal() {
    document.getElementById('distr-modal').style.display = 'none';
}
function toggleDistrInputs() {
    const type         = document.getElementById('distr-type').value;
    const generalPanel = document.getElementById('general-inputs');
    const primaryLabel = document.getElementById('lbl-primary');
    if (type === 'Standard') {
        generalPanel.style.display = 'none';
        primaryLabel.innerText = 'Value (Z):';
    } else {
        generalPanel.style.display = 'block';
        primaryLabel.innerText = 'Value (X):';
    }
}
function calculateDistribution(mode) {
    const type = document.getElementById('distr-type').value;
    let x    = parseFloat(document.getElementById('distr-val').value);
    let mean = 0;
    let sd   = 1;

    if (isNaN(x)) { display.value = "Input Error"; closeDistrModal(); return; }

    if (type === 'General') {
        mean = parseFloat(document.getElementById('distr-mean').value);
        sd   = parseFloat(document.getElementById('distr-sd').value);
        if (isNaN(mean) || isNaN(sd) || sd <= 0) {
            display.value = "Invalid Parameters";
            closeDistrModal();
            return;
        }
        x = (x - mean) / sd; 
    }

    if (mode === 'PD') {
        let height = (1 / (Math.sqrt(2 * Math.PI) * (type === 'General' ? sd : 1))) *
                     Math.exp(-Math.pow(x, 2) / 2);
        display.value = `NormalPD:${formatResult(height)}`;
    } else if (mode === 'CDF') {
        display.value = `NormalCDF:${formatResult(normalCDF(x))}`;
    }

    closeDistrModal();
}