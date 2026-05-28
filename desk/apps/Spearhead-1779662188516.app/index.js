export var name = "Spearhead";

export async function launch(FS, UI, WD) {
    const window = UI.window('Spearhead', WD.tasks[id].task);
    window.main.window.style.maxWidth = "420px";
    const welcomeDiv = UI.create('div', window.main.content);
    UI.text('Use left arrow to go back, down arrow to delete, and right arrow to keep', welcomeDiv);
    const btn = UI.button('Open folder', welcomeDiv, 'md-filled-button');
    btn.addEventListener('click', async function () {
        const root = await BrowserFS.requestAccess();
        await root.mkdir('WebDesk-Spearhead/Deleted');
        await root.mkdir('WebDesk-Spearhead/Compressed');
        await root.mkdir('WebDesk-Spearhead/Normal');

        async function getImages(folder, path = '/') {
            const excluded = ['WebDesk-Spearhead/Deleted', 'WebDesk-Spearhead/Compressed', 'WebDesk-Spearhead/Normal'];
            const images = [];

            async function recurse(currentPath) {
                const entries = await folder.ls(currentPath);
                for (const entry of entries) {
                    if (entry.kind === 'directory') {
                        if (!excluded.includes(entry.name)) {
                            await recurse(entry.path);
                        }
                    } else {
                        const type = await folder.checkType(entry.path);
                        if (type === 'image') images.push(entry);
                    }
                }
            }

            await recurse.call(root, path);
            return images;
        }

        var index = 0;
        const newin = await root.read('/WebDesk-Spearhead/index');
        if (newin) index = Number(newin);

        var images = await getImages(root);
        const history = []; // { index, action, name }

        welcomeDiv.remove();
        const imgContainer = UI.create('div', window.main.content);
        window.main.content.style.padding = "0px";

        async function renderImage(index2) {
            if (index2 >= images.length) {
                imgContainer.innerHTML = "";
                UI.text('All done!', imgContainer);
                UI.text('To finish, go into the folder on your computer, navigate into "WebDesk-Spearhead", then navigate to "Normal" to see your cleaned up photos.', imgContainer);
                return;
            }

            imgContainer.innerHTML = "";
            const imgData = await root.read(images[index2].path);
            const img = UI.create('img', imgContainer);
            img.style.maxHeight = "75%";
            img.style.maxWidth = "420px";
            const url = URL.createObjectURL(imgData);
            img.src = url;
            img.onload = () => URL.revokeObjectURL(url);

            async function handleArrowKeys(event) {
                switch (event.key) {
                    case "ArrowLeft": {
                        if (history.length === 0) return;
                        document.removeEventListener('keydown', handleArrowKeys);
                        UI.snack('Back', 600);
                        const last = history.pop();
                        const folder = last.action === 'kept' ? 'Normal' : 'Deleted';
                        await root.rm(`/WebDesk-Spearhead/${folder}/${last.name}`);
                        index = last.index;
                        await root.write('/WebDesk-Spearhead/index', index);
                        await renderImage(index);
                        break;
                    }
                    case "ArrowDown": {
                        document.removeEventListener('keydown', handleArrowKeys);
                        UI.snack('Deleted', 600);
                        await root.write('/WebDesk-Spearhead/Deleted/' + images[index2].name, imgData);
                        history.push({ index: index2, action: 'deleted', name: images[index2].name });
                        index++;
                        await root.write('/WebDesk-Spearhead/index', index);
                        await renderImage(index);
                        break;
                    }
                    case "ArrowRight": {
                        document.removeEventListener('keydown', handleArrowKeys);
                        UI.snack('Kept', 600);
                        await root.write('/WebDesk-Spearhead/Normal/' + images[index2].name, imgData);
                        history.push({ index: index2, action: 'kept', name: images[index2].name });
                        index++;
                        await root.write('/WebDesk-Spearhead/index', index);
                        await renderImage(index);
                        break;
                    }
                }
            }

            document.addEventListener('keydown', handleArrowKeys);
        }
        await renderImage(index);
    });

    window.finish();
}