/**
 * Preview.hx
 */
package;
import Lambda as Lmd;
using StringTools;

#if ERR 
  #error "no good!"
#end

interface ITest {
  function test(i:Int):Adjective;
}

@:enum abstract Adjective(String) to String {
  var GREAT = "great";
  var HAXEY = "haxey";
}

class Preview implements ITest {
  public function new(i, dummy:Null<Bool> = null):Void {
    var adj = test(i);
    trace('Haxe is $adj: $i!'.toUpperCase());
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