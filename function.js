const select = document.getElementById("gridSize");
const grid = document.getElementById("grid");
let useScaledSize = false;

document.getElementById("switch").addEventListener("click", () => {
    useScaledSize = !useScaledSize;
    console.log("useScaledSize ist jetzt:", useScaledSize);
});

const mainPreviewToggle = document.getElementById("mainPreviewToggle");

if (mainPreviewToggle) {
    mainPreviewToggle.addEventListener('click', () => {

        document.body.classList.toggle('full-screen-preview');

        if (document.body.classList.contains('full-screen-preview')) {
            mainPreviewToggle.textContent = "Vorschau beenden";
        } else {
            mainPreviewToggle.textContent = "Vorschau starten";
        }
    });
}


const togglePreviewButton = document.getElementById("togglePreviewButton");
if (togglePreviewButton) {
    togglePreviewButton.addEventListener('click', () => {
        document.body.classList.toggle('preview-mode');
    });
}

function createGrid(sizeString) {
    grid.innerHTML = "";

    const [cols, rows] = sizeString.split('x').map(Number);

    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
   
    for (let i = 0; i < cols * rows; i++) { 
        const cell = document.createElement("div");
        cell.className = "grid-cell";

        const plus = document.createElement("div");
        plus.className = "plus";
        plus.textContent = "+";
        plus.addEventListener("click", () => {
            showPreview("+", "transparent");
        });

        cell.appendChild(plus);
        grid.appendChild(cell);
    }
    grid.style.setProperty('--grid-size', cols); 
}

function setupDraggables() {
    const allDraggables = document.querySelectorAll('.patterns > div');

    allDraggables.forEach(item => {
        const cloneHTML = item.innerHTML;
        const classList = Array.from(item.classList);
        const color = item.style.backgroundColor || 'white';

        item.draggable = true;

        item.addEventListener('dragstart', e => {
            const patternSize = parseInt(document.getElementById("patternSize").value) || 1;
            e.dataTransfer.setData('text/plain', JSON.stringify({
                html: cloneHTML,
                classes: classList,
                color,
                patternSize 
            }));
        });

        item.addEventListener("click", () => {
            showPreviewFromHTML(cloneHTML, classList, color);
        });
    });
}

grid.addEventListener('dragover', e => e.preventDefault());

grid.addEventListener('drop', e => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('text/plain');
    let data;
    try { data = JSON.parse(dataStr); } catch { return; }

    const target = e.target.closest('.grid-cell');
    if (!target || target.querySelector('.draggable')) return; 

    const patternSize = data.patternSize || 1; 

    const currentGridSizeString = document.getElementById("gridSize").value;
    const [gridCols, gridRows] = currentGridSizeString.split('x').map(Number);

    const startIndex = Array.from(grid.children).indexOf(target);
    const startX = startIndex % gridCols; 
    const startY = Math.floor(startIndex / gridCols); 

    if (startX + patternSize > gridCols || startY + patternSize > gridRows) {
        alert("Muster passt nicht in das Raster an dieser Stelle.");
        return;
    }

    for (let dy = 0; dy < patternSize; dy++) {
        for (let dx = 0; dx < patternSize; dx++) {
            const cellIndex = (startY + dy) * gridCols + (startX + dx);
            const cell = grid.children[cellIndex];
            if (!cell || cell.querySelector('.draggable') || cell.querySelector('.occupied')) {
                alert("Zielbereich ist schon belegt oder ungültig.");
                return;
            }
        }
    }

    for (let dy = 0; dy < patternSize; dy++) {
        for (let dx = 0; dx < patternSize; dx++) {
            const cellIndex = (startY + dy) * gridCols + (startX + dx);
            const cell = grid.children[cellIndex];
            if (cell) {
                cell.innerHTML = ""; 
            }
        }
    }

    const firstCellIndex = startY * gridCols + startX;
    const firstCell = grid.children[firstCellIndex];

    const item = document.createElement("div");
    if (data.html && data.classes) {
        item.innerHTML = data.html;
        data.classes.forEach(cls => item.classList.add(cls));
    } else {
        item.className = "draggable";
        item.textContent = data.letter || "?";
    }

    item.style.backgroundColor = data.color || 'transparent';
    item.style.width = "100%";
    item.style.height = "100%";

    const isCentered = ["draggable1", "draggable4", "draggable5", "draggable7"].some(cls => item.classList.contains(cls));
    const size = useScaledSize ? "100%" : "70.7%";
    item.style.width = item.style.height = size;
    item.style.margin = isCentered ? "auto" : "0";
    item.style.transformOrigin = "center center";

    item.style.gridColumn = `span ${patternSize}`;
    item.style.gridRow = `span ${patternSize}`;

    item.draggable = true;

    item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
    });

    item.addEventListener("click", () => {
        data.html && data.classes
            ? showPreviewFromHTML(data.html, data.classes, data.color)
            : showPreview(data.letter, data.color);
    });

    firstCell.appendChild(item);

    for (let dy = 0; dy < patternSize; dy++) {
        for (let dx = 0; dx < patternSize; dx++) {
            if (dx === 0 && dy === 0) continue; 
            const cellIndex = (startY + dy) * gridCols + (startX + dx);
            const cell = grid.children[cellIndex];
            const blocker = document.createElement("div");
            blocker.classList.add("occupied");
            cell.appendChild(blocker);
        }
    }
});


function showPreviewFromHTML(html, classList, color = "transparent") {
    const previewArea = document.querySelector(".preview");
    previewArea.innerHTML = "";

    const item = document.createElement("div");
    item.innerHTML = html;
    classList.forEach(cls => item.classList.add(cls));
    item.classList.add("draggable");
    item.draggable = true;

    if (color) {
        item.style.backgroundColor = color;
    }

    const data = {
        html,
        classes: classList,
        color
    };

    item.addEventListener("dragstart", e => {
        const styles = getInlineStyles(item);
        const dragData = {
            html: item.innerHTML,
            classes: classList,
            color: styles["background-color"] || color,
            styles 
        };
        e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    });

    item.addEventListener("click", () => {
        showPreviewFromHTML(html, classList, color);
    });

    previewArea.appendChild(item);
    showColorConfig(item, data); 
}

function showColorConfig(container, data) {
    const colorSlots = document.querySelectorAll(".color-config .color-slot");

    colorSlots.forEach(slot => {
        const input = slot.querySelector("input");
        input.value = "#ffffff";
        input.disabled = true;
        input.oninput = null;
    });

    const elements = [container, ...container.querySelectorAll("*")];
    const colorMap = new Map();

    elements.forEach(el => {
        const styles = getComputedStyle(el);
        ["backgroundColor", "color", "borderColor"].forEach(prop => {
            const val = styles[prop];
            if (val && isColor(val)) {
                const hex = rgbToHex(val);
                if (!colorMap.has(hex)) {
                    colorMap.set(hex, []);
                }
                colorMap.get(hex).push({
                    element: el,
                    prop
                });
            }
        });
    });


    ([...colorMap.entries()]).slice(0, 4).forEach(([color, entries], index) => {
        const slot = colorSlots[index];
        if (!slot) return;

        const input = slot.querySelector("input");
        input.value = color;
        input.disabled = false;

        input.addEventListener("input", () => {
            const newColor = input.value;
            entries.forEach(({
                element,
                prop
            }) => {
                element.style[prop] = newColor;
            });
        });
    });

    const textEl = container.querySelector(".text-element");
    const textConfig = document.querySelector(".text-config");

    if (textEl && textConfig) {
        textConfig.style.display = "flex";

        const textInput = textConfig.querySelector("input[name='text-content']");
        const sizeInput = textConfig.querySelector("input[name='text-size']");
        const colorInput = textConfig.querySelector("input[name='text-color']");

        textInput.value = textEl.textContent;
        sizeInput.value = parseInt(getComputedStyle(textEl).fontSize) || 16;
        colorInput.value = rgbToHex(getComputedStyle(textEl).color);

        textInput.oninput = () => {
            textEl.textContent = textInput.value;
        };
        sizeInput.oninput = () => {
            textEl.style.fontSize = `${sizeInput.value}px`;
        };
        colorInput.oninput = () => {
            textEl.style.color = colorInput.value;
        };
    } else if (textConfig) {
        textConfig.style.display = "none";
    }
}

function isColor(val) {
    return /^rgba?\(/.test(val); 
}

function rgbToHex(rgb) {
    const result = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(rgb);
    if (!result) return "#ffffff";
    return "#" + result.slice(1, 4).map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

function getInlineStyles(element) {
    const styles = {};
    const style = element.getAttribute("style");
    if (!style) return styles;

    style.split(";").forEach(rule => {
        const [prop, value] = rule.split(":").map(s => s.trim());
        if (prop && value) styles[prop] = value;
    });

    return styles;
}

const preview = document.getElementById("preview");
const animationSwitch = document.getElementById("animationSwitch"); 

if (animationSwitch) { 
    animationSwitch.addEventListener("change", () => {
        const elements = [preview, grid];
        elements.forEach(el => {
            if (animationSwitch.checked) {
                el.classList.remove("disable-animations");
            } else {
                el.classList.add("disable-animations");
            }
        });
    });
}



createGrid(select.value); 
select.addEventListener("change", () => createGrid(select.value)); 

const patternContainer = document.querySelector(".patterns");
setupDraggables();


document.querySelector('#togglePreviewButton').addEventListener('click', () => {
    document.body.classList.toggle('preview-mode');
});


document.querySelector('.backButton').addEventListener('click', () => {
    document.body.classList.remove('full-screen-preview');
    document.body.classList.remove('preview-mode');
    if (mainPreviewToggle) {
        mainPreviewToggle.textContent = "Vorschau starten";
    }
});