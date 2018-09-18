Haxe for Notepad++
==================

Syntax Highlighting for Haxe files in Notepad++ (UDL v2.1)

What's This Thing
-----------------
Just an xml file that gives you syntax highlighting/coloring for .hx files inside recent versions of [Notepad++](http://notepad-plus-plus.org) (the ones that support the [User Defined Language](http://ivan-radic.github.io/udl-documentation/ "User Defined Language")).

How to Use it
-------------
 - Download the [haxe-dark.xml](haxe-dark.xml) file (or [haxe-light.xml](haxe-light.xml))
 - Open Notepad++
 - Go to  `Language -> Define your language...`,  click on  `Import...` and select the `haxe-dark.xml` file you've downloaded
 - Close and restart Notepad++
 - Done

Screenshots
-----
Here's a preview of how it looks like:

[haxe-dark.xml](haxe-dark.xml) | [preview](https://rawgit.com/azrafe7/Haxe-for-Notepad-plusplus/master/themer/themer.html?udl=../haxe-dark.xml)
![](preview.png)

[haxe-light.xml](haxe-light.xml) | [preview](https://rawgit.com/azrafe7/Haxe-for-Notepad-plusplus/master/themer/themer.html?udl=../haxe-light.xml&bg=FFFFFF)
![](preview-light.png)

Thanks to [@yellowafterlife](https://yal.cc/notepad-pp-syntax-highlighting-for-haxe-2/) for the original work, and to the contributors of [haxe-TmLanguage](https://github.com/vshaxe/haxe-TmLanguage/).

UDL 2.1 Themer
--------------
You can customize the theme in the browser with this [little tool](https://rawgit.com/azrafe7/Haxe-for-Notepad-plusplus/master/themer/themer.html) (WIP).

_Hint_: **CTRL+click** on code in the preview panel to jump to the associated udl rule.

<sub>The themer works by mapping udl to css and back again (mappings are in `stylemap.haxe.json`).</sub>

<sub>The `preview.haxe.html` file is directly exported from Notepad++ (Plugins->NppExport->Export to HTML), and injected as is.</sub>

<sub>It can be used to live-preview and edit other udl files using `stylemap.generic.json` ([example LESS](https://rawgit.com/azrafe7/Haxe-for-Notepad-plusplus/master/themer/themer.html?udl=https://rawgit.com/azrafe7/LESS-for-Notepad-plusplus/master/less.xml&stylemap=stylemap.generic.json&preview=https://rawgit.com/azrafe7/LESS-for-Notepad-plusplus/master/preview.less.html)), or using a custom style-mapping file ([like stylemap.haxe.json](themer/stylemap.haxe.json)).</sub>


LICENSE (MIT)
-------------
See [LICENSE](LICENSE).