"use strict";

var DEBUG = true;
var UPDATE_UDL = true;
var NO_DOM_PICKER = false;

var CodePickerSupported = false;
var codePickerMode = false;

/* 
  these can be overridden by passing in values as url params:
    preview=preview_filename&
    stylemap=stylemap_filename&
    udl=udl_filename
*/
var previewFile = "preview.haxe.html";
var udl2cssFile = "stylemap.haxe.json";
var udlBaseFile = "udl.haxe.xml";

var urlParams;

var $settingsPanel;
var $previewPanel;
var $udlPanel;

var firstTime = true;
var originalPreview;
var originalUdl;
var originalUdl2Css;
var clonedUdl;
var mappings;
var tiny;

var xmlSerializer;

var $inputs;
var swatches;
var inputID = 0;

function getUrlParams() {
  var dict = {};
  var query = window.location.search.substring(1).split("&");
  for (var i = 0; i < query.length; i++)
  {
    if (query[i] === "") // check for trailing & with no param
      continue;

    var param = query[i].split("=");
    dict[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
  }
  
  return dict;
}

function init() {
  $settingsPanel = null;
  $previewPanel = null;
  $udlPanel = null;
  originalPreview = null;
  originalUdl = null;
  originalUdl2Css = null;
  clonedUdl = null;
  xmlSerializer = new XMLSerializer();
  
  urlParams = getUrlParams();
  if (urlParams['preview']) previewFile = urlParams['preview'];
  if (urlParams['stylemap']) udl2cssFile = urlParams['stylemap'];
  if (urlParams['udl']) udlBaseFile = urlParams['udl'];
}

$(function() {
  main();
});

function main() {
  console.log("-- UDL 2.1 Themer.js");

  init();
  
  // to preserve order (which $.add() doesn't do)
  $.fn.push = function(selector) {
    Array.prototype.push.apply(this, $.makeArray($(selector)));
    return this;
  };

  $settingsPanel = $("#settings-panel");
  $previewPanel = $("#preview-panel");
  $udlPanel = $("#udl-panel");

  $("button#reset-all").click(function(e) { resetAll(); e.preventDefault(); $(this).blur(); });
  $("button#export-udl").click(function(e) { exportUdl(); e.preventDefault(); $(this).blur(); });
  
  loadPrevieHtml().then(function() {
    loadUdlBaseFile().then(function() {
      loadUdl2CssJson();
    });
  });
  
  // scroll color picker into view when focused
  $settingsPanel.on('focus', 'input.sc', function() {
    $(this).focus(); // this works (doesn't trigger a recursive death!)
    $(".popover-content")[0].scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  });
  
  if (document.elementFromPoint && document.body.scrollIntoView && !NO_DOM_PICKER) {
    CodePickerSupported = true;
    $(document.body).on('keydown keyup', function(evt) {
      codePickerMode = evt.ctrlKey || evt.metaKey;
      $previewPanel.toggleClass('ctrl-pressed', codePickerMode);
    });
    $previewPanel.on('click', function(evt) {
      if (!codePickerMode) return;
      var el = document.elementFromPoint(evt.clientX, evt.clientY);
      if (el) showInputFor(el);
    });
  }
  console.log("CodePickerSupported", CodePickerSupported);
}

function showInputFor(previewEl) {
  if (!($settingsPanel.find('input'))) return;
  
  //console.log("picked:", previewEl);
  var i = 0;
  var found = false;
  $.each($inputs, function(key, item) {
    var $cssSel = $(getCssSelection(item.json));
    var filtered = $cssSel.filter([previewEl]);
    if (filtered.length) {
      //console.log("matched input:", item.el);
      found = item;
    }
  });
  
  if (!found) {
    console.warn("CodePicker: no matching input for", previewEl);
  }
  else // activate parent nav-tab and scroll input into view
  {
    var $input = found.el;
    var $navTabs = $input.parents('.panel-body').find('.nav-tabs');
    var tabId = $input.parents('.tab-pane').attr('id');
    $navTabs.find('li a[href="#' + tabId + '"]').tab('show');
    found.el.focus();
  }
}

// https://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file#answer-18197511
function download(filename, text) {
  var pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  pom.setAttribute('download', filename);

  if (document.createEvent) {
    var event = document.createEvent('MouseEvents');
    event.initEvent('click', true, true);
    pom.dispatchEvent(event);
  }
  else {
    pom.click();
  }
}

function exportUdl() {
  var tempXml = cloneXml(clonedUdl);
  //console.log(xmlSerializer.serializeToString(tempXml));
  $(tempXml).find('Settings').html($(originalUdl).find('Settings').html());
  $(tempXml).find('KeywordLists').html($(originalUdl).find('KeywordLists').html());
  var exportData = xmlSerializer.serializeToString(tempXml);
  //console.log(exportData);
  var langName = $(clonedUdl).find('UserLang').attr('name');
  download(langName + ".xml", exportData);
}

function setPanelFile($panel, filename) {
  filename = filename.split('/').pop();
  $panel.parents('.panel').find('.panel-title span').text(filename);
}

function resetAll() {
  resetPreview(originalPreview);
  resetUdl(originalUdl, true);
  resetSettings(originalUdl2Css);
}

function resetPreview(html) {
  $previewPanel.html(html);
  $previewPanel.find('[class^=sc]').addClass('unstyled-code');
  if (!firstTime) $('.panel-body').addClass('disabled-panel');
  setPanelFile($previewPanel, previewFile);
}

function loadPrevieHtml() {
  var xhr = fetchUrl(previewFile, $previewPanel, "html");
  xhr.done(function(data) {
    //console.log(data);
    originalPreview = data;
    resetPreview(originalPreview);
    return xhr;
  });
  return xhr;
}

function getCssSelection(json) {
  var sel = $();
  for (var i=0; json.cssSelectors && i < json.cssSelectors.length; i++) {
    var cssSelector = json.cssSelectors[i];
    if (!cssSelector) sel = sel.push($previewPanel);
    else sel = sel.push($previewPanel.find(cssSelector));
  }
  return sel;
}

function getUdlSelection(json) {
  if (json.udlSelector) return $(clonedUdl).find(json.udlSelector);
  else return null;
}

function getInitialValue(json) {
  var sel = getUdlSelection(json);
  if (sel) {
    return sel.attr(json.udlAttr);
  }

  return $(getCssSelection(json)[0]).css(json.cssAttr); // use only the first item (see $.push())
}

function updateUdlValue(id, json, value) {
  setPanelFile($udlPanel, udlBaseFile);
  if (!UPDATE_UDL) return;
  var sel = getUdlSelection(json);
  if (sel) {
    if (json.type === "color") value = value.substr(1).toUpperCase(); // strip leading '#'
    sel.attr(json.udlAttr, value);
    resetUdl(clonedUdl);
  }
}

function createColorInput(id, label, color, json) {
  var form = $('<div class="form-group">' +
    '<small>' +
    '<label for=' + id + ' class="control-label text-muted">' + label + '</label>' +
    '<input class="sc form-control input-sm" id="' + id + '" type="text" value="' + color + '">' + 
    '</small>' +
    '</div>'
  );
  var input = form.find('input');

  var $slider = $(input).ColorPickerSliders({
    //previewontriggerelement: false,
    size: 'sm',
    placement: 'bottom',
    swatches: swatches,
    customswatches: 'udl-swatches',
    hsvpanel: true,
    grouping: true,
    previewformat: 'hex',
    order: {
      hsl: 1
    },
    labels: {'hslhue':'hue', 'hslsaturation':'saturation', 'hsllightness':'lightness'},
    //updateinterval: 60,
    onchange: function(container, color) {
      var hexColor = color.tiny.toHexString(color);
      var $sel = getCssSelection(json);
      $sel.css(json.cssAttr, hexColor);
      updateUdlValue(id, json, $(input).val());
    }
  });

  if (!color) {
    color = getInitialValue(json);
  }
  $(input).val(color);
  if (swatches.indexOf(color) < 0) swatches.push(color);
  
  $slider.on('keyup', function(evt) {
    if (evt.keyCode == 27) {
      $slider.trigger("colorpickersliders.hide");
    }
  });
  
  var update = function(color) {
    $slider.trigger("colorpickersliders.updateColor", color);
    $slider.trigger("colorpickersliders.show").trigger("colorpickersliders.hide");
  };

  $inputs[id] = {el: $slider, update: update, json: json, formEl:form};

  return form;
}

function createTextInput(id, label, value, json) {
  var form = $('<div class="form-group">' + 
    '<small>' +
    '<label for=' + id + ' class="control-label text-muted">' + label + '</label>' +
    '<input class="txt form-control input-sm" id="' + id + '" type="text" value="' + value + '">' + 
    '</small>' +
    '</div>'
  );
  var input = form.find('input');
  $(input).on('change keyup paste', function() {
    update($(this).val());
  });

  if (!value) {
    value = getInitialValue(json);
  }
  $(input).val(value);
  
  var update = function(value) {
    updateUdlValue(id, json, $(input).val());
  };
  $inputs[id] = {el: $(input), update: update, json: json, formEl:form};
  return form;
}

function createInputFor(jsonData, value) {
  var $formEl;
  
  if (jsonData.type === "color") {
    $formEl = createColorInput(jsonData.type + '-' + inputID++, jsonData.label, value, jsonData);
  }
  else if (jsonData.type === "text") {
    $formEl = createTextInput(jsonData.type + '-' + inputID++, jsonData.label, value, jsonData);
  } else {
    $formEl = createTextInput(jsonData.type + '-' + inputID++, jsonData.label, value, jsonData);
  }
  
  var $input = $formEl.find('input');
  $input.attr('data-input-idx', inputID - 1);
  $input.attr('data-initial-value', $input.val());
  return $formEl;
}

function resetSettings(json) {
  //console.log(json);
  setPanelFile($settingsPanel, udl2cssFile);
  
  mappings = json.mappings;

  if (firstTime) {
    originalUdl2Css = json;

    $settingsPanel.empty();
    swatches = [];
    $inputs = {};
    inputID = 0;
    
    // first time (create)
    var i = 0;
    for (i = 0; i < mappings.length; i++) {
      var item = json.mappings[i];
      var formEl = createInputFor(item);
      
      var id = $(formEl).find('input').attr('id');
      var $input = $inputs[id];
      $input.update($input.el.val());

      //console.log(item);
    }
    
    addPickersAndPagination();
  
    reEnableButtons();
  } else { // reset to original (with a little delay)
    console.log('Reset to original UDL');

    setTimeout(function() {
      $.each($inputs, function(key, input) {
        input.el.val(input.el.data('initial-value'));
        input.update(input.el.data('initial-value'));
      });
      
      reEnableButtons();
    }, 0);
  }
  
  firstTime = false;
}

function reEnableButtons() {
  $previewPanel.find('[class^=sc]').removeClass('unstyled-code');
  $("button#reset-all").removeClass("disabled");
  $("button#export-udl").removeClass("disabled");
  $('.panel-body').removeClass('disabled-panel');
}

function loadUdl2CssJson() {
  var xhr = fetchUrl(udl2cssFile, $settingsPanel, 'json');
  xhr.done(function(data) {
    resetSettings(data);
  
    return xhr;
  });

  return xhr;
}

function addPickersAndPagination() {
  var tabs = '<div>' +
  '<!-- Nav tabs -->' +
  '<ul class="nav nav-tabs" role="tablist">' +
  '  <li role="presentation" class="active"><a href="#tab0" aria-controls="main" role="tab" data-toggle="tab">Main</a></li>' +
  '  <li role="presentation"><a href="#tab1" aria-controls="secondary" role="tab" data-toggle="tab">Secondary</a></li>' +
  '  <li class="hidden" role="presentation"><a href="#tab2" aria-controls="extra" role="tab" data-toggle="tab">Extra</a></li>' +
  '  <li class="hidden" role="presentation"><a href="#tab3" aria-controls="extra 2" role="tab" data-toggle="tab">Extra 2</a></li>' +
  '</ul>' +
  '' +
  '<!-- Tab panes -->' +
  '<div class="tab-content">' +
  '  <div role="tabpanel" class="tab-pane active" id="tab0"></div>' +
  '  <div role="tabpanel" class="tab-pane" id="tab1"></div>' +
  '  <div role="tabpanel" class="tab-pane" id="tab2"></div>' +
  '  <div role="tabpanel" class="tab-pane" id="tab3"></div>' +
  '</div>' +
  '</div>';
  
  var $tabs = $(tabs);
  var i = 0;
  $.each($inputs, function(key, item) {
    var tabNum = Math.floor(i / 7);
    var $tab = $tabs.find('#tab' + tabNum);
    var $navTab = $tabs.find('li:eq(' + tabNum + ')');
    if ($navTab.hasClass("hidden")) $navTab.removeClass('hidden');
    $tab.append(item.formEl);
    i++;
  });
  
  $settingsPanel.append($tabs);
}

function cloneXml(xml) {
  var xmlString = xmlSerializer.serializeToString(xml);
  var clone = $.parseXML(xmlString);
  return clone;
}

function resetUdl(xmlData, force = false) {
  if (!originalUdl || force) {
    originalUdl = xmlData;
    
    // clone and remove some sections
    clonedUdl = cloneXml(xmlData);
    $(clonedUdl).find('Settings, KeywordLists').html("...");
  }
  
  //console.log(xmlData);
  $udlPanel.html('<pre class="language-xml"><code>');
  //var escapedData = $('<div/>').text(data).html();
  
  $udlPanel.find('code').text(xmlSerializer.serializeToString(clonedUdl));
  Prism.highlightElement($udlPanel.find("pre code")[0]);
}

function loadUdlBaseFile() {
  var xhr = fetchUrl(udlBaseFile, $udlPanel, "xml");
  xhr.done(function(data) {
    //console.log(data);
    resetUdl(data);
    return xhr;
  });

  return xhr;
}

function fetchUrl(url, $container, dataType) {
  dataType = dataType || "text";
  var xhr = $.ajax(url, {dataType:dataType});
  
  xhr.done(function(data) {
    console.log("Loaded '" + url + "'" + " (dataType:" + dataType + ")");
    return xhr;
  });

  xhr.fail(function(xhr, status, errorStr) {
    $container.html($('<div role="alert">').addClass('alert alert-danger').html("Failed to load <strong>'" + url + "'</strong>: " + errorStr));
    console.error("Failed to load '" + url + "':", status, errorStr);
    return xhr;
  });

  return xhr;
}