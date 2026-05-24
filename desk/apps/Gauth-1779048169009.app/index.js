export var name = "WebGauth";
export async function launch(FS, UI, WD, path) {
    const window = UI.window('WebGauth');
    var pane = "";

    async function resize(blobUrl) {
        const bitmap = await createImageBitmap(await fetch(blobUrl).then(r => r.blob()));
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const aspectRatio = bitmap.height / bitmap.width;

        const targetWidth = 720;
        const targetHeight = Math.round(targetWidth * aspectRatio);

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

        bitmap.close?.();

        return canvas.toDataURL('image/jpeg', 0.82);
    }

    async function handleImage(file, div) {
        const txt = UI.text('Step 1/2: Recognizing text', div);
        const blob = new Blob([file.content]);
        const imgURL = await URL.createObjectURL(blob);
        const fast = await resize(imgURL);
        const OCRData = await WD.OCR(fast);

        txt.innerText = "Step 2/2: Answering questions (Tokens per second: 0)";
        let llmResponse = "";
        let messages = [];

        let tps = 0;

        const tpsCount = setInterval(function () {
            txt.innerText = `Step 2/2: Answering questions (Tokens per second: ${tps})`;
            tps = 0;
        }, 1000);

        messages.push({ content: await FS.read('/apps/Gauth-1779048169009.app/answer.txt'), role: "system" });
        const response2 = await WD.LLM.sendToLLM(messages, OCRData, function (token) {
            tps++;
            llmResponse += token;
        });

        clearInterval(tpsCount);

        const newPane = panes.results(response2);
        window.main.content.appendChild(newPane);
        UI.anims.crossFade(pane, newPane, 'block').then(function () {
            pane.remove();
            pane = newPane;
        });
    }

    const panes = {
        loader: function () {
            const div = UI.create('div');
            div.style.width = "320px";
            UI.text('WebGauth is loading the AI. Look at the top right for status updates.', div);
            const special = UI.text('', div);
            special.innerHTML = "<b>Tips:</b> Close all the tabs you can. AI is resource-intensive, and low-end laptops can't handle it well.";
            return div;
        },
        home: function () {
            const div = UI.create('div');
            div.style.width = "320px";
            const welcomeTxt = UI.text('WebGauth is initializing the AI. Check the notification in the top right for status updates.', div);
            welcomeTxt.innerText = 'WebGauth is based off of small AI. WebGauth may make mistakes.';

            const btncontainer = UI.create('div', div, 'button-list-horizontal');

            const btn = UI.button('Upload worksheet', btncontainer, 'md-outlined-button');
            btn.addEventListener('click', async function () {
                const file = await FS.uploadFileFromBrowser();
                if (file.isImage === true) {
                    btncontainer.remove();
                    await handleImage(file, div)
                }
            });

            const pasteBtn = UI.button('Paste image', btncontainer, 'md-outlined-button');

            pasteBtn.addEventListener('click', async function () {
                try {
                    const items = await navigator.clipboard.read();
                    let found = false;

                    for (const item of items) {
                        const imageType = item.types.find(t => t.startsWith('image/'));
                        if (imageType) {
                            found = true;
                            btncontainer.remove();
                            const blob = await item.getType(imageType);
                            const arrayBuffer = await blob.arrayBuffer();
                            handleImage({ content: arrayBuffer, isImage: true }, div);
                            break;
                        }
                    }

                    if (!found) alert("No image found in clipboard.");
                } catch (err) {
                    console.error(err);
                    alert("Clipboard access failed. Try Ctrl+V instead.");
                }
            });

            return div;
        },
        results: function (text, showReasoning) {
            const div = UI.create('div');
            div.style.width = "480px";

            function stripThink(text) {
                if (showReasoning !== true) {
                    if (!text || typeof text !== "string") return text;

                    const tag = "</think>";
                    const idx = text.toLowerCase().indexOf(tag);

                    if (idx === -1) return text;

                    return text.slice(idx + tag.length).trim();
                } else {
                    return text;
                }
            }

            if (text !== "DATA_UNREADABLE") {
                UI.text('WebGauth processing finished', div);

                const textArea = UI.create('div', div, 'bar');
                textArea.innerHTML = stripThink(text);
                textArea.style = "overflow: auto !important; max-height: 500px; margin-bottom: var(--padding-small)";
            } else {
                UI.text('Could not process', div);
                UI.text(`The AI couldn't read the text. Take a better picture and try again.`, div);
            }

            const btnCont = UI.create('div', div, 'column-button-container');

            const btn = UI.button('Back', btnCont, 'md-outlined-button');
            btn.addEventListener('click', async function () {
                const pane2 = panes.home();
                window.main.content.appendChild(pane2);
                UI.anims.crossFade(pane, pane2, 'block').then(function () {
                    pane.remove();
                    pane = pane2;
                });
            });

            if (showReasoning !== true) {
                const intReason = UI.button('See reasoning process', btnCont, 'md-outlined-button');
                intReason.addEventListener('click', async function () {
                    const pane2 = panes.results(text, true);
                    window.main.content.appendChild(pane2);
                    UI.anims.crossFade(pane, pane2, 'block').then(function () {
                        pane.remove();
                        pane = pane2;
                    });
                });
            }

            return div;
        }
    }

    async function checkSupport() {
        if (!navigator.gpu) {
            return false;
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            return false;
        }

        return true;
    }

    if (await checkSupport() === true) {
        const newPane = panes.loader();
        pane = newPane;
        window.main.content.appendChild(newPane);
        window.finish();
        if (WD.LLM.loaded !== true) {
            await WD.startLLM();
        }
        const pane2 = panes.home();
        window.main.content.appendChild(pane2);
        UI.anims.crossFade(pane, pane2, 'block').then(function () {
            pane.remove();
            pane = pane2;
        });
    } else {
        UI.text(`Enable WebGPU support`, window.main.content, 'bold');
        UI.text(`To enable WebGPU support on Chrome:`, window.main.content);
        UI.text(`- Go to chrome://flags`, window.main.content);
        UI.text(`- Search for and enable "Unsafe WebGPU support"`, window.main.content);
        UI.text(`- Restart Chrome (or your device)`, window.main.content);
    }
}