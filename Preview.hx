/**
 * Preview.hx
 *
 * @see https://github.com/azrafe7/Haxe-for-Notepad-plusplus
 * @author azrafe7
 */
package;

import Lambda as Lmd;
using StringTools;

#if ERR 
  // FIXME
  #error "no good!"
#end

interface ITest {
  function test(i:Int):Adjective;
}

@:enum abstract Adjective(String) to String {
  var GREAT = "grea";
  var HAXEY = "haxey";
}

class Preview implements ITest {
  static var regex = ~/[a-zA-Z]/g;
  var i64:haxe.Int64;
  
  public function new(i, dummy:Null<Bool> = null):Void {
    var adj = test(i);
    trace('Haxe is ${Std.string(adj + "" + 7)}: $i!'.toUpperCase());
  }
  
  public function test(i:Int):Adjective {
    return switch (i) {
      case 42: GREAT;
      default: HAXEY;
    }
  }
 
  // Entry point
  static public function main() {
    new Preview(0x2a, false);
  }
}