export var name = "Spotlight";

var spotDivCont;
var spotlightData;

var codeToKillTask = function () {
    console.log(`<i> there's NOTHING!!!!!!!!!!!!!!!!!!!!!!!`);
}

export async function close() {
    codeToKillTask();
}

async function keyDown(event) {
    if (event.key === "Escape") {
        codeToKillTask();
    }
}

export async function launch(FS, UI, core) {
    function leftRightUpdate(resultsInfo, count, text) {
        resultsInfo.left.innerHTML = '';
        resultsInfo.right.innerHTML = '';

        if (count === 1) {
            resultsInfo.left.innerHTML = `${count} result (${text})`;
        } else {
            resultsInfo.left.innerHTML = `${count} results (${text})`;
        }

        const close = UI.button('Close', resultsInfo.right, 'button', 'ui-small-btn');
        close.addEventListener('click', function () {
            codeToKillTask();
        })
    }

    document.addEventListener('keydown', (event) => keyDown(event));
    reIndex(UI, FS, core);
    spotDivCont = UI.create('div', document.body, 'spotlight-flex-container');
    spotDivCont.addEventListener('click', function (event) {
        if (event.target === spotDivCont) {
            codeToKillTask();
        }
    });
    const spotDiv = UI.create('div', spotDivCont, 'spotlight-window');
    const wtfamidoing = UI.create('style', spotDiv);
    wtfamidoing.textContent = `
.spotlight-flex-container {
    position: fixed;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    padding: 20px;
    z-index: 999999;
}

.spotlight-window {
    width: 500px;
    background-color: rgba(var(--ui-1), 1);
    border: 1px solid rgba(var(--ui-1-border-color), 1.0);
    border-radius: var(--radii-main);
    box-shadow: var(--big-shadow);
    padding: 20px;
    overflow: auto;
    max-width: 95% !important;
    max-height: 95% !important;
}`;

    const omnibox = UI.input(spotDiv, 'Search for anything...', 'text', 'wide');
    omnibox.focus();
    const resultsInfo = UI.leftRightLayout(undefined, spotDiv);
    const results = UI.create('div', spotDiv);
    results.style.maxHeight = "60vh";
    let lastFs;
    leftRightUpdate(resultsInfo, 0, "waiting for input");
    UI.text("Spotlight", results, "big-text");
    UI.text("- Start search with / to look for files", results);
    UI.text("- Search without / to find anything else", results);
    UI.text(`You can use arrow keys and Enter to navigate`, results);

    // arrow nav key code was made by AI because im a lazy fuck

    let selectedIndex = -1;

    function updateSelection(results) {
        const items = results.querySelectorAll('.list-item');
        items.forEach((el, i) => {
            el.classList.toggle('list-item-fake-focus', i === selectedIndex);
        });
    }

    async function handler(file) {
        if (file) {
            const thing = await FS.checkType(file);
            UI.openFile(thing, "directory");
            UI.openFile(thing, thing.kind);
            codeToKillTask();
        }
    }

    omnibox.addEventListener('keydown', async (e) => {
        const items = results.querySelectorAll('.list-item');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(results);
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection(results);
        }

        if (e.key === 'Enter' && selectedIndex !== -1) {
            e.preventDefault();
            const item = items[selectedIndex];
            const file = item.dataset.data;
            handler(file);
        }
    });

    function focusFirstEl() {
        selectedIndex = 0;
        updateSelection(results);
    }

    omnibox.addEventListener('input', async () => {
        const query = omnibox.value.trim().toLowerCase();

        if (!query || omnibox.value === "") {
            results.innerHTML = "";
            selectedIndex = -1;
            leftRightUpdate(resultsInfo, 0, "waiting for input");
            UI.text("Spotlight", results, "big-text");
            UI.text("- Start search with / to look for files", results);
            UI.text("- Search without / to find anything else", results);
            UI.text(`You can use arrow keys and Enter to navigate`, results);
            return;
        }

        let firstItem = true;
        let count = 0;
        results.innerHTML = '';
        selectedIndex = -1;
        for (const item of spotlightData) {
            if (item.name.toLowerCase().includes(query)) {
                count = count + 1;
                const row = UI.create('div', results, 'list-item');
                row.innerHTML = `<span class="bold">${item.type}</span> ${item.name}`;
                if (item.type === "app") {
                    row.dataset.data = item.path;
                    row.addEventListener('click', function () {
                        handler(item.path);
                    });
                } else if (item.type === "directory" || item.type === "file") {
                    row.dataset.data = item.path;
                    row.addEventListener('click', function () {
                        handler(item.path);
                    });
                }

                if (firstItem === true) {
                    firstItem = false;
                    focusFirstEl();
                }
            }
        }
        leftRightUpdate(resultsInfo, count, "general search");
    });

    codeToKillTask = function () {
        core.removeModule(id);
        UI.remove(spotDivCont);
        document.removeEventListener('keydown', (event) => keyDown(event));
    }
}

export async function reIndex(UI, FS, core) {
    const processing = [];
    const ignoreList = await FS.read('/apps/Spotlight.app/spotlight-ignore.json');
    const ignore = JSON.parse(ignoreList);

    // scanFS mostly written by ChatGPT

    async function scanFS(path) {
        const data = [];
        const entries = Object.values(await FS.ls(path));
        console.log(entries);

        for (const entry of entries) {
            const ignoref = ignore.ignoreList.some(p =>
                entry.path === p || entry.path.startsWith(p + "/")
            );

            if (ignoref) continue;

            if (entry.kind === "directory") {
                if (entry.name.endsWith(".app")) {
                    const test = Object.values(await FS.ls(entry.path));
                    if (test.some(i => i.kind === "file" && i.name === "index.js")) {
                        data.push({ type: "app", name: entry.name, path: entry.path });
                    }
                } else {
                    data.push({ type: "directory", name: entry.name, path: entry.path });
                }

                data.push(...await scanFS(entry.path));
            } else {
                data.push({ type: "file", name: entry.path, path: entry.path });
            }
        }

        return data;
    }

    const thing = await scanFS('/');

    // okay this was written by me

    thing.forEach(async function (file) {
        processing.push({
            type: file.type,
            name: file.name,
            path: file.path
        });
    });

    spotlightData = processing;
    console.log('Indexed:', spotlightData);
}
