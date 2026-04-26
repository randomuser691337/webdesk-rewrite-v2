// WebDesk post-install config script
async function regSetup() {
    if (!await set.read('WDDefaultEditor')) {
        await set.write('WDDefaultEditor', '/apps/TextEdit.app/index.js');
    }
    if (!await set.read('EditorTextSize')) {
        await set.write('EditorTextSize', '14px');
    }
}

regSetup();