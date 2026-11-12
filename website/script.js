const PIXEL_WIDTHS = {
    2: "i.,:;!|'",
    3: "l`",
    4: "It(){}[]<>*",
    5: "kf",
    7: "@~"
};

const MODES = {
    java: { 
        perView: 1, 
        button: document.getElementById("vanilla-java-view"),
        maxWidth: 114,
        maxPages: 100,
        maxCharsPerPage: 1023,
        maxTotalChars: 102300,
        maxLines: 14
    },
    scholar: { 
        perView: 2, 
        button: document.getElementById("scholar-view"),
        maxWidth: 114,
        maxPages: 100,
        maxCharsPerPage: 1023,
        maxTotalChars: 102300,
        maxLines: 14
    },
    bedrock: { 
        perView: 2, 
        button: document.getElementById("bedrock-view"),
        maxWidth: 121,
        maxPages: 50,
        maxCharsPerPage: 256,
        maxTotalChars: 12800,
        maxLines: 14
    },
};

DEFAULT_CHAR_WIDTH = 6;

let pageCount = 1;
let lineCount = 1; // per page
let pixelCount = 0; // per line

let pageCharCount = 0;
let totalCharCount = 0;

let pages = [];
let currentPage = 0;
let currentMode = "scholar";

let pagesPerView = 2;

const WARNINGS = {
    tooLongWords: {
        warn: false,
        message: () => "WARNING: The following words are too long for one line: ",
        details: []
    },
    tooManyPages: {
        warn: false,
        message: () => "WARNING: The maximum number of pages is " + MODES[currentMode].maxPages + ". Your text has been cut off.",
        details: []
    },
    tooManyTotalCharacters: {
        warn: false,
        message: () => "WARNING: The maximum number of characters is " + MODES[currentMode].maxTotalChars + ". Your text has been cut off.",
        details: []
    }
}

function addToPages(pixels, word, forceBreak = false) {
    let tail = "";

    if (pixels > MODES[currentMode].maxWidth) {
        WARNINGS.tooLongWords.warn = true;
        WARNINGS.tooLongWords.details.push(word);
        while (pixels > MODES[currentMode].maxWidth) {
            tail = word.charAt(word.length - 1) + tail;
            word = word.slice(0, -1);
            pixels = countWordPixels(word);
        }
    }

    // If the word will exeede the total character limit, cut characters off the word
    while (totalCharCount + word.length > MODES[currentMode].maxTotalChars) {
        word = word.slice(0, -1);
        pixels = countWordPixels(word)
        if (word == "") {
            return null;
        }
    }
    // If the word will exeede the page character limit, increase page count and return the tail
    const extra = (pixelCount > 0 && !forceBreak) ? 1 : 0;   // the leading space also counts
    if (pixelCount == 0) forceBreak = false;
    if (pageCharCount + extra + word.length > MODES[currentMode].maxCharsPerPage) {
        tail = word;
        pageCount += 1;
        lineCount = 1;
        pixelCount = 0;
        pageCharCount = 0;
        return tail;
    }
    pixels = countWordPixels(word);

    if (word != "") {
        const space = pixelCount > 0 ? 4 : 0;
        const needed = space + pixels;

        if (!forceBreak && pixelCount + needed <= MODES[currentMode].maxWidth) {
            let stuffToAdd = ""
            if (pixelCount > 0) stuffToAdd += " ";
            pixelCount += needed;
            stuffToAdd += word;
            writeToCurrentLine(stuffToAdd);
        } else if (lineCount < MODES[currentMode].maxLines) {
            pixelCount = pixels;
            lineCount += 1;
            writeToCurrentLine(word);
        } else {
            pixelCount = pixels;
            lineCount = 1;
            pageCount += 1;
            pageCharCount = 0;
            writeToCurrentLine(word);
        }
    }

    return tail;
}

function newParagraph() {
    if (lineCount >= MODES[currentMode].maxLines - 1) {
        pixelCount = 0;
        lineCount = 1;
        pageCount += 1;
        pageCharCount = 0;
    } else {
        lineCount += 2;
        pixelCount = 0;
    }
}

const charWidth = {};
for (const width in PIXEL_WIDTHS) {
    for (const char of PIXEL_WIDTHS[width]) {
        charWidth[char] = Number(width);
    }
}

function countWordPixels(word) {
    let pixels = 0;
    for (const char of word) {
        if (char in charWidth) {
            pixels += charWidth[char];
        } else {
            pixels += DEFAULT_CHAR_WIDTH;
        }
    }
    return pixels;
}

function writeToCurrentLine(text) {
    while (pages.length < pageCount) pages.push([]);
    const page = pages[pageCount - 1];
    while (page.length < lineCount) page.push("");
    page[lineCount - 1] += text;
    totalCharCount += text.length;
    pageCharCount += text.length;
}

function formatText(text) {
    text = filterText(text);
    // Reset the "globals" so each run starts fresh
    pageCount = 1;
    lineCount = 1;
    pixelCount = 0;
    pages = [];
    for (const w in WARNINGS) {
        WARNINGS[w].warn = false;
        WARNINGS[w].details = [];
    }
    pageCharCount = 0;
    totalCharCount = 0;

    const lines = text.split("\n");
    if (lines[lines.length - 1] === "") {
        lines.pop();   // a trailing newline isn't an extra line
    }

    for (const line of lines) {
        const words = line.split(/\s+/).filter(w => w !== "");
        let forceBreak = false;

        while (words.length > 0) {
            if (totalCharCount >= MODES[currentMode].maxTotalChars) {
                WARNINGS.tooManyTotalCharacters.warn = true;
                return pages;
            }
            else if (pageCount > MODES[currentMode].maxPages) {
                WARNINGS.tooManyPages.warn = true;
                return pages;
            }
            const w = words.shift();
            const tail = addToPages(countWordPixels(w), w, forceBreak);

            if (tail) {
                words.unshift(tail);   // leftover goes to the front of the list
                forceBreak = true;     // continuation must start on a new line
            } else {
                forceBreak = false;
            }
        }
        newParagraph();
    }
    return pages;
}

function printErrors() {
    warningDiv.replaceChildren();

    for (const w in WARNINGS) {
        if (!WARNINGS[w].warn) continue;

        let msg = WARNINGS[w].message();
        msg += WARNINGS[w].details.join(", ");

        const lineDiv = document.createElement("div");
        lineDiv.className = "warning-line";
        lineDiv.textContent = msg;
        warningDiv.append(lineDiv);
    }
}

const REPLACEMENTS = {
    "\u2018": "'",   // ‘ curly single quotes
    "\u2019": "'",   // ’
    "\u201C": '"',   // “ curly double quotes
    "\u201D": '"',   // ”
};

function filterText(text) {
    let result = "";
    for (const char of text) {
        result += (char in REPLACEMENTS) ? REPLACEMENTS[char] : char;
    }
    return result;
}

function copyPage(offset) {
    const page = pages[currentPage + offset];
    if (!page) return;

    let copy = "";
    for (let i = 0; i < page.length; i++) {
        copy += page[i];
        if (i != page.length - 1) {
            copy += "\n";
        }
    }
    navigator.clipboard.writeText(copy);
}

const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const vanillaJavaViewButton = document.getElementById("vanilla-java-view");
const scholarViewButton = document.getElementById("scholar-view");
const leftPageLabel = document.getElementById("left-label");
const rightPageLabel = document.getElementById("right-label");

const book = document.getElementById("book");
const leftDiv = document.getElementById("left-page");
const rightDiv = document.getElementById("right-page");
const warningDiv = document.getElementById("warnings");

function updateView() {
    // Keep currentPage in range and aligned to the spread size
    if (currentPage > pages.length - 1) currentPage = pages.length - 1;
    if (currentPage < 0) currentPage = 0;
    currentPage = currentPage - (currentPage % pagesPerView);

    renderPage(currentPage, leftDiv);
    renderPage(currentPage + 1, rightDiv);

    prevButton.disabled = currentPage <= 0;
    nextButton.disabled = currentPage + pagesPerView >= pages.length;
    
    if (currentMode == "java" || currentMode == "bedrock") {
        leftPageLabel.textContent = "Page " + (currentPage + 1) + " of " + Math.max(pages.length, 1);
        rightPageLabel.textContent = "Page " + (currentPage + 2) + " of " + Math.max(pages.length, 1);
    }
    else if (currentMode == "scholar") {
        leftPageLabel.textContent = currentPage + 1;
        rightPageLabel.textContent = currentPage + 2;
    }
}

prevButton.addEventListener("click", () => {
    currentPage -= pagesPerView;
    updateView();
});

nextButton.addEventListener("click", () => {
    currentPage += pagesPerView;
    updateView();
});

function setMode(name) {
    for (const m in MODES) book.classList.remove(m);
    book.classList.add(name);
    currentMode = name;
    pagesPerView = MODES[name].perView;
    formatText(inputBox.value);
    printErrors();
    updateView();
}

for (const name in MODES) {
    MODES[name].button.addEventListener("click", () => setMode(name));
}

const inputBox = document.getElementById("in");
const outputBox = document.getElementById("out");

function renderPage(pageIndex, targetDiv) {
    targetDiv.replaceChildren();

    const page = pages[pageIndex];
    if (!page) return;

    for (const text of page) {
        const lineDiv = document.createElement("div");
        lineDiv.className = "line";
        lineDiv.textContent = text;
        targetDiv.append(lineDiv);
    }
}

inputBox.addEventListener("input", () => {
    formatText(inputBox.value);
    printErrors();
    updateView();
});
formatText("");
printErrors();
updateView();

function downloadTextFile() {
    var text = "";

    for (let i = 0; i < pages.length; i++) {
        for (let j = 0; j < pages[i].length; j++) {
            if (pages[i][j] == "") {
                text += "\n\n"
            }
            else {
                text += pages[i][j];
                if (j != pages[i].length - 1) {
                    text += " ";
                }
            }
        }
        text += "";
    }

    var blob = new Blob([text], { type: 'text/plain' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'book.txt';
    link.click();
}

const dpr = window.devicePixelRatio || 1;
const scale = Math.max(1, Math.round(3 * dpr)) / dpr;
document.documentElement.style.setProperty('--scale', scale);