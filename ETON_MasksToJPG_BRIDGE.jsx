#target bridge
var scriptFolder = (new File($.fileName)).parent; // The location of this script

if (BridgeTalk.appName == "bridge") {
    newMenu = new MenuElement( "menu", "ETON", "at the end of Tools", "myMenu" ); 
    runjsx = MenuElement.create("command", "Masks to JPG", "at the end of myMenu");
}

runjsx.onSelect = function() {

    function script() {
        var scriptName = "ETON_MasksToJPG";
        var f = File(scriptFolder + "/PhotoshopScripts/" + scriptName + ".jsx");
        $.evalFile(f);
    }

    var bt = new BridgeTalk;
    bt.target = "photoshop";
    bt.body = " ftn = " + script.toSource() + "; ftn();";
    bt.send(8); 

};