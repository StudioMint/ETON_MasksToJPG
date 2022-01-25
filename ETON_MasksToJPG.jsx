#target photoshop
var scriptFolder = (new File($.fileName)).parent; // The location of this script

// Keeping the ruler settings to reset in the end of the script
var startRulerUnits = app.preferences.rulerUnits;
var startTypeUnits = app.preferences.typeUnits;
var startDisplayDialogs = app.displayDialogs;

// Changing ruler settings to pixels for correct image resizing
app.preferences.rulerUnits = Units.PIXELS;
app.preferences.typeUnits = TypeUnits.PIXELS;
app.displayDialogs = DialogModes.NO;

// VARIABLES

var folderPSD, filesPSD, dir_Masks, lyr_Group1;
var saveJPGs = [];
var groupOrder = 0;
var bridgeRun = true;
var processedFiles = 0;
var d, timeStart;
var errorLog = ["Error log:\n"];

try {
    init();
} catch(e) {
    alert("Error code " + e.number + " (line " + e.line + "):\n" + e);
}

// Reset the ruler
app.preferences.rulerUnits = startRulerUnits;
app.preferences.typeUnits = startTypeUnits;
app.displayDialogs = startDisplayDialogs;

function init() {
    
    app.bringToFront();

    // if (app.documents.length != 0) return alert("Please close any open documents before continuing");

    filesPSD = GetFilesFromBridge();
    if (filesPSD.length == 0) {
        if (app.documents.length == 0) throw new Error("No documents open or opened thru Bridge.");
        filesPSD = [activeDocument];
        bridgeRun = false;
    }
    folderPSD = filesPSD[0].path;

    main();

}

function main() {

    d = new Date();
    timeStart = d.getTime() / 1000;

    for (i = 0; i < filesPSD.length; i++) {
        try {

            saveJPGs = []; // TODO: Contact sheet of all saved jpgs
            groupOrder = 0;
            if (bridgeRun) open(filesPSD[i]);
        
            if (activeDocument.layers.getByName("Group 1").typename == "LayerSet") {
                lyr_Group1 = activeDocument.layers.getByName("Group 1");
            } else {
                throw new Error("The \"Group 1\" group was not found.");
            }

            dir_Masks = new Folder(folderPSD + "/MaskCheck");
            if (!dir_Masks.exists) dir_Masks.create();
            saveAsJPG(dir_Masks, activeDocument.name.substring(0, activeDocument.name.lastIndexOf(".")) + "_" + groupOrder);
            groupOrder++;

            activeDocument.activeLayer = lyr_Group1;
            saveMask();

            for (j = 0; j < lyr_Group1.layerSets.length; j++) {
                activeDocument.activeLayer = lyr_Group1.layerSets[j];
                saveMask();
                if (activeDocument.activeLayer.typename == "LayerSet" && activeDocument.activeLayer.name.toLowerCase() == "adj") {
                    var lyr_Adj = activeDocument.activeLayer;
                    for (k = 0; k < lyr_Adj.layerSets.length; k++) {
                        activeDocument.activeLayer = lyr_Adj.layerSets[k];
                        saveMask();
                    }
                }
            }

            processedFiles++;
            if (!bridgeRun) activeDocument.close(SaveOptions.DONOTSAVECHANGES);

        } catch(e) {
            errorLog.push(activeDocument.name + " @ " + e.line + ": " + e.message);
            if (!bridgeRun) activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        }
        
    }

    var d = new Date();
    var timeEnd = d.getTime() / 1000;
    var timeFull = timeEnd - timeStart;
    if (bridgeRun) {
        if (errorLog.length != 1) {
            var date = d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes();
            saveTxt(date + "\n" + processedFiles + " files processed\n\n" + errorLog.join("\n---\n"), "ERRORLOG", scriptFolder, ".txt");
            alert(processedFiles + " files processed!\nSaved to: " + dir_Masks + "\nTime elapsed " + formatSeconds(timeFull) + "\n\n" + errorLog.join("\n"));
        } else {
            alert(processedFiles + " files processed!\nSaved to: " + dir_Masks + "\nTime elapsed " + formatSeconds(timeFull));
        }
    }

}

function saveMask() {
    if (activeDocument.activeLayer.typename != "LayerSet") return;
    if (enterMask()) {
        activeDocument.selection.selectAll();
        activeDocument.selection.copy();
        activeDocument.selection.deselect();
        exitMask();
        app.documents.add(activeDocument.width.value, activeDocument.height.value, activeDocument.resolution, activeDocument.name.substring(0, activeDocument.name.lastIndexOf(".")) + "_"  + groupOrder + "_" + activeDocument.activeLayer.name.replace(/ /g, '-'), NewDocumentMode.RGB, DocumentFill.WHITE, 1)
        activeDocument.paste();
        activeDocument.flatten();
        var savedFile = saveAsJPG(dir_Masks, activeDocument.name);
        groupOrder++;
        saveJPGs.push(savedFile);
        activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    };
}

function GetFilesFromBridge() {

    var fileList = [];
    if (BridgeTalk.isRunning("bridge")) {
        var bt = new BridgeTalk();
        bt.target = "bridge";
        bt.body = "var theFiles = photoshop.getBridgeFileListForAutomateCommand();theFiles.toSource();";
        bt.onResult = function(inBT) { fileList = eval(inBT.body); }
        bt.onError = function(inBT) { fileList = new Array(); }
        bt.send(8);
    }
    return fileList; 

};

function enterMask() {
    try {
        var idselect = stringIDToTypeID( "select" );
        var desc68 = new ActionDescriptor();
        var idnull = stringIDToTypeID( "null" );
             var ref49 = new ActionReference();
             var idchannel = stringIDToTypeID( "channel" );
             var idchannel = stringIDToTypeID( "channel" );
             var idmask = stringIDToTypeID( "mask" );
             ref49.putEnumerated( idchannel, idchannel, idmask );
        desc68.putReference( idnull, ref49 );
        var idmakeVisible = stringIDToTypeID( "makeVisible" );
        desc68.putBoolean( idmakeVisible, true );
        executeAction( idselect, desc68, DialogModes.NO );
        return true;
    } catch(e) { // No mask
        return null;
    }
}

function exitMask() {
    try {
        var idselect = stringIDToTypeID( "select" );
        var desc71 = new ActionDescriptor();
        var idnull = stringIDToTypeID( "null" );
             var ref52 = new ActionReference();
             var idchannel = stringIDToTypeID( "channel" );
             var idchannel = stringIDToTypeID( "channel" );
             var idRGB = stringIDToTypeID( "RGB" );
             ref52.putEnumerated( idchannel, idchannel, idRGB );
        desc71.putReference( idnull, ref52 );
        var idmakeVisible = stringIDToTypeID( "makeVisible" );
        desc71.putBoolean( idmakeVisible, false );
        executeAction( idselect, desc71, DialogModes.NO );
        return true;
    } catch(e) { // No mask
        return null;
    }
}

function saveAsJPG(folder, name) {
    jpgFile = new File(folder + "/" + name + ".jpg");
    // if (jpgFile.exists) if (!confirm("Overwrite?\nA file with this name in this location already exists.\nDo you want to overwrite that file?")) return;
    jpgSaveOptions = new JPEGSaveOptions();
    jpgSaveOptions.embedColorProfile = true;
    jpgSaveOptions.formatOptions = FormatOptions.STANDARDBASELINE;
    jpgSaveOptions.matte = MatteType.NONE;
    jpgSaveOptions.quality = 8;
    activeDocument.saveAs(jpgFile, jpgSaveOptions, true, Extension.LOWERCASE);
    return jpgFile;
}

function formatSeconds(seconds) {
    var sec_num = parseInt(seconds, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

function saveTxt(text, name, path, ext) {
    if (!ext) ext = ".txt";
    var saveFile = File(Folder(path) + "/" + name + ext);
    if (saveFile.exists) saveFile.remove();
    saveFile.encoding = "UTF8";
    saveFile.open("e", "TEXT", "????");
    saveFile.writeln(text);
    saveFile.close();
}