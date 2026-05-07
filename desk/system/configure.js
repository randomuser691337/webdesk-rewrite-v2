// WebDesk post-install config script
async function regSetup() {
    if (!await set.read('WDDefaultEditor')) {
        await set.write('WDDefaultEditor', '/apps/TextEdit.app/index.js');
    }
    if (!await set.read('EditorTextSize')) {
        await set.write('EditorTextSize', '14px');
    }
    if (!await set.read('animsSlow')) {
        await set.write('animsSlow', '0.3');
    }
    if (!await set.read('animsMed')) {
        await set.write('animsMed', '0.2');
    }
    if (!await set.read('animsFast')) {
        await set.write('animsFast', '0.15');
    }
    // CHANGE AFTER STABLE RELEASE!!!
    if (!await set.read('FORCEUPDATE')) {
        await set.write('FORCEUPDATE', 'true');
    }
    if (!await FS.checkType(FS.normalizeUserPath('config/wallpaper'))) {
        await FS.cp('/system/img/wallpaper.jpg', FS.normalizeUserPath('config/wallpaper'));
    }
}