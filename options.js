import {settings, global} from "./settings.js";
import {log} from "./message.js";
import {initMover, initExporter} from "./tools.js";
import {gtev} from "./utils.js";

function getAsync(file) {
    var r;
    var z, i, elmnt, xhttp;
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                r=this.response;
            }
            if (this.status == 404) {}
        }
    };
    xhttp.open("GET", file, false); // async
    xhttp.send();
    return r;
}
function createRdfField(k, v){
    var NAME_I18N = browser.i18n.getMessage("Name");
    var FILE_I18N = browser.i18n.getMessage("File");
    var $el = $(`<div class='rdf-row'>${NAME_I18N} <input type="text" name="name"/>
${FILE_I18N} <input type="text" name="value"/>
<input type="button" name="move" value="↑" />
<input type="button" name="move" value="↓" />
<input type="button" name="del" value="-" /></div>`).appendTo($("#rdf-area"));
    $el.find("input[name=name]").val(k);
    $el.find("input[name=value]").val(v);
    $el.find("input[name=del]").click(function(){
        $(this).parent().remove();
    });
    $el.find("input[name=move]").click(function(){
        var up = (this.value == '↑');
        var $you;
        var $p = $(this).parent();
        if(up){
            $you = $p.prev(".rdf-row");
            if($you)$you.before($p);
        }else{
            $you = $p.next(".rdf-row");
            if($you)$you.after($p);
        }
    });
}
function showConfiguration(){
    $("#rdf-area").html("");
    $("input[name='save']").click(function(){
        try{
            var names=[];
            var paths=[];
            $("#rdf-area div input:first-child").each(function(){
                var t = $.trim(this.value);
                names.push(t+"\n");
                paths.push($.trim($(this).next("input").val())+"\n");
            });
            settings.set('rdf_paths', paths.join(""), true);
            settings.set('rdf_path_names', names.join(""), true);
            settings.set('backend_port', $("input[name=backend_port]").val(), true);
            settings.set('bg_color', $("input[name=bg_color]").val().replace("#", ""), true);
            settings.set('font_color', $("input[name=font_color]").val().replace("#", ""), true);
            settings.set('separator_color', $("input[name=separator_color]").val().replace("#", ""), true);
            settings.set('bookmark_color', $("input[name=bookmark_color]").val().replace("#", ""), true);
            settings.set('focused_bg_color', $("input[name=focused_bg_color]").val().replace("#", ""), true);
            settings.set('focused_fg_color', $("input[name=focused_fg_color]").val().replace("#", ""), true);
            var size = (parseInt($("input[name=font_size]").val() / 5) * 5) / 100 * 12;
            settings.set('font_size', size, true);
            settings.set('font_name', $("input[name=font_name]").val(), true);
            settings.set('line_spacing', $("input[name=line_spacing]").val(), true);
            settings.set('open_in_current_tab', $("input[name=open_in_current_tab]").is(":checked")?"on":"off", true);
            settings.set('lock_editbar', $("input[name=lock_editbar]").is(":checked")?"on":"off", true);
            settings.set('auto_close_saving_dialog', $("input[name=auto_close_saving_dialog]").is(":checked")?"on":"off", true);
            settings.set('saving_save_frames', $("input[name=saving_save_frames]").is(":checked")?"on":"off", true);
            $(this).next("span").fadeIn().fadeOut();
        }catch(e){
            alert("Save failed");
        }
    });
    var paths = settings.getRdfPaths();
    if(paths){
        settings.getRdfPathNames().forEach(function(k, i){
            createRdfField(k, paths[i]);
        });
    }
    $("input[name=font_size]").bind("input", function(){ // bind 'input' instead of 'change' event
        $(this).next("span").text((parseInt(this.value / 5) * 5) +"%");
    });
    $("input[name=line_spacing]").bind("input", function(){ // bind 'input' instead of 'change' event
        $(this).next("span").text(parseInt(this.value));
    });
    ["bg", "font", "separator", "bookmark", "focused_fg", "focused_bg"].forEach(function(pfx){
        var name = pfx + "_color";
        var value = (settings[name] || "").replace("#", "");
        var element = $(`input[name='${name}']`)[0];
        element.value = value;
        if(element.jscolor){
            element.jscolor.fromString(value); /** for updating */
        }
    });
    jscolor.installByClassName("jscolor");
    $("input[name=font_size]").val((settings.font_size / 12) * 100).trigger("input");
    $("input[name=font_name]").val(settings.font_name);    
    $("input[name=line_spacing]").val(settings.line_spacing).trigger("input");
    $("input[name=backend_port]").val(settings.backend_port);
    $("input[name=open_in_current_tab]").prop("checked", settings.open_in_current_tab=="on");
    $("input[name=lock_editbar]").prop("checked", settings.lock_editbar=="on");
    $("input[name=auto_close_saving_dialog]").prop("checked", settings.auto_close_saving_dialog=="on");
    $("input[name=saving_save_frames]").prop("checked", settings.saving_save_frames=="on");
}
window.onload=async function(){
    await settings.loadFromStorage();
    var lang = "en";
    var ui = browser.i18n.getUILanguage();
    if(["en", "zh-CN", "fr"].indexOf(ui) > -1) {
        lang = ui;
    }
    document.title = document.title.translate();
    document.body.innerHTML = document.body.innerHTML.translate();
    $("#div-announcement").html($("#div-announcement").html().replace(/#(\d+\.\d+\.\d+)#/ig, "<b>V$1</b>"))
    $("#div-help").html(getAsync("_locales/" + lang + "/help.html"));
    $(".tab-button").each((i, el)=>{
        $(el).click((e)=>{
            $(".tab-button").removeClass("focused");
            $(e.target).addClass("focused");
            $(".tab-content").hide();
            $(".tab-content").eq(i).show();
        });
    });
    $(".tab-button").eq(0).click();
    /** export / import */
    $("input[name='export']").click(async function(){
        var json = await settings.getJson();
        downloadText(JSON.stringify(json, null, 2), "scrapbee_configure.json", null, true);
    });
    $("input[name='import']").click(async function(){
        document.getElementById("import_file").onchange=function(){
            var fileToLoad = document.getElementById("import_file").files[0];
            var fileReader = new FileReader();
            fileReader.onload = function(fileLoadedEvent){
                var textFromFileLoaded = fileLoadedEvent.target.result;
                try{
                    var json = JSON.parse(textFromFileLoaded);
                    settings.loadJson(json);
                    showConfiguration();
                }catch(e){
                    alert("Invalid configuration file".translate());
                }
            };
            fileReader.readAsText(fileToLoad, "UTF-8");
        };
        document.getElementById("import_file").click();
    });
    /** tools */
    function initTools(version){
        if(gtev(version, '1.7.0')){
            initMover();
            initExporter();
            log.info("Tools initiated successfully.")
        }else{
            log.error("Can not initiate tools, make sure backend 1.7.0 or later installed.")
        }
    }
    browser.runtime.sendMessage({type: 'GET_BACKEND_VERSION'}).then((version) => {
        initTools(version);
    });
    function findOffsetParent(el){
        var r = document.body;
        var p = el.parentNode;
        while(p){
            var style =  window.getComputedStyle(p, null).getPropertyValue('position');
            if(style == "absolute" || style == "relative"){
                r = p;
                break;
            }
            p = p.parentNode;
        }
        return r;
    }
    /** help mark */
    $(".help-mark, .warn-mark").hover(function(e){
        var parent = findOffsetParent(e.target);
        var offset = parent.getBoundingClientRect();
        $(this).next(".tips.hide").show().css({
            left: e.clientX - offset.left + "px",
            top:  e.clientY - offset.top + "px",
        });
    }, function(){
        $(this).next(".tips.hide").hide();
    });
    /** more donation */
    if($.trim($("#divMoreDonateWay>div").text())){
        $("#divMoreDonateWay").show();
    }
    $("input[name='add']").click(function(){
        createRdfField("", "");
    });
    showConfiguration();
    if(settings.backend_path){
        $("#txtBackendPath").show();
        $("#txtBackendPath").html("{ALREADY_DOWNLOADED_TO}: ".translate() + settings.backend_path);
    }
    function applyArea(){
        $(".div-area").hide();
        $("a.left-index").removeClass("focus");
        var m = location.href.match(/#(\w+)$/);
        if(m){
            $("#div-"+m[1]).show();
            $("a.left-index[href='#" + m[1] + "']").addClass("focus");
        }else{
            $("#div-configure").show();
            $("a.left-index[href='#configure']").addClass("focus");
        }
    }
    window.onhashchange=()=>applyArea();
    applyArea();
    $("#donate").click(()=>window.open('http://PayPal.me/VFence', '_blank'));
    $("#btnDownloadBackend").click(function(){
        function Next(){
            const extRoot = "moz-extension://" + global.extension_id;

            var sources = [
                // extRoot + "/bin/",
                // "https://raw.githubusercontent.com/vctfence/scrapbee_backend/v1.7.1/",
                "https://raw.githubusercontent.com/vctfence/scrapbee_backend/master/",
                "https://gitee.com/vctfence/scrapbee_backend/raw/master/"];

            var sourceId = $("input[name='download_source']:checked").val();
            var binDir = sources[sourceId];

            var src_exec = "scrapbee_backend";
            if(global.platform_os == "mac")
                src_exec += "_mac";
            else if(global.platform_os == "linux")
                src_exec += "_lnx";
            if(global.platform_arch == "x86-64"){
                src_exec += "_64"; 
            }
            src_exec += global.platform=="windows"?".exe":"";
            var dest_exec = "scrapbee_backend" + (global.platform=="windows"?".exe":"");
            /** download backend executable */
            downloadFile(binDir + src_exec, "scrapbee/" + dest_exec, function(id){
                /*** query really filename of backend executable */
                browser.downloads.search({id: id}).then((downloads) => {
                    var filename = downloads[0].filename;
                    var json = {"allowed_extensions":["scrapbee@scrapbee.org"],
                                "description":"Scrapbee backend",
                                "name":"scrapbee_backend",
                                "path":filename, /** path to downloaded backend executable */
                                "type":"stdio"};
                    /*** download json */
                    var jstr = JSON.stringify(json, null, 2);
                    downloadText(jstr, "scrapbee/scrapbee_backend.json", function(){
                        var download_path = filename.replace(/[^\\\/]*$/,"");
                        function done(){ /** download installation script done */
                            settings.set('backend_path', download_path);
                            if(settings.backend_path){
                                $("#txtBackendPath").html("{ALREADY_DOWNLOADED_TO}: ".translate() + settings.backend_path);
                            }
                        }
                        /** download installation script */
                        if(global.platform=="windows")
                            downloadText(installBat(download_path), "scrapbee/install.bat", done);
                        else if(global.platform=="mac")
                            downloadFile(extRoot + "/install/install_mac.sh", "scrapbee/install.sh", done);
                        else
                            downloadFile(extRoot + "/install/install_lnx.sh", "scrapbee/install.sh", done);
                    });
                });
            });
        }
        $("#txtBackendPath").show();
        $("#txtBackendPath").html("Downloading...");  // todo: error output
        setTimeout(Next, 1000);
    });
    function installBat(backend_path){
        return `chcp 65001\r\n\r
reg delete "HKEY_LOCAL_MACHINE\\SOFTWARE\\Mozilla\\NativeMessagingHosts\\scrapbee_backend" /f\r
reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Mozilla\\NativeMessagingHosts\\scrapbee_backend" /d "${backend_path}\scrapbee_backend.json" /f\r\n\r
reg delete "HKEY_CURRENT_USER\\Software\\Mozilla\\NativeMessagingHosts\\scrapbee_backend" /f\r
reg add "HKEY_CURRENT_USER\\Software\\Mozilla\\NativeMessagingHosts\\scrapbee_backend" /d "${backend_path}\scrapbee_backend.json" /f\r\n\r
echo done\r
pause`;
    }
    function downloadFile(src, dest, callback){
        browser.downloads.download({
            url:src,
            filename: dest,
            conflictAction: "overwrite",
            saveAs: false
        }).then(function(id){
            var fn = function(downloadDelta){
                if(downloadDelta.id == id && (downloadDelta.state && downloadDelta.state.current == "complete")){
                    if(callback)callback(id);
                    browser.downloads.onChanged.removeListener(fn);
                }
            };
            browser.downloads.onChanged.addListener(fn);
        }).catch(function (error) {
            $("#txtBackendPath").html("error: " + error);
        });
    }
    function downloadText(text, filename, callback, saveAs=false){
        var blob = new Blob([text], {type : 'text/plain'});
        var objectURL = URL.createObjectURL(blob);
        browser.downloads.download({
            url:objectURL,
            filename: filename,
            conflictAction: "overwrite",
            saveAs: saveAs
        }).then(function(id){
            var fn = function(downloadDelta){
                if(downloadDelta.id == id && (downloadDelta.state && downloadDelta.state.current == "complete")){
                    if(callback)callback(id);
                    URL.revokeObjectURL(objectURL);
                    browser.downloads.onChanged.removeListener(fn);
                }
            };
            browser.downloads.onChanged.addListener(fn);
        }).catch(function (error) {
            $("#txtBackendPath").html("error: " + error);
        });
    }
    browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        var $div = $("#div-log .console");
        if(request.type == 'LOGGING'){
            var b = Math.abs($div.scrollTop() - ($div[0].scrollHeight - $div.height())) < 100;
            var item = request.log;
            var $line = $("<div class='log-line'/>").appendTo($div).html(`[${item.logtype}] ${item.content}`);
            $line.addClass(item.logtype);
            if(b)
                $div.scrollTop($div[0].scrollHeight - $div.height());
        }else if(request.type == "BACKEND_SERVICE_STARTED"){
            initTools(request.version);
        }
    });
    browser.runtime.sendMessage({type: 'GET_ALL_LOG_REQUEST'}).then((response) => {
        var $div = $("#div-log .console");
        response.logs.forEach(function(item){
            var $line = $("<div class='log-line'/>").appendTo($div).html(`[${item.logtype}] ${item.content}`);
            $line.addClass(item.logtype);
        });
    });
};
