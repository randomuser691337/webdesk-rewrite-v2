/* FOR MORE DETAILS ON HOW TO DEVELOP:
   - Visit /system/ui.js and read the comments under each UI element
   - Paste /system/ui.js into an AI and ask it questions about how the UI works
   - Use code from other WebDesk applications
   - Or ask me for help on Discord: @dbh_ra9
*/

export var name = "Example App";

export async function launch(FS, UI, WD) {
    // Creates a window
    const window = UI.window('Example App', WD.tasks[id].task);
    // If mobile mode is off, resize window to 260px
    if (WD.mobile === false) {
        window.main.window.style.width = "240px";
    }
    // Creates a div under the window's contents to contain the UI
    const mainView = UI.create('div', window.main.content);
    // Creates text
    UI.text("Example Application", mainView);
    // Creates container for list of files
    const fileListContainer = UI.create('div', mainView, 'general-container');
    // Lists files in the filesystem root
    const files = await FS.ls('/')
    files.forEach(async function (file) {
        // Creates file item
        const btn = UI.button('', fileListContainer, 'button', 'list-button');
        // Creates flex layout with left and right
        const layout = UI.leftRightLayout(undefined, btn);
        // Figures out file kind for icon
        if (file.kind === "directory") {
            UI.icon('folder', layout.left, 'symbol-style-files');
        } else {
            UI.icon('draft', layout.left, 'symbol-style-files');
        }
        // File name and button text
        const filetxt = UI.span(file.name, layout.left);
        filetxt.style.marginLeft = "var(--padding-small)";
        layout.right.innerText = "⋮";
        layout.right.style.paddingLeft = "30px";
        // Button click listener
        btn.addEventListener('click', async function () {
            // Decide action
            if (file.kind === "directory") {
                // Show alert to user (2500 is time until alert goes away)
                UI.snack("This app doesn't support directories", 2500);
            } else {
                // If button is clicked, open file with user's default app for that file type
                await UI.openFile(file.path);
            }
        });
    });
    window.finish();
}