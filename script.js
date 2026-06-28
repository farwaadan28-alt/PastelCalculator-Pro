// get the screen and history from index.HTML

const screen = document.getElementById('screen');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');

// variables to store 

let currentInput = '0';
let shouldResetScreen = false;
let historyData = [];

// add numbers and decimal point when button clicked

function appendNumber(number) {

    // stop user from typing two dots like 5..3

    if (number === '.') {
        const parts = currentInput.split(/[\+\-\*\/]/);
        const currentPart = parts[parts.length - 1];
        if (currentPart.includes('.')) return;
    }

    // if screen shows 0 or after =, start fresh

    if (currentInput === '0' || shouldResetScreen) {
        currentInput = number === '.'? '0.' : number;
        shouldResetScreen = false;
    } else {
        currentInput += number;
    }
    updateDisplay();
}

// add + - * / operators

function appendOperator(operator) {
    if (shouldResetScreen) shouldResetScreen = false;

    // to replace the last thing if it is operator

    const lastChar = currentInput.slice(-1);
    if (['+', '-', '*', '/'].includes(lastChar)) {
        currentInput = currentInput.slice(0, -1) + operator;
    } else {
        currentInput += operator;
    }
    updateDisplay();
}

// C button - clear everything

function clearScreen() {
    currentInput = '0';
    updateDisplay();
}

// backspace button

function backspace() {
    if (shouldResetScreen) {
        clearScreen();
        return;
    }
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = "0";
    }
    updateDisplay();
}

// = button - do calculations

function calculate() {
    try {
        let expression = currentInput;

        // remove operator at end like 5+
        if (['+', '-', '*', '/'].includes(expression.slice(-1))) {
            expression = expression.slice(0, -1);
        }

        const tokens = expression.match(/(\d+\.?\d*)|([\+\-\*\/])/g);
        if (!tokens) return;

        // first do multiplication and division using BODMAS rule

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '*' || tokens[i] === '/') {
                const op = tokens[i];
                const left = parseFloat(tokens[i - 1]);
                const right = parseFloat(tokens[i + 1]);
                let localResult = op === '*'? left * right : left / right;

                tokens.splice(i - 1, 3, localResult.toString());
                i--;
            }
        }

        // then do addition and subtraction

        let total = parseFloat(tokens[0]);
        for (let i = 1; i < tokens.length; i += 2) {
            const op = tokens[i];
            const nextVal = parseFloat(tokens[i + 1]);
            if (op === '+') total += nextVal;
            if (op === '-') total -= nextVal;
        }

        if (isNaN(total) ||!isFinite(total)) throw new Error();

        // round to 4 decimals so we don't get 0.333

        const finalResult = Number.isInteger(total)
           ? total.toString()
            : parseFloat(total.toFixed(4)).toString();

        // save in history

        logHistory(expression, finalResult);

        currentInput = finalResult;
        shouldResetScreen = true;
        updateDisplay();
    } catch (err) {
        screen.innerText = "Error";
        currentInput = "0";
        shouldResetScreen = true;
    }
}

// current input 

function updateDisplay() {
    screen.innerText = currentInput.replace(/\*/g, '×').replace(/\//g, '÷');
}

// history button 

function toggleHistory() {
    historyPanel.classList.toggle('open');
}

// save calculation to history array

function logHistory(expr, res) {
    const cleanExpr = expr.replace(/\*/g, '×').replace(/\//g, '÷');
    historyData.unshift({ expr: cleanExpr, res: res });

    // keep only last 30 calculations

    if (historyData.length > 30) historyData.pop();
    renderHistory();
}

// show history on screen

function renderHistory() {
    if (historyData.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
        return;
    }

    historyList.innerHTML = historyData.map((item, index) => `
        <div class="history-item" onclick="recallHistory(${index})">
            <div style="opacity: 0.6; font-size: 0.75rem;">${item.expr}</div>
            <div style="font-weight: 700;">= ${item.res}</div>
        </div>
    `).join('');
}

// click on old calculation to use it again

function recallHistory(index) {
    currentInput = historyData[index].res;
    shouldResetScreen = false;
    updateDisplay();
}

// dark mode button

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const targetTheme = currentTheme === 'dark'? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', targetTheme);
}

// keyboard supportx
document.addEventListener("keydown", (e) => {
    if (!isNaN(e.key) || e.key === ".") {
        appendNumber(e.key);
    } else if (["+", "-", "*", "/"].includes(e.key)) {
        appendOperator(e.key);
    } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        calculate();
    } else if (e.key === "Backspace") {
        backspace();
    } else if (e.key === "Escape") {
        clearScreen();
    }
});