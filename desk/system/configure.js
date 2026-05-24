// WebDesk post-install config script
async function regSetup() {
    if (!await set.read('WDDefaultEditor')) {
        await set.write('WDDefaultEditor', '/apps/TextEdit-1779048336412.app/index.js');
    }
    if (!await set.read('WDDefaultMedia')) {
        await set.write('WDDefaultMedia', '/apps/Preview-1779048220692.app/index.js');
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
    if (!await set.read('font-family')) {
        await set.write('font-family', 'Poppins');
    }
    // CHANGE AFTER STABLE RELEASE!!!
    if (!await set.read('FORCEUPDATE')) {
        await set.write('FORCEUPDATE', 'true');
    }
    if (!await set.read('mobile')) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            await set.write('mobile', 'true');
        } else {
            await set.write('mobile', 'false');
        }

    }
    if (!await FS.checkType(FS.normalizeUserPath('config/wallpaper'))) {
        await FS.cp('/system/img/wallpaper.jpg', FS.normalizeUserPath('config/wallpaper'));
    }
}