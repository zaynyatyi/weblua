// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func) {
    var table = FUNCTION_TABLE;
    var ret = table.length;
    assert(ret % 2 === 0);
    table.push(func);
    for (var i = 0; i < 2-1; i++) table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE;
    table[index] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    code = Pointer_stringify(code);
    if (code[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (code.indexOf('"', 1) === code.length-1) {
        code = code.substr(1, code.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + code + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + code + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((low>>>0)+((high>>>0)*4294967296)) : ((low>>>0)+((high|0)*4294967296))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  // TOTAL_MEMORY is the current size of the actual array, and DYNAMICTOP is the new top.
  while (TOTAL_MEMORY <= DYNAMICTOP) { // Simple heuristic. Override enlargeMemory() if your program has something more optimal for it
    TOTAL_MEMORY = alignMemoryPage(2*TOTAL_MEMORY);
  }
  assert(TOTAL_MEMORY <= Math.pow(2, 30)); // 2^30==1GB is a practical maximum - 2^31 is already close to possible negative numbers etc.
  var oldHEAP8 = HEAP8;
  var buffer = new ArrayBuffer(TOTAL_MEMORY);
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
  HEAP8.set(oldHEAP8);
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 10485760;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;


// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 12584;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });









var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;

































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































/* memory initializer */ allocate([117,115,101,114,100,97,116,97,0,0,0,0,0,0,0,0,152,13,0,0,22,1,0,0,160,39,0,0,100,0,0,0,200,30,0,0,32,0,0,0,24,24,0,0,126,0,0,0,8,19,0,0,214,0,0,0,152,15,0,0,78,1,0,0,0,0,0,0,0,0,0,0,48,15,0,0,48,0,0,0,56,40,0,0,72,0,0,0,128,31,0,0,212,0,0,0,96,24,0,0,74,1,0,0,80,19,0,0,40,1,0,0,168,15,0,0,252,0,0,0,88,14,0,0,68,0,0,0,120,12,0,0,20,1,0,0,40,11,0,0,232,0,0,0,40,10,0,0,60,0,0,0,80,46,0,0,132,0,0,0,0,0,0,0,0,0,0,0,40,31,0,0,230,0,0,0,56,24,0,0,58,0,0,0,24,19,0,0,106,0,0,0,160,15,0,0,70,0,0,0,80,14,0,0,142,0,0,0,112,12,0,0,122,0,0,0,32,11,0,0,150,0,0,0,32,10,0,0,14,1,0,0,72,46,0,0,218,0,0,0,184,44,0,0,80,0,0,0,80,43,0,0,130,0,0,0,80,42,0,0,56,0,0,0,152,41,0,0,8,1,0,0,232,40,0,0,102,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,7,7,7,7,7,7,10,9,5,4,3,3,3,3,3,3,3,3,3,3,3,3,2,2,1,1,0,0,48,23,0,0,82,0,0,0,176,22,0,0,216,0,0,0,0,0,0,0,0,0,0,0,96,36,0,0,144,35,0,0,176,34,0,0,144,33,0,0,200,32,0,0,40,10,0,0,0,0,0,0,0,0,0,0,6,0,0,0,3,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,2,0,0,0,168,31,0,0,36,0,0,0,112,24,0,0,40,0,0,0,96,19,0,0,128,0,0,0,176,15,0,0,164,0,0,0,96,14,0,0,22,0,0,0,128,12,0,0,190,0,0,0,56,11,0,0,70,1,0,0,48,10,0,0,198,0,0,0,88,46,0,0,74,0,0,0,232,44,0,0,98,0,0,0,96,43,0,0,94,0,0,0,96,42,0,0,244,0,0,0,168,41,0,0,188,0,0,0,248,40,0,0,248,0,0,0,240,39,0,0,2,1,0,0,24,39,0,0,228,0,0,0,72,38,0,0,220,0,0,0,128,37,0,0,118,0,0,0,104,36,0,0,170,0,0,0,152,35,0,0,84,0,0,0,184,34,0,0,154,0,0,0,160,33,0,0,234,0,0,0,208,32,0,0,34,0,0,0,0,32,0,0,32,1,0,0,24,31,0,0,68,1,0,0,32,30,0,0,200,0,0,0,136,29,0,0,180,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,22,22,22,22,22,22,22,22,22,22,4,4,4,4,4,4,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,5,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,127,64,33,0,0,0,0,0,56,195,16,36,0,0,32,35,0,0,16,34,0,0,56,33,0,0,104,32,0,0,160,31,0,0,160,30,0,0,232,29,0,0,64,29,0,0,120,28,0,0,248,27,0,0,24,27,0,0,56,26,0,0,112,25,0,0,184,24,0,0,104,24,0,0,16,24,0,0,128,23,0,0,40,23,0,0,136,22,0,0,24,22,0,0,104,21,0,0,200,20,0,0,64,20,0,0,176,19,0,0,88,19,0,0,0,19,0,0,144,18,0,0,8,18,0,0,136,17,0,0,72,17,0,0,184,16,0,0,80,16,0,0,0,0,0,0,208,31,0,0,128,43,0,0,192,34,0,0,8,0,0,0,160,26,0,0,248,20,0,0,112,16,0,0,32,15,0,0,8,0,0,0,96,13,0,0,224,11,0,0,200,10,0,0,208,46,0,0,64,45,0,0,240,43,0,0,216,42,0,0,8,42,0,0,56,41,0,0,48,40,0,0,96,39,0,0,160,38,0,0,168,37,0,0,192,36,0,0,240,35,0,0,8,35,0,0,248,33,0,0,16,33,0,0,72,32,0,0,120,31,0,0,0,0,0,0,96,113,65,84,80,80,92,108,60,16,60,84,108,124,124,124,124,124,124,96,96,96,104,34,188,188,188,132,228,84,84,16,98,98,4,98,20,81,80,23,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,3,3,3,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,33,0,0,0,0,0,56,195,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,0,0,0,0,96,20,0,0,240,19,0,0,152,19,0,0,48,19,0,0,200,18,0,0,80,18,0,0,240,17,0,0,104,17,0,0,216,16,0,0,144,16,0,0,40,16,0,0,0,0,0,0,72,39,0,0,26,1,0,0,80,30,0,0,168,0,0,0,232,23,0,0,62,1,0,0,192,18,0,0,58,1,0,0,128,15,0,0,44,0,0,0,184,13,0,0,124,0,0,0,56,12,0,0,86,0,0,0,232,10,0,0,34,1,0,0,0,10,0,0,54,0,0,0,208,45,0,0,186,0,0,0,0,0,0,0,0,0,0,0,240,38,0,0,144,0,0,0,0,0,0,0,0,0,0,0,64,11,0,0,148,0,0,0,56,10,0,0,86,1,0,0,136,24,0,0,44,1,0,0,96,46,0,0,104,0,0,0,48,24,0,0,0,1,0,0,208,23,0,0,202,0,0,0,88,23,0,0,184,0,0,0,240,44,0,0,246,0,0,0,240,22,0,0,66,0,0,0,72,22,0,0,30,1,0,0,184,41,0,0,12,0,0,0,0,0,0,0,0,0,0,0,168,35,0,0,208,34,0,0,184,33,0,0,232,32,0,0,16,32,0,0,0,0,0,0,64,11,0,0,148,0,0,0,56,10,0,0,240,0,0,0,96,46,0,0,46,0,0,0,240,44,0,0,158,0,0,0,136,43,0,0,2,0,0,0,104,42,0,0,90,1,0,0,184,41,0,0,52,0,0,0,0,41,0,0,76,1,0,0,248,39,0,0,10,0,0,0,0,0,0,0,0,0,0,0,160,35,0,0,200,34,0,0,176,33,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,224,32,0,0,8,32,0,0,32,31,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,95,112,137,0,255,9,47,15,10,0,0,0,100,0,0,0,232,3,0,0,16,39,0,0,160,134,1,0,64,66,15,0,128,150,152,0,0,225,245,5,96,18,0,0,16,1,0,0,120,41,0,0,88,1,0,0,128,32,0,0,38,0,0,0,192,24,0,0,108,0,0,0,184,19,0,0,50,0,0,0,216,15,0,0,46,1,0,0,136,14,0,0,18,0,0,0,144,12,0,0,134,0,0,0,72,11,0,0,136,0,0,0,64,10,0,0,42,0,0,0,104,46,0,0,38,1,0,0,248,44,0,0,210,0,0,0,144,43,0,0,10,1,0,0,112,42,0,0,110,0,0,0,192,41,0,0,62,0,0,0,8,41,0,0,84,1,0,0,0,0,0,0,0,0,0,0,116,0,0,0,30,0,0,0,56,1,0,0,6,0,0,0,0,0,0,0,0,0,0,0,248,18,0,0,140,0,0,0,144,41,0,0,12,1,0,0,144,32,0,0,162,0,0,0,224,24,0,0,6,1,0,0,200,19,0,0,160,0,0,0,232,15,0,0,208,0,0,0,0,0,0,0,0,0,0,0,192,28,0,0,56,47,0,0,144,19,0,0,80,1,0,0,176,41,0,0,24,0,0,0,216,32,0,0,66,1,0,0,16,25,0,0,16,0,0,0,208,19,0,0,112,0,0,0,240,15,0,0,48,1,0,0,184,14,0,0,176,0,0,0,208,12,0,0,204,0,0,0,120,11,0,0,36,1,0,0,104,10,0,0,114,0,0,0,136,46,0,0,52,1,0,0,8,45,0,0,174,0,0,0,0,0,0,0,0,0,0,0,104,25,0,0,88,0,0,0,48,20,0,0,54,1,0,0,248,15,0,0,224,0,0,0,192,14,0,0,4,1,0,0,216,12,0,0,242,0,0,0,128,11,0,0,24,1,0,0,112,10,0,0,250,0,0,0,144,46,0,0,60,1,0,0,16,45,0,0,28,0,0,0,200,43,0,0,4,0,0,0,176,42,0,0,196,0,0,0,248,41,0,0,254,0,0,0,24,41,0,0,238,0,0,0,40,40,0,0,206,0,0,0,80,39,0,0,72,1,0,0,104,38,0,0,50,1,0,0,152,37,0,0,42,1,0,0,152,36,0,0,18,1,0,0,176,35,0,0,138,0,0,0,216,34,0,0,92,0,0,0,224,33,0,0,8,0,0,0,240,32,0,0,156,0,0,0,0,0,0,0,0,0,0,0,33,0,0,0,0,0,56,195,33,0,0,0,0,0,56,195,43,45,0,0,0,0,0,0,109,97,116,104,0,0,0,0,76,85,65,95,67,80,65,84,72,0,0,0,0,0,0,0,110,0,0,0,0,0,0,0,108,101,110,0,0,0,0,0,116,105,109,101,0,0,0,0,99,111,115,0,0,0,0,0,102,108,117,115,104,0,0,0,117,112,118,97,108,117,101,105,100,0,0,0,0,0,0,0,99,111,114,111,117,116,105,110,101,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,114,101,112,108,97,99,101,0,108,111,97,100,102,105,108,101,0,0,0,0,0,0,0,0,110,0,0,0,0,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,110,111,110,45,115,117,115,112,101,110,100,101,100,32,99,111,114,111,117,116,105,110,101,0,0,0,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,32,105,110,0,0,0,0,0,117,112,118,97,108,0,0,0,115,101,108,102,0,0,0,0,103,108,111,98,97,108,0,0,80,112,0,0,0,0,0,0,98,105,116,51,50,0,0,0,76,85,65,95,67,80,65,84,72,95,53,95,50,0,0,0,116,111,111,32,109,97,110,121,32,114,101,115,117,108,116,115,32,116,111,32,117,110,112,97,99,107,0,0,0,0,0,0,103,115,117,98,0,0,0,0,115,101,116,108,111,99,97,108,101,0,0,0,0,0,0,0,99,111,115,104,0,0,0,0,99,108,111,115,101,0,0,0,117,112,118,97,108,117,101,106,111,105,110,0,0,0,0,0,116,111,111,32,109,97,110,121,32,114,101,115,117,108,116,115,32,116,111,32,114,101,115,117,109,101,0,0,0,0,0,0,108,115,104,105,102,116,0,0,105,112,97,105,114,115,0,0,98,97,100,32,97,114,103,117,109,101,110,116,32,35,37,100,32,40,37,115,41,0,0,0,101,114,114,111,114,32,105,110,32,101,114,114,111,114,32,104,97,110,100,108,105,110,103,0,39,102,111,114,39,32,115,116,101,112,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,0,110,111,116,32,97,0,0,0,112,114,111,116,111,0,0,0,99,97,110,110,111,116,32,117,115,101,32,39,46,46,46,39,32,111,117,116,115,105,100,101,32,97,32,118,97,114,97,114,103,32,102,117,110,99,116,105,111,110,0,0,0,0,0,0,34,93,0,0,0,0,0,0,95,69,78,86,0,0,0,0,39,37,99,39,0,0,0,0,88,120,0,0,0,0,0,0,115,116,114,105,110,103,0,0,99,112,97,116,104,0,0,0,105,110,118,97,108,105,100,32,111,114,100,101,114,32,102,117,110,99,116,105,111,110,32,102,111,114,32,115,111,114,116,105,110,103,0,0,0,0,0,0,103,109,97,116,99,104,0,0,114,101,110,97,109,101,0,0,99,101,105,108,0,0,0,0,95,95,105,110,100,101,120,0,103,101,116,117,112,118,97,108,117,101,0,0,0,0,0,0,95,80,82,69,76,79,65,68,0,0,0,0,0,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,100,101,97,100,32,99,111,114,111,117,116,105,110,101,0,0,0,0,108,114,111,116,97,116,101,0,103,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,10,9,40,46,46,46,116,97,105,108,32,99,97,108,108,115,46,46,46,41,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,108,111,97,100,32,97,32,37,115,32,99,104,117,110,107,32,40,109,111,100,101,32,105,115,32,39,37,115,39,41,0,0,0,0,0,0,0,39,102,111,114,39,32,108,105,109,105,116,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,99,111,114,114,117,112,116,101,100,0,0,0,0,0,0,0,116,104,114,101,97,100,0,0,67,32,108,101,118,101,108,115,0,0,0,0,0,0,0,0,91,115,116,114,105,110,103,32,34,0,0,0,0,0,0,0,95,67,76,73,66,83,0,0,108,111,99,97,108,0,0,0,99,111,110,99,97,116,0,0,105,110,102,105,110,105,116,121,0,0,0,0,0,0,0,0,69,101,0,0,0,0,0,0,111,115,0,0,0,0,0,0,47,117,115,114,47,108,111,99,97,108,47,115,104,97,114,101,47,108,117,97,47,53,46,50,47,63,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,115,104,97,114,101,47,108,117,97,47,53,46,50,47,63,47,105,110,105,116,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,47,105,110,105,116,46,108,117,97,59,46,47,63,46,108,117,97,0,0,0,0,0,0,0,102,111,114,109,97,116,0,0,114,101,109,111,118,101,0,0,97,116,97,110,0,0,0,0,99,97,110,110,111,116,32,99,108,111,115,101,32,115,116,97,110,100,97,114,100,32,102,105,108,101,0,0,0,0,0,0,103,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,116,111,111,32,109,97,110,121,32,97,114,103,117,109,101,110,116,115,32,116,111,32,114,101,115,117,109,101,0,0,0,0,101,120,116,114,97,99,116,0,101,114,114,111,114,0,0,0,32,105,110,32,0,0,0,0,39,102,111,114,39,32,105,110,105,116,105,97,108,32,118,97,108,117,101,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,116,101,120,116,0,0,0,0,37,115,58,32,37,115,32,112,114,101,99,111,109,112,105,108,101,100,32,99,104,117,110,107,0,0,0,0,0,0,0,0,102,117,110,99,116,105,111,110,0,0,0,0,0,0,0,0,99,108,111,99,107,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,46,46,46,0,0,0,0,0,37,115,58,37,100,58,32,37,115,0,0,0,0,0,0,0,110,111,32,109,101,115,115,97,103,101,0,0,0,0,0,0,112,105,0,0,0,0,0,0,46,0,0,0,0,0,0,0,105,111,0,0,0,0,0,0,76,85,65,95,80,65,84,72,0,0,0,0,0,0,0,0,115,111,114,116,0,0,0,0,102,105,110,100,0,0,0,0,103,101,116,101,110,118,0,0,97,116,97,110,50,0,0,0,70,73,76,69,42,0,0,0,97,115,115,101,114,116,105,111,110,32,102,97,105,108,101,100,33,0,0,0,0,0,0,0,103,101,116,114,101,103,105,115,116,114,121,0,0,0,0,0,121,105,101,108,100,0,0,0,98,116,101,115,116,0,0,0,100,111,102,105,108,101,0,0,37,115,0,0,0,0,0,0,95,73,79,95,105,110,112,117,116,0,0,0,0,0,0,0,37,115,10,0,0,0,0,0,37,100,58,0,0,0,0,0,105,110,99,114,101,109,101,110,116,97,108,0,0,0,0,0,103,101,116,32,108,101,110,103,116,104,32,111,102,0,0,0,98,105,110,97,114,121,0,0,60,115,116,114,105,110,103,62,0,0,0,0,0,0,0,0,116,114,117,110,99,97,116,101,100,0,0,0,0,0,0,0,116,97,98,108,101,0,0,0,61,40,100,101,98,117,103,32,99,111,109,109,97,110,100,41,0,0,0,0,0,0,0,0,103,101,110,101,114,97,116,105,111,110,97,108,0,0,0,0,102,117,110,99,116,105,111,110,32,60,37,115,58,37,100,62,0,0,0,0,0,0,0,0,60,110,97,109,101,62,0,0,37,115,32,101,120,112,101,99,116,101,100,0,0,0,0,0,99,111,110,116,10,0,0,0,105,115,114,117,110,110,105,110,103,0,0,0,0,0,0,0,109,97,105,110,32,99,104,117,110,107,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,37,37,99,39,32,116,111,32,39,108,117,97,95,112,117,115,104,102,115,116,114,105,110,103,39,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,99,111,109,112,97,114,101,32,37,115,32,119,105,116,104,32,37,115,0,0,0,60,110,117,109,98,101,114,62,0,0,0,0,0,0,0,0,108,117,97,95,100,101,98,117,103,62,32,0,0,0,0,0,115,101,116,109,97,106,111,114,105,110,99,0,0,0,0,0,102,117,110,99,116,105,111,110,32,39,37,115,39,0,0,0,60,101,111,102,62,0,0,0,97,116,116,101,109,112,116,32,116,111,32,37,115,32,37,115,32,39,37,115,39,32,40,97,32,37,115,32,118,97,108,117,101,41,0,0,0,0,0,0,105,110,118,97,108,105,100,32,109,111,100,101,32,39,37,115,39,32,40,115,104,111,117,108,100,32,109,97,116,99,104,32,39,91,114,119,97,93,37,37,43,63,98,63,39,41,0,0,37,115,0,0,0,0,0,0,115,101,116,115,116,101,112,109,117,108,0,0,0,0,0,0,46,0,0,0,0,0,0,0,58,58,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,99,111,109,112,97,114,101,32,116,119,111,32,37,115,32,118,97,108,117,101,115,0,0,0,0,0,0,0,0,114,119,97,0,0,0,0,0,101,120,116,101,114,110,97,108,32,104,111,111,107,0,0,0,115,101,116,112,97,117,115,101,0,0,0,0,0,0,0,0,100,101,98,117,103,0,0,0,102,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,108,111,110,103,32,115,116,114,105,110,103,32,100,101,108,105,109,105,116,101,114,0,0,0,126,61,0,0,0,0,0,0,99,97,110,110,111,116,32,111,112,101,110,32,102,105,108,101,32,39,37,115,39,32,40,37,115,41,0,0,0,0,0,0,102,117,110,99,0,0,0,0,116,97,98,108,101,0,0,0,115,116,101,112,0,0,0,0,37,115,32,101,120,112,101,99,116,101,100,44,32,103,111,116,32,37,115,0,0,0,0,0,76,85,65,95,80,65,84,72,95,53,95,50,0,0,0,0,99,114,101,97,116,101,0,0,60,61,0,0,0,0,0,0,114,101,109,111,118,101,0,0,119,0,0,0,0,0,0,0,100,117,109,112,0,0,0,0,97,99,116,105,118,101,108,105,110,101,115,0,0,0,0,0,99,111,117,110,116,0,0,0,99,97,110,110,111,116,32,37,115,32,37,115,58,32,37,115,0,0,0,0,0,0,0,0,101,120,105,116,0,0,0,0,62,61,0,0,0,0,0,0,97,115,105,110,0,0,0,0,39,112,111,112,101,110,39,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,105,115,116,97,105,108,99,97,108,108,0,0,0,0,0,0,97,114,115,104,105,102,116,0,99,111,108,108,101,99,116,0,115,116,100,101,114,114,0,0,239,187,191,0,0,0,0,0,61,61,0,0,0,0,0,0,103,101,116,108,111,99,97,108,0,0,0,0,0,0,0,0,119,114,97,112,0,0,0,0,98,120,111,114,0,0,0,0,114,0,0,0,0,0,0,0,110,97,109,101,119,104,97,116,0,0,0,0,0,0,0,0,114,101,115,116,97,114,116,0,80,65,78,73,67,58,32,117,110,112,114,111,116,101,99,116,101,100,32,101,114,114,111,114,32,105,110,32,99,97,108,108,32,116,111,32,76,117,97,32,65,80,73,32,40,37,115,41,10,0,0,0,0,0,0,0,99,111,108,108,101,99,116,103,97,114,98,97,103,101,0,0,46,46,46,0,0,0,0,0,102,105,108,101,0,0,0,0,110,97,109,101,0,0,0,0,10,9,37,115,58,0,0,0,115,116,111,112,0,0,0,0,98,97,100,32,99,111,110,118,101,114,115,105,111,110,32,110,117,109,98,101,114,45,62,105,110,116,59,32,109,117,115,116,32,114,101,99,111,109,112,105,108,101,32,76,117,97,32,119,105,116,104,32,112,114,111,112,101,114,32,115,101,116,116,105,110,103,115,0,0,0,0,0,115,116,114,105,110,103,32,108,101,110,103,116,104,32,111,118,101,114,102,108,111,119,0,0,46,46,0,0,0,0,0,0,25,147,13,10,26,10,0,0,27,76,117,97,0,0,0,0,115,116,114,105,110,103,32,115,108,105,99,101,32,116,111,111,32,108,111,110,103,0,0,0,115,116,114,105,110,103,0,0,99,108,111,115,101,100,32,102,105,108,101,0,0,0,0,0,105,115,118,97,114,97,114,103,0,0,0,0,0,0,0,0,95,95,105,112,97,105,114,115,0,0,0,0,0,0,0,0,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,58,32,97,112,112,46,32,110,101,101,100,115,32,37,102,44,32,76,117,97,32,99,111,114,101,32,112,114,111,118,105,100,101,115,32,37,102,0,0,0,119,104,105,108,101,0,0,0,108,97,98,101,108,115,47,103,111,116,111,115,0,0,0,0,105,110,105,116,0,0,0,0,118,97,108,117,101,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,115,116,97,110,100,97,114,100,32,37,115,32,102,105,108,101,32,105,115,32,99,108,111,115,101,100,0,0,0,0,0,0,110,112,97,114,97,109,115,0,114,101,97,100,101,114,32,102,117,110,99,116,105,111,110,32,109,117,115,116,32,114,101,116,117,114,110,32,97,32,115,116,114,105,110,103,0,0,0,0,109,117,108,116,105,112,108,101,32,76,117,97,32,86,77,115,32,100,101,116,101,99,116,101,100,0,0,0,0,0,0,0,37,0,0,0,0,0,0,0,117,110,116,105,108,0,0,0,97,98,115,101,110,116,0,0,117,110,97,98,108,101,32,116,111,32,100,117,109,112,32,103,105,118,101,110,32,102,117,110,99,116,105,111,110,0,0,0,116,121,112,101,0,0,0,0,110,117,112,115,0,0,0,0,116,111,111,32,109,97,110,121,32,110,101,115,116,101,100,32,102,117,110,99,116,105,111,110,115,0,0,0,0,0,0,0,95,76,79,65,68,69,68,0,95,71,0,0,0,0,0,0,116,114,117,101,0,0,0,0,99,111,110,116,114,111,108,32,115,116,114,117,99,116,117,114,101,32,116,111,111,32,108,111,110,103,0,0,0,0,0,0,115,101,97,114,99,104,112,97,116,104,0,0,0,0,0,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,32,40,119,105,100,116,104,32,111,114,32,112,114,101,99,105,115,105,111,110,32,116,111,111,32,108,111,110,103,41,0,0,0,0,116,109,112,102,105,108,101,0,99,117,114,114,101,110,116,108,105,110,101,0,0,0,0,0,61,40,108,111,97,100,41,0,116,111,111,32,109,97,110,121,32,117,112,118,97,108,117,101,115,0,0,0,0,0,0,0,116,104,101,110,0,0,0,0,108,111,97,100,108,105,98,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,32,40,114,101,112,101,97,116,101,100,32,102,108,97,103,115,41,0,112,111,112,101,110,0,0,0,119,104,97,116,0,0,0,0,98,116,0,0,0,0,0,0,37,115,58,32,37,112,0,0,95,69,78,86,0,0,0,0,114,101,116,117,114,110,0,0,112,101,114,102,111,114,109,32,97,114,105,116,104,109,101,116,105,99,32,111,110,0,0,0,10,9,110,111,32,102,105,101,108,100,32,112,97,99,107,97,103,101,46,112,114,101,108,111,97,100,91,39,37,115,39,93,0,0,0,0,0,0,0,0,45,43,32,35,48,0,0,0,111,117,116,112,117,116,0,0,108,97,115,116,108,105,110,101,100,101,102,105,110,101,100,0,99,111,114,111,117,116,105,110,101,0,0,0,0,0,0,0,95,95,112,97,105,114,115,0,110,105,108,0,0,0,0,0,112,97,116,104,0,0,0,0,114,101,112,101,97,116,0,0,117,110,112,97,99,107,0,0,59,0,0,0,0,0,0,0,92,37,48,51,100,0,0,0,111,112,101,110,0,0,0,0,99,104,97,114,0,0,0,0,108,105,110,101,100,101,102,105,110,101,100,0,0,0,0,0,10,0,0,0,0,0,0,0,102,97,108,115,101,0,0,0,101,120,101,99,117,116,101,0,111,114,0,0,0,0,0,0,97,99,111,115,0,0,0,0,114,0,0,0,0,0,0,0,92,37,100,0,0,0,0,0,105,110,112,117,116,0,0,0,115,104,111,114,116,95,115,114,99,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,115,116,100,111,117,116,0,0,116,114,117,101,0,0,0,0,110,111,116,0,0,0,0,0,103,101,116,105,110,102,111,0,37,115,10,0,0,0,0,0,10,9,110,111,32,102,105,108,101,32,39,37,115,39,0,0,115,116,97,116,117,115,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,37,37,99,39,32,116,111,32,39,102,111,114,109,97,116,39,0,0,0,0,0,0,0,98,111,114,0,0,0,0,0,37,115,0,0,0,0,0,0,115,111,117,114,99,101,0,0,39,116,111,115,116,114,105,110,103,39,32,109,117,115,116,32,114,101,116,117,114,110,32,97,32,115,116,114,105,110,103,32,116,111,32,39,112,114,105,110,116,39,0,0,0,0,0,0,95,95,116,111,115,116,114,105,110,103,0,0,0,0,0,0,97,115,115,101,114,116,0,0,110,105,108,0,0,0,0,0,63,0,0,0,0,0,0,0,110,111,116,32,97,32,110,111,110,45,110,101,103,97,116,105,118,101,32,110,117,109,98,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,0,0,0,0,0,102,105,108,101,32,105,115,32,97,108,114,101,97,100,121,32,99,108,111,115,101,100,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,0,0,83,108,110,116,0,0,0,0,116,97,98,108,101,32,111,114,32,115,116,114,105,110,103,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,0,0,111,98,106,101,99,116,32,108,101,110,103,116,104,32,105,115,32,110,111,116,32,97,32,110,117,109,98,101,114,0,0,0,108,111,111,112,32,105,110,32,115,101,116,116,97,98,108,101,0,0,0,0,0,0,0,0,108,111,99,97,108,0,0,0,50,0,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,121,105,101,108,100,32,102,114,111,109,32,111,117,116,115,105,100,101,32,97,32,99,111,114,111,117,116,105,110,101,0,0,0,0,0,0,0,39,112,97,99,107,97,103,101,46,37,115,39,32,109,117,115,116,32,98,101,32,97,32,115,116,114,105,110,103,0,0,0,108,0,0,0,0,0,0,0,110,117,109,98,101,114,0,0,116,111,111,32,109,97,110,121,32,111,112,116,105,111,110,115,0,0,0,0,0,0,0,0,102,117,110,99,116,105,111,110,32,111,114,32,108,101,118,101,108,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,105,110,100,101,120,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,114,101,97,100,0,0,0,0,105,110,118,97,108,105,100,32,107,101,121,32,116,111,32,39,110,101,120,116,39,0,0,0,105,110,0,0,0,0,0,0,98,114,101,97,107,0,0,0,100,121,110,97,109,105,99,32,108,105,98,114,97,114,105,101,115,32,110,111,116,32,101,110,97,98,108,101,100,59,32,99,104,101,99,107,32,121,111,117,114,32,76,117,97,32,105,110,115,116,97,108,108,97,116,105,111,110,0,0,0,0,0,0,110,111,116,32,97,32,110,117,109,98,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,0,0,105,110,118,97,108,105,100,32,99,111,110,118,101,114,115,105,111,110,32,115,112,101,99,105,102,105,101,114,32,39,37,37,37,115,39,0,0,0,0,0,37,108,102,0,0,0,0,0,62,37,115,0,0,0,0,0,99,97,110,110,111,116,32,99,104,97,110,103,101,32,97,32,112,114,111,116,101,99,116,101,100,32,109,101,116,97,116,97,98,108,101,0,0,0,0,0,114,101,111,112,101,110,0,0,37,112,0,0,0,0,0,0,105,102,0,0,0,0,0,0,108,117,97,111,112,101,110,95,37,115,0,0,0,0,0,0,37,46,49,52,103,0,0,0,110,111,32,118,97,108,117,101,0,0,0,0,0,0,0,0,119,114,111,110,103,32,110,117,109,98,101,114,32,111,102,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,0,0,102,108,110,83,116,117,0,0,95,95,109,101,116,97,116,97,98,108,101,0,0,0,0,0,114,98,0,0,0,0,0,0,103,111,116,111,0,0,0,0,111,112,99,111,100,101,115,0,45,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,117,115,101,32,111,102,32,39,37,99,39,32,105,110,32,114,101,112,108,97,99,101,109,101,110,116,32,115,116,114,105,110,103,0,0,0,0,0,0,0,97,65,98,66,99,100,72,73,106,109,77,112,83,85,119,87,120,88,121,89,122,37,0,0,105,110,116,101,114,118,97,108,32,105,115,32,101,109,112,116,121,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,0,0,76,117,97,32,102,117,110,99,116,105,111,110,32,101,120,112,101,99,116,101,100,0,0,0,110,105,108,32,111,114,32,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,0,27,76,117,97,0,0,0,0,27,76,117,97,0,0,0,0,102,117,110,99,116,105,111,110,0,0,0,0,0,0,0,0,95,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,114,101,112,108,97,99,101,109,101,110,116,32,118,97,108,117,101,32,40,97,32,37,115,41,0,0,0,0,0,0,0,0,121,100,97,121,0,0,0,0,116,97,110,0,0,0,0,0,116,111,111,32,109,97,110,121,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,105,110,118,97,108,105,100,32,117,112,118,97,108,117,101,32,105,110,100,101,120,0,0,0,32,12,10,13,9,11,0,0,111,112,101,110,0,0,0,0,117,112,118,97,108,117,101,115,0,0,0,0,0,0,0,0,39,37,115,39,0,0,0,0,102,111,114,0,0,0,0,0,46,0,0,0,0,0,0,0,115,116,114,105,110,103,47,102,117,110,99,116,105,111,110,47,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,119,100,97,121,0,0,0,0,116,97,110,104,0,0,0,0,110,111,116,32,97,110,32,105,110,116,101,103,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,62,117,0,0,0,0,0,0,112,97,99,107,97,103,101,0,98,97,115,101,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,0,114,0,0,0,0,0,0,0,37,115,32,101,120,112,101,99,116,101,100,32,40,116,111,32,99,108,111,115,101,32,37,115,32,97,116,32,108,105,110,101,32,37,100,41,0,0,0,0,102,97,108,115,101,0,0,0,115,101,97,114,99,104,101,114,115,0,0,0,0,0,0,0,99,111,110,99,97,116,101,110,97,116,101,0,0,0,0,0,112,97,99,107,0,0,0,0,101,114,114,111,114,32,108,111,97,100,105,110,103,32,109,111,100,117,108,101,32,39,37,115,39,32,102,114,111,109,32,102,105,108,101,32,39,37,115,39,58,10,9,37,115,0,0,0,94,36,42,43,63,46,40,91,37,45,0,0,0,0,0,0,42,116,0,0,0,0,0,0,115,113,114,116,0,0,0,0,101,110,100,0,0,0,0,0,98,121,116,101,0,0,0,0,102,117,108,108,32,117,115,101,114,100,97,116,97,32,101,120,112,101,99,116,101,100,44,32,103,111,116,32,108,105,103,104,116,32,117,115,101,114,100,97,116,97,0,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,64,37,115,0,0,0,0,0,95,95,99,97,108,108,0,0,100,105,102,102,116,105,109,101,0,0,0,0,0,0,0,0,40,102,111,114,32,115,116,101,112,41,0,0,0,0,0,0,101,110,100,0,0,0,0,0,97,98,115,0,0,0,0,0,10,9,110,111,32,109,111,100,117,108,101,32,39,37,115,39,32,105,110,32,102,105,108,101,32,39,37,115,39,0,0,0,110,111,32,118,97,108,117,101,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,112,97,116,116,101,114,110,32,99,97,112,116,117,114,101,0,37,99,0,0,0,0,0,0,115,105,110,0,0,0,0,0,99,117,114,0,0,0,0,0,116,97,105,108,32,99,97,108,108,0,0,0,0,0,0,0,118,97,108,117,101,32,101,120,112,101,99,116,101,100,0,0,95,73,79,95,111,117,116,112,117,116,0,0,0,0,0,0,61,115,116,100,105,110,0,0,95,95,99,111,110,99,97,116,0,0,0,0,0,0,0,0,40,102,111,114,32,108,105,109,105,116,41,0,0,0,0,0,101,108,115,101,105,102,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,103,101,116,104,111,111,107,0,47,0,0,0,0,0,0,0,114,117,110,110,105,110,103,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,109,105,115,115,105,110,103,32,97,114,103,117,109,101,110,116,115,32,116,111,32,39,37,37,98,39,41,0,0,110,117,109,101,114,105,99,0,115,105,110,104,0,0,0,0,98,110,111,116,0,0,0,0,115,101,116,0,0,0,0,0,99,111,117,110,116,0,0,0,120,112,99,97,108,108,0,0,98,117,102,102,101,114,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,0,0,95,95,108,101,0,0,0,0,40,102,111,114,32,105,110,100,101,120,41,0,0,0,0,0,40,42,118,97,114,97,114,103,41,0,0,0,0,0,0,0,101,108,115,101,0,0,0,0,95,86,69,82,83,73,79,78,0,0,0,0,0,0,0,0,99,111,110,115,116,97,110,116,115,0,0,0,0,0,0,0,76,85,65,95,78,79,69,78,86,0,0,0,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,109,105,115,115,105,110,103,32,39,93,39,41,0,109,111,110,101,116,97,114,121,0,0,0,0,0,0,0,0,114,97,110,100,111,109,115,101,101,100,0,0,0,0,0,0,108,105,110,101,0,0,0,0,108,105,110,101,0,0,0,0,10,9,46,46,46,0,0,0,116,97,98,108,101,32,105,110,100,101,120,32,105,115,32,110,105,108,0,0,0,0,0,0,116,121,112,101,0,0,0,0,118,97,108,117,101,32,101,120,112,101,99,116,101,100,0,0,95,95,108,116,0,0,0,0,40,102,111,114,32,99,111,110,116,114,111,108,41,0,0,0,100,111,0,0,0,0,0,0,108,111,111,112,32,105,110,32,103,101,116,116,97,98,108,101,0,0,0,0,0,0,0,0,40,42,116,101,109,112,111,114,97,114,121,41,0,0,0,0,53,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,121,105,101,108,100,32,97,99,114,111,115,115,32,109,101,116,97,109,101,116,104,111,100,47,67,45,99,97,108,108,32,98,111,117,110,100,97,114,121,0,0,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,101,110,100,115,32,119,105,116,104,32,39,37,37,39,41,0,0,0,0,0,0,99,116,121,112,101,0,0,0,114,97,110,100,111,109,0,0,98,111,111,108,101,97,110,0,102,117,108,108,0,0,0,0,114,101,116,117,114,110,0,0,116,111,115,116,114,105,110,103,0,0,0,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,116,97,98,108,101,32,111,118,101,114,102,108,111,119,0,0,95,95,117,110,109,0,0,0,40,102,111,114,32,115,116,97,116,101,41,0,0,0,0,0,98,114,101,97,107,0,0,0,76,117,97,0,0,0,0,0,60,103,111,116,111,32,37,115,62,32,97,116,32,108,105,110,101,32,37,100,32,106,117,109,112,115,32,105,110,116,111,32,116,104,101,32,115,99,111,112,101,32,111,102,32,108,111,99,97,108,32,39,37,115,39,0,59,1,59,0,0,0,0,0,105,110,118,97,108,105,100,32,99,97,112,116,117,114,101,32,105,110,100,101,120,32,37,37,37,100,0,0,0,0,0,0,99,111,108,108,97,116,101,0,114,97,100,0,0,0,0,0,110,111,0,0,0,0,0,0,99,97,108,108,0,0,0,0,116,111,110,117,109,98,101,114,0,0,0,0,0,0,0,0,110,111,116,32,101,110,111,117,103,104,32,109,101,109,111,114,121,0,0,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,32,40,37,115,41,0,0,0,0,0,95,95,112,111,119,0,0,0,40,110,117,108,108,41,0,0,40,102,111,114,32,103,101,110,101,114,97,116,111,114,41,0,97,110,100,0,0,0,0,0,109,97,105,110,0,0,0,0,37,115,32,110,101,97,114,32,37,115,0,0,0,0,0,0,59,59,0,0,0,0,0,0,109,105,115,115,105,110,103,32,39,91,39,32,97,102,116,101,114,32,39,37,37,102,39,32,105,110,32,112,97,116,116,101,114,110,0,0,0,0,0,0,97,108,108,0,0,0,0,0,112,111,119,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,117,115,101,32,97,32,99,108,111,115,101,100,32,102,105,108,101,0,0,0,0,95,95,109,111,100,101,0,0,115,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,115,39,0,0,0,0,0,95,95,109,111,100,0,0,0,39,61,39,32,111,114,32,39,105,110,39,32,101,120,112,101,99,116,101,100,0,0,0,0,61,63,0,0,0,0,0,0,102,117,110,99,116,105,111,110,32,111,114,32,101,120,112,114,101,115,115,105,111,110,32,116,111,111,32,99,111,109,112,108,101,120,0,0,0,0,0,0,37,115,58,37,100,58,32,37,115,0,0,0,0,0,0,0,109,111,100,117,108,101,32,39,37,115,39,32,110,111,116,32,102,111,117,110,100,58,37,115,0,0,0,0,0,0,0,0,117,110,102,105,110,105,115,104,101,100,32,99,97,112,116,117,114,101,0,0,0,0,0,0,102,105,101,108,100,32,39,37,115,39,32,109,105,115,115,105,110,103,32,105,110,32,100,97,116,101,32,116,97,98,108,101,0,0,0,0,0,0,0,0,109,111,100,102,0,0,0,0,37,46,49,52,103,0,0,0,107,0,0,0,0,0,0,0,115,101,108,101,99,116,0,0,101,120,105,116,0,0,0,0,95,95,100,105,118,0,0,0,108,97,98,101,108,32,39,37,115,39,32,97,108,114,101,97,100,121,32,100,101,102,105,110,101,100,32,111,110,32,108,105,110,101,32,37,100,0,0,0,67,0,0,0,0,0,0,0,99,104,117,110,107,32,104,97,115,32,116,111,111,32,109,97,110,121,32,108,105,110,101,115,0,0,0,0,0,0,0,0,39,112,97,99,107,97,103,101,46,115,101,97,114,99,104,101,114,115,39,32,109,117,115,116,32,98,101,32,97,32,116,97,98,108,101,0,0,0,0,0,105,110,118,97,108,105,100,32,99,97,112,116,117,114,101,32,105,110,100,101,120,0,0,0,105,115,100,115,116,0,0,0,109,105,110,0,0,0,0,0,102,105,108,101,32,40,37,112,41,0,0,0,0,0,0,0,95,72,75,69,89,0,0,0,114,97,119,115,101,116,0,0,37,115,0,0,0,0,0,0,60,37,115,62,32,97,116,32,108,105,110,101,32,37,100,32,110,111,116,32,105,110,115,105,100,101,32,97,32,108,111,111,112,0,0,0,0,0,0,0,95,95,109,117,108,0,0,0,117,110,101,120,112,101,99,116,101,100,32,115,121,109,98,111,108,0,0,0,0,0,0,0,99,104,97,114,40,37,100,41,0,0,0,0,0,0,0,0,61,91,67,93,0,0,0,0,117,110,102,105,110,105,115,104,101,100,32,108,111,110,103,32,99,111,109,109,101,110,116,0,114,101,113,117,105,114,101,0,116,111,111,32,109,97,110,121,32,99,97,112,116,117,114,101,115,0,0,0,0,0,0,0,121,101,97,114,0,0,0,0,109,97,120,0,0,0,0,0,102,105,108,101,32,40,99,108,111,115,101,100,41,0,0,0,108,101,118,101,108,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,95,71,0,0,0,0,0,0,114,97,119,103,101,116,0,0,37,115,58,32,37,115,0,0,95,95,115,117,98,0,0,0,102,117,110,99,116,105,111,110,32,97,114,103,117,109,101,110,116,115,32,101,120,112,101,99,116,101,100,0,0,0,0,0,95,95,103,99,0,0,0,0,109,101,116,97,109,101,116,104,111,100,0,0,0,0,0,0,105,110,115,101,114,116,0,0,117,110,102,105,110,105,115,104,101,100,32,108,111,110,103,32,115,116,114,105,110,103,0,0,112,114,101,108,111,97,100,0,114,101,115,117,108,116,105,110,103,32,115,116,114,105,110,103,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,109,111,110,116,104,0,0,0,108,111,103,0,0,0,0,0,95,95,116,111,115,116,114,105,110,103], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([95,95,105,110,100,101,120,0,110,105,108,32,111,114,32,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,0,114,97,119,108,101,110,0,0,95,95,97,100,100,0,0,0,100,97,116,101,0,0,0,0,116,111,111,32,109,97,110,121,32,37,115,32,40,108,105,109,105,116,32,105,115,32,37,100,41,32,105,110,32,37,115,0,102,111,114,32,105,116,101,114,97,116,111,114,0,0,0,0,101,114,114,111,114,32,105,110,32,95,95,103,99,32,109,101,116,97,109,101,116,104,111,100,32,40,37,115,41,0,0,0,97,116,116,101,109,112,116,32,116,111,32,37,115,32,97,32,37,115,32,118,97,108,117,101,0,0,0,0,0,0,0,0,104,101,120,97,100,101,99,105,109,97,108,32,100,105,103,105,116,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,104,117,103,101,0,0,0,0,95,80,82,69,76,79,65,68,0,0,0,0,0,0,0,0,117,112,112,101,114,0,0,0,100,97,121,0,0,0,0,0,108,100,101,120,112,0,0,0,95,95,103,99,0,0,0,0,116,114,97,99,101,98,97,99,107,0,0,0,0,0,0,0,114,97,119,101,113,117,97,108,0,0,0,0,0,0,0,0,115,116,100,105,110,0,0,0,37,115,58,37,100,58,32,0,95,95,101,113,0,0,0,0,102,117,110,99,116,105,111,110,32,97,116,32,108,105,110,101,32,37,100,0,0,0,0,0,100,101,99,105,109,97,108,32,101,115,99,97,112,101,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,0,0,103,101,116,117,115,101,114,118,97,108,117,101,0,0,0,0,108,111,97,100,101,100,0,0,114,101,115,117,109,101,0,0,115,117,98,0,0,0,0,0,104,111,117,114,0,0,0,0,102,114,101,120,112,0,0,0,98,97,110,100,0,0,0,0,119,114,105,116,101,0,0,0,115,101,116,117,112,118,97,108,117,101,0,0,0,0,0,0,116,114,121,105,110,103,32,116,111,32,97,99,99,101,115,115,32,110,111,110,45,101,120,105,115,116,101,110,116,32,98,105,116,115,0,0,0,0,0,0,112,114,105,110,116,0,0,0,83,108,0,0,0,0,0,0,95,95,108,101,110,0,0,0,109,97,105,110,32,102,117,110,99,116,105,111,110,0,0,0,76,117,97,32,53,46,50,0,63,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,101,115,99,97,112,101,32,115,101,113,117,101,110,99,101,0,95,76,79,65,68,69,68,0,114,101,118,101,114,115,101,0,109,105,110,0,0,0,0,0,102,109,111,100,0,0,0,0,115,101,116,118,98,117,102,0,115,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,115,116,97,99,107,32,116,114,97,99,101,98,97,99,107,58,0,0,0,0,0,0,0,0,119,105,100,116,104,32,109,117,115,116,32,98,101,32,112,111,115,105,116,105,118,101,0,0,112,99,97,108,108,0,0,0,98,97,100,32,97,114,103,117,109,101,110,116,32,35,37,100,32,116,111,32,39,37,115,39,32,40,37,115,41,0,0,0,95,95,109,111,100,101,0,0,105,116,101,109,115,32,105,110,32,97,32,99,111,110,115,116,114,117,99,116,111,114,0,0,109,101,116,104,111,100,0,0,105,110,100,101,120,0,0,0,99,111,110,115,116,114,117,99,116,111,114,32,116,111,111,32,108,111,110,103,0,0,0,0,98,105,110,97,114,121,32,115,116,114,105,110,103,0,0,0,117,110,102,105,110,105,115,104,101,100,32,115,116,114,105,110,103,0,0,0,0,0,0,0,99,111,110,102,105,103,0,0,114,101,112,0,0,0,0,0,115,101,99,0,0,0,0,0,102,108,111,111,114,0,0,0,67,32,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,0,0,0,0,0,0,110,105,108,0,0,0,0,0,115,101,101,107,0,0,0,0,115,101,116,108,111,99,97,108,0,0,0,0,0,0,0,0,100,101,97,100,0,0,0,0,102,105,101,108,100,32,99,97,110,110,111,116,32,98,101,32,110,101,103,97,116,105,118,101,0,0,0,0,0,0,0,0,112,97,105,114,115,0,0,0,63,0,0,0,0,0,0,0,116,97,98,108,101,32,105,110,100,101,120,32,105,115,32,78,97,78,0,0,0,0,0,0,95,95,103,99,0,0,0,0,102,117,110,99,116,105,111,110,115,0,0,0,0,0,0,0,110,78,0,0,0,0,0,0,99,111,110,115,116,97,110,116,0,0,0,0,0,0,0,0,108,101,120,105,99,97,108,32,101,108,101,109,101,110,116,32,116,111,111,32,108,111,110,103,0,0,0,0,0,0,0,0,110,111,32,118,105,115,105,98,108,101,32,108,97,98,101,108,32,39,37,115,39,32,102,111,114,32,60,103,111,116,111,62,32,97,116,32,108,105,110,101,32,37,100,0,0,0,0,0,47,10,59,10,63,10,33,10,45,10,0,0,0,0,0,0,105,110,118,97,108,105,100,32,118,97,108,117,101,32,40,37,115,41,32,97,116,32,105,110,100,101,120,32,37,100,32,105,110,32,116,97,98,108,101,32,102,111,114,32,39,99,111,110,99,97,116,39,0,0,0,0,109,97,116,99,104,0,0,0,117,110,97,98,108,101,32,116,111,32,103,101,110,101,114,97,116,101,32,97,32,117,110,105,113,117,101,32,102,105,108,101,110,97,109,101,0,0,0,0,101,120,112,0,0,0,0,0,114,101,97,100,0,0,0,0,115,101,116,104,111,111,107,0,110,111,114,109,97,108,0,0,114,115,104,105,102,116,0,0,110,101,120,116,0,0,0,0,99,97,108,108,0,0,0,0,99,97,108,108,105,110,103,32,39,37,115,39,32,111,110,32,98,97,100,32,115,101,108,102,0,0,0,0,0,0,0,0,95,95,110,101,119,105,110,100,101,120,0,0,0,0,0,0,120,88,0,0,0,0,0,0,108,111,99,97,108,32,118,97,114,105,97,98,108,101,115,0,109,101,109,111,114,121,32,97,108,108,111,99,97,116,105,111,110,32,101,114,114,111,114,58,32,98,108,111,99,107,32,116,111,111,32,98,105,103,0,0,116,111,111,32,109,97,110,121,32,37,115,32,40,108,105,109,105,116,32,105,115,32,37,100,41,0,0,0,0,0,0,0,117,112,118,97,108,117,101,0,109,97,108,102,111,114,109,101,100,32,110,117,109,98,101,114,0,0,0,0,0,0,0,0,100,101,98,117,103,0,0,0,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,46,115,111,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,108,111,97,100,97,108,108,46,115,111,59,46,47,63,46,115,111,0,0,0,0,119,114,111,110,103,32,110,117,109,98,101,114,32,111,102,32,97,114,103,117,109,101,110,116,115,32,116,111,32,39,105,110,115,101,114,116,39,0,0,0,108,111,119,101,114,0,0,0,116,109,112,110,97,109,101,0,100,101,103,0,0,0,0,0,108,105,110,101,115,0,0,0,115,101,116,117,115,101,114,118,97,108,117,101,0,0,0,0,115,117,115,112,101,110,100,101,100,0,0,0,0,0,0,0,114,114,111,116,97,116,101,0,108,111,97,100,0,0,0,0,109,101,116,104,111,100,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,100,101,97,100,32,99,111,114,111,117,116,105,110,101,0,0,0,0,105,110,99,111,109,112,97,116,105,98,108,101,0,0,0,0,95,95,105,110,100,101,120,0,60,110,97,109,101,62,32,111,114,32,39,46,46,46,39,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,0,0,102,105,101,108,100,0,0,0,63,0,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);
function runPostSets() {


}

var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  var _llvm_va_start=undefined;

  function _llvm_va_end() {}

  var _abs=Math_abs;

  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }

  
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }

  function _longjmp(env, value) {
      throw { longjmp: true, id: HEAP32[((env)>>2)], value: value || 1 };
    }

  function _abort() {
      Module['abort']();
    }

  var _setjmp=undefined;

  function _localeconv() {
      // %struct.timeval = type { char* decimal point, other stuff... }
      // var indexes = Runtime.calculateStructAlignment({ fields: ['i32', 'i32'] });
      var me = _localeconv;
      if (!me.ret) {
        me.ret = allocate([allocate(intArrayFromString('.'), 'i8', ALLOC_NORMAL)], 'i8*', ALLOC_NORMAL); // just decimal point, for now
      }
      return me.ret;
    }

  var _floor=Math_floor;

  var _llvm_pow_f64=Math_pow;

  function _strpbrk(ptr1, ptr2) {
      var curr;
      var searchSet = {};
      while (1) {
        var curr = HEAP8[((ptr2++)|0)];
        if (!curr) break;
        searchSet[curr] = 1;
      }
      while (1) {
        curr = HEAP8[(ptr1)];
        if (!curr) break;
        if (curr in searchSet) return ptr1;
        ptr1++;
      }
      return 0;
    }

  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }

  
  
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision === -1) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  function _memcmp(p1, p2, num) {
      p1 = p1|0; p2 = p2|0; num = num|0;
      var i = 0, v1 = 0, v2 = 0;
      while ((i|0) < (num|0)) {
        v1 = HEAPU8[(((p1)+(i))|0)];
        v2 = HEAPU8[(((p2)+(i))|0)];
        if ((v1|0) != (v2|0)) return ((v1|0) > (v2|0) ? 1 : -1)|0;
        i = (i+1)|0;
      }
      return 0;
    }

  var _strcoll=_strcmp;

  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }function ___errno_location() {
      return ___errno_state;
    }

  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }

  
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
  
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
  
        if (!total) {
          // early out
          return callback(null);
        }
  
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
  
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
  
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
  
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat, node;
  
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
  
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
  
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
  
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
  
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          FS.FSNode.prototype = {};
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
  
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
  
              if (!hasByteServing) chunkSize = datalength;
  
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
  
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
  
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
  
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 512;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 1024;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }

  
  
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      var stream = FS.getStream(fildes);
      if (stream) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }function _freopen(filename, mode, stream) {
      // FILE *freopen(const char *restrict filename, const char *restrict mode, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/freopen.html
      if (!filename) {
        var streamObj = FS.getStream(stream);
        if (!streamObj) {
          ___setErrNo(ERRNO_CODES.EBADF);
          return 0;
        }
        if (_freopen.buffer) _free(_freopen.buffer);
        filename = intArrayFromString(streamObj.path);
        filename = allocate(filename, 'i8', ALLOC_NORMAL);
      }
      _fclose(stream);
      return _fopen(filename, mode);
    }

  function _ferror(stream) {
      // int ferror(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ferror.html
      stream = FS.getStream(stream);
      return Number(stream && stream.error);
    }


  function _strstr(ptr1, ptr2) {
      var check = 0, start;
      do {
        if (!check) {
          start = ptr1;
          check = ptr2;
        }
        var curr1 = HEAP8[((ptr1++)|0)];
        var curr2 = HEAP8[((check++)|0)];
        if (curr2 == 0) return start;
        if (curr2 != curr1) {
          // rewind to one character after start, to find ez in eeez
          ptr1 = start + 1;
          check = 0;
        }
      } while (curr1);
      return 0;
    }

  
  
  
  
  
  var _mkport=undefined;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }


  function _feof(stream) {
      // int feof(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/feof.html
      stream = FS.getStream(stream);
      return Number(stream && stream.eof);
    }

  
  
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop();
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }

  
  function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;

  function _strspn(pstr, pset) {
      var str = pstr, set, strcurr, setcurr;
      while (1) {
        strcurr = HEAP8[(str)];
        if (!strcurr) return str - pstr;
        set = pset;
        while (1) {
          setcurr = HEAP8[(set)];
          if (!setcurr || setcurr == strcurr) break;
          set++;
        }
        if (!setcurr) return str - pstr;
        str++;
      }
    }

  function _isalnum(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }

  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }

  function _toupper(chr) {
      if (chr >= 97 && chr <= 122) {
        return chr - 97 + 65;
      } else {
        return chr;
      }
    }


  function _fgets(s, n, stream) {
      // char *fgets(char *restrict s, int n, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgets.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return 0;
      if (streamObj.error || streamObj.eof) return 0;
      var byte_;
      for (var i = 0; i < n - 1 && byte_ != 10; i++) {
        byte_ = _fgetc(stream);
        if (byte_ == -1) {
          if (streamObj.error || (streamObj.eof && i == 0)) return 0;
          else if (streamObj.eof) break;
        }
        HEAP8[(((s)+(i))|0)]=byte_;
      }
      HEAP8[(((s)+(i))|0)]=0;
      return s;
    }

  function _setvbuf(stream, buf, type, size) {
      // int setvbuf(FILE *restrict stream, char *restrict buf, int type, size_t size);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/setvbuf.html
      // TODO: Implement custom buffering.
      return 0;
    }

  
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      }
      stream = FS.getStream(stream);
      stream.eof = false;
      return 0;
    }

  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      stream = FS.getStream(stream);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (FS.isChrdev(stream.node.mode)) {
        ___setErrNo(ERRNO_CODES.ESPIPE);
        return -1;
      } else {
        return stream.position;
      }
    }

  function _clearerr(stream) {
      // void clearerr(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/clearerr.html
      stream = FS.getStream(stream);
      if (!stream) {
        return;
      }
      stream.eof = false;
      stream.error = false;
    }

  
  
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
  
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
  
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
  
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
  
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
  
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
  
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
  
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
  
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
  
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16);
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text);
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text);
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j];
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }
  
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }function _fscanf(stream, format, varargs) {
      // int fscanf(FILE *restrict stream, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        return -1;
      }
      var buffer = [];
      function get() {
        var c = _fgetc(stream);
        buffer.push(c);
        return c;
      };
      function unget() {
        _ungetc(buffer.pop(), stream);
      };
      return __scanString(format, get, unget, varargs);
    }


  
  function _tmpnam(s, dir, prefix) {
      // char *tmpnam(char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpnam.html
      // NOTE: The dir and prefix arguments are for internal use only.
      var folder = FS.findObject(dir || '/tmp');
      if (!folder || !folder.isFolder) {
        dir = '/tmp';
        folder = FS.findObject(dir);
        if (!folder || !folder.isFolder) return 0;
      }
      var name = prefix || 'file';
      do {
        name += String.fromCharCode(65 + Math.floor(Math.random() * 25));
      } while (name in folder.contents);
      var result = dir + '/' + name;
      if (!_tmpnam.buffer) _tmpnam.buffer = _malloc(256);
      if (!s) s = _tmpnam.buffer;
      writeAsciiToMemory(result, s);
      return s;
    }function _tmpfile() {
      // FILE *tmpfile(void);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpfile.html
      // TODO: Delete the created file on closing.
      if (_tmpfile.mode) {
        _tmpfile.mode = allocate(intArrayFromString('w+'), 'i8', ALLOC_NORMAL);
      }
      return _fopen(_tmpnam(0), _tmpfile.mode);
    }

  var _tan=Math_tan;

  
  function _sinh(x) {
      var p = Math.pow(Math.E, x);
      return (p - (1 / p)) / 2;
    }
  
  function _cosh(x) {
      var p = Math.pow(Math.E, x);
      return (p + (1 / p)) / 2;
    }function _tanh(x) {
      return _sinh(x) / _cosh(x);
    }

  var _sqrt=Math_sqrt;

  var _sin=Math_sin;


  function _srand(seed) {}

  function _rand() {
      return Math.floor(Math.random()*0x80000000);
    }

  function _modf(x, intpart) {
      HEAPF64[((intpart)>>3)]=Math.floor(x);
      return x - HEAPF64[((intpart)>>3)];
    }

  var _log=Math_log;

  function _log10(x) {
      return Math.log(x) / Math.LN10;
    }

  function _frexp(x, exp_addr) {
      var sig = 0, exp_ = 0;
      if (x !== 0) {
        var sign = 1;
        if (x < 0) {
          x = -x;
          sign = -1;
        }
        var raw_exp = Math.log(x)/Math.log(2);
        exp_ = Math.ceil(raw_exp);
        if (exp_ === raw_exp) exp_ += 1;
        sig = sign*x/Math.pow(2, exp_);
      }
      HEAP32[((exp_addr)>>2)]=exp_;
      return sig;
    }

  function _fmod(x, y) {
      return x % y;
    }

  var _exp=Math_exp;

  var _cos=Math_cos;


  var _ceil=Math_ceil;

  var _atan=Math_atan;

  var _atan2=Math_atan2;

  var _asin=Math_asin;

  var _acos=Math_acos;

  var _fabs=Math_abs;


  
  
  var _tzname=allocate(8, "i32*", ALLOC_STATIC);
  
  var _daylight=allocate(1, "i32*", ALLOC_STATIC);
  
  var _timezone=allocate(1, "i32*", ALLOC_STATIC);function _tzset() {
      // TODO: Use (malleable) environment variables instead of system settings.
      if (_tzset.called) return;
      _tzset.called = true;
  
      HEAP32[((_timezone)>>2)]=-(new Date()).getTimezoneOffset() * 60;
  
      var winter = new Date(2000, 0, 1);
      var summer = new Date(2000, 6, 1);
      HEAP32[((_daylight)>>2)]=Number(winter.getTimezoneOffset() != summer.getTimezoneOffset());
  
      var winterName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | winter.toString().match(/\(([A-Z]+)\)/)[1];
      var summerName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | summer.toString().match(/\(([A-Z]+)\)/)[1];
      var winterNamePtr = allocate(intArrayFromString(winterName), 'i8', ALLOC_NORMAL);
      var summerNamePtr = allocate(intArrayFromString(summerName), 'i8', ALLOC_NORMAL);
      HEAP32[((_tzname)>>2)]=winterNamePtr;
      HEAP32[(((_tzname)+(4))>>2)]=summerNamePtr;
    }function _mktime(tmPtr) {
      _tzset();
      var year = HEAP32[(((tmPtr)+(20))>>2)];
      var timestamp = new Date(year >= 1900 ? year : year + 1900,
                               HEAP32[(((tmPtr)+(16))>>2)],
                               HEAP32[(((tmPtr)+(12))>>2)],
                               HEAP32[(((tmPtr)+(8))>>2)],
                               HEAP32[(((tmPtr)+(4))>>2)],
                               HEAP32[((tmPtr)>>2)],
                               0).getTime() / 1000;
      HEAP32[(((tmPtr)+(24))>>2)]=new Date(timestamp).getDay();
      var yday = Math.round((timestamp - (new Date(year, 0, 1)).getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      return timestamp;
    }

  function _setlocale(category, locale) {
      if (!_setlocale.ret) _setlocale.ret = allocate([0], 'i8', ALLOC_NORMAL);
      return _setlocale.ret;
    }

  function _rename(old_path, new_path) {
      // int rename(const char *old, const char *new);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rename.html
      old_path = Pointer_stringify(old_path);
      new_path = Pointer_stringify(new_path);
      try {
        FS.rename(old_path, new_path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  
  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = Pointer_stringify(path);
      try {
        FS.unlink(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _rmdir(path) {
      // int rmdir(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rmdir.html
      path = Pointer_stringify(path);
      try {
        FS.rmdir(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _remove(path) {
      // int remove(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/remove.html
      var ret = _unlink(path);
      if (ret == -1) ret = _rmdir(path);
      return ret;
    }

  
  
  
  
  var _environ=allocate(1, "i32*", ALLOC_STATIC);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
  
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './this.program';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr;
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
  
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
  
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
  
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }

  function _system(command) {
      // int system(const char *command);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/system.html
      // Can't call external programs.
      ___setErrNo(ERRNO_CODES.EAGAIN);
      return -1;
    }

  function _difftime(time1, time0) {
      return time1 - time0;
    }

  
  var ___tm_current=allocate(44, "i8", ALLOC_STATIC);
  
  
  var ___tm_timezone=allocate(intArrayFromString("GMT"), "i8", ALLOC_STATIC);function _gmtime_r(time, tmPtr) {
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getUTCSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getUTCMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getUTCHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getUTCDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getUTCMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getUTCFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getUTCDay();
      HEAP32[(((tmPtr)+(36))>>2)]=0;
      HEAP32[(((tmPtr)+(32))>>2)]=0;
      var start = new Date(date); // define date using UTC, start from Jan 01 00:00:00 UTC
      start.setUTCDate(1);
      start.setUTCMonth(0);
      start.setUTCHours(0);
      start.setUTCMinutes(0);
      start.setUTCSeconds(0);
      start.setUTCMilliseconds(0);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _gmtime(time) {
      return _gmtime_r(time, ___tm_current);
    }

  
  function _localtime_r(time, tmPtr) {
      _tzset();
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getDay();
  
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(36))>>2)]=start.getTimezoneOffset() * 60;
  
      var dst = Number(start.getTimezoneOffset() != date.getTimezoneOffset());
      HEAP32[(((tmPtr)+(32))>>2)]=dst;
  
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _localtime(time) {
      return _localtime_r(time, ___tm_current);
    }

  
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  
  
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
  
      var pattern = Pointer_stringify(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
  
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
  
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
  
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
  
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
  
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }

  function _clock() {
      if (_clock.start === undefined) _clock.start = Date.now();
      return Math.floor((Date.now() - _clock.start) * (1000000/1000));
    }

  function _tolower(chr) {
      chr = chr|0;
      if ((chr|0) < 65) return chr|0;
      if ((chr|0) > 90) return chr|0;
      return (chr - 65 + 97)|0;
    }

  function _isalpha(chr) {
      return (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }

  function _iscntrl(chr) {
      return (0 <= chr && chr <= 0x1F) || chr === 0x7F;
    }

  function _isgraph(chr) {
      return 0x20 < chr && chr < 0x7F;
    }

  function _islower(chr) {
      return chr >= 97 && chr <= 122;
    }

  function _ispunct(chr) {
      return (chr >= 33 && chr <= 47) ||
             (chr >= 58 && chr <= 64) ||
             (chr >= 91 && chr <= 96) ||
             (chr >= 123 && chr <= 126);
    }

  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }

  function _isupper(chr) {
      return chr >= 65 && chr <= 90;
    }

  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }

  function _memchr(ptr, chr, num) {
      chr = unSign(chr);
      for (var i = 0; i < num; i++) {
        if (HEAP8[(ptr)] == chr) return ptr;
        ptr++;
      }
      return 0;
    }

  function _strcpy(pdest, psrc) {
      pdest = pdest|0; psrc = psrc|0;
      var i = 0;
      do {
        HEAP8[(((pdest+i)|0)|0)]=HEAP8[(((psrc+i)|0)|0)];
        i = (i+1)|0;
      } while (HEAP8[(((psrc)+(i-1))|0)]);
      return pdest|0;
    }

  function _llvm_lifetime_start() {}

  function _llvm_lifetime_end() {}

  
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
      return (ptr-num)|0;
    }var _llvm_memset_p0i8_i64=_memset;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  
  function _copysign(a, b) {
      return __reallyNegative(a) === __reallyNegative(b) ? a : -a;
    }var _copysignl=_copysign;

  var _fmodl=_fmod;






  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (scrollX + rect.left);
              y = t.pageY - (scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (scrollX + rect.left);
            y = event.pageY - (scrollY + rect.top);
          }
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
___buildEnvironment(ENV);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 10485760;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");



var FUNCTION_TABLE = [0,0,_f_seek,0,_luaB_pairs,0,_searcher_Croot,0,_luaB_type,0,_f_tostring,0,_io_write,0,_gctm,0,_b_or,0,_db_getmetatable,0,_dothecall,0,_math_atan,0,_b_and,0,_pcallcont,0,_luaB_next,0,_searcher_Lua,0,_pack,0,_math_sinh,0,_math_abs,0,_db_gethook,0,_math_acos,0,_db_upvalueid,0,_luaopen_io,0,_f_lines,0,_os_clock,0,_db_getlocal,0,_f_write,0,_luaopen_math,0,_str_reverse,0,_str_char,0,_os_time,0,_db_setupvalue,0,_f_call,0,_io_tmpfile,0,_os_remove,0,_str_find,0,_os_date,0,_math_deg,0,_luaB_auxwrap,0,_writer,0,_str_match,0,_ll_loadlib,0,_math_rad,0,_luaopen_string,0,_luaB_assert,0,_f_luaopen,0,_luaB_tostring,0,_math_floor,0,_panic,0,_math_exp,0,_tinsert,0,_str_upper,0,_io_lines,0,_str_dump,0,_db_getinfo,0,_db_setmetatable,0,_b_xor,0,_b_replace,0,_searcher_preload,0,_math_modf,0,_f_parser,0,_gmatch,0,_luaopen_os,0,_unpack,0,_math_asin,0,_str_rep,0,_os_tmpname,0,_db_getupvalue,0,_db_upvaluejoin,0,_luaB_tonumber,0,_luaB_cocreate,0,_str_format,0,_ll_require,0,_hookf,0,_io_close,0,_str_gsub,0,_resume,0,_math_random,0,_luaB_xpcall,0,_f_read,0,_luaB_cowrap,0,_luaB_corunning,0,_math_atan2,0,_io_readline,0,_luaopen_package,0,_math_pow,0,_io_noclose,0,_b_rshift,0,_b_extract,0,_ipairsaux,0,_math_tan,0,_gmatch_aux,0,_io_popen,0,_luaopen_debug,0,_math_frexp,0,_math_ceil,0,_l_alloc,0,_dofilecont,0,_luaB_pcall,0,_math_cos,0,_math_tanh,0,_io_output,0,_b_lrot,0,_luaB_rawlen,0,_luaB_yield,0,_db_sethook,0,_os_difftime,0,_tremove,0,_ll_searchpath,0,_str_lower,0,_math_min,0,_lua_newstate,0,_luaB_dofile,0,_growstack,0,_math_max,0,_str_byte,0,_os_setlocale,0,_math_randomseed,0,_unroll,0,_luaB_rawequal,0,_f_flush,0,_luaB_getmetatable,0,_math_fmod,0,_io_read,0,_math_ldexp,0,_luaB_loadfile,0,_os_getenv,0,_luaB_print,0,_io_open,0,_math_log,0,_luaB_error,0,_luaB_costatus,0,_str_sub,0,_db_setlocal,0,_luaB_coresume,0,_str_len,0,_db_debug,0,_luaB_setmetatable,0,_os_rename,0,_tconcat,0,_luaB_ipairs,0,_luaopen_base,0,_io_fclose,0,_io_type,0,_math_sin,0,_luaopen_bit32,0,_b_lshift,0,_db_setuservalue,0,_os_exit,0,_luaB_select,0,_io_input,0,_db_getregistry,0,_b_test,0,_luaB_rawset,0,_b_rrot,0,_luaB_collectgarbage,0,_searcher_C,0,_luaopen_table,0,_luaB_load,0,_luaopen_coroutine,0,_io_pclose,0,_b_not,0,_math_sqrt,0,_math_cosh,0,_luaB_rawget,0,_os_execute,0,_f_gc,0,_sort,0,_b_arshift,0,_getS,0,_db_traceback,0,_io_flush,0,_db_getuservalue,0,_f_setvbuf,0,_getF,0,_generic_reader,0];

// EMSCRIPTEN_START_FUNCS
function _getfreepos(r1){var r2,r3,r4,r5,r6;r2=0;r3=STACKTOP;r4=r1;while(1){if(HEAP32[r4+20>>2]>>>0<=HEAP32[r4+16>>2]>>>0){r2=6;break}r1=r4+20|0;HEAP32[r1>>2]=HEAP32[r1>>2]-32;if((HEAP32[HEAP32[r4+20>>2]+24>>2]|0)==0){r2=4;break}}if(r2==4){r5=HEAP32[r4+20>>2];r6=r5;STACKTOP=r3;return r6}else if(r2==6){r5=0;r6=r5;STACKTOP=r3;return r6}}function _rehash(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;STACKTOP=STACKTOP+136|0;r5=r4;r6=r4+8;r7=r1;r1=r2;r2=r3;r3=0;while(1){if((r3|0)>30){break}HEAP32[r6+(r3<<2)>>2]=0;r3=r3+1|0}r3=_numusearray(r1,r6|0);HEAP32[r5>>2]=r3;r3=HEAP32[r5>>2];r3=r3+_numusehash(r1,r6|0,r5)|0;r8=_countint(r2,r6|0);HEAP32[r5>>2]=HEAP32[r5>>2]+r8;r3=r3+1|0;r8=_computesizes(r6|0,r5);_luaH_resize(r7,r1,HEAP32[r5>>2],r3-r8|0);STACKTOP=r4;return}function _luaH_getint(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1;r1=r2;if((r1-1|0)>>>0<HEAP32[r5+28>>2]>>>0){r6=HEAP32[r5+12>>2]+(r1-1<<4)|0;r7=r6;STACKTOP=r4;return r7}r2=r1|0;r1=_hashnum(r5,r2);while(1){if((HEAP32[r1+24>>2]|0)==3){if(HEAPF64[r1+16>>3]==r2){r3=6;break}}r1=HEAP32[r1+28>>2];if((r1|0)==0){r3=10;break}}if(r3==6){r6=r1|0;r7=r6;STACKTOP=r4;return r7}else if(r3==10){r6=1208;r7=r6;STACKTOP=r4;return r7}}function _hashnum(r1,r2){var r3,r4,r5;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r1;HEAPF64[r4>>3]=r2+1;r2=HEAP32[r4>>2];r2=r2+HEAP32[r4+4>>2]|0;if((r2|0)<0){if((r2|0)==(-r2|0)){r2=0}r2=-r2|0}STACKTOP=r3;return HEAP32[r5+16>>2]+(((r2|0)%((1<<HEAPU8[r5+7|0])-1|1|0)&-1)<<5)|0}function _luaH_getstr(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=HEAP32[r5+16>>2]+((HEAP32[r1+8>>2]&(1<<HEAPU8[r5+7|0])-1)<<5)|0;while(1){if((HEAP32[r2+24>>2]|0)==68){if((HEAP32[r2+16>>2]|0)==(r1|0)){r3=4;break}}r2=HEAP32[r2+28>>2];if((r2|0)==0){r3=8;break}}if(r3==4){r6=r2|0;r7=r6;STACKTOP=r4;return r7}else if(r3==8){r6=1208;r7=r6;STACKTOP=r4;return r7}}function _luaH_get(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r1;r1=r2;r2=HEAP32[r1+8>>2]&63;do{if((r2|0)==0){r7=1208;r8=r7;STACKTOP=r4;return r8}else if((r2|0)==3){HEAPF64[r5>>3]=HEAPF64[r1>>3]+6755399441055744;r9=HEAP32[r5+(((HEAP32[1484>>2]|0)==33)<<2)>>2];if((r9|0)!=HEAPF64[r1>>3]){break}r7=_luaH_getint(r6,r9);r8=r7;STACKTOP=r4;return r8}else if((r2|0)==4){r7=_luaH_getstr(r6,HEAP32[r1>>2]);r8=r7;STACKTOP=r4;return r8}}while(0);r2=_mainposition(r6,r1);while(1){if((HEAP32[r2+24>>2]|0)==(HEAP32[r1+8>>2]|0)){if((_luaV_equalobj_(0,r2+16|0,r1)|0)!=0){r3=10;break}}r2=HEAP32[r2+28>>2];if((r2|0)==0){r3=14;break}}if(r3==10){r7=r2|0;r8=r7;STACKTOP=r4;return r8}else if(r3==14){r7=1208;r8=r7;STACKTOP=r4;return r8}}function _luaH_getn(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;r3=r1;r1=HEAP32[r3+28>>2];do{if(r1>>>0>0){if((HEAP32[HEAP32[r3+12>>2]+(r1-1<<4)+8>>2]|0)!=0){break}r4=0;while(1){if((r1-r4|0)>>>0<=1){break}r5=((r4+r1|0)>>>0)/2&-1;if((HEAP32[HEAP32[r3+12>>2]+(r5-1<<4)+8>>2]|0)==0){r1=r5}else{r4=r5}}r6=r4;r7=r6;STACKTOP=r2;return r7}}while(0);if((HEAP32[r3+16>>2]|0)==1952){r6=r1;r7=r6;STACKTOP=r2;return r7}else{r6=_unbound_search(r3,r1);r7=r6;STACKTOP=r2;return r7}}function _unbound_search(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=r1;r1=r1+1|0;while(1){r6=_luaH_getint(r5,r1)+8|0;if(!((HEAP32[r6>>2]|0)==0^1)){break}r2=r1;r1=r1<<1;if(r1>>>0>2147483645){r3=4;break}}if(r3==4){r2=1;while(1){r3=_luaH_getint(r5,r2)+8|0;if(!((HEAP32[r3>>2]|0)==0^1)){break}r2=r2+1|0}r7=r2-1|0;r8=r7;STACKTOP=r4;return r8}while(1){if((r1-r2|0)>>>0<=1){break}r3=((r2+r1|0)>>>0)/2&-1;r6=_luaH_getint(r5,r3)+8|0;if((HEAP32[r6>>2]|0)==0){r1=r3}else{r2=r3}}r7=r2;r8=r7;STACKTOP=r4;return r8}function _numusearray(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=0;r6=1;r7=0;r8=1;while(1){if((r7|0)>30){r3=15;break}r9=0;r10=r8;if((r10|0)>(HEAP32[r5+28>>2]|0)){r10=HEAP32[r5+28>>2];if((r6|0)>(r10|0)){break}}while(1){if((r6|0)>(r10|0)){break}if((HEAP32[HEAP32[r5+12>>2]+(r6-1<<4)+8>>2]|0)!=0){r9=r9+1|0}r6=r6+1|0}r10=r1+(r7<<2)|0;HEAP32[r10>>2]=HEAP32[r10>>2]+r9;r2=r2+r9|0;r7=r7+1|0;r8=r8<<1}if(r3==15){r11=r2;STACKTOP=r4;return r11}r11=r2;STACKTOP=r4;return r11}function _numusehash(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=0;r6=0;r7=1<<HEAPU8[r5+7|0];while(1){r8=r7;r7=r8-1|0;if((r8|0)==0){break}r8=HEAP32[r5+16>>2]+(r7<<5)|0;if((HEAP32[r8+8>>2]|0)!=0){r6=r6+_countint(r8+16|0,r1)|0;r3=r3+1|0}}r1=r2;HEAP32[r1>>2]=HEAP32[r1>>2]+r6;STACKTOP=r4;return r3}function _countint(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r2;r2=_arrayindex(r1);do{if(0<(r2|0)){if((r2|0)>1073741824){break}r1=r4+(_luaO_ceillog2(r2)<<2)|0;HEAP32[r1>>2]=HEAP32[r1>>2]+1;r5=1;r6=r5;STACKTOP=r3;return r6}}while(0);r5=0;r6=r5;STACKTOP=r3;return r6}function _computesizes(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=0;r6=0;r7=0;r8=0;r9=1;while(1){if(((r9|0)/2&-1|0)>=(HEAP32[r1>>2]|0)){r3=11;break}if((HEAP32[r5+(r8<<2)>>2]|0)>0){r2=r2+HEAP32[r5+(r8<<2)>>2]|0;if((r2|0)>((r9|0)/2&-1|0)){r7=r9;r6=r2}}if((r2|0)==(HEAP32[r1>>2]|0)){break}r8=r8+1|0;r9=r9<<1}if(r3==11){r10=r7;r11=r1;HEAP32[r11>>2]=r10;r12=r6;STACKTOP=r4;return r12}r10=r7;r11=r1;HEAP32[r11>>2]=r10;r12=r6;STACKTOP=r4;return r12}function _arrayindex(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;do{if((HEAP32[r4+8>>2]|0)==3){r1=HEAPF64[r4>>3];HEAPF64[r3>>3]=r1+6755399441055744;r5=HEAP32[r3+(((HEAP32[2540>>2]|0)==33)<<2)>>2];if((r5|0)!=r1){break}r6=r5;r7=r6;STACKTOP=r2;return r7}}while(0);r6=-1;r7=r6;STACKTOP=r2;return r7}function _luaT_init(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=0;while(1){if((r1|0)>=17){break}r4=_luaS_new(r3,HEAP32[1096+(r1<<2)>>2]);HEAP32[HEAP32[r3+12>>2]+184+(r1<<2)>>2]=r4;r4=HEAP32[HEAP32[r3+12>>2]+184+(r1<<2)>>2]+5|0;HEAP8[r4]=HEAPU8[r4]|32;r1=r1+1|0}STACKTOP=r2;return}function _luaT_gettm(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=_luaH_getstr(r5,r3);if((HEAP32[r1+8>>2]|0)==0){r3=r5+6|0;HEAP8[r3]=HEAPU8[r3]|1<<r2&255;r6=0;r7=r6;STACKTOP=r4;return r7}else{r6=r1;r7=r6;STACKTOP=r4;return r7}}function _luaT_gettmbyobj(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=HEAP32[r1+8>>2]&15;if((r3|0)==7){r6=HEAP32[HEAP32[r1>>2]+8>>2]}else if((r3|0)==5){r6=HEAP32[HEAP32[r1>>2]+8>>2]}else{r6=HEAP32[HEAP32[r5+12>>2]+252+((HEAP32[r1+8>>2]&15)<<2)>>2]}if((r6|0)!=0){r7=_luaH_getstr(r6,HEAP32[HEAP32[r5+12>>2]+184+(r2<<2)>>2]);STACKTOP=r4;return r7}else{r7=1208;STACKTOP=r4;return r7}}function _luaU_undump(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+16|0;r7=r6;r8=r1;r1=r2;r2=r3;r3=r4;do{if((HEAP8[r3]|0)==64){r5=3}else{if((HEAP8[r3]|0)==61){r5=3;break}if((HEAP8[r3]|0)==(HEAP8[7480]|0)){HEAP32[r7+12>>2]=11040}else{HEAP32[r7+12>>2]=r3}}}while(0);if(r5==3){HEAP32[r7+12>>2]=r3+1}HEAP32[r7>>2]=r8;HEAP32[r7+4>>2]=r1;HEAP32[r7+8>>2]=r2;_LoadHeader(r7);r2=_luaF_newLclosure(r8,1);r1=HEAP32[r8+8>>2];HEAP32[r1>>2]=r2;HEAP32[r1+8>>2]=70;r1=r8+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16;if(((HEAP32[r8+24>>2]-HEAP32[r8+8>>2]|0)/16&-1|0)<=0){_luaD_growstack(r8,0)}r1=_luaF_newproto(r8);HEAP32[r2+12>>2]=r1;_LoadFunction(r7,HEAP32[r2+12>>2]);if((HEAP32[HEAP32[r2+12>>2]+40>>2]|0)==1){r9=r2;STACKTOP=r6;return r9}r7=HEAP32[r2+12>>2];r2=_luaF_newLclosure(r8,HEAP32[HEAP32[r2+12>>2]+40>>2]);HEAP32[r2+12>>2]=r7;r7=HEAP32[r8+8>>2]-16|0;HEAP32[r7>>2]=r2;HEAP32[r7+8>>2]=70;r9=r2;STACKTOP=r6;return r9}function _LoadHeader(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+48|0;r3=r2;r4=r2+24;r5=r1;_luaU_header(r3|0);HEAP8[r4]=HEAP8[r3];_LoadBlock(r5,r4+1|0,17);if((_memcmp(r3|0,r4|0,18)|0)==0){STACKTOP=r2;return}if((_memcmp(r3|0,r4|0,4)|0)!=0){_error(r5,3032)}if((_memcmp(r3|0,r4|0,6)|0)!=0){_error(r5,2736)}if((_memcmp(r3|0,r4|0,12)|0)!=0){_error(r5,11968)}else{_error(r5,3408)}}function _LoadFunction(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;r2=_LoadInt(r4);HEAP32[r1+64>>2]=r2;r2=_LoadInt(r4);HEAP32[r1+68>>2]=r2;r2=_LoadChar(r4)&255;HEAP8[r1+76|0]=r2;r2=_LoadChar(r4)&255;HEAP8[r1+77|0]=r2;r2=_LoadChar(r4)&255;HEAP8[r1+78|0]=r2;_LoadCode(r4,r1);_LoadConstants(r4,r1);_LoadUpvalues(r4,r1);_LoadDebug(r4,r1);STACKTOP=r3;return}function _luaU_header(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;HEAP32[r3>>2]=1;r1=r4;HEAP8[r1]=HEAP8[7480];HEAP8[r1+1|0]=HEAP8[7481];HEAP8[r1+2|0]=HEAP8[7482];HEAP8[r1+3|0]=HEAP8[7483];r4=r4+4|0;r1=r4;r4=r1+1|0;HEAP8[r1]=(HEAP8[8768]-48<<4)+((HEAP8[6720]|0)-48);r1=r4;r4=r1+1|0;HEAP8[r1]=0;r1=r4;r4=r1+1|0;HEAP8[r1]=HEAP8[r3];r3=r4;r4=r3+1|0;HEAP8[r3]=4;r3=r4;r4=r3+1|0;HEAP8[r3]=4;r3=r4;r4=r3+1|0;HEAP8[r3]=4;r3=r4;r4=r3+1|0;HEAP8[r3]=8;r3=r4;r4=r3+1|0;HEAP8[r3]=0;r3=r4;HEAP8[r3]=HEAP8[5328];HEAP8[r3+1|0]=HEAP8[5329];HEAP8[r3+2|0]=HEAP8[5330];HEAP8[r3+3|0]=HEAP8[5331];HEAP8[r3+4|0]=HEAP8[5332];HEAP8[r3+5|0]=HEAP8[5333];STACKTOP=r2;return}function _LoadInt(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;_LoadBlock(r4,r3,4);if((HEAP32[r3>>2]|0)<0){_error(r4,3408)}else{STACKTOP=r2;return HEAP32[r3>>2]}}function _LoadChar(r1){var r2,r3;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;_LoadBlock(r1,r3,1);STACKTOP=r2;return HEAP8[r3]|0}function _LoadCode(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=r2;r2=_LoadInt(r4);if((r2+1|0)>>>0>1073741823){_luaM_toobig(HEAP32[r4>>2])}else{r5=_luaM_realloc_(HEAP32[r4>>2],0,0,r2<<2)}HEAP32[r1+12>>2]=r5;HEAP32[r1+48>>2]=r2;_LoadBlock(r4,HEAP32[r1+12>>2],r2<<2);STACKTOP=r3;return}function _LoadConstants(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=STACKTOP;r4=r1;r1=r2;r2=_LoadInt(r4);if((r2+1|0)>>>0>268435455){_luaM_toobig(HEAP32[r4>>2])}else{r5=_luaM_realloc_(HEAP32[r4>>2],0,0,r2<<4)}HEAP32[r1+8>>2]=r5;HEAP32[r1+44>>2]=r2;r5=0;while(1){if((r5|0)>=(r2|0)){break}HEAP32[HEAP32[r1+8>>2]+(r5<<4)+8>>2]=0;r5=r5+1|0}r5=0;while(1){if((r5|0)>=(r2|0)){break}r6=HEAP32[r1+8>>2]+(r5<<4)|0;r7=_LoadChar(r4);if((r7|0)==0){HEAP32[r6+8>>2]=0}else if((r7|0)==1){r8=r6;r9=_LoadChar(r4);HEAP32[r8>>2]=r9;HEAP32[r8+8>>2]=1}else if((r7|0)==4){r8=r6;r9=_LoadString(r4);HEAP32[r8>>2]=r9;HEAP32[r8+8>>2]=HEAPU8[r9+4|0]|64}else if((r7|0)==3){r7=r6;r6=_LoadNumber(r4);HEAPF64[r7>>3]=r6;HEAP32[r7+8>>2]=3}r5=r5+1|0}r2=_LoadInt(r4);if((r2+1|0)>>>0>1073741823){_luaM_toobig(HEAP32[r4>>2])}else{r10=_luaM_realloc_(HEAP32[r4>>2],0,0,r2<<2)}HEAP32[r1+16>>2]=r10;HEAP32[r1+56>>2]=r2;r5=0;while(1){if((r5|0)>=(r2|0)){break}HEAP32[HEAP32[r1+16>>2]+(r5<<2)>>2]=0;r5=r5+1|0}r5=0;while(1){if((r5|0)>=(r2|0)){break}r10=_luaF_newproto(HEAP32[r4>>2]);HEAP32[HEAP32[r1+16>>2]+(r5<<2)>>2]=r10;_LoadFunction(r4,HEAP32[HEAP32[r1+16>>2]+(r5<<2)>>2]);r5=r5+1|0}STACKTOP=r3;return}function _LoadUpvalues(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;r2=_LoadInt(r4);if((r2+1|0)>>>0>536870911){_luaM_toobig(HEAP32[r4>>2])}else{r5=_luaM_realloc_(HEAP32[r4>>2],0,0,r2<<3)}HEAP32[r1+28>>2]=r5;HEAP32[r1+40>>2]=r2;r5=0;while(1){if((r5|0)>=(r2|0)){break}HEAP32[HEAP32[r1+28>>2]+(r5<<3)>>2]=0;r5=r5+1|0}r5=0;while(1){if((r5|0)>=(r2|0)){break}r6=_LoadChar(r4)&255;HEAP8[HEAP32[r1+28>>2]+(r5<<3)+4|0]=r6;r6=_LoadChar(r4)&255;HEAP8[HEAP32[r1+28>>2]+(r5<<3)+5|0]=r6;r5=r5+1|0}STACKTOP=r3;return}function _LoadDebug(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;r2=_LoadString(r4);HEAP32[r1+36>>2]=r2;r2=_LoadInt(r4);if((r2+1|0)>>>0>1073741823){_luaM_toobig(HEAP32[r4>>2])}else{r5=_luaM_realloc_(HEAP32[r4>>2],0,0,r2<<2)}HEAP32[r1+20>>2]=r5;HEAP32[r1+52>>2]=r2;_LoadBlock(r4,HEAP32[r1+20>>2],r2<<2);r2=_LoadInt(r4);if((r2+1|0)>>>0>357913941){_luaM_toobig(HEAP32[r4>>2])}else{r6=_luaM_realloc_(HEAP32[r4>>2],0,0,r2*12&-1)}HEAP32[r1+24>>2]=r6;HEAP32[r1+60>>2]=r2;r6=0;while(1){if((r6|0)>=(r2|0)){break}HEAP32[HEAP32[r1+24>>2]+(r6*12&-1)>>2]=0;r6=r6+1|0}r6=0;while(1){if((r6|0)>=(r2|0)){break}r5=_LoadString(r4);HEAP32[HEAP32[r1+24>>2]+(r6*12&-1)>>2]=r5;r5=_LoadInt(r4);HEAP32[HEAP32[r1+24>>2]+(r6*12&-1)+4>>2]=r5;r5=_LoadInt(r4);HEAP32[HEAP32[r1+24>>2]+(r6*12&-1)+8>>2]=r5;r6=r6+1|0}r2=_LoadInt(r4);r6=0;while(1){if((r6|0)>=(r2|0)){break}r5=_LoadString(r4);HEAP32[HEAP32[r1+28>>2]+(r6<<3)>>2]=r5;r6=r6+1|0}STACKTOP=r3;return}function _LoadString(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;_LoadBlock(r4,r3,4);if((HEAP32[r3>>2]|0)==0){r5=0;r6=r5;STACKTOP=r2;return r6}else{r1=_luaZ_openspace(HEAP32[r4>>2],HEAP32[r4+8>>2],HEAP32[r3>>2]);_LoadBlock(r4,r1,HEAP32[r3>>2]);r5=_luaS_newlstr(HEAP32[r4>>2],r1,HEAP32[r3>>2]-1|0);r6=r5;STACKTOP=r2;return r6}}function _LoadBlock(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;if((_luaZ_read(HEAP32[r5+4>>2],r2,r3)|0)!=0){_error(r5,4192)}else{STACKTOP=r4;return}}function _error(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1;_luaO_pushfstring(HEAP32[r5>>2],3840,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP32[r5+12>>2],HEAP32[r3+8>>2]=r2,r3));STACKTOP=r3;_luaD_throw(HEAP32[r5>>2],3);STACKTOP=r4;return}function _LoadNumber(r1){var r2,r3;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;_LoadBlock(r1,r3,8);STACKTOP=r2;return HEAPF64[r3>>3]}function _luaV_tonumber(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r1;r1=r2;if((HEAP32[r5+8>>2]|0)==3){r6=r5;r7=r6;STACKTOP=r3;return r7}do{if((HEAP32[r5+8>>2]&15|0)==4){if((_luaO_str2d(HEAP32[r5>>2]+16|0,HEAP32[HEAP32[r5>>2]+12>>2],r4)|0)==0){break}r2=r1;HEAPF64[r2>>3]=HEAPF64[r4>>3];HEAP32[r2+8>>2]=3;r6=r1;r7=r6;STACKTOP=r3;return r7}}while(0);r6=0;r7=r6;STACKTOP=r3;return r7}function _luaV_tostring(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r2;if((HEAP32[r6+8>>2]|0)==3){r2=_sprintf(r5|0,7184,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r3>>3]=HEAPF64[r6>>3],r3));STACKTOP=r3;r3=r6;r6=_luaS_newlstr(r1,r5|0,r2);HEAP32[r3>>2]=r6;HEAP32[r3+8>>2]=HEAPU8[r6+4|0]|64;r7=1;r8=r7;STACKTOP=r4;return r8}else{r7=0;r8=r7;STACKTOP=r4;return r8}}function _luaV_gettable(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13;r5=0;r6=0;r7=STACKTOP;r8=r1;r1=r2;r2=r3;r3=r4;r4=0;while(1){if((r4|0)>=100){r5=21;break}if((HEAP32[r1+8>>2]|0)==69){r9=HEAP32[r1>>2];r10=_luaH_get(r9,r2);if((HEAP32[r10+8>>2]|0)!=0){r5=12;break}if((HEAP32[r9+8>>2]|0)==0){r11=0}else{if((HEAP8[HEAP32[r9+8>>2]+6|0]&1|0)!=0){r12=0}else{r12=_luaT_gettm(HEAP32[r9+8>>2],0,HEAP32[HEAP32[r8+12>>2]+184>>2])}r11=r12}r13=r11;if((r11|0)==0){r5=12;break}}else{r9=_luaT_gettmbyobj(r8,r1,0);r13=r9;if((HEAP32[r9+8>>2]|0)==0){r5=15;break}}if((HEAP32[r13+8>>2]&15|0)==6){r5=18;break}r1=r13;r4=r4+1|0}if(r5==12){r4=r10;r10=r3;r11=r10|0;r12=r4|0;HEAP32[r11>>2]=HEAP32[r12>>2];HEAP32[r11+4>>2]=HEAP32[r12+4>>2];HEAP32[r10+8>>2]=HEAP32[r4+8>>2];STACKTOP=r7;return}else if(r5==15){_luaG_typeerror(r8,r1,11008)}else if(r5==18){_callTM(r8,r13,r1,r2,r3,1);STACKTOP=r7;return}else if(r5==21){_luaG_runerror(r8,8728,(r6=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r6>>2]=0,r6));STACKTOP=r6}}function _callTM(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11;r7=STACKTOP;r8=r1;r1=r5;r5=r6;r6=r1-HEAP32[r8+28>>2]|0;r9=r2;r2=r8+8|0;r10=HEAP32[r2>>2];HEAP32[r2>>2]=r10+16;r2=r10;r10=r2|0;r11=r9|0;HEAP32[r10>>2]=HEAP32[r11>>2];HEAP32[r10+4>>2]=HEAP32[r11+4>>2];HEAP32[r2+8>>2]=HEAP32[r9+8>>2];r9=r3;r3=r8+8|0;r2=HEAP32[r3>>2];HEAP32[r3>>2]=r2+16;r3=r2;r2=r3|0;r11=r9|0;HEAP32[r2>>2]=HEAP32[r11>>2];HEAP32[r2+4>>2]=HEAP32[r11+4>>2];HEAP32[r3+8>>2]=HEAP32[r9+8>>2];r9=r4;r4=r8+8|0;r3=HEAP32[r4>>2];HEAP32[r4>>2]=r3+16;r4=r3;r3=r4|0;r11=r9|0;HEAP32[r3>>2]=HEAP32[r11>>2];HEAP32[r3+4>>2]=HEAP32[r11+4>>2];HEAP32[r4+8>>2]=HEAP32[r9+8>>2];if((r5|0)==0){r9=r1;r4=r8+8|0;r11=HEAP32[r4>>2];HEAP32[r4>>2]=r11+16;r4=r11;r11=r4|0;r3=r9|0;HEAP32[r11>>2]=HEAP32[r3>>2];HEAP32[r11+4>>2]=HEAP32[r3+4>>2];HEAP32[r4+8>>2]=HEAP32[r9+8>>2]}if(((HEAP32[r8+24>>2]-HEAP32[r8+8>>2]|0)/16&-1|0)<=0){_luaD_growstack(r8,0)}_luaD_call(r8,HEAP32[r8+8>>2]+(-(4-r5|0)<<4)|0,r5,HEAP8[HEAP32[r8+16>>2]+18|0]&1);if((r5|0)==0){STACKTOP=r7;return}r1=HEAP32[r8+28>>2]+r6|0;r6=r8+8|0;r8=HEAP32[r6>>2]-16|0;HEAP32[r6>>2]=r8;r6=r8;r8=r1;r1=r8|0;r5=r6|0;HEAP32[r1>>2]=HEAP32[r5>>2];HEAP32[r1+4>>2]=HEAP32[r5+4>>2];HEAP32[r8+8>>2]=HEAP32[r6+8>>2];STACKTOP=r7;return}function _luaV_settable(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r5=0;r6=0;r7=STACKTOP;r8=r1;r1=r2;r2=r3;r3=r4;r4=0;while(1){if((r4|0)>=100){r5=27;break}if((HEAP32[r1+8>>2]|0)==69){r9=HEAP32[r1>>2];r10=_luaH_get(r9,r2);if((HEAP32[r10+8>>2]|0)!=0){r5=14;break}if((HEAP32[r9+8>>2]|0)==0){r11=0}else{if((HEAP8[HEAP32[r9+8>>2]+6|0]&2|0)!=0){r12=0}else{r12=_luaT_gettm(HEAP32[r9+8>>2],1,HEAP32[HEAP32[r8+12>>2]+188>>2])}r11=r12}r13=r11;if((r11|0)==0){if((r10|0)!=1208){r5=14;break}r10=_luaH_newkey(r8,r9,r2);if(1){r5=14;break}}}else{r14=_luaT_gettmbyobj(r8,r1,1);r13=r14;if((HEAP32[r14+8>>2]|0)==0){r5=21;break}}if((HEAP32[r13+8>>2]&15|0)==6){r5=24;break}r1=r13;r4=r4+1|0}if(r5==14){r4=r3;r11=r10;r10=r11|0;r12=r4|0;HEAP32[r10>>2]=HEAP32[r12>>2];HEAP32[r10+4>>2]=HEAP32[r12+4>>2];HEAP32[r11+8>>2]=HEAP32[r4+8>>2];HEAP8[r9+6|0]=0;do{if((HEAP32[r3+8>>2]&64|0)!=0){if((HEAP8[HEAP32[r3>>2]+5|0]&3|0)==0){break}if((HEAP8[r9+5|0]&4|0)==0){break}_luaC_barrierback_(r8,r9)}}while(0);STACKTOP=r7;return}else if(r5==21){_luaG_typeerror(r8,r1,11008)}else if(r5==24){_callTM(r8,r13,r1,r2,r3,0);STACKTOP=r7;return}else if(r5==27){_luaG_runerror(r8,6688,(r6=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r6>>2]=0,r6));STACKTOP=r6}}function _luaV_lessthan(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;do{if((HEAP32[r1+8>>2]|0)==3){if((HEAP32[r2+8>>2]|0)!=3){break}r6=HEAPF64[r1>>3]<HEAPF64[r2>>3]|0;r7=r6;STACKTOP=r4;return r7}}while(0);do{if((HEAP32[r1+8>>2]&15|0)==4){if((HEAP32[r2+8>>2]&15|0)!=4){break}r6=(_l_strcmp(HEAP32[r1>>2],HEAP32[r2>>2])|0)<0|0;r7=r6;STACKTOP=r4;return r7}}while(0);r3=_call_orderTM(r5,r1,r2,13);if((r3|0)<0){_luaG_ordererror(r5,r1,r2)}r6=r3;r7=r6;STACKTOP=r4;return r7}function _l_strcmp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=r5+16|0;r6=HEAP32[r5+12>>2];r5=r1+16|0;r7=HEAP32[r1+12>>2];while(1){r8=_strcmp(r2,r5);if((r8|0)!=0){r3=3;break}r9=_strlen(r2);if((r9|0)==(r7|0)){r3=5;break}if((r9|0)==(r6|0)){r3=7;break}r9=r9+1|0;r2=r2+r9|0;r6=r6-r9|0;r5=r5+r9|0;r7=r7-r9|0}if(r3==3){r10=r8;r11=r10;STACKTOP=r4;return r11}else if(r3==5){r10=(r9|0)==(r6|0)?0:1;r11=r10;STACKTOP=r4;return r11}else if(r3==7){r10=-1;r11=r10;STACKTOP=r4;return r11}}function _call_orderTM(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r5=STACKTOP;r6=r1;if((_call_binTM(r6,r2,r3,HEAP32[r6+8>>2],r4)|0)==0){r7=-1;r8=r7;STACKTOP=r5;return r8}if((HEAP32[HEAP32[r6+8>>2]+8>>2]|0)==0){r9=1}else{if((HEAP32[HEAP32[r6+8>>2]+8>>2]|0)==1){r10=(HEAP32[HEAP32[r6+8>>2]>>2]|0)==0}else{r10=0}r9=r10}r7=(r9^1)&1;r8=r7;STACKTOP=r5;return r8}function _luaV_lessequal(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;r5=r1;r1=r2;r2=r3;do{if((HEAP32[r1+8>>2]|0)==3){if((HEAP32[r2+8>>2]|0)!=3){break}r6=HEAPF64[r1>>3]<=HEAPF64[r2>>3]|0;r7=r6;STACKTOP=r4;return r7}}while(0);do{if((HEAP32[r1+8>>2]&15|0)==4){if((HEAP32[r2+8>>2]&15|0)!=4){break}r6=(_l_strcmp(HEAP32[r1>>2],HEAP32[r2>>2])|0)<=0|0;r7=r6;STACKTOP=r4;return r7}}while(0);r3=_call_orderTM(r5,r1,r2,14);r8=r3;if((r3|0)>=0){r6=r8;r7=r6;STACKTOP=r4;return r7}r3=_call_orderTM(r5,r2,r1,13);r8=r3;if((r3|0)<0){_luaG_ordererror(r5,r1,r2)}r6=((r8|0)!=0^1)&1;r7=r6;STACKTOP=r4;return r7}function _luaV_equalobj_(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182;r4=0;r5=STACKTOP;r6=r1;r7=r2;r8=r3;r9=r7;r10=r9+8|0;r11=HEAP32[r10>>2];r12=r11&63;L1:do{switch(r12|0){case 5:{r13=r7;r14=r13|0;r15=r14;r16=HEAP32[r15>>2];r17=r16;r18=r8;r19=r18|0;r20=r19;r21=HEAP32[r20>>2];r22=r21;r23=(r17|0)==(r22|0);if(r23){r24=1;r25=r24;STACKTOP=r5;return r25}r26=r6;r27=(r26|0)==0;if(r27){r24=0;r25=r24;STACKTOP=r5;return r25}else{r28=r6;r29=r7;r30=r29|0;r31=r30;r32=HEAP32[r31>>2];r33=r32;r34=r33+8|0;r35=HEAP32[r34>>2];r36=r8;r37=r36|0;r38=r37;r39=HEAP32[r38>>2];r40=r39;r41=r40+8|0;r42=HEAP32[r41>>2];r43=_get_equalTM(r28,r35,r42,5);r44=r43;break L1}break};case 22:{r45=r7;r46=r45|0;r47=r46;r48=HEAP32[r47>>2];r49=r8;r50=r49|0;r51=r50;r52=HEAP32[r51>>2];r53=(r48|0)==(r52|0);r54=r53&1;r24=r54;r25=r24;STACKTOP=r5;return r25;break};case 3:{r55=r7;r56=r55|0;r57=r56;r58=HEAPF64[r57>>3];r59=r8;r60=r59|0;r61=r60;r62=HEAPF64[r61>>3];r63=r58==r62;r64=r63&1;r24=r64;r25=r24;STACKTOP=r5;return r25;break};case 0:{r24=1;r25=r24;STACKTOP=r5;return r25;break};case 4:{r65=r7;r66=r65|0;r67=r66;r68=HEAP32[r67>>2];r69=r68;r70=r8;r71=r70|0;r72=r71;r73=HEAP32[r72>>2];r74=r73;r75=(r69|0)==(r74|0);r76=r75&1;r24=r76;r25=r24;STACKTOP=r5;return r25;break};case 20:{r77=r7;r78=r77|0;r79=r78;r80=HEAP32[r79>>2];r81=r80;r82=r8;r83=r82|0;r84=r83;r85=HEAP32[r84>>2];r86=r85;r87=_luaS_eqlngstr(r81,r86);r24=r87;r25=r24;STACKTOP=r5;return r25;break};case 7:{r88=r7;r89=r88|0;r90=r89;r91=HEAP32[r90>>2];r92=r91;r93=r92;r94=r8;r95=r94|0;r96=r95;r97=HEAP32[r96>>2];r98=r97;r99=r98;r100=(r93|0)==(r99|0);if(r100){r24=1;r25=r24;STACKTOP=r5;return r25}r101=r6;r102=(r101|0)==0;if(r102){r24=0;r25=r24;STACKTOP=r5;return r25}else{r103=r6;r104=r7;r105=r104|0;r106=r105;r107=HEAP32[r106>>2];r108=r107;r109=r108;r110=r109+8|0;r111=HEAP32[r110>>2];r112=r8;r113=r112|0;r114=r113;r115=HEAP32[r114>>2];r116=r115;r117=r116;r118=r117+8|0;r119=HEAP32[r118>>2];r120=_get_equalTM(r103,r111,r119,5);r44=r120;break L1}break};case 2:{r121=r7;r122=r121|0;r123=r122;r124=HEAP32[r123>>2];r125=r8;r126=r125|0;r127=r126;r128=HEAP32[r127>>2];r129=(r124|0)==(r128|0);r130=r129&1;r24=r130;r25=r24;STACKTOP=r5;return r25;break};case 1:{r131=r7;r132=r131|0;r133=r132;r134=HEAP32[r133>>2];r135=r8;r136=r135|0;r137=r136;r138=HEAP32[r137>>2];r139=(r134|0)==(r138|0);r140=r139&1;r24=r140;r25=r24;STACKTOP=r5;return r25;break};default:{r141=r7;r142=r141|0;r143=r142;r144=HEAP32[r143>>2];r145=r8;r146=r145|0;r147=r146;r148=HEAP32[r147>>2];r149=(r144|0)==(r148|0);r150=r149&1;r24=r150;r25=r24;STACKTOP=r5;return r25}}}while(0);r151=r44;r152=(r151|0)==0;if(r152){r24=0;r25=r24;STACKTOP=r5;return r25}r153=r6;r154=r44;r155=r7;r156=r8;r157=r6;r158=r157+8|0;r159=HEAP32[r158>>2];_callTM(r153,r154,r155,r156,r159,1);r160=r6;r161=r160+8|0;r162=HEAP32[r161>>2];r163=r162+8|0;r164=HEAP32[r163>>2];r165=(r164|0)==0;if(r165){r166=1}else{r167=r6;r168=r167+8|0;r169=HEAP32[r168>>2];r170=r169+8|0;r171=HEAP32[r170>>2];r172=(r171|0)==1;if(r172){r173=r6;r174=r173+8|0;r175=HEAP32[r174>>2];r176=r175|0;r177=r176;r178=HEAP32[r177>>2];r179=(r178|0)==0;r180=r179}else{r180=0}r166=r180}r181=r166^1;r182=r181&1;r24=r182;r25=r24;STACKTOP=r5;return r25}function _get_equalTM(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=r4;if((r1|0)==0){r7=0}else{if((HEAPU8[r1+6|0]&1<<r3|0)!=0){r8=0}else{r8=_luaT_gettm(r1,r3,HEAP32[HEAP32[r6+12>>2]+184+(r3<<2)>>2])}r7=r8}r8=r7;if((r8|0)==0){r9=0;r10=r9;STACKTOP=r5;return r10}if((r1|0)==(r2|0)){r9=r8;r10=r9;STACKTOP=r5;return r10}if((r2|0)==0){r11=0}else{if((HEAPU8[r2+6|0]&1<<r3|0)!=0){r12=0}else{r12=_luaT_gettm(r2,r3,HEAP32[HEAP32[r6+12>>2]+184+(r3<<2)>>2])}r11=r12}r12=r11;if((r12|0)==0){r9=0;r10=r9;STACKTOP=r5;return r10}do{if((HEAP32[r8+8>>2]|0)==(HEAP32[r12+8>>2]|0)){if((_luaV_equalobj_(0,r8,r12)|0)==0){break}r9=r8;r10=r9;STACKTOP=r5;return r10}}while(0);r9=0;r10=r9;STACKTOP=r5;return r10}function _luaV_concat(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=0;r4=0;r5=STACKTOP;r6=r1;r1=r2;L1:while(1){r7=HEAP32[r6+8>>2];r2=2;if((HEAP32[r7-32+8>>2]&15|0)==4){r3=4}else{if((HEAP32[r7-32+8>>2]|0)==3){r3=4}else{r3=6}}do{if(r3==4){r3=0;if((HEAP32[r7-16+8>>2]&15|0)!=4){if((_luaV_tostring(r6,r7-16|0)|0)==0){r3=6;break}}if((HEAP32[HEAP32[r7-16>>2]+12>>2]|0)==0){if((HEAP32[r7-32+8>>2]&15|0)==4){r8=1}else{r8=(_luaV_tostring(r6,r7-32|0)|0)!=0}}else{do{if((HEAP32[r7-32+8>>2]&15|0)==4){if((HEAP32[HEAP32[r7-32>>2]+12>>2]|0)!=0){r3=16;break}r9=r7-16|0;r10=r7-32|0;r11=r10|0;r12=r9|0;HEAP32[r11>>2]=HEAP32[r12>>2];HEAP32[r11+4>>2]=HEAP32[r12+4>>2];HEAP32[r10+8>>2]=HEAP32[r9+8>>2]}else{r3=16}}while(0);if(r3==16){r3=0;r9=HEAP32[HEAP32[r7-16>>2]+12>>2];r10=1;while(1){if((r10|0)<(r1|0)){if((HEAP32[r7+(-r10<<4)-16+8>>2]&15|0)==4){r13=1}else{r13=(_luaV_tostring(r6,r7+(-r10<<4)-16|0)|0)!=0}r14=r13}else{r14=0}if(!r14){break}r12=HEAP32[HEAP32[r7+(-r10<<4)-16>>2]+12>>2];if(r12>>>0>=(-3-r9|0)>>>0){r3=23;break L1}r9=r9+r12|0;r10=r10+1|0}r12=_luaZ_openspace(r6,HEAP32[r6+12>>2]+144|0,r9);r9=0;r2=r10;while(1){r11=HEAP32[HEAP32[r7+(-r10<<4)>>2]+12>>2];_memcpy(r12+r9|0,HEAP32[r7+(-r10<<4)>>2]+16|0,r11)|0;r9=r9+r11|0;r11=r10-1|0;r10=r11;if((r11|0)<=0){break}}r10=r7+(-r2<<4)|0;r11=_luaS_newlstr(r6,r12,r9);HEAP32[r10>>2]=r11;HEAP32[r10+8>>2]=HEAPU8[r11+4|0]|64}}}}while(0);if(r3==6){r3=0;if((_call_binTM(r6,r7-32|0,r7-16|0,r7-32|0,15)|0)==0){r3=7;break}}r1=r1-(r2-1)|0;r11=r6+8|0;HEAP32[r11>>2]=HEAP32[r11>>2]+(-(r2-1|0)<<4);if((r1|0)<=1){r3=34;break}}if(r3==7){_luaG_concaterror(r6,r7-32|0,r7-16|0)}else if(r3==23){_luaG_runerror(r6,5296,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4}else if(r3==34){STACKTOP=r5;return}}function _call_binTM(r1,r2,r3,r4,r5){var r6,r7,r8,r9;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=r5;r5=_luaT_gettmbyobj(r7,r1,r3);if((HEAP32[r5+8>>2]|0)==0){r5=_luaT_gettmbyobj(r7,r2,r3)}if((HEAP32[r5+8>>2]|0)==0){r8=0;r9=r8;STACKTOP=r6;return r9}else{_callTM(r7,r5,r1,r2,r4,1);r8=1;r9=r8;STACKTOP=r6;return r9}}function _luaV_objlen(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=HEAP32[r2+8>>2]&15;do{if((r3|0)==4){r6=r1;HEAPF64[r6>>3]=HEAP32[HEAP32[r2>>2]+12>>2]>>>0;HEAP32[r6+8>>2]=3;STACKTOP=r4;return}else if((r3|0)==5){r6=HEAP32[r2>>2];if((HEAP32[r6+8>>2]|0)==0){r7=0}else{if((HEAP8[HEAP32[r6+8>>2]+6|0]&16|0)!=0){r8=0}else{r8=_luaT_gettm(HEAP32[r6+8>>2],4,HEAP32[HEAP32[r5+12>>2]+200>>2])}r7=r8}r9=r7;if((r9|0)!=0){break}r10=r1;r11=_luaH_getn(r6)|0;HEAPF64[r10>>3]=r11;HEAP32[r10+8>>2]=3;STACKTOP=r4;return}else{r9=_luaT_gettmbyobj(r5,r2,4);if((HEAP32[r9+8>>2]|0)==0){_luaG_typeerror(r5,r2,4152)}else{break}}}while(0);_callTM(r5,r9,r2,r2,r1,1);STACKTOP=r4;return}function _luaV_arith(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11;r6=STACKTOP;STACKTOP=STACKTOP+32|0;r7=r1;r1=r2;r2=r3;r3=r4;r4=r5;r5=_luaV_tonumber(r2,r6);r8=r5;do{if((r5|0)!=0){r9=_luaV_tonumber(r3,r6+16);if((r9|0)==0){break}r10=r1;r11=_luaO_arith(r4-6|0,HEAPF64[r8>>3],HEAPF64[r9>>3]);HEAPF64[r10>>3]=r11;HEAP32[r10+8>>2]=3;STACKTOP=r6;return}}while(0);if((_call_binTM(r7,r2,r3,r1,r4)|0)==0){_luaG_aritherror(r7,r2,r3)}STACKTOP=r6;return}function _luaV_finishOp(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196;r2=0;r3=STACKTOP;r4=r1;r5=r4;r6=r5+16|0;r7=HEAP32[r6>>2];r8=r7;r9=r8;r10=r9+24|0;r11=r10;r12=r11|0;r13=HEAP32[r12>>2];r14=r13;r15=r8;r16=r15+24|0;r17=r16;r18=r17+4|0;r19=HEAP32[r18>>2];r20=r19-4|0;r21=HEAP32[r20>>2];r22=r21;r23=r22;r24=r23>>>0;r25=r24&63;r26=r25;r27=r26;switch(r27|0){case 26:case 25:case 24:{r28=r4;r29=r28+8|0;r30=HEAP32[r29>>2];r31=r30-16|0;r32=r31+8|0;r33=HEAP32[r32>>2];r34=(r33|0)==0;if(r34){r35=1}else{r36=r4;r37=r36+8|0;r38=HEAP32[r37>>2];r39=r38-16|0;r40=r39+8|0;r41=HEAP32[r40>>2];r42=(r41|0)==1;if(r42){r43=r4;r44=r43+8|0;r45=HEAP32[r44>>2];r46=r45-16|0;r47=r46|0;r48=r47;r49=HEAP32[r48>>2];r50=(r49|0)==0;r51=r50}else{r51=0}r35=r51}r52=r35^1;r53=r52&1;r54=r53;r55=r4;r56=r55+8|0;r57=HEAP32[r56>>2];r58=r57-16|0;HEAP32[r56>>2]=r58;r59=r26;r60=(r59|0)==26;do{if(r60){r61=r4;r62=r14;r63=r22;r64=r63>>>23;r65=r64&511;r66=r62+(r65<<4)|0;r67=_luaT_gettmbyobj(r61,r66,14);r68=r67+8|0;r69=HEAP32[r68>>2];r70=(r69|0)==0;if(!r70){break}r71=r54;r72=(r71|0)!=0;r73=r72^1;r74=r73&1;r54=r74}}while(0);r75=r54;r76=r22;r77=r76>>>6;r78=r77&255;r79=(r75|0)!=(r78|0);if(r79){r80=r8;r81=r80+24|0;r82=r81;r83=r82+4|0;r84=HEAP32[r83>>2];r85=r84+4|0;HEAP32[r83>>2]=r85}STACKTOP=r3;return;break};case 13:case 14:case 15:case 16:case 17:case 18:case 19:case 21:case 6:case 7:case 12:{r86=r4;r87=r86+8|0;r88=HEAP32[r87>>2];r89=r88-16|0;HEAP32[r87>>2]=r89;r90=r89;r91=r14;r92=r22;r93=r92>>>6;r94=r93&255;r95=r91+(r94<<4)|0;r96=r95;r97=r96;r98=r97|0;r99=r90;r100=r99|0;r101=r98;r102=r100;HEAP32[r101>>2]=HEAP32[r102>>2];HEAP32[r101+4>>2]=HEAP32[r102+4>>2];r103=r90;r104=r103+8|0;r105=HEAP32[r104>>2];r106=r96;r107=r106+8|0;HEAP32[r107>>2]=r105;STACKTOP=r3;return;break};case 22:{r108=r4;r109=r108+8|0;r110=HEAP32[r109>>2];r111=r110-16|0;r112=r111;r113=r22;r114=r113>>>23;r115=r114&511;r116=r115;r117=r112;r118=r117-16|0;r119=r14;r120=r116;r121=r119+(r120<<4)|0;r122=r118;r123=r121;r124=r122-r123|0;r125=(r124|0)/16&-1;r126=r125;r127=r112;r128=r127;r129=r112;r130=r129-32|0;r131=r130;r132=r131;r133=r132|0;r134=r128;r135=r134|0;r136=r133;r137=r135;HEAP32[r136>>2]=HEAP32[r137>>2];HEAP32[r136+4>>2]=HEAP32[r137+4>>2];r138=r128;r139=r138+8|0;r140=HEAP32[r139>>2];r141=r131;r142=r141+8|0;HEAP32[r142>>2]=r140;r143=r126;r144=(r143|0)>1;if(r144){r145=r112;r146=r145-16|0;r147=r4;r148=r147+8|0;HEAP32[r148>>2]=r146;r149=r4;r150=r126;_luaV_concat(r149,r150)}r151=r4;r152=r151+8|0;r153=HEAP32[r152>>2];r154=r153-16|0;r155=r154;r156=r8;r157=r156+24|0;r158=r157;r159=r158|0;r160=HEAP32[r159>>2];r161=r22;r162=r161>>>6;r163=r162&255;r164=r160+(r163<<4)|0;r165=r164;r166=r165;r167=r166|0;r168=r155;r169=r168|0;r170=r167;r171=r169;HEAP32[r170>>2]=HEAP32[r171>>2];HEAP32[r170+4>>2]=HEAP32[r171+4>>2];r172=r155;r173=r172+8|0;r174=HEAP32[r173>>2];r175=r165;r176=r175+8|0;HEAP32[r176>>2]=r174;r177=r8;r178=r177+4|0;r179=HEAP32[r178>>2];r180=r4;r181=r180+8|0;HEAP32[r181>>2]=r179;STACKTOP=r3;return;break};case 34:{r182=r8;r183=r182+4|0;r184=HEAP32[r183>>2];r185=r4;r186=r185+8|0;HEAP32[r186>>2]=r184;STACKTOP=r3;return;break};case 29:{r187=r22;r188=r187>>>14;r189=r188&511;r190=r189-1|0;r191=(r190|0)>=0;if(r191){r192=r8;r193=r192+4|0;r194=HEAP32[r193>>2];r195=r4;r196=r195+8|0;HEAP32[r196>>2]=r194}STACKTOP=r3;return;break};case 30:case 8:case 10:{STACKTOP=r3;return;break};default:{STACKTOP=r3;return}}}function _luaV_execute(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545,r546,r547,r548,r549,r550,r551,r552,r553,r554,r555,r556,r557,r558,r559,r560,r561,r562,r563,r564,r565,r566,r567,r568,r569,r570,r571,r572,r573,r574,r575,r576,r577,r578,r579,r580,r581,r582,r583,r584,r585,r586,r587,r588,r589,r590,r591,r592,r593,r594,r595,r596,r597,r598,r599,r600,r601,r602,r603,r604,r605,r606,r607,r608,r609,r610,r611,r612,r613,r614,r615,r616,r617,r618,r619,r620,r621,r622,r623,r624,r625,r626,r627,r628,r629,r630,r631,r632,r633,r634,r635,r636,r637,r638,r639,r640,r641,r642,r643,r644,r645,r646,r647,r648,r649,r650,r651,r652,r653,r654,r655,r656,r657,r658,r659,r660,r661,r662,r663,r664,r665,r666,r667,r668,r669,r670,r671,r672,r673,r674,r675,r676,r677,r678,r679,r680,r681,r682,r683,r684,r685,r686,r687,r688,r689,r690,r691,r692,r693,r694,r695,r696,r697,r698,r699,r700,r701,r702,r703,r704,r705,r706,r707,r708,r709,r710,r711,r712,r713,r714,r715,r716,r717,r718,r719,r720,r721,r722,r723,r724,r725,r726,r727,r728,r729,r730,r731,r732,r733,r734,r735,r736,r737,r738,r739,r740,r741,r742,r743,r744,r745,r746,r747,r748,r749,r750,r751,r752,r753,r754,r755,r756,r757,r758,r759,r760,r761,r762,r763,r764,r765,r766,r767,r768,r769,r770,r771,r772,r773,r774,r775,r776,r777,r778,r779,r780,r781,r782,r783,r784,r785,r786,r787,r788,r789,r790,r791,r792,r793,r794,r795,r796,r797,r798,r799,r800,r801,r802,r803,r804,r805,r806,r807,r808,r809,r810,r811,r812,r813,r814,r815,r816,r817,r818,r819,r820,r821,r822,r823,r824,r825,r826,r827,r828,r829,r830,r831,r832,r833,r834,r835,r836,r837,r838,r839,r840,r841,r842,r843,r844,r845,r846,r847,r848,r849,r850,r851,r852,r853,r854,r855,r856,r857,r858,r859,r860,r861,r862,r863,r864,r865,r866,r867,r868,r869,r870,r871,r872,r873,r874,r875,r876,r877,r878,r879,r880,r881,r882,r883,r884,r885,r886,r887,r888,r889,r890,r891,r892,r893,r894,r895,r896,r897,r898,r899,r900,r901,r902,r903,r904,r905,r906,r907,r908,r909,r910,r911,r912,r913,r914,r915,r916,r917,r918,r919,r920,r921,r922,r923,r924,r925,r926,r927,r928,r929,r930,r931,r932,r933,r934,r935,r936,r937,r938,r939,r940,r941,r942,r943,r944,r945,r946,r947,r948,r949,r950,r951,r952,r953,r954,r955,r956,r957,r958,r959,r960,r961,r962,r963,r964,r965,r966,r967,r968,r969,r970,r971,r972,r973,r974,r975,r976,r977,r978,r979,r980,r981,r982,r983,r984,r985,r986,r987,r988,r989,r990,r991,r992,r993,r994,r995,r996,r997,r998,r999,r1000,r1001,r1002,r1003,r1004,r1005,r1006,r1007,r1008,r1009,r1010,r1011,r1012,r1013,r1014,r1015,r1016,r1017,r1018,r1019,r1020,r1021,r1022,r1023,r1024,r1025,r1026,r1027,r1028,r1029,r1030,r1031,r1032,r1033,r1034,r1035,r1036,r1037,r1038,r1039,r1040,r1041,r1042,r1043,r1044,r1045,r1046,r1047,r1048,r1049,r1050,r1051,r1052,r1053,r1054,r1055,r1056,r1057,r1058,r1059,r1060,r1061,r1062,r1063,r1064,r1065,r1066,r1067,r1068,r1069,r1070,r1071,r1072,r1073,r1074,r1075,r1076,r1077,r1078,r1079,r1080,r1081,r1082,r1083,r1084,r1085,r1086,r1087,r1088,r1089,r1090,r1091,r1092,r1093,r1094,r1095,r1096,r1097,r1098,r1099,r1100,r1101,r1102,r1103,r1104,r1105,r1106,r1107,r1108,r1109,r1110,r1111,r1112,r1113,r1114,r1115,r1116,r1117,r1118,r1119,r1120,r1121,r1122,r1123,r1124,r1125,r1126,r1127,r1128,r1129,r1130,r1131,r1132,r1133,r1134,r1135,r1136,r1137,r1138,r1139,r1140,r1141,r1142,r1143,r1144,r1145,r1146,r1147,r1148,r1149,r1150,r1151,r1152,r1153,r1154,r1155,r1156,r1157,r1158,r1159,r1160,r1161,r1162,r1163,r1164,r1165,r1166,r1167,r1168,r1169,r1170,r1171,r1172,r1173,r1174,r1175,r1176,r1177,r1178,r1179,r1180,r1181,r1182,r1183,r1184,r1185,r1186,r1187,r1188,r1189,r1190,r1191,r1192,r1193,r1194,r1195,r1196,r1197,r1198,r1199,r1200,r1201,r1202,r1203,r1204,r1205,r1206,r1207,r1208,r1209,r1210,r1211,r1212,r1213,r1214,r1215,r1216,r1217,r1218,r1219,r1220,r1221,r1222,r1223,r1224,r1225,r1226,r1227,r1228,r1229,r1230,r1231,r1232,r1233,r1234,r1235,r1236,r1237,r1238,r1239,r1240,r1241,r1242,r1243,r1244,r1245,r1246,r1247,r1248,r1249,r1250,r1251,r1252,r1253,r1254,r1255,r1256,r1257,r1258,r1259,r1260,r1261,r1262,r1263,r1264,r1265,r1266,r1267,r1268,r1269,r1270,r1271,r1272,r1273,r1274,r1275,r1276,r1277,r1278,r1279,r1280,r1281,r1282,r1283,r1284,r1285,r1286,r1287,r1288,r1289,r1290,r1291,r1292,r1293,r1294,r1295,r1296,r1297,r1298,r1299,r1300,r1301,r1302,r1303,r1304,r1305,r1306,r1307,r1308,r1309,r1310,r1311,r1312,r1313,r1314,r1315,r1316,r1317,r1318,r1319,r1320,r1321,r1322,r1323,r1324,r1325,r1326,r1327,r1328,r1329,r1330,r1331,r1332,r1333,r1334,r1335,r1336,r1337,r1338,r1339,r1340,r1341,r1342,r1343,r1344,r1345,r1346,r1347,r1348,r1349,r1350,r1351,r1352,r1353,r1354,r1355,r1356,r1357,r1358,r1359,r1360,r1361,r1362,r1363,r1364,r1365,r1366,r1367,r1368,r1369,r1370,r1371,r1372,r1373,r1374,r1375,r1376,r1377,r1378,r1379,r1380,r1381,r1382,r1383,r1384,r1385,r1386,r1387,r1388,r1389,r1390,r1391,r1392,r1393,r1394,r1395,r1396,r1397,r1398,r1399,r1400,r1401,r1402,r1403,r1404,r1405,r1406,r1407,r1408,r1409,r1410,r1411,r1412,r1413,r1414,r1415,r1416,r1417,r1418,r1419,r1420,r1421,r1422,r1423,r1424,r1425,r1426,r1427,r1428,r1429,r1430,r1431,r1432,r1433,r1434,r1435,r1436,r1437,r1438,r1439,r1440,r1441,r1442,r1443,r1444,r1445,r1446,r1447,r1448,r1449,r1450,r1451,r1452,r1453,r1454,r1455,r1456,r1457,r1458,r1459,r1460,r1461,r1462,r1463,r1464,r1465,r1466,r1467,r1468,r1469,r1470,r1471,r1472,r1473,r1474,r1475,r1476,r1477,r1478,r1479,r1480,r1481,r1482,r1483,r1484,r1485,r1486,r1487,r1488,r1489,r1490,r1491,r1492,r1493,r1494,r1495,r1496,r1497,r1498,r1499,r1500,r1501,r1502,r1503,r1504,r1505,r1506,r1507,r1508,r1509,r1510,r1511,r1512,r1513,r1514,r1515,r1516,r1517,r1518,r1519,r1520,r1521,r1522,r1523,r1524,r1525,r1526,r1527,r1528,r1529,r1530,r1531,r1532,r1533,r1534,r1535,r1536,r1537,r1538,r1539,r1540,r1541,r1542,r1543,r1544,r1545,r1546,r1547,r1548,r1549,r1550,r1551,r1552,r1553,r1554,r1555,r1556,r1557,r1558,r1559,r1560,r1561,r1562,r1563,r1564,r1565,r1566,r1567,r1568,r1569,r1570,r1571,r1572,r1573,r1574,r1575,r1576,r1577,r1578,r1579,r1580,r1581,r1582,r1583,r1584,r1585,r1586,r1587,r1588,r1589,r1590,r1591,r1592,r1593,r1594,r1595,r1596,r1597,r1598,r1599,r1600,r1601,r1602,r1603,r1604,r1605,r1606,r1607,r1608,r1609,r1610,r1611,r1612,r1613,r1614,r1615,r1616,r1617,r1618,r1619,r1620,r1621,r1622,r1623,r1624,r1625,r1626,r1627,r1628,r1629,r1630,r1631,r1632,r1633,r1634,r1635,r1636,r1637,r1638,r1639,r1640,r1641,r1642,r1643,r1644,r1645,r1646,r1647,r1648,r1649,r1650,r1651,r1652,r1653,r1654,r1655,r1656,r1657,r1658,r1659,r1660,r1661,r1662,r1663,r1664,r1665,r1666,r1667,r1668,r1669,r1670,r1671,r1672,r1673,r1674,r1675,r1676,r1677,r1678,r1679,r1680,r1681,r1682,r1683,r1684,r1685,r1686,r1687,r1688,r1689,r1690,r1691,r1692,r1693,r1694,r1695,r1696,r1697,r1698,r1699,r1700,r1701,r1702,r1703,r1704,r1705,r1706,r1707,r1708,r1709,r1710,r1711,r1712,r1713,r1714,r1715,r1716,r1717,r1718,r1719,r1720,r1721,r1722,r1723,r1724,r1725,r1726,r1727,r1728,r1729,r1730,r1731,r1732,r1733,r1734,r1735,r1736,r1737,r1738,r1739,r1740,r1741,r1742,r1743,r1744,r1745,r1746,r1747,r1748,r1749,r1750,r1751,r1752,r1753,r1754,r1755,r1756,r1757,r1758,r1759,r1760,r1761,r1762,r1763,r1764,r1765,r1766,r1767,r1768,r1769,r1770,r1771,r1772,r1773,r1774,r1775,r1776,r1777,r1778,r1779,r1780,r1781,r1782,r1783,r1784,r1785,r1786,r1787,r1788,r1789,r1790,r1791,r1792,r1793,r1794,r1795,r1796,r1797,r1798,r1799,r1800,r1801,r1802,r1803,r1804,r1805,r1806,r1807,r1808,r1809,r1810,r1811,r1812,r1813,r1814,r1815,r1816,r1817,r1818,r1819,r1820,r1821,r1822,r1823,r1824,r1825,r1826,r1827,r1828,r1829,r1830,r1831,r1832,r1833,r1834,r1835,r1836,r1837,r1838,r1839,r1840,r1841,r1842,r1843,r1844,r1845,r1846,r1847,r1848,r1849,r1850,r1851,r1852,r1853,r1854,r1855,r1856,r1857,r1858,r1859,r1860,r1861,r1862,r1863,r1864,r1865,r1866,r1867,r1868,r1869,r1870,r1871,r1872,r1873,r1874,r1875,r1876,r1877,r1878,r1879,r1880,r1881,r1882,r1883,r1884,r1885,r1886,r1887,r1888,r1889,r1890,r1891,r1892,r1893,r1894,r1895,r1896,r1897,r1898,r1899,r1900,r1901,r1902,r1903,r1904,r1905,r1906,r1907,r1908,r1909,r1910,r1911,r1912,r1913,r1914,r1915,r1916,r1917,r1918,r1919,r1920,r1921,r1922,r1923,r1924,r1925,r1926,r1927,r1928,r1929,r1930,r1931,r1932,r1933,r1934,r1935,r1936,r1937,r1938,r1939,r1940,r1941,r1942,r1943,r1944,r1945,r1946,r1947,r1948,r1949,r1950,r1951,r1952,r1953,r1954,r1955,r1956,r1957,r1958,r1959,r1960,r1961,r1962,r1963,r1964,r1965,r1966,r1967,r1968,r1969,r1970,r1971,r1972,r1973,r1974,r1975,r1976,r1977,r1978,r1979,r1980,r1981,r1982,r1983,r1984,r1985,r1986,r1987,r1988,r1989,r1990,r1991,r1992,r1993,r1994,r1995,r1996,r1997,r1998,r1999,r2000,r2001,r2002,r2003,r2004,r2005,r2006,r2007,r2008,r2009,r2010,r2011,r2012,r2013,r2014,r2015,r2016,r2017,r2018,r2019,r2020,r2021,r2022,r2023,r2024,r2025,r2026,r2027,r2028,r2029,r2030,r2031,r2032,r2033,r2034,r2035,r2036,r2037,r2038,r2039,r2040,r2041,r2042,r2043,r2044,r2045,r2046,r2047,r2048,r2049,r2050,r2051,r2052,r2053,r2054,r2055,r2056,r2057,r2058,r2059,r2060,r2061,r2062,r2063,r2064,r2065,r2066,r2067,r2068,r2069,r2070,r2071,r2072,r2073,r2074,r2075,r2076,r2077,r2078,r2079,r2080,r2081,r2082,r2083,r2084,r2085,r2086,r2087,r2088,r2089,r2090,r2091,r2092,r2093,r2094,r2095,r2096,r2097,r2098,r2099,r2100,r2101,r2102,r2103,r2104,r2105,r2106,r2107,r2108,r2109,r2110,r2111,r2112,r2113,r2114,r2115,r2116,r2117,r2118,r2119,r2120,r2121,r2122,r2123,r2124,r2125,r2126,r2127,r2128,r2129,r2130,r2131,r2132,r2133,r2134,r2135,r2136,r2137,r2138,r2139,r2140,r2141,r2142,r2143,r2144,r2145,r2146,r2147,r2148,r2149,r2150,r2151,r2152,r2153,r2154,r2155,r2156,r2157,r2158,r2159,r2160,r2161,r2162,r2163,r2164,r2165,r2166,r2167,r2168,r2169,r2170,r2171,r2172,r2173,r2174,r2175,r2176,r2177,r2178,r2179,r2180,r2181,r2182,r2183,r2184,r2185,r2186,r2187,r2188,r2189,r2190,r2191,r2192,r2193,r2194,r2195,r2196,r2197,r2198,r2199,r2200,r2201,r2202,r2203,r2204,r2205,r2206,r2207,r2208,r2209,r2210,r2211,r2212,r2213,r2214,r2215,r2216,r2217,r2218,r2219,r2220,r2221,r2222,r2223,r2224,r2225,r2226,r2227,r2228,r2229,r2230,r2231,r2232,r2233,r2234,r2235,r2236,r2237,r2238;r2=0;r3=0;r4=STACKTOP;r5=r1;r6=r5;r7=r6+16|0;r8=HEAP32[r7>>2];r9=r8;L1:while(1){r10=r9;r11=r10|0;r12=HEAP32[r11>>2];r13=r12|0;r14=r13;r15=HEAP32[r14>>2];r16=r15;r17=r16;r18=r17;r19=r18;r20=r19+12|0;r21=HEAP32[r20>>2];r22=r21+8|0;r23=HEAP32[r22>>2];r24=r23;r25=r9;r26=r25+24|0;r27=r26;r28=r27|0;r29=HEAP32[r28>>2];r30=r29;L3:while(1){r31=r9;r32=r31+24|0;r33=r32;r34=r33+4|0;r35=HEAP32[r34>>2];r36=r35+4|0;HEAP32[r34>>2]=r36;r37=HEAP32[r35>>2];r38=r37;r39=r5;r40=r39+40|0;r41=HEAP8[r40];r42=r41&255;r43=r42&12;r44=(r43|0)!=0;do{if(r44){r45=r5;r46=r45+48|0;r47=HEAP32[r46>>2];r48=r47-1|0;HEAP32[r46>>2]=r48;r49=(r48|0)==0;if(!r49){r50=r5;r51=r50+40|0;r52=HEAP8[r51];r53=r52&255;r54=r53&4;r55=(r54|0)!=0;if(!r55){break}}r56=r5;_traceexec(r56);r57=r9;r58=r57+24|0;r59=r58;r60=r59|0;r61=HEAP32[r60>>2];r30=r61}}while(0);r62=r30;r63=r38;r64=r63>>>6;r65=r64&255;r66=r62+(r65<<4)|0;r67=r66;r68=r38;r69=r68>>>0;r70=r69&63;switch(r70|0){case 3:{r71=r67;r72=r71;r73=r38;r74=r73>>>23;r75=r74&511;r76=r72;r77=r76|0;r78=r77;HEAP32[r78>>2]=r75;r79=r72;r80=r79+8|0;HEAP32[r80>>2]=1;r81=r38;r82=r81>>>14;r83=r82&511;r84=(r83|0)!=0;if(r84){r85=r9;r86=r85+24|0;r87=r86;r88=r87+4|0;r89=HEAP32[r88>>2];r90=r89+4|0;HEAP32[r88>>2]=r90}break};case 1:{r91=r24;r92=r38;r93=r92>>>14;r94=r93&262143;r95=r91+(r94<<4)|0;r96=r95;r97=r96;r98=r97;r99=r67;r100=r99;r101=r100;r102=r101|0;r103=r98;r104=r103|0;r105=r102;r106=r104;HEAP32[r105>>2]=HEAP32[r106>>2];HEAP32[r105+4>>2]=HEAP32[r106+4>>2];r107=r98;r108=r107+8|0;r109=HEAP32[r108>>2];r110=r100;r111=r110+8|0;HEAP32[r111>>2]=r109;break};case 0:{r112=r30;r113=r38;r114=r113>>>23;r115=r114&511;r116=r112+(r115<<4)|0;r117=r116;r118=r67;r119=r118;r120=r119;r121=r120|0;r122=r117;r123=r122|0;r124=r121;r125=r123;HEAP32[r124>>2]=HEAP32[r125>>2];HEAP32[r124+4>>2]=HEAP32[r125+4>>2];r126=r117;r127=r126+8|0;r128=HEAP32[r127>>2];r129=r119;r130=r129+8|0;HEAP32[r130>>2]=r128;break};case 9:{r131=r38;r132=r131>>>23;r133=r132&511;r134=r18;r135=r134+16|0;r136=r135+(r133<<2)|0;r137=HEAP32[r136>>2];r138=r137;r139=r67;r140=r139;r141=r138;r142=r141+8|0;r143=HEAP32[r142>>2];r144=r143;r145=r144;r146=r145|0;r147=r140;r148=r147|0;r149=r146;r150=r148;HEAP32[r149>>2]=HEAP32[r150>>2];HEAP32[r149+4>>2]=HEAP32[r150+4>>2];r151=r140;r152=r151+8|0;r153=HEAP32[r152>>2];r154=r144;r155=r154+8|0;HEAP32[r155>>2]=r153;r156=r67;r157=r156+8|0;r158=HEAP32[r157>>2];r159=r158&64;r160=(r159|0)!=0;do{if(r160){r161=r67;r162=r161|0;r163=r162;r164=HEAP32[r163>>2];r165=r164;r166=r165+5|0;r167=HEAP8[r166];r168=r167&255;r169=r168&3;r170=(r169|0)!=0;if(!r170){break}r171=r138;r172=r171;r173=r172;r174=r173+5|0;r175=HEAP8[r174];r176=r175&255;r177=r176&4;r178=(r177|0)!=0;if(!r178){break}r179=r5;r180=r138;r181=r180;r182=r67;r183=r182|0;r184=r183;r185=HEAP32[r184>>2];_luaC_barrier_(r179,r181,r185)}}while(0);break};case 2:{r186=r24;r187=r9;r188=r187+24|0;r189=r188;r190=r189+4|0;r191=HEAP32[r190>>2];r192=r191+4|0;HEAP32[r190>>2]=r192;r193=HEAP32[r191>>2];r194=r193>>>6;r195=r194&67108863;r196=r186+(r195<<4)|0;r197=r196;r198=r197;r199=r198;r200=r67;r201=r200;r202=r201;r203=r202|0;r204=r199;r205=r204|0;r206=r203;r207=r205;HEAP32[r206>>2]=HEAP32[r207>>2];HEAP32[r206+4>>2]=HEAP32[r207+4>>2];r208=r199;r209=r208+8|0;r210=HEAP32[r209>>2];r211=r201;r212=r211+8|0;HEAP32[r212>>2]=r210;break};case 7:{r213=r5;r214=r30;r215=r38;r216=r215>>>23;r217=r216&511;r218=r214+(r217<<4)|0;r219=r38;r220=r219>>>14;r221=r220&511;r222=r221&256;r223=(r222|0)!=0;if(r223){r224=r24;r225=r38;r226=r225>>>14;r227=r226&511;r228=r227&-257;r229=r224+(r228<<4)|0;r230=r229}else{r231=r30;r232=r38;r233=r232>>>14;r234=r233&511;r235=r231+(r234<<4)|0;r230=r235}r236=r67;_luaV_gettable(r213,r218,r230,r236);r237=r9;r238=r237+24|0;r239=r238;r240=r239|0;r241=HEAP32[r240>>2];r30=r241;break};case 6:{r242=r38;r243=r242>>>23;r244=r243&511;r245=r244;r246=r5;r247=r245;r248=r18;r249=r248+16|0;r250=r249+(r247<<2)|0;r251=HEAP32[r250>>2];r252=r251+8|0;r253=HEAP32[r252>>2];r254=r38;r255=r254>>>14;r256=r255&511;r257=r256&256;r258=(r257|0)!=0;if(r258){r259=r24;r260=r38;r261=r260>>>14;r262=r261&511;r263=r262&-257;r264=r259+(r263<<4)|0;r265=r264}else{r266=r30;r267=r38;r268=r267>>>14;r269=r268&511;r270=r266+(r269<<4)|0;r265=r270}r271=r67;_luaV_gettable(r246,r253,r265,r271);r272=r9;r273=r272+24|0;r274=r273;r275=r274|0;r276=HEAP32[r275>>2];r30=r276;break};case 5:{r277=r38;r278=r277>>>23;r279=r278&511;r280=r279;r281=r280;r282=r18;r283=r282+16|0;r284=r283+(r281<<2)|0;r285=HEAP32[r284>>2];r286=r285+8|0;r287=HEAP32[r286>>2];r288=r287;r289=r67;r290=r289;r291=r290;r292=r291|0;r293=r288;r294=r293|0;r295=r292;r296=r294;HEAP32[r295>>2]=HEAP32[r296>>2];HEAP32[r295+4>>2]=HEAP32[r296+4>>2];r297=r288;r298=r297+8|0;r299=HEAP32[r298>>2];r300=r290;r301=r300+8|0;HEAP32[r301>>2]=r299;break};case 8:{r302=r38;r303=r302>>>6;r304=r303&255;r305=r304;r306=r5;r307=r305;r308=r18;r309=r308+16|0;r310=r309+(r307<<2)|0;r311=HEAP32[r310>>2];r312=r311+8|0;r313=HEAP32[r312>>2];r314=r38;r315=r314>>>23;r316=r315&511;r317=r316&256;r318=(r317|0)!=0;if(r318){r319=r24;r320=r38;r321=r320>>>23;r322=r321&511;r323=r322&-257;r324=r319+(r323<<4)|0;r325=r324}else{r326=r30;r327=r38;r328=r327>>>23;r329=r328&511;r330=r326+(r329<<4)|0;r325=r330}r331=r38;r332=r331>>>14;r333=r332&511;r334=r333&256;r335=(r334|0)!=0;if(r335){r336=r24;r337=r38;r338=r337>>>14;r339=r338&511;r340=r339&-257;r341=r336+(r340<<4)|0;r342=r341}else{r343=r30;r344=r38;r345=r344>>>14;r346=r345&511;r347=r343+(r346<<4)|0;r342=r347}_luaV_settable(r306,r313,r325,r342);r348=r9;r349=r348+24|0;r350=r349;r351=r350|0;r352=HEAP32[r351>>2];r30=r352;break};case 4:{r353=r38;r354=r353>>>23;r355=r354&511;r356=r355;while(1){r357=r67;r358=r357+16|0;r67=r358;r359=r357+8|0;HEAP32[r359>>2]=0;r360=r356;r361=r360-1|0;r356=r361;r362=(r360|0)!=0;if(!r362){break}}break};case 10:{r363=r5;r364=r67;r365=r38;r366=r365>>>23;r367=r366&511;r368=r367&256;r369=(r368|0)!=0;if(r369){r370=r24;r371=r38;r372=r371>>>23;r373=r372&511;r374=r373&-257;r375=r370+(r374<<4)|0;r376=r375}else{r377=r30;r378=r38;r379=r378>>>23;r380=r379&511;r381=r377+(r380<<4)|0;r376=r381}r382=r38;r383=r382>>>14;r384=r383&511;r385=r384&256;r386=(r385|0)!=0;if(r386){r387=r24;r388=r38;r389=r388>>>14;r390=r389&511;r391=r390&-257;r392=r387+(r391<<4)|0;r393=r392}else{r394=r30;r395=r38;r396=r395>>>14;r397=r396&511;r398=r394+(r397<<4)|0;r393=r398}_luaV_settable(r363,r364,r376,r393);r399=r9;r400=r399+24|0;r401=r400;r402=r401|0;r403=HEAP32[r402>>2];r30=r403;break};case 11:{r404=r38;r405=r404>>>23;r406=r405&511;r407=r406;r408=r38;r409=r408>>>14;r410=r409&511;r411=r410;r412=r5;r413=_luaH_new(r412);r414=r413;r415=r67;r416=r415;r417=r414;r418=r417;r419=r416;r420=r419|0;r421=r420;HEAP32[r421>>2]=r418;r422=r416;r423=r422+8|0;HEAP32[r423>>2]=69;r424=r407;r425=(r424|0)!=0;if(r425){r2=48}else{r426=r411;r427=(r426|0)!=0;if(r427){r2=48}}if(r2==48){r2=0;r428=r5;r429=r414;r430=r407;r431=_luaO_fb2int(r430);r432=r411;r433=_luaO_fb2int(r432);_luaH_resize(r428,r429,r431,r433)}r434=r5;r435=r434+12|0;r436=HEAP32[r435>>2];r437=r436+12|0;r438=HEAP32[r437>>2];r439=(r438|0)>0;if(r439){r440=r67;r441=r440+16|0;r442=r5;r443=r442+8|0;HEAP32[r443>>2]=r441;r444=r5;_luaC_step(r444);r445=r9;r446=r445+4|0;r447=HEAP32[r446>>2];r448=r5;r449=r448+8|0;HEAP32[r449>>2]=r447}r450=r9;r451=r450+24|0;r452=r451;r453=r452|0;r454=HEAP32[r453>>2];r30=r454;break};case 12:{r455=r30;r456=r38;r457=r456>>>23;r458=r457&511;r459=r455+(r458<<4)|0;r460=r459;r461=r460;r462=r461;r463=r67;r464=r463+16|0;r465=r464;r466=r465;r467=r466|0;r468=r462;r469=r468|0;r470=r467;r471=r469;HEAP32[r470>>2]=HEAP32[r471>>2];HEAP32[r470+4>>2]=HEAP32[r471+4>>2];r472=r462;r473=r472+8|0;r474=HEAP32[r473>>2];r475=r465;r476=r475+8|0;HEAP32[r476>>2]=r474;r477=r5;r478=r460;r479=r38;r480=r479>>>14;r481=r480&511;r482=r481&256;r483=(r482|0)!=0;if(r483){r484=r24;r485=r38;r486=r485>>>14;r487=r486&511;r488=r487&-257;r489=r484+(r488<<4)|0;r490=r489}else{r491=r30;r492=r38;r493=r492>>>14;r494=r493&511;r495=r491+(r494<<4)|0;r490=r495}r496=r67;_luaV_gettable(r477,r478,r490,r496);r497=r9;r498=r497+24|0;r499=r498;r500=r499|0;r501=HEAP32[r500>>2];r30=r501;break};case 13:{r502=r38;r503=r502>>>23;r504=r503&511;r505=r504&256;r506=(r505|0)!=0;if(r506){r507=r24;r508=r38;r509=r508>>>23;r510=r509&511;r511=r510&-257;r512=r507+(r511<<4)|0;r513=r512}else{r514=r30;r515=r38;r516=r515>>>23;r517=r516&511;r518=r514+(r517<<4)|0;r513=r518}r519=r513;r520=r38;r521=r520>>>14;r522=r521&511;r523=r522&256;r524=(r523|0)!=0;if(r524){r525=r24;r526=r38;r527=r526>>>14;r528=r527&511;r529=r528&-257;r530=r525+(r529<<4)|0;r531=r530}else{r532=r30;r533=r38;r534=r533>>>14;r535=r534&511;r536=r532+(r535<<4)|0;r531=r536}r537=r531;r538=r519;r539=r538+8|0;r540=HEAP32[r539>>2];r541=(r540|0)==3;do{if(r541){r542=r537;r543=r542+8|0;r544=HEAP32[r543>>2];r545=(r544|0)==3;if(!r545){r2=65;break}r546=r519;r547=r546|0;r548=r547;r549=HEAPF64[r548>>3];r550=r549;r551=r537;r552=r551|0;r553=r552;r554=HEAPF64[r553>>3];r555=r554;r556=r67;r557=r556;r558=r550;r559=r555;r560=r558+r559;r561=r557;r562=r561|0;r563=r562;HEAPF64[r563>>3]=r560;r564=r557;r565=r564+8|0;HEAP32[r565>>2]=3}else{r2=65}}while(0);if(r2==65){r2=0;r566=r5;r567=r67;r568=r519;r569=r537;_luaV_arith(r566,r567,r568,r569,6);r570=r9;r571=r570+24|0;r572=r571;r573=r572|0;r574=HEAP32[r573>>2];r30=r574}break};case 14:{r575=r38;r576=r575>>>23;r577=r576&511;r578=r577&256;r579=(r578|0)!=0;if(r579){r580=r24;r581=r38;r582=r581>>>23;r583=r582&511;r584=r583&-257;r585=r580+(r584<<4)|0;r586=r585}else{r587=r30;r588=r38;r589=r588>>>23;r590=r589&511;r591=r587+(r590<<4)|0;r586=r591}r592=r586;r593=r38;r594=r593>>>14;r595=r594&511;r596=r595&256;r597=(r596|0)!=0;if(r597){r598=r24;r599=r38;r600=r599>>>14;r601=r600&511;r602=r601&-257;r603=r598+(r602<<4)|0;r604=r603}else{r605=r30;r606=r38;r607=r606>>>14;r608=r607&511;r609=r605+(r608<<4)|0;r604=r609}r610=r604;r611=r592;r612=r611+8|0;r613=HEAP32[r612>>2];r614=(r613|0)==3;do{if(r614){r615=r610;r616=r615+8|0;r617=HEAP32[r616>>2];r618=(r617|0)==3;if(!r618){r2=76;break}r619=r592;r620=r619|0;r621=r620;r622=HEAPF64[r621>>3];r623=r622;r624=r610;r625=r624|0;r626=r625;r627=HEAPF64[r626>>3];r628=r627;r629=r67;r630=r629;r631=r623;r632=r628;r633=r631-r632;r634=r630;r635=r634|0;r636=r635;HEAPF64[r636>>3]=r633;r637=r630;r638=r637+8|0;HEAP32[r638>>2]=3}else{r2=76}}while(0);if(r2==76){r2=0;r639=r5;r640=r67;r641=r592;r642=r610;_luaV_arith(r639,r640,r641,r642,7);r643=r9;r644=r643+24|0;r645=r644;r646=r645|0;r647=HEAP32[r646>>2];r30=r647}break};case 15:{r648=r38;r649=r648>>>23;r650=r649&511;r651=r650&256;r652=(r651|0)!=0;if(r652){r653=r24;r654=r38;r655=r654>>>23;r656=r655&511;r657=r656&-257;r658=r653+(r657<<4)|0;r659=r658}else{r660=r30;r661=r38;r662=r661>>>23;r663=r662&511;r664=r660+(r663<<4)|0;r659=r664}r665=r659;r666=r38;r667=r666>>>14;r668=r667&511;r669=r668&256;r670=(r669|0)!=0;if(r670){r671=r24;r672=r38;r673=r672>>>14;r674=r673&511;r675=r674&-257;r676=r671+(r675<<4)|0;r677=r676}else{r678=r30;r679=r38;r680=r679>>>14;r681=r680&511;r682=r678+(r681<<4)|0;r677=r682}r683=r677;r684=r665;r685=r684+8|0;r686=HEAP32[r685>>2];r687=(r686|0)==3;do{if(r687){r688=r683;r689=r688+8|0;r690=HEAP32[r689>>2];r691=(r690|0)==3;if(!r691){r2=87;break}r692=r665;r693=r692|0;r694=r693;r695=HEAPF64[r694>>3];r696=r695;r697=r683;r698=r697|0;r699=r698;r700=HEAPF64[r699>>3];r701=r700;r702=r67;r703=r702;r704=r696;r705=r701;r706=r704*r705;r707=r703;r708=r707|0;r709=r708;HEAPF64[r709>>3]=r706;r710=r703;r711=r710+8|0;HEAP32[r711>>2]=3}else{r2=87}}while(0);if(r2==87){r2=0;r712=r5;r713=r67;r714=r665;r715=r683;_luaV_arith(r712,r713,r714,r715,8);r716=r9;r717=r716+24|0;r718=r717;r719=r718|0;r720=HEAP32[r719>>2];r30=r720}break};case 16:{r721=r38;r722=r721>>>23;r723=r722&511;r724=r723&256;r725=(r724|0)!=0;if(r725){r726=r24;r727=r38;r728=r727>>>23;r729=r728&511;r730=r729&-257;r731=r726+(r730<<4)|0;r732=r731}else{r733=r30;r734=r38;r735=r734>>>23;r736=r735&511;r737=r733+(r736<<4)|0;r732=r737}r738=r732;r739=r38;r740=r739>>>14;r741=r740&511;r742=r741&256;r743=(r742|0)!=0;if(r743){r744=r24;r745=r38;r746=r745>>>14;r747=r746&511;r748=r747&-257;r749=r744+(r748<<4)|0;r750=r749}else{r751=r30;r752=r38;r753=r752>>>14;r754=r753&511;r755=r751+(r754<<4)|0;r750=r755}r756=r750;r757=r738;r758=r757+8|0;r759=HEAP32[r758>>2];r760=(r759|0)==3;do{if(r760){r761=r756;r762=r761+8|0;r763=HEAP32[r762>>2];r764=(r763|0)==3;if(!r764){r2=98;break}r765=r738;r766=r765|0;r767=r766;r768=HEAPF64[r767>>3];r769=r768;r770=r756;r771=r770|0;r772=r771;r773=HEAPF64[r772>>3];r774=r773;r775=r67;r776=r775;r777=r769;r778=r774;r779=r777/r778;r780=r776;r781=r780|0;r782=r781;HEAPF64[r782>>3]=r779;r783=r776;r784=r783+8|0;HEAP32[r784>>2]=3}else{r2=98}}while(0);if(r2==98){r2=0;r785=r5;r786=r67;r787=r738;r788=r756;_luaV_arith(r785,r786,r787,r788,9);r789=r9;r790=r789+24|0;r791=r790;r792=r791|0;r793=HEAP32[r792>>2];r30=r793}break};case 17:{r794=r38;r795=r794>>>23;r796=r795&511;r797=r796&256;r798=(r797|0)!=0;if(r798){r799=r24;r800=r38;r801=r800>>>23;r802=r801&511;r803=r802&-257;r804=r799+(r803<<4)|0;r805=r804}else{r806=r30;r807=r38;r808=r807>>>23;r809=r808&511;r810=r806+(r809<<4)|0;r805=r810}r811=r805;r812=r38;r813=r812>>>14;r814=r813&511;r815=r814&256;r816=(r815|0)!=0;if(r816){r817=r24;r818=r38;r819=r818>>>14;r820=r819&511;r821=r820&-257;r822=r817+(r821<<4)|0;r823=r822}else{r824=r30;r825=r38;r826=r825>>>14;r827=r826&511;r828=r824+(r827<<4)|0;r823=r828}r829=r823;r830=r811;r831=r830+8|0;r832=HEAP32[r831>>2];r833=(r832|0)==3;do{if(r833){r834=r829;r835=r834+8|0;r836=HEAP32[r835>>2];r837=(r836|0)==3;if(!r837){r2=109;break}r838=r811;r839=r838|0;r840=r839;r841=HEAPF64[r840>>3];r842=r841;r843=r829;r844=r843|0;r845=r844;r846=HEAPF64[r845>>3];r847=r846;r848=r67;r849=r848;r850=r842;r851=r842;r852=r847;r853=r851/r852;r854=Math_floor(r853);r855=r847;r856=r854*r855;r857=r850-r856;r858=r849;r859=r858|0;r860=r859;HEAPF64[r860>>3]=r857;r861=r849;r862=r861+8|0;HEAP32[r862>>2]=3}else{r2=109}}while(0);if(r2==109){r2=0;r863=r5;r864=r67;r865=r811;r866=r829;_luaV_arith(r863,r864,r865,r866,10);r867=r9;r868=r867+24|0;r869=r868;r870=r869|0;r871=HEAP32[r870>>2];r30=r871}break};case 18:{r872=r38;r873=r872>>>23;r874=r873&511;r875=r874&256;r876=(r875|0)!=0;if(r876){r877=r24;r878=r38;r879=r878>>>23;r880=r879&511;r881=r880&-257;r882=r877+(r881<<4)|0;r883=r882}else{r884=r30;r885=r38;r886=r885>>>23;r887=r886&511;r888=r884+(r887<<4)|0;r883=r888}r889=r883;r890=r38;r891=r890>>>14;r892=r891&511;r893=r892&256;r894=(r893|0)!=0;if(r894){r895=r24;r896=r38;r897=r896>>>14;r898=r897&511;r899=r898&-257;r900=r895+(r899<<4)|0;r901=r900}else{r902=r30;r903=r38;r904=r903>>>14;r905=r904&511;r906=r902+(r905<<4)|0;r901=r906}r907=r901;r908=r889;r909=r908+8|0;r910=HEAP32[r909>>2];r911=(r910|0)==3;do{if(r911){r912=r907;r913=r912+8|0;r914=HEAP32[r913>>2];r915=(r914|0)==3;if(!r915){r2=120;break}r916=r889;r917=r916|0;r918=r917;r919=HEAPF64[r918>>3];r920=r919;r921=r907;r922=r921|0;r923=r922;r924=HEAPF64[r923>>3];r925=r924;r926=r67;r927=r926;r928=r920;r929=r925;r930=Math_pow(r928,r929);r931=r927;r932=r931|0;r933=r932;HEAPF64[r933>>3]=r930;r934=r927;r935=r934+8|0;HEAP32[r935>>2]=3}else{r2=120}}while(0);if(r2==120){r2=0;r936=r5;r937=r67;r938=r889;r939=r907;_luaV_arith(r936,r937,r938,r939,11);r940=r9;r941=r940+24|0;r942=r941;r943=r942|0;r944=HEAP32[r943>>2];r30=r944}break};case 19:{r945=r30;r946=r38;r947=r946>>>23;r948=r947&511;r949=r945+(r948<<4)|0;r950=r949;r951=r950;r952=r951+8|0;r953=HEAP32[r952>>2];r954=(r953|0)==3;if(r954){r955=r950;r956=r955|0;r957=r956;r958=HEAPF64[r957>>3];r959=r958;r960=r67;r961=r960;r962=r959;r963=-0-r962;r964=r961;r965=r964|0;r966=r965;HEAPF64[r966>>3]=r963;r967=r961;r968=r967+8|0;HEAP32[r968>>2]=3}else{r969=r5;r970=r67;r971=r950;r972=r950;_luaV_arith(r969,r970,r971,r972,12);r973=r9;r974=r973+24|0;r975=r974;r976=r975|0;r977=HEAP32[r976>>2];r30=r977}break};case 20:{r978=r30;r979=r38;r980=r979>>>23;r981=r980&511;r982=r978+(r981<<4)|0;r983=r982;r984=r983;r985=r984+8|0;r986=HEAP32[r985>>2];r987=(r986|0)==0;if(r987){r988=1}else{r989=r983;r990=r989+8|0;r991=HEAP32[r990>>2];r992=(r991|0)==1;if(r992){r993=r983;r994=r993|0;r995=r994;r996=HEAP32[r995>>2];r997=(r996|0)==0;r998=r997}else{r998=0}r988=r998}r999=r988&1;r1000=r999;r1001=r67;r1002=r1001;r1003=r1000;r1004=r1002;r1005=r1004|0;r1006=r1005;HEAP32[r1006>>2]=r1003;r1007=r1002;r1008=r1007+8|0;HEAP32[r1008>>2]=1;break};case 21:{r1009=r5;r1010=r67;r1011=r30;r1012=r38;r1013=r1012>>>23;r1014=r1013&511;r1015=r1011+(r1014<<4)|0;_luaV_objlen(r1009,r1010,r1015);r1016=r9;r1017=r1016+24|0;r1018=r1017;r1019=r1018|0;r1020=HEAP32[r1019>>2];r30=r1020;break};case 22:{r1021=r38;r1022=r1021>>>23;r1023=r1022&511;r1024=r1023;r1025=r38;r1026=r1025>>>14;r1027=r1026&511;r1028=r1027;r1029=r30;r1030=r1028;r1031=r1029+(r1030<<4)|0;r1032=r1031+16|0;r1033=r5;r1034=r1033+8|0;HEAP32[r1034>>2]=r1032;r1035=r5;r1036=r1028;r1037=r1024;r1038=r1036-r1037|0;r1039=r1038+1|0;_luaV_concat(r1035,r1039);r1040=r9;r1041=r1040+24|0;r1042=r1041;r1043=r1042|0;r1044=HEAP32[r1043>>2];r30=r1044;r1045=r30;r1046=r38;r1047=r1046>>>6;r1048=r1047&255;r1049=r1045+(r1048<<4)|0;r67=r1049;r1050=r1024;r1051=r30;r1052=r1051+(r1050<<4)|0;r1053=r1052;r1054=r1053;r1055=r1054;r1056=r67;r1057=r1056;r1058=r1057;r1059=r1058|0;r1060=r1055;r1061=r1060|0;r1062=r1059;r1063=r1061;HEAP32[r1062>>2]=HEAP32[r1063>>2];HEAP32[r1062+4>>2]=HEAP32[r1063+4>>2];r1064=r1055;r1065=r1064+8|0;r1066=HEAP32[r1065>>2];r1067=r1057;r1068=r1067+8|0;HEAP32[r1068>>2]=r1066;r1069=r5;r1070=r1069+12|0;r1071=HEAP32[r1070>>2];r1072=r1071+12|0;r1073=HEAP32[r1072>>2];r1074=(r1073|0)>0;if(r1074){r1075=r67;r1076=r1053;r1077=r1075>>>0>=r1076>>>0;if(r1077){r1078=r67;r1079=r1078+16|0;r1080=r1079}else{r1081=r1053;r1080=r1081}r1082=r5;r1083=r1082+8|0;HEAP32[r1083>>2]=r1080;r1084=r5;_luaC_step(r1084);r1085=r9;r1086=r1085+4|0;r1087=HEAP32[r1086>>2];r1088=r5;r1089=r1088+8|0;HEAP32[r1089>>2]=r1087}r1090=r9;r1091=r1090+24|0;r1092=r1091;r1093=r1092|0;r1094=HEAP32[r1093>>2];r30=r1094;r1095=r9;r1096=r1095+4|0;r1097=HEAP32[r1096>>2];r1098=r5;r1099=r1098+8|0;HEAP32[r1099>>2]=r1097;break};case 23:{r1100=r38;r1101=r1100>>>6;r1102=r1101&255;r1103=r1102;r1104=r1103;r1105=(r1104|0)>0;if(r1105){r1106=r5;r1107=r9;r1108=r1107+24|0;r1109=r1108;r1110=r1109|0;r1111=HEAP32[r1110>>2];r1112=r1103;r1113=r1111+(r1112<<4)|0;r1114=r1113-16|0;_luaF_close(r1106,r1114)}r1115=r38;r1116=r1115>>>14;r1117=r1116&262143;r1118=r1117-131071|0;r1119=r1118|0;r1120=r9;r1121=r1120+24|0;r1122=r1121;r1123=r1122+4|0;r1124=HEAP32[r1123>>2];r1125=r1124+(r1119<<2)|0;HEAP32[r1123>>2]=r1125;break};case 24:{r1126=r38;r1127=r1126>>>23;r1128=r1127&511;r1129=r1128&256;r1130=(r1129|0)!=0;if(r1130){r1131=r24;r1132=r38;r1133=r1132>>>23;r1134=r1133&511;r1135=r1134&-257;r1136=r1131+(r1135<<4)|0;r1137=r1136}else{r1138=r30;r1139=r38;r1140=r1139>>>23;r1141=r1140&511;r1142=r1138+(r1141<<4)|0;r1137=r1142}r1143=r1137;r1144=r38;r1145=r1144>>>14;r1146=r1145&511;r1147=r1146&256;r1148=(r1147|0)!=0;if(r1148){r1149=r24;r1150=r38;r1151=r1150>>>14;r1152=r1151&511;r1153=r1152&-257;r1154=r1149+(r1153<<4)|0;r1155=r1154}else{r1156=r30;r1157=r38;r1158=r1157>>>14;r1159=r1158&511;r1160=r1156+(r1159<<4)|0;r1155=r1160}r1161=r1155;r1162=r1143;r1163=r1162+8|0;r1164=HEAP32[r1163>>2];r1165=r1161;r1166=r1165+8|0;r1167=HEAP32[r1166>>2];r1168=(r1164|0)==(r1167|0);if(r1168){r1169=r5;r1170=r1143;r1171=r1161;r1172=_luaV_equalobj_(r1169,r1170,r1171);r1173=(r1172|0)!=0;r1174=r1173}else{r1174=0}r1175=r1174&1;r1176=r38;r1177=r1176>>>6;r1178=r1177&255;r1179=(r1175|0)!=(r1178|0);if(r1179){r1180=r9;r1181=r1180+24|0;r1182=r1181;r1183=r1182+4|0;r1184=HEAP32[r1183>>2];r1185=r1184+4|0;HEAP32[r1183>>2]=r1185}else{r1186=r9;r1187=r1186+24|0;r1188=r1187;r1189=r1188+4|0;r1190=HEAP32[r1189>>2];r1191=HEAP32[r1190>>2];r38=r1191;r1192=r38;r1193=r1192>>>6;r1194=r1193&255;r1195=r1194;r1196=r1195;r1197=(r1196|0)>0;if(r1197){r1198=r5;r1199=r9;r1200=r1199+24|0;r1201=r1200;r1202=r1201|0;r1203=HEAP32[r1202>>2];r1204=r1195;r1205=r1203+(r1204<<4)|0;r1206=r1205-16|0;_luaF_close(r1198,r1206)}r1207=r38;r1208=r1207>>>14;r1209=r1208&262143;r1210=r1209-131071|0;r1211=r1210+1|0;r1212=r9;r1213=r1212+24|0;r1214=r1213;r1215=r1214+4|0;r1216=HEAP32[r1215>>2];r1217=r1216+(r1211<<2)|0;HEAP32[r1215>>2]=r1217}r1218=r9;r1219=r1218+24|0;r1220=r1219;r1221=r1220|0;r1222=HEAP32[r1221>>2];r30=r1222;break};case 25:{r1223=r5;r1224=r38;r1225=r1224>>>23;r1226=r1225&511;r1227=r1226&256;r1228=(r1227|0)!=0;if(r1228){r1229=r24;r1230=r38;r1231=r1230>>>23;r1232=r1231&511;r1233=r1232&-257;r1234=r1229+(r1233<<4)|0;r1235=r1234}else{r1236=r30;r1237=r38;r1238=r1237>>>23;r1239=r1238&511;r1240=r1236+(r1239<<4)|0;r1235=r1240}r1241=r38;r1242=r1241>>>14;r1243=r1242&511;r1244=r1243&256;r1245=(r1244|0)!=0;if(r1245){r1246=r24;r1247=r38;r1248=r1247>>>14;r1249=r1248&511;r1250=r1249&-257;r1251=r1246+(r1250<<4)|0;r1252=r1251}else{r1253=r30;r1254=r38;r1255=r1254>>>14;r1256=r1255&511;r1257=r1253+(r1256<<4)|0;r1252=r1257}r1258=_luaV_lessthan(r1223,r1235,r1252);r1259=r38;r1260=r1259>>>6;r1261=r1260&255;r1262=(r1258|0)!=(r1261|0);if(r1262){r1263=r9;r1264=r1263+24|0;r1265=r1264;r1266=r1265+4|0;r1267=HEAP32[r1266>>2];r1268=r1267+4|0;HEAP32[r1266>>2]=r1268}else{r1269=r9;r1270=r1269+24|0;r1271=r1270;r1272=r1271+4|0;r1273=HEAP32[r1272>>2];r1274=HEAP32[r1273>>2];r38=r1274;r1275=r38;r1276=r1275>>>6;r1277=r1276&255;r1278=r1277;r1279=r1278;r1280=(r1279|0)>0;if(r1280){r1281=r5;r1282=r9;r1283=r1282+24|0;r1284=r1283;r1285=r1284|0;r1286=HEAP32[r1285>>2];r1287=r1278;r1288=r1286+(r1287<<4)|0;r1289=r1288-16|0;_luaF_close(r1281,r1289)}r1290=r38;r1291=r1290>>>14;r1292=r1291&262143;r1293=r1292-131071|0;r1294=r1293+1|0;r1295=r9;r1296=r1295+24|0;r1297=r1296;r1298=r1297+4|0;r1299=HEAP32[r1298>>2];r1300=r1299+(r1294<<2)|0;HEAP32[r1298>>2]=r1300}r1301=r9;r1302=r1301+24|0;r1303=r1302;r1304=r1303|0;r1305=HEAP32[r1304>>2];r30=r1305;break};case 26:{r1306=r5;r1307=r38;r1308=r1307>>>23;r1309=r1308&511;r1310=r1309&256;r1311=(r1310|0)!=0;if(r1311){r1312=r24;r1313=r38;r1314=r1313>>>23;r1315=r1314&511;r1316=r1315&-257;r1317=r1312+(r1316<<4)|0;r1318=r1317}else{r1319=r30;r1320=r38;r1321=r1320>>>23;r1322=r1321&511;r1323=r1319+(r1322<<4)|0;r1318=r1323}r1324=r38;r1325=r1324>>>14;r1326=r1325&511;r1327=r1326&256;r1328=(r1327|0)!=0;if(r1328){r1329=r24;r1330=r38;r1331=r1330>>>14;r1332=r1331&511;r1333=r1332&-257;r1334=r1329+(r1333<<4)|0;r1335=r1334}else{r1336=r30;r1337=r38;r1338=r1337>>>14;r1339=r1338&511;r1340=r1336+(r1339<<4)|0;r1335=r1340}r1341=_luaV_lessequal(r1306,r1318,r1335);r1342=r38;r1343=r1342>>>6;r1344=r1343&255;r1345=(r1341|0)!=(r1344|0);if(r1345){r1346=r9;r1347=r1346+24|0;r1348=r1347;r1349=r1348+4|0;r1350=HEAP32[r1349>>2];r1351=r1350+4|0;HEAP32[r1349>>2]=r1351}else{r1352=r9;r1353=r1352+24|0;r1354=r1353;r1355=r1354+4|0;r1356=HEAP32[r1355>>2];r1357=HEAP32[r1356>>2];r38=r1357;r1358=r38;r1359=r1358>>>6;r1360=r1359&255;r1361=r1360;r1362=r1361;r1363=(r1362|0)>0;if(r1363){r1364=r5;r1365=r9;r1366=r1365+24|0;r1367=r1366;r1368=r1367|0;r1369=HEAP32[r1368>>2];r1370=r1361;r1371=r1369+(r1370<<4)|0;r1372=r1371-16|0;_luaF_close(r1364,r1372)}r1373=r38;r1374=r1373>>>14;r1375=r1374&262143;r1376=r1375-131071|0;r1377=r1376+1|0;r1378=r9;r1379=r1378+24|0;r1380=r1379;r1381=r1380+4|0;r1382=HEAP32[r1381>>2];r1383=r1382+(r1377<<2)|0;HEAP32[r1381>>2]=r1383}r1384=r9;r1385=r1384+24|0;r1386=r1385;r1387=r1386|0;r1388=HEAP32[r1387>>2];r30=r1388;break};case 27:{r1389=r38;r1390=r1389>>>14;r1391=r1390&511;r1392=(r1391|0)!=0;do{if(r1392){r1393=r67;r1394=r1393+8|0;r1395=HEAP32[r1394>>2];r1396=(r1395|0)==0;if(r1396){r2=186;break}r1397=r67;r1398=r1397+8|0;r1399=HEAP32[r1398>>2];r1400=(r1399|0)==1;if(!r1400){r2=187;break}r1401=r67;r1402=r1401|0;r1403=r1402;r1404=HEAP32[r1403>>2];r1405=(r1404|0)==0;if(r1405){r2=186}else{r2=187}}else{r1406=r67;r1407=r1406+8|0;r1408=HEAP32[r1407>>2];r1409=(r1408|0)==0;if(r1409){r2=187;break}r1410=r67;r1411=r1410+8|0;r1412=HEAP32[r1411>>2];r1413=(r1412|0)==1;if(!r1413){r2=186;break}r1414=r67;r1415=r1414|0;r1416=r1415;r1417=HEAP32[r1416>>2];r1418=(r1417|0)==0;if(r1418){r2=187}else{r2=186}}}while(0);if(r2==186){r2=0;r1419=r9;r1420=r1419+24|0;r1421=r1420;r1422=r1421+4|0;r1423=HEAP32[r1422>>2];r1424=r1423+4|0;HEAP32[r1422>>2]=r1424}else if(r2==187){r2=0;r1425=r9;r1426=r1425+24|0;r1427=r1426;r1428=r1427+4|0;r1429=HEAP32[r1428>>2];r1430=HEAP32[r1429>>2];r38=r1430;r1431=r38;r1432=r1431>>>6;r1433=r1432&255;r1434=r1433;r1435=r1434;r1436=(r1435|0)>0;if(r1436){r1437=r5;r1438=r9;r1439=r1438+24|0;r1440=r1439;r1441=r1440|0;r1442=HEAP32[r1441>>2];r1443=r1434;r1444=r1442+(r1443<<4)|0;r1445=r1444-16|0;_luaF_close(r1437,r1445)}r1446=r38;r1447=r1446>>>14;r1448=r1447&262143;r1449=r1448-131071|0;r1450=r1449+1|0;r1451=r9;r1452=r1451+24|0;r1453=r1452;r1454=r1453+4|0;r1455=HEAP32[r1454>>2];r1456=r1455+(r1450<<2)|0;HEAP32[r1454>>2]=r1456}break};case 28:{r1457=r30;r1458=r38;r1459=r1458>>>23;r1460=r1459&511;r1461=r1457+(r1460<<4)|0;r1462=r1461;r1463=r38;r1464=r1463>>>14;r1465=r1464&511;r1466=(r1465|0)!=0;do{if(r1466){r1467=r1462;r1468=r1467+8|0;r1469=HEAP32[r1468>>2];r1470=(r1469|0)==0;if(r1470){r2=198;break}r1471=r1462;r1472=r1471+8|0;r1473=HEAP32[r1472>>2];r1474=(r1473|0)==1;if(!r1474){r2=199;break}r1475=r1462;r1476=r1475|0;r1477=r1476;r1478=HEAP32[r1477>>2];r1479=(r1478|0)==0;if(r1479){r2=198}else{r2=199}}else{r1480=r1462;r1481=r1480+8|0;r1482=HEAP32[r1481>>2];r1483=(r1482|0)==0;if(r1483){r2=199;break}r1484=r1462;r1485=r1484+8|0;r1486=HEAP32[r1485>>2];r1487=(r1486|0)==1;if(!r1487){r2=198;break}r1488=r1462;r1489=r1488|0;r1490=r1489;r1491=HEAP32[r1490>>2];r1492=(r1491|0)==0;if(r1492){r2=199}else{r2=198}}}while(0);if(r2==198){r2=0;r1493=r9;r1494=r1493+24|0;r1495=r1494;r1496=r1495+4|0;r1497=HEAP32[r1496>>2];r1498=r1497+4|0;HEAP32[r1496>>2]=r1498}else if(r2==199){r2=0;r1499=r1462;r1500=r1499;r1501=r67;r1502=r1501;r1503=r1502;r1504=r1503|0;r1505=r1500;r1506=r1505|0;r1507=r1504;r1508=r1506;HEAP32[r1507>>2]=HEAP32[r1508>>2];HEAP32[r1507+4>>2]=HEAP32[r1508+4>>2];r1509=r1500;r1510=r1509+8|0;r1511=HEAP32[r1510>>2];r1512=r1502;r1513=r1512+8|0;HEAP32[r1513>>2]=r1511;r1514=r9;r1515=r1514+24|0;r1516=r1515;r1517=r1516+4|0;r1518=HEAP32[r1517>>2];r1519=HEAP32[r1518>>2];r38=r1519;r1520=r38;r1521=r1520>>>6;r1522=r1521&255;r1523=r1522;r1524=r1523;r1525=(r1524|0)>0;if(r1525){r1526=r5;r1527=r9;r1528=r1527+24|0;r1529=r1528;r1530=r1529|0;r1531=HEAP32[r1530>>2];r1532=r1523;r1533=r1531+(r1532<<4)|0;r1534=r1533-16|0;_luaF_close(r1526,r1534)}r1535=r38;r1536=r1535>>>14;r1537=r1536&262143;r1538=r1537-131071|0;r1539=r1538+1|0;r1540=r9;r1541=r1540+24|0;r1542=r1541;r1543=r1542+4|0;r1544=HEAP32[r1543>>2];r1545=r1544+(r1539<<2)|0;HEAP32[r1543>>2]=r1545}break};case 29:{r1546=r38;r1547=r1546>>>23;r1548=r1547&511;r1549=r1548;r1550=r38;r1551=r1550>>>14;r1552=r1551&511;r1553=r1552-1|0;r1554=r1553;r1555=r1549;r1556=(r1555|0)!=0;if(r1556){r1557=r67;r1558=r1549;r1559=r1557+(r1558<<4)|0;r1560=r5;r1561=r1560+8|0;HEAP32[r1561>>2]=r1559}r1562=r5;r1563=r67;r1564=r1554;r1565=_luaD_precall(r1562,r1563,r1564);r1566=(r1565|0)!=0;if(!r1566){r2=209;break L3}r1567=r1554;r1568=(r1567|0)>=0;if(r1568){r1569=r9;r1570=r1569+4|0;r1571=HEAP32[r1570>>2];r1572=r5;r1573=r1572+8|0;HEAP32[r1573>>2]=r1571}r1574=r9;r1575=r1574+24|0;r1576=r1575;r1577=r1576|0;r1578=HEAP32[r1577>>2];r30=r1578;break};case 30:{r1579=r38;r1580=r1579>>>23;r1581=r1580&511;r1582=r1581;r1583=r1582;r1584=(r1583|0)!=0;if(r1584){r1585=r67;r1586=r1582;r1587=r1585+(r1586<<4)|0;r1588=r5;r1589=r1588+8|0;HEAP32[r1589>>2]=r1587}r1590=r5;r1591=r67;r1592=_luaD_precall(r1590,r1591,-1);r1593=(r1592|0)!=0;if(!r1593){r2=215;break L3}r1594=r9;r1595=r1594+24|0;r1596=r1595;r1597=r1596|0;r1598=HEAP32[r1597>>2];r30=r1598;break};case 31:{r2=223;break L3;break};case 32:{r1599=r67;r1600=r1599+32|0;r1601=r1600|0;r1602=r1601;r1603=HEAPF64[r1602>>3];r1604=r1603;r1605=r67;r1606=r1605|0;r1607=r1606;r1608=HEAPF64[r1607>>3];r1609=r1604;r1610=r1608+r1609;r1611=r1610;r1612=r67;r1613=r1612+16|0;r1614=r1613|0;r1615=r1614;r1616=HEAPF64[r1615>>3];r1617=r1616;r1618=r1604;r1619=0<r1618;if(r1619){r1620=r1611;r1621=r1617;r1622=r1620<=r1621;if(r1622){r2=235}}else{r1623=r1617;r1624=r1611;r1625=r1623<=r1624;if(r1625){r2=235}}if(r2==235){r2=0;r1626=r38;r1627=r1626>>>14;r1628=r1627&262143;r1629=r1628-131071|0;r1630=r9;r1631=r1630+24|0;r1632=r1631;r1633=r1632+4|0;r1634=HEAP32[r1633>>2];r1635=r1634+(r1629<<2)|0;HEAP32[r1633>>2]=r1635;r1636=r67;r1637=r1636;r1638=r1611;r1639=r1637;r1640=r1639|0;r1641=r1640;HEAPF64[r1641>>3]=r1638;r1642=r1637;r1643=r1642+8|0;HEAP32[r1643>>2]=3;r1644=r67;r1645=r1644+48|0;r1646=r1645;r1647=r1611;r1648=r1646;r1649=r1648|0;r1650=r1649;HEAPF64[r1650>>3]=r1647;r1651=r1646;r1652=r1651+8|0;HEAP32[r1652>>2]=3}break};case 33:{r1653=r67;r1654=r1653;r1655=r67;r1656=r1655+16|0;r1657=r1656;r1658=r67;r1659=r1658+32|0;r1660=r1659;r1661=r1654;r1662=r1661+8|0;r1663=HEAP32[r1662>>2];r1664=(r1663|0)==3;if(!r1664){r1665=r1654;r1666=r67;r1667=_luaV_tonumber(r1665,r1666);r1654=r1667;r1668=(r1667|0)!=0;if(!r1668){r2=239;break L1}}r1669=r1657;r1670=r1669+8|0;r1671=HEAP32[r1670>>2];r1672=(r1671|0)==3;if(!r1672){r1673=r1657;r1674=r67;r1675=r1674+16|0;r1676=_luaV_tonumber(r1673,r1675);r1657=r1676;r1677=(r1676|0)!=0;if(!r1677){r2=242;break L1}}r1678=r1660;r1679=r1678+8|0;r1680=HEAP32[r1679>>2];r1681=(r1680|0)==3;if(!r1681){r1682=r1660;r1683=r67;r1684=r1683+32|0;r1685=_luaV_tonumber(r1682,r1684);r1660=r1685;r1686=(r1685|0)!=0;if(!r1686){r2=245;break L1}}r1687=r67;r1688=r1687;r1689=r67;r1690=r1689|0;r1691=r1690;r1692=HEAPF64[r1691>>3];r1693=r1660;r1694=r1693|0;r1695=r1694;r1696=HEAPF64[r1695>>3];r1697=r1692-r1696;r1698=r1688;r1699=r1698|0;r1700=r1699;HEAPF64[r1700>>3]=r1697;r1701=r1688;r1702=r1701+8|0;HEAP32[r1702>>2]=3;r1703=r38;r1704=r1703>>>14;r1705=r1704&262143;r1706=r1705-131071|0;r1707=r9;r1708=r1707+24|0;r1709=r1708;r1710=r1709+4|0;r1711=HEAP32[r1710>>2];r1712=r1711+(r1706<<2)|0;HEAP32[r1710>>2]=r1712;break};case 34:{r1713=r67;r1714=r1713+48|0;r1715=r1714;r1716=r67;r1717=r1716+32|0;r1718=r1717;r1719=r1715;r1720=r1719+32|0;r1721=r1720;r1722=r1721;r1723=r1722|0;r1724=r1718;r1725=r1724|0;r1726=r1723;r1727=r1725;HEAP32[r1726>>2]=HEAP32[r1727>>2];HEAP32[r1726+4>>2]=HEAP32[r1727+4>>2];r1728=r1718;r1729=r1728+8|0;r1730=HEAP32[r1729>>2];r1731=r1721;r1732=r1731+8|0;HEAP32[r1732>>2]=r1730;r1733=r67;r1734=r1733+16|0;r1735=r1734;r1736=r1715;r1737=r1736+16|0;r1738=r1737;r1739=r1738;r1740=r1739|0;r1741=r1735;r1742=r1741|0;r1743=r1740;r1744=r1742;HEAP32[r1743>>2]=HEAP32[r1744>>2];HEAP32[r1743+4>>2]=HEAP32[r1744+4>>2];r1745=r1735;r1746=r1745+8|0;r1747=HEAP32[r1746>>2];r1748=r1738;r1749=r1748+8|0;HEAP32[r1749>>2]=r1747;r1750=r67;r1751=r1750;r1752=r1715;r1753=r1752;r1754=r1753;r1755=r1754|0;r1756=r1751;r1757=r1756|0;r1758=r1755;r1759=r1757;HEAP32[r1758>>2]=HEAP32[r1759>>2];HEAP32[r1758+4>>2]=HEAP32[r1759+4>>2];r1760=r1751;r1761=r1760+8|0;r1762=HEAP32[r1761>>2];r1763=r1753;r1764=r1763+8|0;HEAP32[r1764>>2]=r1762;r1765=r1715;r1766=r1765+48|0;r1767=r5;r1768=r1767+8|0;HEAP32[r1768>>2]=r1766;r1769=r5;r1770=r1715;r1771=r38;r1772=r1771>>>14;r1773=r1772&511;_luaD_call(r1769,r1770,r1773,1);r1774=r9;r1775=r1774+24|0;r1776=r1775;r1777=r1776|0;r1778=HEAP32[r1777>>2];r30=r1778;r1779=r9;r1780=r1779+4|0;r1781=HEAP32[r1780>>2];r1782=r5;r1783=r1782+8|0;HEAP32[r1783>>2]=r1781;r1784=r9;r1785=r1784+24|0;r1786=r1785;r1787=r1786+4|0;r1788=HEAP32[r1787>>2];r1789=r1788+4|0;HEAP32[r1787>>2]=r1789;r1790=HEAP32[r1788>>2];r38=r1790;r1791=r30;r1792=r38;r1793=r1792>>>6;r1794=r1793&255;r1795=r1791+(r1794<<4)|0;r67=r1795;r2=251;break};case 35:{r2=251;break};case 36:{r1796=r38;r1797=r1796>>>23;r1798=r1797&511;r1799=r1798;r1800=r38;r1801=r1800>>>14;r1802=r1801&511;r1803=r1802;r1804=r1799;r1805=(r1804|0)==0;if(r1805){r1806=r5;r1807=r1806+8|0;r1808=HEAP32[r1807>>2];r1809=r67;r1810=r1808;r1811=r1809;r1812=r1810-r1811|0;r1813=(r1812|0)/16&-1;r1814=r1813-1|0;r1799=r1814}r1815=r1803;r1816=(r1815|0)==0;if(r1816){r1817=r9;r1818=r1817+24|0;r1819=r1818;r1820=r1819+4|0;r1821=HEAP32[r1820>>2];r1822=r1821+4|0;HEAP32[r1820>>2]=r1822;r1823=HEAP32[r1821>>2];r1824=r1823>>>6;r1825=r1824&67108863;r1803=r1825}r1826=r67;r1827=r1826|0;r1828=r1827;r1829=HEAP32[r1828>>2];r1830=r1829;r1831=r1830;r1832=r1803;r1833=r1832-1|0;r1834=r1833*50&-1;r1835=r1799;r1836=r1834+r1835|0;r1837=r1836;r1838=r1837;r1839=r1831;r1840=r1839+28|0;r1841=HEAP32[r1840>>2];r1842=(r1838|0)>(r1841|0);if(r1842){r1843=r5;r1844=r1831;r1845=r1837;_luaH_resizearray(r1843,r1844,r1845)}while(1){r1846=r1799;r1847=(r1846|0)>0;if(!r1847){break}r1848=r67;r1849=r1799;r1850=r1848+(r1849<<4)|0;r1851=r1850;r1852=r5;r1853=r1831;r1854=r1837;r1855=r1854-1|0;r1837=r1855;r1856=r1851;_luaH_setint(r1852,r1853,r1854,r1856);r1857=r1851;r1858=r1857+8|0;r1859=HEAP32[r1858>>2];r1860=r1859&64;r1861=(r1860|0)!=0;do{if(r1861){r1862=r1851;r1863=r1862|0;r1864=r1863;r1865=HEAP32[r1864>>2];r1866=r1865;r1867=r1866+5|0;r1868=HEAP8[r1867];r1869=r1868&255;r1870=r1869&3;r1871=(r1870|0)!=0;if(!r1871){break}r1872=r1831;r1873=r1872;r1874=r1873;r1875=r1874+5|0;r1876=HEAP8[r1875];r1877=r1876&255;r1878=r1877&4;r1879=(r1878|0)!=0;if(!r1879){break}r1880=r5;r1881=r1831;r1882=r1881;_luaC_barrierback_(r1880,r1882)}}while(0);r1883=r1799;r1884=r1883-1|0;r1799=r1884}r1885=r9;r1886=r1885+4|0;r1887=HEAP32[r1886>>2];r1888=r5;r1889=r1888+8|0;HEAP32[r1889>>2]=r1887;break};case 37:{r1890=r38;r1891=r1890>>>14;r1892=r1891&262143;r1893=r18;r1894=r1893+12|0;r1895=HEAP32[r1894>>2];r1896=r1895+16|0;r1897=HEAP32[r1896>>2];r1898=r1897+(r1892<<2)|0;r1899=HEAP32[r1898>>2];r1900=r1899;r1901=r1900;r1902=r18;r1903=r1902+16|0;r1904=r1903|0;r1905=r30;r1906=_getcached(r1901,r1904,r1905);r1907=r1906;r1908=r1907;r1909=(r1908|0)==0;if(r1909){r1910=r5;r1911=r1900;r1912=r18;r1913=r1912+16|0;r1914=r1913|0;r1915=r30;r1916=r67;_pushclosure(r1910,r1911,r1914,r1915,r1916)}else{r1917=r67;r1918=r1917;r1919=r1907;r1920=r1919;r1921=r1918;r1922=r1921|0;r1923=r1922;HEAP32[r1923>>2]=r1920;r1924=r1918;r1925=r1924+8|0;HEAP32[r1925>>2]=70}r1926=r5;r1927=r1926+12|0;r1928=HEAP32[r1927>>2];r1929=r1928+12|0;r1930=HEAP32[r1929>>2];r1931=(r1930|0)>0;if(r1931){r1932=r67;r1933=r1932+16|0;r1934=r5;r1935=r1934+8|0;HEAP32[r1935>>2]=r1933;r1936=r5;_luaC_step(r1936);r1937=r9;r1938=r1937+4|0;r1939=HEAP32[r1938>>2];r1940=r5;r1941=r1940+8|0;HEAP32[r1941>>2]=r1939}r1942=r9;r1943=r1942+24|0;r1944=r1943;r1945=r1944|0;r1946=HEAP32[r1945>>2];r30=r1946;break};case 38:{r1947=r38;r1948=r1947>>>23;r1949=r1948&511;r1950=r1949-1|0;r1951=r1950;r1952=r30;r1953=r9;r1954=r1953|0;r1955=HEAP32[r1954>>2];r1956=r1952;r1957=r1955;r1958=r1956-r1957|0;r1959=(r1958|0)/16&-1;r1960=r18;r1961=r1960+12|0;r1962=HEAP32[r1961>>2];r1963=r1962+76|0;r1964=HEAP8[r1963];r1965=r1964&255;r1966=r1959-r1965|0;r1967=r1966-1|0;r1968=r1967;r1969=r1951;r1970=(r1969|0)<0;if(r1970){r1971=r1968;r1951=r1971;r1972=r5;r1973=r1972+24|0;r1974=HEAP32[r1973>>2];r1975=r5;r1976=r1975+8|0;r1977=HEAP32[r1976>>2];r1978=r1974;r1979=r1977;r1980=r1978-r1979|0;r1981=(r1980|0)/16&-1;r1982=r1968;r1983=(r1981|0)<=(r1982|0);if(r1983){r1984=r5;r1985=r1968;_luaD_growstack(r1984,r1985)}r1986=r9;r1987=r1986+24|0;r1988=r1987;r1989=r1988|0;r1990=HEAP32[r1989>>2];r30=r1990;r1991=r30;r1992=r38;r1993=r1992>>>6;r1994=r1993&255;r1995=r1991+(r1994<<4)|0;r67=r1995;r1996=r67;r1997=r1968;r1998=r1996+(r1997<<4)|0;r1999=r5;r2000=r1999+8|0;HEAP32[r2000>>2]=r1998}r2001=0;while(1){r2002=r2001;r2003=r1951;r2004=(r2002|0)<(r2003|0);if(!r2004){break}r2005=r2001;r2006=r1968;r2007=(r2005|0)<(r2006|0);if(r2007){r2008=r30;r2009=r1968;r2010=-r2009|0;r2011=r2008+(r2010<<4)|0;r2012=r2001;r2013=r2011+(r2012<<4)|0;r2014=r2013;r2015=r67;r2016=r2001;r2017=r2015+(r2016<<4)|0;r2018=r2017;r2019=r2018;r2020=r2019|0;r2021=r2014;r2022=r2021|0;r2023=r2020;r2024=r2022;HEAP32[r2023>>2]=HEAP32[r2024>>2];HEAP32[r2023+4>>2]=HEAP32[r2024+4>>2];r2025=r2014;r2026=r2025+8|0;r2027=HEAP32[r2026>>2];r2028=r2018;r2029=r2028+8|0;HEAP32[r2029>>2]=r2027}else{r2030=r67;r2031=r2001;r2032=r2030+(r2031<<4)|0;r2033=r2032+8|0;HEAP32[r2033>>2]=0}r2034=r2001;r2035=r2034+1|0;r2001=r2035}break};case 39:{break};default:{}}if(r2==251){r2=0;r2036=r67;r2037=r2036+16|0;r2038=r2037+8|0;r2039=HEAP32[r2038>>2];r2040=(r2039|0)==0;if(!r2040){r2041=r67;r2042=r2041+16|0;r2043=r2042;r2044=r67;r2045=r2044;r2046=r2045;r2047=r2046|0;r2048=r2043;r2049=r2048|0;r2050=r2047;r2051=r2049;HEAP32[r2050>>2]=HEAP32[r2051>>2];HEAP32[r2050+4>>2]=HEAP32[r2051+4>>2];r2052=r2043;r2053=r2052+8|0;r2054=HEAP32[r2053>>2];r2055=r2045;r2056=r2055+8|0;HEAP32[r2056>>2]=r2054;r2057=r38;r2058=r2057>>>14;r2059=r2058&262143;r2060=r2059-131071|0;r2061=r9;r2062=r2061+24|0;r2063=r2062;r2064=r2063+4|0;r2065=HEAP32[r2064>>2];r2066=r2065+(r2060<<2)|0;HEAP32[r2064>>2]=r2066}}}if(r2==209){r2=0;r2067=r5;r2068=r2067+16|0;r2069=HEAP32[r2068>>2];r9=r2069;r2070=r9;r2071=r2070+18|0;r2072=HEAP8[r2071];r2073=r2072&255;r2074=r2073|4;r2075=r2074&255;HEAP8[r2071]=r2075;continue}else if(r2==215){r2=0;r2076=r5;r2077=r2076+16|0;r2078=HEAP32[r2077>>2];r2079=r2078;r2080=r2079;r2081=r2080+8|0;r2082=HEAP32[r2081>>2];r2083=r2082;r2084=r2079;r2085=r2084|0;r2086=HEAP32[r2085>>2];r2087=r2086;r2088=r2083;r2089=r2088|0;r2090=HEAP32[r2089>>2];r2091=r2090;r2092=r2079;r2093=r2092+24|0;r2094=r2093;r2095=r2094|0;r2096=HEAP32[r2095>>2];r2097=r2087;r2098=r2097|0;r2099=r2098;r2100=HEAP32[r2099>>2];r2101=r2100;r2102=r2101;r2103=r2102+12|0;r2104=HEAP32[r2103>>2];r2105=r2104+76|0;r2106=HEAP8[r2105];r2107=r2106&255;r2108=r2096+(r2107<<4)|0;r2109=r2108;r2110=r18;r2111=r2110+12|0;r2112=HEAP32[r2111>>2];r2113=r2112+56|0;r2114=HEAP32[r2113>>2];r2115=(r2114|0)>0;if(r2115){r2116=r5;r2117=r2083;r2118=r2117+24|0;r2119=r2118;r2120=r2119|0;r2121=HEAP32[r2120>>2];_luaF_close(r2116,r2121)}r2122=0;while(1){r2123=r2087;r2124=r2122;r2125=r2123+(r2124<<4)|0;r2126=r2109;r2127=r2125>>>0<r2126>>>0;if(!r2127){break}r2128=r2087;r2129=r2122;r2130=r2128+(r2129<<4)|0;r2131=r2130;r2132=r2091;r2133=r2122;r2134=r2132+(r2133<<4)|0;r2135=r2134;r2136=r2135;r2137=r2136|0;r2138=r2131;r2139=r2138|0;r2140=r2137;r2141=r2139;HEAP32[r2140>>2]=HEAP32[r2141>>2];HEAP32[r2140+4>>2]=HEAP32[r2141+4>>2];r2142=r2131;r2143=r2142+8|0;r2144=HEAP32[r2143>>2];r2145=r2135;r2146=r2145+8|0;HEAP32[r2146>>2]=r2144;r2147=r2122;r2148=r2147+1|0;r2122=r2148}r2149=r2091;r2150=r2079;r2151=r2150+24|0;r2152=r2151;r2153=r2152|0;r2154=HEAP32[r2153>>2];r2155=r2087;r2156=r2154;r2157=r2155;r2158=r2156-r2157|0;r2159=(r2158|0)/16&-1;r2160=r2149+(r2159<<4)|0;r2161=r2083;r2162=r2161+24|0;r2163=r2162;r2164=r2163|0;HEAP32[r2164>>2]=r2160;r2165=r2091;r2166=r5;r2167=r2166+8|0;r2168=HEAP32[r2167>>2];r2169=r2087;r2170=r2168;r2171=r2169;r2172=r2170-r2171|0;r2173=(r2172|0)/16&-1;r2174=r2165+(r2173<<4)|0;r2175=r5;r2176=r2175+8|0;HEAP32[r2176>>2]=r2174;r2177=r2083;r2178=r2177+4|0;HEAP32[r2178>>2]=r2174;r2179=r2079;r2180=r2179+24|0;r2181=r2180;r2182=r2181+4|0;r2183=HEAP32[r2182>>2];r2184=r2083;r2185=r2184+24|0;r2186=r2185;r2187=r2186+4|0;HEAP32[r2187>>2]=r2183;r2188=r2083;r2189=r2188+18|0;r2190=HEAP8[r2189];r2191=r2190&255;r2192=r2191|64;r2193=r2192&255;HEAP8[r2189]=r2193;r2194=r2083;r2195=r5;r2196=r2195+16|0;HEAP32[r2196>>2]=r2194;r9=r2194;continue}else if(r2==223){r2=0;r2197=r38;r2198=r2197>>>23;r2199=r2198&511;r2200=r2199;r2201=r2200;r2202=(r2201|0)!=0;if(r2202){r2203=r67;r2204=r2200;r2205=r2203+(r2204<<4)|0;r2206=r2205-16|0;r2207=r5;r2208=r2207+8|0;HEAP32[r2208>>2]=r2206}r2209=r18;r2210=r2209+12|0;r2211=HEAP32[r2210>>2];r2212=r2211+56|0;r2213=HEAP32[r2212>>2];r2214=(r2213|0)>0;if(r2214){r2215=r5;r2216=r30;_luaF_close(r2215,r2216)}r2217=r5;r2218=r67;r2219=_luaD_poscall(r2217,r2218);r2200=r2219;r2220=r9;r2221=r2220+18|0;r2222=HEAP8[r2221];r2223=r2222&255;r2224=r2223&4;r2225=(r2224|0)!=0;if(!r2225){r2=228;break}r2226=r5;r2227=r2226+16|0;r2228=HEAP32[r2227>>2];r9=r2228;r2229=r2200;r2230=(r2229|0)!=0;if(r2230){r2231=r9;r2232=r2231+4|0;r2233=HEAP32[r2232>>2];r2234=r5;r2235=r2234+8|0;HEAP32[r2235>>2]=r2233}continue}}if(r2==228){STACKTOP=r4;return}else if(r2==239){r2236=r5;_luaG_runerror(r2236,3792,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3}else if(r2==242){r2237=r5;_luaG_runerror(r2237,3376,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3}else if(r2==245){r2238=r5;_luaG_runerror(r2238,3e3,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3}}function _traceexec(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r2=0;r3=STACKTOP;r4=r1;r1=HEAP32[r4+16>>2];r5=HEAP8[r4+40|0];if((r5&8|0)!=0){r6=(HEAP32[r4+48>>2]|0)==0}else{r6=0}r7=r6&1;if((r7|0)!=0){HEAP32[r4+48>>2]=HEAP32[r4+44>>2]}if((HEAP8[r1+18|0]&128|0)!=0){r6=r1+18|0;HEAP8[r6]=HEAPU8[r6]&-129;STACKTOP=r3;return}if((r7|0)!=0){_luaD_hook(r4,3,-1)}if((r5&4|0)!=0){r5=HEAP32[HEAP32[HEAP32[r1>>2]>>2]+12>>2];r6=((HEAP32[r1+28>>2]-HEAP32[r5+12>>2]|0)/4&-1)-1|0;if((HEAP32[r5+20>>2]|0)!=0){r8=HEAP32[HEAP32[r5+20>>2]+(r6<<2)>>2]}else{r8=0}r9=r8;do{if((r6|0)==0){r2=19}else{if(HEAP32[r1+28>>2]>>>0<=HEAP32[r4+20>>2]>>>0){r2=19;break}if((HEAP32[r5+20>>2]|0)!=0){r10=HEAP32[HEAP32[r5+20>>2]+(((HEAP32[r4+20>>2]-HEAP32[r5+12>>2]|0)/4&-1)-1<<2)>>2]}else{r10=0}if((r9|0)!=(r10|0)){r2=19}}}while(0);if(r2==19){_luaD_hook(r4,2,r9)}}HEAP32[r4+20>>2]=HEAP32[r1+28>>2];if((HEAPU8[r4+6|0]|0)!=1){STACKTOP=r3;return}if((r7|0)==0){r11=r1;r12=r11+24|0;r13=r12;r14=r13+4|0;r15=HEAP32[r14>>2];r16=r15-4|0;HEAP32[r14>>2]=r16;r17=r1;r18=r17+18|0;r19=HEAP8[r18];r20=r19&255;r21=r20|128;r22=r21&255;HEAP8[r18]=r22;r23=r4;r24=r23+8|0;r25=HEAP32[r24>>2];r26=r25-16|0;r27=r1;r28=r27|0;HEAP32[r28>>2]=r26;r29=r4;_luaD_throw(r29,1)}HEAP32[r4+48>>2]=1;r11=r1;r12=r11+24|0;r13=r12;r14=r13+4|0;r15=HEAP32[r14>>2];r16=r15-4|0;HEAP32[r14>>2]=r16;r17=r1;r18=r17+18|0;r19=HEAP8[r18];r20=r19&255;r21=r20|128;r22=r21&255;HEAP8[r18]=r22;r23=r4;r24=r23+8|0;r25=HEAP32[r24>>2];r26=r25-16|0;r27=r1;r28=r27|0;HEAP32[r28>>2]=r26;r29=r4;_luaD_throw(r29,1)}function _getcached(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=HEAP32[r6+32>>2];do{if((r3|0)!=0){r7=HEAP32[r6+40>>2];r8=HEAP32[r6+28>>2];r9=0;while(1){if((r9|0)>=(r7|0)){r4=11;break}if((HEAPU8[r8+(r9<<3)+4|0]|0)!=0){r10=r2+(HEAPU8[r8+(r9<<3)+5|0]<<4)|0}else{r10=HEAP32[HEAP32[r1+(HEAPU8[r8+(r9<<3)+5|0]<<2)>>2]+8>>2]}if((HEAP32[HEAP32[r3+16+(r9<<2)>>2]+8>>2]|0)!=(r10|0)){break}r9=r9+1|0}if(r4==11){break}r11=0;r12=r11;STACKTOP=r5;return r12}}while(0);r11=r3;r12=r11;STACKTOP=r5;return r12}function _pushclosure(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=r4;r4=HEAP32[r1+40>>2];r8=HEAP32[r1+28>>2];r9=_luaF_newLclosure(r7,r4);HEAP32[r9+12>>2]=r1;r10=r5;HEAP32[r10>>2]=r9;HEAP32[r10+8>>2]=70;r10=0;while(1){if((r10|0)>=(r4|0)){break}if((HEAP8[r8+(r10<<3)+4|0]|0)!=0){r5=_luaF_findupval(r7,r3+(HEAPU8[r8+(r10<<3)+5|0]<<4)|0);HEAP32[r9+16+(r10<<2)>>2]=r5}else{HEAP32[r9+16+(r10<<2)>>2]=HEAP32[r2+(HEAPU8[r8+(r10<<3)+5|0]<<2)>>2]}r10=r10+1|0}if((HEAP8[r1+5|0]&4|0)==0){r11=r9;r12=r1;r13=r12+32|0;HEAP32[r13>>2]=r11;STACKTOP=r6;return}_luaC_barrierproto_(r7,r1,r9);r11=r9;r12=r1;r13=r12+32|0;HEAP32[r13>>2]=r11;STACKTOP=r6;return}function _luaZ_fill(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r1=FUNCTION_TABLE[HEAP32[r4+8>>2]](HEAP32[r4+16>>2],HEAP32[r4+12>>2],r3);do{if((r1|0)!=0){if((HEAP32[r3>>2]|0)==0){break}HEAP32[r4>>2]=HEAP32[r3>>2]-1;HEAP32[r4+4>>2]=r1;r5=r4+4|0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6+1;r7=HEAPU8[r6];r8=r7;STACKTOP=r2;return r8}}while(0);r7=-1;r8=r7;STACKTOP=r2;return r8}function _luaZ_init(r1,r2,r3,r4){var r5;r5=r2;HEAP32[r5+16>>2]=r1;HEAP32[r5+8>>2]=r3;HEAP32[r5+12>>2]=r4;HEAP32[r5>>2]=0;HEAP32[r5+4>>2]=0;STACKTOP=STACKTOP;return}function _luaZ_read(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;while(1){if((r2|0)==0){r4=12;break}if((HEAP32[r6>>2]|0)==0){if((_luaZ_fill(r6)|0)==-1){r4=5;break}r3=r6|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;r3=r6+4|0;HEAP32[r3>>2]=HEAP32[r3>>2]-1}if(r2>>>0<=HEAP32[r6>>2]>>>0){r7=r2}else{r7=HEAP32[r6>>2]}r3=r7;_memcpy(r1,HEAP32[r6+4>>2],r3)|0;r8=r6|0;HEAP32[r8>>2]=HEAP32[r8>>2]-r3;r8=r6+4|0;HEAP32[r8>>2]=HEAP32[r8>>2]+r3;r1=r1+r3|0;r2=r2-r3|0}if(r4==5){r9=r2;r10=r9;STACKTOP=r5;return r10}else if(r4==12){r9=0;r10=r9;STACKTOP=r5;return r10}}function _luaZ_openspace(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if(r2>>>0<=HEAP32[r1+8>>2]>>>0){r6=r1;r7=r6|0;r8=HEAP32[r7>>2];STACKTOP=r4;return r8}if(r2>>>0<32){r2=32}if((r2+1|0)>>>0>4294967293){_luaM_toobig(r5)}else{r9=_luaM_realloc_(r5,HEAP32[r1>>2],HEAP32[r1+8>>2],r2)}HEAP32[r1>>2]=r9;HEAP32[r1+8>>2]=r2;r6=r1;r7=r6|0;r8=HEAP32[r7>>2];STACKTOP=r4;return r8}function _luaL_traceback(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+104|0;r7=r6;r8=r1;r1=r2;r2=r3;r3=r4;r4=_lua_gettop(r8);r9=_countlevels(r1);r10=(r9|0)>22?12:0;if((r2|0)!=0){_lua_pushfstring(r8,6344,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r2,r5));STACKTOP=r5}_lua_pushlstring(r8,10880,16);while(1){r2=r3;r3=r2+1|0;if((_lua_getstack(r1,r2,r7)|0)==0){break}if((r3|0)==(r10|0)){_lua_pushlstring(r8,8640,5);r3=r9-10|0}else{_lua_getinfo(r1,6616,r7);_lua_pushfstring(r8,5208,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r7+36,r5));STACKTOP=r5;if((HEAP32[r7+20>>2]|0)>0){_lua_pushfstring(r8,4128,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=HEAP32[r7+20>>2],r5));STACKTOP=r5}_lua_pushlstring(r8,3784,4);_pushfuncname(r8,r7);if((HEAP8[r7+35|0]|0)!=0){_lua_pushlstring(r8,3304,20)}_lua_concat(r8,_lua_gettop(r8)-r4|0)}}_lua_concat(r8,_lua_gettop(r8)-r4|0);STACKTOP=r6;return}function _countlevels(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;STACKTOP=STACKTOP+104|0;r3=r2;r4=r1;r1=1;r5=1;while(1){if((_lua_getstack(r4,r5,r3)|0)==0){break}r1=r5;r5=r5<<1}while(1){if((r1|0)>=(r5|0)){break}r6=(r1+r5|0)/2&-1;if((_lua_getstack(r4,r6,r3)|0)!=0){r1=r6+1|0}else{r5=r6}}STACKTOP=r2;return r5-1|0}function _pushfuncname(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1;r1=r2;if((HEAP8[HEAP32[r1+8>>2]]|0)!=0){_lua_pushfstring(r5,4472,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAP32[r1+4>>2],r3));STACKTOP=r3;STACKTOP=r4;return}if((HEAP8[HEAP32[r1+12>>2]]|0)==109){_lua_pushfstring(r5,4328,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3}else{if((HEAP8[HEAP32[r1+12>>2]]|0)==67){if((_pushglobalfuncname(r5,r1)|0)!=0){r2=_lua_tolstring(r5,-1,0);_lua_pushfstring(r5,4472,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r2,r3));STACKTOP=r3;_lua_remove(r5,-2)}else{_lua_pushlstring(r5,11216,1)}}else{r2=HEAP32[r1+24>>2];_lua_pushfstring(r5,4256,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r1+36,HEAP32[r3+8>>2]=r2,r3));STACKTOP=r3}}STACKTOP=r4;return}function _luaL_argerror(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+104|0;r6=r5;r7=r1;r1=r2;r2=r3;if((_lua_getstack(r7,0,r6)|0)==0){r3=_luaL_error(r7,2952,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r1,HEAP32[r4+8>>2]=r2,r4));STACKTOP=r4;r8=r3;r9=r8;STACKTOP=r5;return r9}_lua_getinfo(r7,2688,r6);do{if((_strcmp(HEAP32[r6+8>>2],11928)|0)==0){r1=r1-1|0;if((r1|0)!=0){break}r3=_luaL_error(r7,11552,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r6+4>>2],r4));STACKTOP=r4;r8=r3;r9=r8;STACKTOP=r5;return r9}}while(0);if((HEAP32[r6+4>>2]|0)==0){if((_pushglobalfuncname(r7,r6)|0)!=0){r10=_lua_tolstring(r7,-1,0)}else{r10=11216}HEAP32[r6+4>>2]=r10}r10=HEAP32[r6+4>>2];r6=_luaL_error(r7,10936,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r1,HEAP32[r4+8>>2]=r10,HEAP32[r4+16>>2]=r2,r4));STACKTOP=r4;r8=r6;r9=r8;STACKTOP=r5;return r9}function _luaL_error(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r1;r1=r5|0;HEAP32[r1>>2]=r3;HEAP32[r1+4>>2]=0;_luaL_where(r6,1);_lua_pushvfstring(r6,r2,r5|0);_lua_concat(r6,2);r5=_lua_error(r6);STACKTOP=r4;return r5}function _pushglobalfuncname(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=_lua_gettop(r4);_lua_getinfo(r4,4712,r2);_lua_rawgeti(r4,-1001e3,2);if((_findfield(r4,r1+1|0,2)|0)!=0){_lua_copy(r4,-1,r1+1|0);_lua_settop(r4,-3);r5=1;r6=r5;STACKTOP=r3;return r6}else{_lua_settop(r4,r1);r5=0;r6=r5;STACKTOP=r3;return r6}}function _luaL_where(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+104|0;r5=r4;r6=r1;do{if((_lua_getstack(r6,r2,r5)|0)!=0){_lua_getinfo(r6,10752,r5);if((HEAP32[r5+20>>2]|0)<=0){break}r1=HEAP32[r5+20>>2];_lua_pushfstring(r6,10544,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r5+36,HEAP32[r3+8>>2]=r1,r3));STACKTOP=r3;STACKTOP=r4;return}}while(0);_lua_pushlstring(r6,12096,0);STACKTOP=r4;return}function _luaL_fileresult(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;r5=STACKTOP;r6=r1;r1=r3;r3=___errno_location();r7=HEAP32[r3>>2];if((r2|0)!=0){_lua_pushboolean(r6,1);r8=1;r9=r8;STACKTOP=r5;return r9}_lua_pushnil(r6);if((r1|0)!=0){r2=_strerror(r7);_lua_pushfstring(r6,10072,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r1,HEAP32[r4+8>>2]=r2,r4));STACKTOP=r4}else{r2=_strerror(r7);_lua_pushfstring(r6,9840,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4}_lua_pushinteger(r6,r7);r8=3;r9=r8;STACKTOP=r5;return r9}function _luaL_execresult(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=9632;if((r1|0)==-1){r6=_luaL_fileresult(r5,0,0);r7=r6;STACKTOP=r4;return r7}do{if((HEAP8[r2]|0)==101){if((r1|0)!=0){r3=6;break}_lua_pushboolean(r5,1)}else{r3=6}}while(0);if(r3==6){_lua_pushnil(r5)}_lua_pushstring(r5,r2);_lua_pushinteger(r5,r1);r6=3;r7=r6;STACKTOP=r4;return r7}function _luaL_newmetatable(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;_lua_getfield(r4,-1001e3,r1);if((_lua_type(r4,-1)|0)==0){_lua_settop(r4,-2);_lua_createtable(r4,0,0);_lua_pushvalue(r4,-1);_lua_setfield(r4,-1001e3,r1);r5=1;r6=r5;STACKTOP=r3;return r6}else{r5=0;r6=r5;STACKTOP=r3;return r6}}function _luaL_setmetatable(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;_lua_getfield(r4,-1001e3,r2);_lua_setmetatable(r4,-2);STACKTOP=r3;return}function _luaL_testudata(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=_lua_touserdata(r5,r1);do{if((r3|0)!=0){if((_lua_getmetatable(r5,r1)|0)==0){break}_lua_getfield(r5,-1001e3,r2);if((_lua_rawequal(r5,-1,-2)|0)==0){r3=0}_lua_settop(r5,-3);r6=r3;r7=r6;STACKTOP=r4;return r7}}while(0);r6=0;r7=r6;STACKTOP=r4;return r7}function _luaL_checkudata(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=_luaL_testudata(r5,r1,r2);if((r3|0)!=0){r6=r3;STACKTOP=r4;return r6}_typeerror(r5,r1,r2);r6=r3;STACKTOP=r4;return r6}function _typeerror(r1,r2,r3){var r4,r5,r6,r7;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=_lua_typename(r6,_lua_type(r6,r1));r7=_lua_pushfstring(r6,4816,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r3,HEAP32[r4+8>>2]=r2,r4));STACKTOP=r4;r4=_luaL_argerror(r6,r1,r7);STACKTOP=r5;return r4}function _luaL_checkoption(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11;r5=0;r6=0;r7=STACKTOP;r8=r1;r1=r2;r2=r3;r3=r4;if((r2|0)!=0){r9=_luaL_optlstring(r8,r1,r2,0)}else{r9=_luaL_checklstring(r8,r1,0)}r2=r9;r9=0;while(1){if((HEAP32[r3+(r9<<2)>>2]|0)==0){r5=10;break}if((_strcmp(HEAP32[r3+(r9<<2)>>2],r2)|0)==0){r5=7;break}r9=r9+1|0}if(r5==7){r10=r9;r11=r10;STACKTOP=r7;return r11}else if(r5==10){r5=_lua_pushfstring(r8,9384,(r6=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r6>>2]=r2,r6));STACKTOP=r6;r10=_luaL_argerror(r8,r1,r5);r11=r10;STACKTOP=r7;return r11}}function _luaL_optlstring(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=r4;if((_lua_type(r6,r1)|0)>0){r7=_luaL_checklstring(r6,r1,r3);r8=r7;STACKTOP=r5;return r8}if((r3|0)!=0){if((r2|0)!=0){r9=_strlen(r2)}else{r9=0}HEAP32[r3>>2]=r9}r7=r2;r8=r7;STACKTOP=r5;return r8}function _luaL_checklstring(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=r2;r2=_lua_tolstring(r5,r1,r3);if((r2|0)!=0){r6=r2;STACKTOP=r4;return r6}_tag_error(r5,r1,4);r6=r2;STACKTOP=r4;return r6}function _luaL_checkstack(r1,r2,r3){var r4,r5,r6;r4=0;r5=STACKTOP;r6=r1;r1=r3;if((_lua_checkstack(r6,r2+20|0)|0)!=0){STACKTOP=r5;return}if((r1|0)!=0){_luaL_error(r6,9176,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r1,r4));STACKTOP=r4}else{_luaL_error(r6,8936,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4}STACKTOP=r5;return}function _luaL_checktype(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((_lua_type(r5,r1)|0)==(r2|0)){STACKTOP=r4;return}_tag_error(r5,r1,r2);STACKTOP=r4;return}function _tag_error(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;_typeerror(r5,r2,_lua_typename(r5,r3));STACKTOP=r4;return}function _luaL_checkany(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;if((_lua_type(r4,r1)|0)!=-1){STACKTOP=r3;return}_luaL_argerror(r4,r1,8680);STACKTOP=r3;return}function _luaL_checknumber(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r1;r1=r2;r2=_lua_tonumberx(r5,r1,r4);if((HEAP32[r4>>2]|0)!=0){r6=r2;STACKTOP=r3;return r6}_tag_error(r5,r1,3);r6=r2;STACKTOP=r3;return r6}function _luaL_optnumber(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=r2;if((_lua_type(r5,r1)|0)<=0){r6=r3;STACKTOP=r4;return r6}else{r6=_luaL_checknumber(r5,r1);STACKTOP=r4;return r6}}function _luaL_checkinteger(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r1;r1=r2;r2=_lua_tointegerx(r5,r1,r4);if((HEAP32[r4>>2]|0)!=0){r6=r2;STACKTOP=r3;return r6}_tag_error(r5,r1,3);r6=r2;STACKTOP=r3;return r6}function _luaL_checkunsigned(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r1;r1=r2;r2=_lua_tounsignedx(r5,r1,r4);if((HEAP32[r4>>2]|0)!=0){r6=r2;STACKTOP=r3;return r6}_tag_error(r5,r1,3);r6=r2;STACKTOP=r3;return r6}function _luaL_optinteger(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=r2;if((_lua_type(r5,r1)|0)<=0){r6=r3;STACKTOP=r4;return r6}else{r6=_luaL_checkinteger(r5,r1);STACKTOP=r4;return r6}}function _luaL_prepbuffsize(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=0;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=HEAP32[r6+12>>2];if((HEAP32[r6+4>>2]-HEAP32[r6+8>>2]|0)>>>0>=r1>>>0){r7=r6;r8=r7+8|0;r9=HEAP32[r8>>2];r10=r6;r11=r10|0;r12=HEAP32[r11>>2];r13=r12+r9|0;STACKTOP=r5;return r13}r14=HEAP32[r6+4>>2]<<1;if((r14-HEAP32[r6+8>>2]|0)>>>0<r1>>>0){r14=HEAP32[r6+8>>2]+r1|0}if(r14>>>0<HEAP32[r6+8>>2]>>>0){r3=6}else{if((r14-HEAP32[r6+8>>2]|0)>>>0<r1>>>0){r3=6}}if(r3==6){_luaL_error(r2,8440,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4}r4=_lua_newuserdata(r2,r14);_memcpy(r4,HEAP32[r6>>2],HEAP32[r6+8>>2])|0;if((HEAP32[r6>>2]|0)!=(r6+16|0)){_lua_remove(r2,-2)}HEAP32[r6>>2]=r4;HEAP32[r6+4>>2]=r14;r7=r6;r8=r7+8|0;r9=HEAP32[r8>>2];r10=r6;r11=r10|0;r12=HEAP32[r11>>2];r13=r12+r9|0;STACKTOP=r5;return r13}function _luaL_addlstring(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;r1=r3;_memcpy(_luaL_prepbuffsize(r5,r1),r2,r1)|0;r2=r5+8|0;HEAP32[r2>>2]=HEAP32[r2>>2]+r1;STACKTOP=r4;return}function _luaL_addstring(r1,r2){var r3,r4;r3=STACKTOP;r4=r2;_luaL_addlstring(r1,r4,_strlen(r4));STACKTOP=r3;return}function _luaL_pushresult(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=HEAP32[r3+12>>2];_lua_pushlstring(r1,HEAP32[r3>>2],HEAP32[r3+8>>2]);if((HEAP32[r3>>2]|0)==(r3+16|0)){STACKTOP=r2;return}_lua_remove(r1,-2);STACKTOP=r2;return}function _luaL_pushresultsize(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r4+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+r2;_luaL_pushresult(r4);STACKTOP=r3;return}function _luaL_addvalue(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r1=HEAP32[r4+12>>2];r5=_lua_tolstring(r1,-1,r3);if((HEAP32[r4>>2]|0)!=(r4+16|0)){_lua_insert(r1,-2)}_luaL_addlstring(r4,r5,HEAP32[r3>>2]);_lua_remove(r1,(HEAP32[r4>>2]|0)!=(r4+16|0)?-2:-1);STACKTOP=r2;return}function _luaL_buffinit(r1,r2){var r3;r3=r2;HEAP32[r3+12>>2]=r1;HEAP32[r3>>2]=r3+16;HEAP32[r3+8>>2]=0;HEAP32[r3+4>>2]=1024;STACKTOP=STACKTOP;return}function _luaL_buffinitsize(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r2;_luaL_buffinit(r1,r5);r1=_luaL_prepbuffsize(r5,r3);STACKTOP=r4;return r1}function _luaL_loadfilex(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1040|0;r6=r5;r7=r5+1032;r8=r1;r1=r2;r2=r3;r3=_lua_gettop(r8)+1|0;do{if((r1|0)==0){_lua_pushlstring(r8,8256,6);HEAP32[r6+4>>2]=HEAP32[_stdin>>2]}else{_lua_pushfstring(r8,8048,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r1,r4));STACKTOP=r4;r9=_fopen(r1,7792);HEAP32[r6+4>>2]=r9;if((HEAP32[r6+4>>2]|0)!=0){break}r10=_errfile(r8,7624,r3);r11=r10;STACKTOP=r5;return r11}}while(0);if((_skipcomment(r6,r7)|0)!=0){r4=r6|0;r9=HEAP32[r4>>2];HEAP32[r4>>2]=r9+1;HEAP8[r6+8+r9|0]=10}do{if((HEAP32[r7>>2]|0)==(HEAP8[7472]|0)){if((r1|0)==0){break}r9=_freopen(r1,7280,HEAP32[r6+4>>2]);HEAP32[r6+4>>2]=r9;if((HEAP32[r6+4>>2]|0)!=0){_skipcomment(r6,r7);break}r10=_errfile(r8,7144,r3);r11=r10;STACKTOP=r5;return r11}}while(0);if((HEAP32[r7>>2]|0)!=-1){r9=HEAP32[r7>>2]&255;r7=r6|0;r4=HEAP32[r7>>2];HEAP32[r7>>2]=r4+1;HEAP8[r6+8+r4|0]=r9}r9=_lua_load(r8,348,r6,_lua_tolstring(r8,-1,0),r2);r2=_ferror(HEAP32[r6+4>>2]);if((r1|0)!=0){_fclose(HEAP32[r6+4>>2])}if((r2|0)!=0){_lua_settop(r8,r3);r10=_errfile(r8,6904,r3);r11=r10;STACKTOP=r5;return r11}else{_lua_remove(r8,r3);r10=r9;r11=r10;STACKTOP=r5;return r11}}function _errfile(r1,r2,r3){var r4,r5,r6,r7;r4=0;r5=STACKTOP;r6=r1;r1=r3;r3=___errno_location();r7=_strerror(HEAP32[r3>>2]);r3=_lua_tolstring(r6,r1,0)+1|0;_lua_pushfstring(r6,4920,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r3,HEAP32[r4+16>>2]=r7,r4));STACKTOP=r4;_lua_remove(r6,r1);STACKTOP=r5;return 7}function _skipcomment(r1,r2){var r3,r4,r5,r6,r7,r8;r3=STACKTOP;r4=r1;r1=r2;r2=_skipBOM(r4);HEAP32[r1>>2]=r2;r5=r2;if((r5|0)!=35){r6=0;r7=r6;STACKTOP=r3;return r7}while(1){r5=_fgetc(HEAP32[r4+4>>2]);if((r5|0)!=-1){r8=(r5|0)!=10}else{r8=0}if(!r8){break}}r8=_fgetc(HEAP32[r4+4>>2]);HEAP32[r1>>2]=r8;r6=1;r7=r6;STACKTOP=r3;return r7}function _getF(r1,r2,r3){var r4,r5,r6;r1=STACKTOP;r4=r3;r3=r2;do{if((HEAP32[r3>>2]|0)>0){HEAP32[r4>>2]=HEAP32[r3>>2];HEAP32[r3>>2]=0}else{if((_feof(HEAP32[r3+4>>2])|0)==0){r2=_fread(r3+8|0,1,1024,HEAP32[r3+4>>2]);HEAP32[r4>>2]=r2;break}r5=0;r6=r5;STACKTOP=r1;return r6}}while(0);r5=r3+8|0;r6=r5;STACKTOP=r1;return r6}function _luaL_loadbufferx(r1,r2,r3,r4,r5){var r6,r7;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r7=r6;HEAP32[r7>>2]=r2;HEAP32[r7+4>>2]=r3;r3=_lua_load(r1,338,r7,r4,r5);STACKTOP=r6;return r3}function _getS(r1,r2,r3){var r4,r5,r6;r1=STACKTOP;r4=r2;if((HEAP32[r4+4>>2]|0)==0){r5=0;r6=r5;STACKTOP=r1;return r6}else{HEAP32[r3>>2]=HEAP32[r4+4>>2];HEAP32[r4+4>>2]=0;r5=HEAP32[r4>>2];r6=r5;STACKTOP=r1;return r6}}function _luaL_getmetafield(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;if((_lua_getmetatable(r5,r2)|0)==0){r6=0;r7=r6;STACKTOP=r4;return r7}_lua_pushstring(r5,r3);_lua_rawget(r5,-2);if((_lua_type(r5,-1)|0)==0){_lua_settop(r5,-3);r6=0;r7=r6;STACKTOP=r4;return r7}else{_lua_remove(r5,-2);r6=1;r7=r6;STACKTOP=r4;return r7}}function _luaL_callmeta(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r1=_lua_absindex(r5,r1);if((_luaL_getmetafield(r5,r1,r3)|0)!=0){_lua_pushvalue(r5,r1);_lua_callk(r5,1,1,0,0);r6=1;r7=r6;STACKTOP=r4;return r7}else{r6=0;r7=r6;STACKTOP=r4;return r7}}function _luaL_len(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r1;_lua_len(r6,r2);r2=_lua_tointegerx(r6,-1,r5);if((HEAP32[r5>>2]|0)!=0){r7=r6;_lua_settop(r7,-2);r8=r2;STACKTOP=r4;return r8}_luaL_error(r6,6656,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;r7=r6;_lua_settop(r7,-2);r8=r2;STACKTOP=r4;return r8}function _luaL_tolstring(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;if((_luaL_callmeta(r6,r1,6488)|0)!=0){r7=r6;r8=r2;r9=_lua_tolstring(r7,-1,r8);STACKTOP=r5;return r9}r3=_lua_type(r6,r1);if((r3|0)==3|(r3|0)==4){_lua_pushvalue(r6,r1)}else if((r3|0)==0){_lua_pushlstring(r6,6144,3)}else if((r3|0)==1){r3=(_lua_toboolean(r6,r1)|0)!=0;_lua_pushstring(r6,r3?6320:6232)}else{r3=_lua_typename(r6,_lua_type(r6,r1));r10=_lua_topointer(r6,r1);_lua_pushfstring(r6,6e3,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r3,HEAP32[r4+8>>2]=r10,r4));STACKTOP=r4}r7=r6;r8=r2;r9=_lua_tolstring(r7,-1,r8);STACKTOP=r5;return r9}function _luaL_setfuncs(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;r1=r2;r2=r3;_luaL_checkversion_(r5,502);_luaL_checkstack(r5,r2,5904);while(1){if((HEAP32[r1>>2]|0)==0){break}r3=0;while(1){if((r3|0)>=(r2|0)){break}_lua_pushvalue(r5,-r2|0);r3=r3+1|0}_lua_pushcclosure(r5,HEAP32[r1+4>>2],r2);_lua_setfield(r5,-(r2+2|0)|0,HEAP32[r1>>2]);r1=r1+8|0}_lua_settop(r5,-r2-1|0);STACKTOP=r4;return}function _luaL_checkversion_(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=_lua_version(r5);if((r2|0)!=(_lua_version(0)|0)){_luaL_error(r5,5616,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3}else{if(HEAPF64[r2>>3]!=r1){r6=HEAPF64[r2>>3];_luaL_error(r5,5424,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAPF64[r3>>3]=r1,HEAPF64[r3+8>>3]=r6,r3));STACKTOP=r3}}_lua_pushnumber(r5,-4660);do{if((_lua_tointegerx(r5,-1,0)|0)==-4660){if((_lua_tounsignedx(r5,-1,0)|0)!=-4660){break}r7=r5;_lua_settop(r7,-2);STACKTOP=r4;return}}while(0);_luaL_error(r5,5224,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;r7=r5;_lua_settop(r7,-2);STACKTOP=r4;return}function _luaL_getsubtable(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;_lua_getfield(r5,r1,r2);if((_lua_type(r5,-1)|0)==5){r6=1;r7=r6;STACKTOP=r4;return r7}else{_lua_settop(r5,-2);r1=_lua_absindex(r5,r1);_lua_createtable(r5,0,0);_lua_pushvalue(r5,-1);_lua_setfield(r5,r1,r2);r6=0;r7=r6;STACKTOP=r4;return r7}}function _luaL_requiref(r1,r2,r3,r4){var r5,r6;r5=STACKTOP;r6=r1;r1=r2;_lua_pushcclosure(r6,r3,0);_lua_pushstring(r6,r1);_lua_callk(r6,1,1,0,0);_luaL_getsubtable(r6,-1001e3,5752);_lua_pushvalue(r6,-2);_lua_setfield(r6,-2,r1);_lua_settop(r6,-2);if((r4|0)==0){STACKTOP=r5;return}_lua_pushvalue(r6,-1);_lua_setglobal(r6,r1);STACKTOP=r5;return}function _luaL_gsub(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=STACKTOP;STACKTOP=STACKTOP+1040|0;r6=r5;r7=r1;r1=r2;r2=r3;r3=r4;r4=_strlen(r2);_luaL_buffinit(r7,r6);while(1){r8=_strstr(r1,r2);r9=r8;if((r8|0)==0){break}_luaL_addlstring(r6,r1,r9-r1|0);_luaL_addstring(r6,r3);r1=r9+r4|0}_luaL_addstring(r6,r1);_luaL_pushresult(r6);r6=_lua_tolstring(r7,-1,0);STACKTOP=r5;return r6}function _luaL_newstate(){var r1,r2,r3;r1=STACKTOP;r2=_lua_newstate(192,0);if((r2|0)==0){r3=r2;STACKTOP=r1;return r3}_lua_atpanic(r2,96);r3=r2;STACKTOP=r1;return r3}function _l_alloc(r1,r2,r3,r4){var r5,r6;r3=STACKTOP;r1=r2;r2=r4;if((r2|0)==0){_free(r1);r5=0;r6=r5;STACKTOP=r3;return r6}else{r5=_realloc(r1,r2);r6=r5;STACKTOP=r3;return r6}}function _panic(r1){var r2,r3,r4,r5;r2=0;r3=STACKTOP;r4=HEAP32[_stderr>>2];r5=_lua_tolstring(r1,-1,0);_fprintf(r4,5112,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r5,r2));STACKTOP=r2;_fflush(HEAP32[_stderr>>2]);STACKTOP=r3;return 0}function _skipBOM(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=0;r3=STACKTOP;r4=r1;r1=5032;HEAP32[r4>>2]=0;while(1){r5=_fgetc(HEAP32[r4+4>>2]);if((r5|0)==-1){r2=4;break}r6=r1;r1=r6+1|0;if((r5|0)!=(HEAPU8[r6]|0)){r2=4;break}r6=r4|0;r7=HEAP32[r6>>2];HEAP32[r6>>2]=r7+1;HEAP8[r4+8+r7|0]=r5;if((HEAP8[r1]|0)==0){r2=7;break}}if(r2==4){r8=r5;r9=r8;STACKTOP=r3;return r9}else if(r2==7){HEAP32[r4>>2]=0;r8=_fgetc(HEAP32[r4+4>>2]);r9=r8;STACKTOP=r3;return r9}}function _findfield(r1,r2,r3){var r4,r5,r6,r7,r8;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;do{if((r2|0)!=0){if((_lua_type(r6,-1)|0)!=5){break}_lua_pushnil(r6);while(1){if((_lua_next(r6,-2)|0)==0){r4=14;break}if((_lua_type(r6,-2)|0)==4){if((_lua_rawequal(r6,r1,-1)|0)!=0){r4=8;break}if((_findfield(r6,r1,r2-1|0)|0)!=0){r4=10;break}}_lua_settop(r6,-2)}if(r4==8){_lua_settop(r6,-2);r7=1;r8=r7;STACKTOP=r5;return r8}else if(r4==10){_lua_remove(r6,-2);_lua_pushlstring(r6,4608,1);_lua_insert(r6,-2);_lua_concat(r6,3);r7=1;r8=r7;STACKTOP=r5;return r8}else if(r4==14){r7=0;r8=r7;STACKTOP=r5;return r8}}}while(0);r7=0;r8=r7;STACKTOP=r5;return r8}function _luaopen_base(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_rawgeti(r3,-1001e3,2);_lua_rawgeti(r3,-1001e3,2);_lua_setfield(r3,-2,5760);_luaL_setfuncs(r3,2352,0);_lua_pushlstring(r3,10784,7);_lua_setfield(r3,-2,8512);STACKTOP=r2;return 1}function _luaB_assert(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=STACKTOP;r4=r1;if((_lua_toboolean(r4,1)|0)!=0){r5=_lua_gettop(r4);r6=r5;STACKTOP=r3;return r6}else{r1=_luaL_optlstring(r4,2,4032,0);r7=_luaL_error(r4,4096,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r1,r2));STACKTOP=r2;r5=r7;r6=r5;STACKTOP=r3;return r6}}function _luaB_collectgarbage(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;r3=r1;r1=1488+(_luaL_checkoption(r3,1,5016,1536)<<2)|0;r4=HEAP32[r1>>2];r1=_lua_gc(r3,r4,_luaL_optinteger(r3,2,0));r5=r4;if((r5|0)==5|(r5|0)==9){_lua_pushboolean(r3,r1);r6=1;r7=r6;STACKTOP=r2;return r7}else if((r5|0)==3){r5=_lua_gc(r3,4,0);_lua_pushnumber(r3,(r1|0)+(r5|0)/1024);_lua_pushinteger(r3,r5);r6=2;r7=r6;STACKTOP=r2;return r7}else{_lua_pushinteger(r3,r1);r6=1;r7=r6;STACKTOP=r2;return r7}}function _luaB_dofile(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_optlstring(r3,1,0,0);_lua_settop(r3,1);if((_luaL_loadfilex(r3,r1,0)|0)!=0){_lua_error(r3)}_lua_callk(r3,0,-1,0,194);r1=_dofilecont(r3);STACKTOP=r2;return r1}function _luaB_error(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_optinteger(r3,2,1);_lua_settop(r3,1);do{if((_lua_isstring(r3,1)|0)!=0){if((r1|0)<=0){break}_luaL_where(r3,r1);_lua_pushvalue(r3,1);_lua_concat(r3,2)}}while(0);r1=_lua_error(r3);STACKTOP=r2;return r1}function _luaB_getmetatable(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;_luaL_checkany(r3,1);if((_lua_getmetatable(r3,1)|0)!=0){_luaL_getmetafield(r3,1,7264);r4=1;r5=r4;STACKTOP=r2;return r5}else{_lua_pushnil(r3);r4=1;r5=r4;STACKTOP=r2;return r5}}function _luaB_ipairs(r1){var r2,r3;r2=STACKTOP;r3=_pairsmeta(r1,5408,1,178);STACKTOP=r2;return r3}function _luaB_loadfile(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;r1=_luaL_optlstring(r3,1,0,0);r4=_luaL_optlstring(r3,2,0,0);r5=((_lua_type(r3,3)|0)==-1^1)&1;r6=_luaL_loadfilex(r3,r1,r4);do{if((r6|0)==0){if((r5|0)==0){break}_lua_pushvalue(r3,3);_lua_setupvalue(r3,-2,1)}}while(0);r5=_load_aux(r3,r6);STACKTOP=r2;return r5}function _luaB_load(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r1=_lua_gettop(r4);r5=_lua_tolstring(r4,1,r3);r6=_luaL_optlstring(r4,3,5992,0);if((r5|0)!=0){r7=_luaL_optlstring(r4,2,r5,0);r8=_luaL_loadbufferx(r4,r5,HEAP32[r3>>2],r7,r6)}else{r7=_luaL_optlstring(r4,2,5896,0);_luaL_checktype(r4,1,6);_lua_settop(r4,5);r8=_lua_load(r4,350,0,r7,r6)}if((r8|0)!=0){r9=r4;r10=r8;r11=_load_aux(r9,r10);STACKTOP=r2;return r11}if((r1|0)<4){r9=r4;r10=r8;r11=_load_aux(r9,r10);STACKTOP=r2;return r11}_lua_pushvalue(r4,4);_lua_setupvalue(r4,-2,1);r9=r4;r10=r8;r11=_load_aux(r9,r10);STACKTOP=r2;return r11}function _luaB_next(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;_luaL_checktype(r3,1,5);_lua_settop(r3,2);if((_lua_next(r3,1)|0)!=0){r4=2;r5=r4;STACKTOP=r2;return r5}else{_lua_pushnil(r3);r4=1;r5=r4;STACKTOP=r2;return r5}}function _luaB_pairs(r1){var r2,r3;r2=STACKTOP;r3=_pairsmeta(r1,6136,0,28);STACKTOP=r2;return r3}function _luaB_pcall(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checkany(r3,1);_lua_pushnil(r3);_lua_insert(r3,1);r1=_finishpcall(r3,(_lua_pcallk(r3,_lua_gettop(r3)-2|0,-1,0,0,26)|0)==0|0);STACKTOP=r2;return r1}function _luaB_print(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=0;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r1;r1=_lua_gettop(r6);_lua_getglobal(r6,8920);r7=1;while(1){if((r7|0)>(r1|0)){r2=9;break}_lua_pushvalue(r6,-1);_lua_pushvalue(r6,r7);_lua_callk(r6,1,1,0,0);r8=_lua_tolstring(r6,-1,r5);if((r8|0)==0){r2=4;break}if((r7|0)>1){_fwrite(6304,1,1,HEAP32[_stdout>>2])}_fwrite(r8,1,HEAP32[r5>>2],HEAP32[_stdout>>2]);_lua_settop(r6,-2);r7=r7+1|0}if(r2==4){r7=_luaL_error(r6,6440,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;r9=r7;r10=r9;STACKTOP=r4;return r10}else if(r2==9){_fwrite(6224,1,1,HEAP32[_stdout>>2]);_fflush(HEAP32[_stdout>>2]);r9=0;r10=r9;STACKTOP=r4;return r10}}function _luaB_rawequal(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checkany(r3,1);_luaL_checkany(r3,2);_lua_pushboolean(r3,_lua_rawequal(r3,1,2));STACKTOP=r2;return 1}function _luaB_rawlen(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_lua_type(r3,1);do{if((r1|0)==5){r4=1}else{if((r1|0)==4){r4=1;break}r4=(_luaL_argerror(r3,1,6624)|0)!=0}}while(0);_lua_pushinteger(r3,_lua_rawlen(r3,1));STACKTOP=r2;return 1}function _luaB_rawget(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checktype(r3,1,5);_luaL_checkany(r3,2);_lua_settop(r3,2);_lua_rawget(r3,1);STACKTOP=r2;return 1}function _luaB_rawset(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checktype(r3,1,5);_luaL_checkany(r3,2);_luaL_checkany(r3,3);_lua_settop(r3,3);_lua_rawset(r3,1);STACKTOP=r2;return 1}function _luaB_select(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;r3=r1;r1=_lua_gettop(r3);do{if((_lua_type(r3,1)|0)==4){r4=_lua_tolstring(r3,1,0);if((HEAP8[r4]|0)!=35){break}_lua_pushinteger(r3,r1-1|0);r5=1;r6=r5;STACKTOP=r2;return r6}}while(0);r4=_luaL_checkinteger(r3,1);if((r4|0)<0){r4=r1+r4|0}else{if((r4|0)>(r1|0)){r4=r1}}if(1<=(r4|0)){r7=1}else{r7=(_luaL_argerror(r3,1,6880)|0)!=0}r5=r1-r4|0;r6=r5;STACKTOP=r2;return r6}function _luaB_setmetatable(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=STACKTOP;r4=r1;r1=_lua_type(r4,2);_luaL_checktype(r4,1,5);do{if((r1|0)==0){r5=1}else{if((r1|0)==5){r5=1;break}r5=(_luaL_argerror(r4,2,7448)|0)!=0}}while(0);if((_luaL_getmetafield(r4,1,7264)|0)!=0){r5=_luaL_error(r4,7104,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r6=r5;r7=r6;STACKTOP=r3;return r7}else{_lua_settop(r4,2);_lua_setmetatable(r4,1);r6=1;r7=r6;STACKTOP=r3;return r7}}function _luaB_tonumber(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=r3+8;r6=r1;do{if((_lua_type(r6,2)|0)<=0){r1=_lua_tonumberx(r6,1,r4);if((HEAP32[r4>>2]|0)==0){_luaL_checkany(r6,1);break}_lua_pushnumber(r6,r1);r7=1;r8=r7;STACKTOP=r3;return r8}else{r1=_luaL_checklstring(r6,1,r5);r9=r1+HEAP32[r5>>2]|0;r10=_luaL_checkinteger(r6,2);r11=0;if(2<=(r10|0)){if((r10|0)<=36){r12=1}else{r2=7}}else{r2=7}if(r2==7){r12=(_luaL_argerror(r6,2,7768)|0)!=0}r1=r1+_strspn(r1,7616)|0;if((HEAP8[r1]|0)==45){r1=r1+1|0;r11=1}else{if((HEAP8[r1]|0)==43){r1=r1+1|0}}do{if((_isalnum(HEAPU8[r1])|0)!=0){r13=0;while(1){if((_isdigit(HEAPU8[r1])|0)!=0){r14=HEAP8[r1]-48|0}else{r14=_toupper(HEAPU8[r1])-65+10|0}r15=r14;if((r15|0)>=(r10|0)){r2=19;break}r13=r13*(r10|0)+(r15|0);r1=r1+1|0;if((_isalnum(HEAPU8[r1])|0)==0){break}}r1=r1+_strspn(r1,7616)|0;if((r1|0)!=(r9|0)){break}if((r11|0)!=0){r16=-0-r13}else{r16=r13}_lua_pushnumber(r6,r16);r7=1;r8=r7;STACKTOP=r3;return r8}}while(0)}}while(0);_lua_pushnil(r6);r7=1;r8=r7;STACKTOP=r3;return r8}function _luaB_tostring(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checkany(r3,1);_luaL_tolstring(r3,1,0);STACKTOP=r2;return 1}function _luaB_type(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checkany(r3,1);_lua_pushstring(r3,_lua_typename(r3,_lua_type(r3,1)));STACKTOP=r2;return 1}function _luaB_xpcall(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_lua_gettop(r3);if((r1|0)>=2){r4=1}else{r4=(_luaL_argerror(r3,2,8224)|0)!=0}_lua_pushvalue(r3,1);_lua_copy(r3,2,1);_lua_replace(r3,2);r4=_finishpcall(r3,(_lua_pcallk(r3,r1-2|0,-1,1,0,26)|0)==0|0);STACKTOP=r2;return r4}function _pcallcont(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_finishpcall(r3,(_lua_getctx(r3,0)|0)==1|0);STACKTOP=r2;return r1}function _finishpcall(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;if((_lua_checkstack(r4,1)|0)!=0){_lua_pushboolean(r4,r2);_lua_replace(r4,1);r5=_lua_gettop(r4);r6=r5;STACKTOP=r3;return r6}else{_lua_settop(r4,0);_lua_pushboolean(r4,0);_lua_pushstring(r4,8032);r5=2;r6=r5;STACKTOP=r3;return r6}}function _pairsmeta(r1,r2,r3,r4){var r5,r6;r5=STACKTOP;r6=r1;if((_luaL_getmetafield(r6,1,r2)|0)!=0){_lua_pushvalue(r6,1);_lua_callk(r6,1,3,0,0);STACKTOP=r5;return 3}_luaL_checktype(r6,1,5);_lua_pushcclosure(r6,r4,0);_lua_pushvalue(r6,1);if((r3|0)!=0){_lua_pushinteger(r6,0)}else{_lua_pushnil(r6)}STACKTOP=r5;return 3}function _generic_reader(r1,r2,r3){var r4,r5,r6,r7;r2=0;r4=STACKTOP;r5=r1;r1=r3;_luaL_checkstack(r5,2,5720);_lua_pushvalue(r5,1);_lua_callk(r5,0,1,0,0);if((_lua_type(r5,-1)|0)==0){_lua_settop(r5,-2);HEAP32[r1>>2]=0;r6=0;r7=r6;STACKTOP=r4;return r7}if((_lua_isstring(r5,-1)|0)==0){_luaL_error(r5,5576,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2}_lua_replace(r5,5);r6=_lua_tolstring(r5,5,r1);r7=r6;STACKTOP=r4;return r7}function _load_aux(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;if((r2|0)==0){r5=1;r6=r5;STACKTOP=r3;return r6}else{_lua_pushnil(r4);_lua_insert(r4,-2);r5=2;r6=r5;STACKTOP=r3;return r6}}function _ipairsaux(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_checkinteger(r3,2);_luaL_checktype(r3,1,5);r1=r1+1|0;_lua_pushinteger(r3,r1);_lua_rawgeti(r3,1,r1);r1=(_lua_type(r3,-1)|0)==0;STACKTOP=r2;return r1?1:2}function _dofilecont(r1){var r2,r3;r2=STACKTOP;r3=_lua_gettop(r1)-1|0;STACKTOP=r2;return r3}function _luaopen_bit32(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_createtable(r3,0,12);_luaL_setfuncs(r3,2248,0);STACKTOP=r2;return 1}function _b_arshift(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;r1=_luaL_checkunsigned(r3,1);r4=_luaL_checkinteger(r3,2);do{if((r4|0)>=0){if((r1&-2147483648|0)==0){break}if((r4|0)>=32){r1=-1}else{r1=r1>>>(r4>>>0)|~(-1>>>(r4>>>0))}_lua_pushunsigned(r3,r1);r5=1;r6=r5;STACKTOP=r2;return r6}}while(0);r5=_b_shift(r3,r1,-r4|0);r6=r5;STACKTOP=r2;return r6}function _b_and(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushunsigned(r3,_andaux(r3));STACKTOP=r2;return 1}function _b_not(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushunsigned(r3,~_luaL_checkunsigned(r3,1));STACKTOP=r2;return 1}function _b_or(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=_lua_gettop(r3);r4=0;r5=1;while(1){if((r5|0)>(r1|0)){break}r4=r4|_luaL_checkunsigned(r3,r5);r5=r5+1|0}_lua_pushunsigned(r3,r4);STACKTOP=r2;return 1}function _b_xor(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=_lua_gettop(r3);r4=0;r5=1;while(1){if((r5|0)>(r1|0)){break}r4=r4^_luaL_checkunsigned(r3,r5);r5=r5+1|0}_lua_pushunsigned(r3,r4);STACKTOP=r2;return 1}function _b_test(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushboolean(r3,(_andaux(r3)|0)!=0|0);STACKTOP=r2;return 1}function _b_extract(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r1=_luaL_checkunsigned(r4,1);r5=r1>>>(_fieldargs(r4,2,r3)>>>0);r1=r5&~(-2<<HEAP32[r3>>2]-1);_lua_pushunsigned(r4,r1);STACKTOP=r2;return 1}function _b_lrot(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_b_rot(r3,_luaL_checkinteger(r3,2));STACKTOP=r2;return r1}function _b_lshift(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_luaL_checkunsigned(r3,1);r4=_b_shift(r3,r1,_luaL_checkinteger(r3,2));STACKTOP=r2;return r4}function _b_replace(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r1=_luaL_checkunsigned(r4,1);r5=_luaL_checkunsigned(r4,2);r6=_fieldargs(r4,3,r3);r7=~(-2<<HEAP32[r3>>2]-1);r5=r5&r7;r1=r1&~(r7<<r6)|r5<<r6;_lua_pushunsigned(r4,r1);STACKTOP=r2;return 1}function _b_rrot(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_b_rot(r3,-_luaL_checkinteger(r3,2)|0);STACKTOP=r2;return r1}function _b_rshift(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_luaL_checkunsigned(r3,1);r4=_b_shift(r3,r1,-_luaL_checkinteger(r3,2)|0);STACKTOP=r2;return r4}function _b_shift(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((r2|0)<0){r2=-r2|0;r1=r1;if((r2|0)>=32){r1=0}else{r1=r1>>>(r2>>>0)}r6=r5;r7=r1;_lua_pushunsigned(r6,r7);STACKTOP=r4;return 1}else{if((r2|0)>=32){r1=0}else{r1=r1<<r2}r1=r1;r6=r5;r7=r1;_lua_pushunsigned(r6,r7);STACKTOP=r4;return 1}}function _b_rot(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;r2=_luaL_checkunsigned(r4,1);r1=r1&31;r2=r2;r2=r2<<r1|r2>>>((32-r1|0)>>>0);_lua_pushunsigned(r4,r2);STACKTOP=r3;return 1}function _fieldargs(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=_luaL_checkinteger(r6,r1);r7=_luaL_optinteger(r6,r1+1|0,1);if(0<=(r3|0)){r8=1}else{r8=(_luaL_argerror(r6,r1,11176)|0)!=0}if(0<(r7|0)){r9=1}else{r9=(_luaL_argerror(r6,r1+1|0,10904)|0)!=0}if((r3+r7|0)<=32){r10=r7;r11=r2;HEAP32[r11>>2]=r10;r12=r3;STACKTOP=r5;return r12}_luaL_error(r6,10704,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r10=r7;r11=r2;HEAP32[r11>>2]=r10;r12=r3;STACKTOP=r5;return r12}function _andaux(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=_lua_gettop(r3);r4=-1;r5=1;while(1){if((r5|0)>(r1|0)){break}r4=r4&_luaL_checkunsigned(r3,r5);r5=r5+1|0}STACKTOP=r2;return r4}function _luaopen_coroutine(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_createtable(r3,0,6);_luaL_setfuncs(r3,2184,0);STACKTOP=r2;return 1}function _luaB_cocreate(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checktype(r3,1,6);r1=_lua_newthread(r3);_lua_pushvalue(r3,1);_lua_xmove(r3,r1,1);STACKTOP=r2;return 1}function _luaB_coresume(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;r1=_lua_tothread(r3,1);if((r1|0)!=0){r4=1}else{r4=(_luaL_argerror(r3,1,2640)|0)!=0}r4=_auxresume(r3,r1,_lua_gettop(r3)-1|0);if((r4|0)<0){_lua_pushboolean(r3,0);_lua_insert(r3,-2);r5=2;r6=r5;STACKTOP=r2;return r6}else{_lua_pushboolean(r3,1);_lua_insert(r3,-(r4+1|0)|0);r5=r4+1|0;r6=r5;STACKTOP=r2;return r6}}function _luaB_corunning(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushboolean(r3,_lua_pushthread(r3));STACKTOP=r2;return 2}function _luaB_costatus(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+104|0;r3=r2;r4=r1;r1=_lua_tothread(r4,1);if((r1|0)!=0){r5=1}else{r5=(_luaL_argerror(r4,1,2640)|0)!=0}if((r4|0)==(r1|0)){_lua_pushlstring(r4,8336,7);STACKTOP=r2;return 1}r5=_lua_status(r1);if((r5|0)==1){_lua_pushlstring(r4,11896,9)}else if((r5|0)==0){if((_lua_getstack(r1,0,r3)|0)>0){_lua_pushlstring(r4,11520,6)}else{if((_lua_gettop(r1)|0)==0){_lua_pushlstring(r4,11168,4)}else{_lua_pushlstring(r4,11896,9)}}}else{_lua_pushlstring(r4,11168,4)}STACKTOP=r2;return 1}function _luaB_cowrap(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaB_cocreate(r3);_lua_pushcclosure(r3,76,1);STACKTOP=r2;return 1}function _luaB_yield(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_lua_yieldk(r3,_lua_gettop(r3),0,0);STACKTOP=r2;return r1}function _luaB_auxwrap(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=_lua_tothread(r3,-1001001);r4=_auxresume(r3,r1,_lua_gettop(r3));if((r4|0)>=0){r5=r4;STACKTOP=r2;return r5}if((_lua_isstring(r3,-1)|0)!=0){_luaL_where(r3,1);_lua_insert(r3,-2);_lua_concat(r3,2)}_lua_error(r3);r5=r4;STACKTOP=r2;return r5}function _auxresume(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((_lua_checkstack(r1,r2)|0)==0){_lua_pushlstring(r5,3736,28);r6=-1;r7=r6;STACKTOP=r4;return r7}do{if((_lua_status(r1)|0)==0){if((_lua_gettop(r1)|0)!=0){break}_lua_pushlstring(r5,3248,28);r6=-1;r7=r6;STACKTOP=r4;return r7}}while(0);_lua_xmove(r5,r1,r2);r3=_lua_resume(r1,r5,r2);do{if((r3|0)!=0){if((r3|0)==1){break}_lua_xmove(r1,r5,1);r6=-1;r7=r6;STACKTOP=r4;return r7}}while(0);r3=_lua_gettop(r1);if((_lua_checkstack(r5,r3+1|0)|0)!=0){_lua_xmove(r1,r5,r3);r6=r3;r7=r6;STACKTOP=r4;return r7}else{_lua_settop(r1,-r3-1|0);_lua_pushlstring(r5,2904,26);r6=-1;r7=r6;STACKTOP=r4;return r7}}function _luaopen_debug(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_createtable(r3,0,16);_luaL_setfuncs(r3,2024,0);STACKTOP=r2;return 1}function _db_debug(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+256|0;r5=r4;r6=r1;while(1){_fprintf(HEAP32[_stderr>>2],4584,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=4440,r3));STACKTOP=r3;_fflush(HEAP32[_stderr>>2]);if((_fgets(r5|0,250,HEAP32[_stdin>>2])|0)==0){r2=4;break}if((_strcmp(r5|0,4304)|0)==0){r2=4;break}if((_luaL_loadbufferx(r6,r5|0,_strlen(r5|0),4216,0)|0)!=0){r2=7}else{if((_lua_pcallk(r6,0,0,0,0,0)|0)!=0){r2=7}}if(r2==7){r2=0;r1=HEAP32[_stderr>>2];r7=_lua_tolstring(r6,-1,0);_fprintf(r1,4120,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r7,r3));STACKTOP=r3;_fflush(HEAP32[_stderr>>2])}_lua_settop(r6,0)}if(r2==4){STACKTOP=r4;return 0}}function _db_getuservalue(r1){var r2,r3;r2=STACKTOP;r3=r1;if((_lua_type(r3,1)|0)!=7){_lua_pushnil(r3);STACKTOP=r2;return 1}else{_lua_getuservalue(r3,1);STACKTOP=r2;return 1}}function _db_gethook(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3+8;r5=r1;r1=_getthread(r5,r3);r6=_lua_gethookmask(r1);r7=_lua_gethook(r1);do{if((r7|0)!=0){if((r7|0)==146){r2=4;break}_lua_pushlstring(r5,4672,13)}else{r2=4}}while(0);if(r2==4){_luaL_getsubtable(r5,-1001e3,9824);_lua_pushthread(r1);_lua_xmove(r1,r5,1);_lua_rawget(r5,-2);_lua_remove(r5,-2)}_lua_pushstring(r5,_unmakemask(r6,r4|0));_lua_pushinteger(r5,_lua_gethookcount(r1));STACKTOP=r3;return 3}function _db_getinfo(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+112|0;r4=r3;r5=r3+104;r6=r1;r1=_getthread(r6,r5);r7=_luaL_optlstring(r6,HEAP32[r5>>2]+2|0,7256,0);do{if((_lua_isnumber(r6,HEAP32[r5>>2]+1|0)|0)!=0){if((_lua_getstack(r1,_lua_tointegerx(r6,HEAP32[r5>>2]+1|0,0),r4)|0)!=0){break}_lua_pushnil(r6);r8=1;r9=r8;STACKTOP=r3;return r9}else{if((_lua_type(r6,HEAP32[r5>>2]+1|0)|0)==6){_lua_pushfstring(r6,7096,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r7,r2));STACKTOP=r2;r7=_lua_tolstring(r6,-1,0);_lua_pushvalue(r6,HEAP32[r5>>2]+1|0);_lua_xmove(r6,r1,1);break}else{r8=_luaL_argerror(r6,HEAP32[r5>>2]+1|0,6848);r9=r8;STACKTOP=r3;return r9}}}while(0);if((_lua_getinfo(r1,r7,r4)|0)==0){r8=_luaL_argerror(r6,HEAP32[r5>>2]+2|0,6600);r9=r8;STACKTOP=r3;return r9}_lua_createtable(r6,0,2);if((_strchr(r7,83)|0)!=0){_settabss(r6,6432,HEAP32[r4+16>>2]);_settabss(r6,6288,r4+36|0);_settabsi(r6,6208,HEAP32[r4+24>>2]);_settabsi(r6,6104,HEAP32[r4+28>>2]);_settabss(r6,5984,HEAP32[r4+12>>2])}if((_strchr(r7,108)|0)!=0){_settabsi(r6,5880,HEAP32[r4+20>>2])}if((_strchr(r7,117)|0)!=0){_settabsi(r6,5712,HEAPU8[r4+32|0]);_settabsi(r6,5568,HEAPU8[r4+33|0]);_settabsb(r6,5392,HEAP8[r4+34|0]|0)}if((_strchr(r7,110)|0)!=0){_settabss(r6,5200,HEAP32[r4+4>>2]);_settabss(r6,5088,HEAP32[r4+8>>2])}if((_strchr(r7,116)|0)!=0){_settabsb(r6,4992,HEAP8[r4+35|0]|0)}if((_strchr(r7,76)|0)!=0){_treatstackoption(r6,r1,4896)}if((_strchr(r7,102)|0)!=0){_treatstackoption(r6,r1,4792)}r8=1;r9=r8;STACKTOP=r3;return r9}function _db_getlocal(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+112|0;r3=r2;r4=r2+8;r5=r1;r1=_getthread(r5,r3);r6=_luaL_checkinteger(r5,HEAP32[r3>>2]+2|0);if((_lua_type(r5,HEAP32[r3>>2]+1|0)|0)==6){_lua_pushvalue(r5,HEAP32[r3>>2]+1|0);_lua_pushstring(r5,_lua_getlocal(r5,0,r6));r7=1;r8=r7;STACKTOP=r2;return r8}if((_lua_getstack(r1,_luaL_checkinteger(r5,HEAP32[r3>>2]+1|0),r4)|0)==0){r7=_luaL_argerror(r5,HEAP32[r3>>2]+1|0,10032);r8=r7;STACKTOP=r2;return r8}r3=_lua_getlocal(r1,r4,r6);if((r3|0)!=0){_lua_xmove(r1,r5,1);_lua_pushstring(r5,r3);_lua_pushvalue(r5,-2);r7=2;r8=r7;STACKTOP=r2;return r8}else{_lua_pushnil(r5);r7=1;r8=r7;STACKTOP=r2;return r8}}function _db_getregistry(r1){var r2;r2=STACKTOP;_lua_pushvalue(r1,-1001e3);STACKTOP=r2;return 1}function _db_getmetatable(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checkany(r3,1);if((_lua_getmetatable(r3,1)|0)!=0){STACKTOP=r2;return 1}_lua_pushnil(r3);STACKTOP=r2;return 1}function _db_getupvalue(r1){var r2,r3;r2=STACKTOP;r3=_auxupvalue(r1,1);STACKTOP=r2;return r3}function _db_upvaluejoin(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;r3=r1;r1=_checkupval(r3,1,2);r4=_checkupval(r3,3,4);if((_lua_iscfunction(r3,1)|0)!=0){r5=(_luaL_argerror(r3,1,7424)|0)!=0}else{r5=1}if((_lua_iscfunction(r3,3)|0)==0){r6=1;r7=r6&1;r8=r3;r9=r1;r10=r4;_lua_upvaluejoin(r8,1,r9,3,r10);STACKTOP=r2;return 0}r6=(_luaL_argerror(r3,3,7424)|0)!=0;r7=r6&1;r8=r3;r9=r1;r10=r4;_lua_upvaluejoin(r8,1,r9,3,r10);STACKTOP=r2;return 0}function _db_upvalueid(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushlightuserdata(r3,_lua_upvalueid(r3,1,_checkupval(r3,1,2)));STACKTOP=r2;return 1}function _db_setuservalue(r1){var r2,r3;r2=STACKTOP;r3=r1;if((_lua_type(r3,1)|0)==2){_luaL_argerror(r3,1,7984)}_luaL_checktype(r3,1,7);if((_lua_type(r3,2)|0)>0){_luaL_checktype(r3,2,5)}_lua_settop(r3,2);_lua_setuservalue(r3,1);STACKTOP=r2;return 1}function _db_sethook(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r1=_getthread(r4,r3);if((_lua_type(r4,HEAP32[r3>>2]+1|0)|0)<=0){_lua_settop(r4,HEAP32[r3>>2]+1|0);r5=0;r6=0;r7=0}else{r8=_luaL_checklstring(r4,HEAP32[r3>>2]+2|0,0);_luaL_checktype(r4,HEAP32[r3>>2]+1|0,6);r7=_luaL_optinteger(r4,HEAP32[r3>>2]+3|0,0);r5=146;r6=_makemask(r8,r7)}if((_luaL_getsubtable(r4,-1001e3,9824)|0)==0){_lua_pushstring(r4,9616);_lua_setfield(r4,-2,9360);_lua_pushvalue(r4,-1);_lua_setmetatable(r4,-2)}_lua_pushthread(r1);_lua_xmove(r1,r4,1);_lua_pushvalue(r4,HEAP32[r3>>2]+1|0);_lua_rawset(r4,-3);_lua_sethook(r1,r5,r6,r7);STACKTOP=r2;return 0}function _db_setlocal(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;STACKTOP=STACKTOP+112|0;r3=r2;r4=r2+8;r5=r1;r1=_getthread(r5,r3);if((_lua_getstack(r1,_luaL_checkinteger(r5,HEAP32[r3>>2]+1|0),r4)|0)!=0){_luaL_checkany(r5,HEAP32[r3>>2]+3|0);_lua_settop(r5,HEAP32[r3>>2]+3|0);_lua_xmove(r5,r1,1);_lua_pushstring(r5,_lua_setlocal(r1,r4,_luaL_checkinteger(r5,HEAP32[r3>>2]+2|0)));r6=1;r7=r6;STACKTOP=r2;return r7}else{r6=_luaL_argerror(r5,HEAP32[r3>>2]+1|0,10032);r7=r6;STACKTOP=r2;return r7}}function _db_setmetatable(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_lua_type(r3,2);do{if((r1|0)==0){r4=1}else{if((r1|0)==5){r4=1;break}r4=(_luaL_argerror(r3,2,10256)|0)!=0}}while(0);_lua_settop(r3,2);_lua_setmetatable(r3,1);STACKTOP=r2;return 1}function _db_setupvalue(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checkany(r3,3);r1=_auxupvalue(r3,0);STACKTOP=r2;return r1}function _db_traceback(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r1=_getthread(r4,r3);r5=_lua_tolstring(r4,HEAP32[r3>>2]+1|0,0);do{if((r5|0)==0){if((_lua_type(r4,HEAP32[r3>>2]+1|0)|0)<=0){break}_lua_pushvalue(r4,HEAP32[r3>>2]+1|0);STACKTOP=r2;return 1}}while(0);_luaL_traceback(r4,r1,r5,_luaL_optinteger(r4,HEAP32[r3>>2]+2|0,(r4|0)==(r1|0)?1:0));STACKTOP=r2;return 1}function _getthread(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;if((_lua_type(r4,1)|0)==8){HEAP32[r1>>2]=1;r5=_lua_tothread(r4,1);r6=r5;STACKTOP=r3;return r6}else{HEAP32[r1>>2]=0;r5=r4;r6=r5;STACKTOP=r3;return r6}}function _auxupvalue(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;r4=r1;r1=r2;r2=_luaL_checkinteger(r4,2);_luaL_checktype(r4,1,6);if((r1|0)!=0){r5=_lua_getupvalue(r4,1,r2)}else{r5=_lua_setupvalue(r4,1,r2)}r2=r5;if((r2|0)==0){r6=0;r7=r6;STACKTOP=r3;return r7}else{_lua_pushstring(r4,r2);_lua_insert(r4,-(r1+1|0)|0);r6=r1+1|0;r7=r6;STACKTOP=r3;return r7}}function _hookf(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;_luaL_getsubtable(r4,-1001e3,9824);_lua_pushthread(r4);_lua_rawget(r4,-2);if((_lua_type(r4,-1)|0)!=6){STACKTOP=r3;return}_lua_pushstring(r4,HEAP32[1784+(HEAP32[r1>>2]<<2)>>2]);if((HEAP32[r1+20>>2]|0)>=0){_lua_pushinteger(r4,HEAP32[r1+20>>2])}else{_lua_pushnil(r4)}_lua_callk(r4,2,0,0,0);STACKTOP=r3;return}function _makemask(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=0;if((_strchr(r4,99)|0)!=0){r1=r1|1}if((_strchr(r4,114)|0)!=0){r1=r1|2}if((_strchr(r4,108)|0)!=0){r1=r1|4}if((r2|0)<=0){r5=r1;STACKTOP=r3;return r5}r1=r1|8;r5=r1;STACKTOP=r3;return r5}function _checkupval(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=STACKTOP;STACKTOP=STACKTOP+104|0;r5=r4;r6=r1;r1=r2;r2=r3;r3=_luaL_checkinteger(r6,r2);_luaL_checktype(r6,r1,6);_lua_pushvalue(r6,r1);_lua_getinfo(r6,7752,r5);do{if(1<=(r3|0)){if((r3|0)<=(HEAPU8[r5+32|0]|0)){r7=1}else{break}r8=r7&1;r9=r3;STACKTOP=r4;return r9}}while(0);r7=(_luaL_argerror(r6,r2,7592)|0)!=0;r8=r7&1;r9=r3;STACKTOP=r4;return r9}function _settabss(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;_lua_pushstring(r5,r3);_lua_setfield(r5,-2,r2);STACKTOP=r4;return}function _settabsi(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;_lua_pushinteger(r5,r3);_lua_setfield(r5,-2,r2);STACKTOP=r4;return}function _settabsb(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;_lua_pushboolean(r5,r3);_lua_setfield(r5,-2,r2);STACKTOP=r4;return}function _treatstackoption(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;r1=r2;if((r5|0)==(r1|0)){_lua_pushvalue(r5,-2);_lua_remove(r5,-3)}else{_lua_xmove(r1,r5,1)}_lua_setfield(r5,-2,r3);STACKTOP=r4;return}function _unmakemask(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=STACKTOP;r4=r1;r1=r2;r2=0;if((r4&1|0)!=0){r5=r2;r2=r5+1|0;HEAP8[r1+r5|0]=99}if((r4&2|0)!=0){r5=r2;r2=r5+1|0;HEAP8[r1+r5|0]=114}if((r4&4|0)==0){r6=r2;r7=r1;r8=r7+r6|0;HEAP8[r8]=0;r9=r1;STACKTOP=r3;return r9}r4=r2;r2=r4+1|0;HEAP8[r1+r4|0]=108;r6=r2;r7=r1;r8=r7+r6|0;HEAP8[r8]=0;r9=r1;STACKTOP=r3;return r9}function _luaopen_io(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_createtable(r3,0,11);_luaL_setfuncs(r3,1688,0);_createmeta(r3);_createstdfile(r3,HEAP32[_stdin>>2],4104,10536);_createstdfile(r3,HEAP32[_stdout>>2],8240,6312);_createstdfile(r3,HEAP32[_stderr>>2],0,5024);STACKTOP=r2;return 1}function _createmeta(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_newmetatable(r3,4024);_lua_pushvalue(r3,-1);_lua_setfield(r3,-2,3208);_luaL_setfuncs(r3,1808,0);_lua_settop(r3,-2);STACKTOP=r2;return}function _createstdfile(r1,r2,r3,r4){var r5,r6,r7,r8;r5=STACKTOP;r6=r1;r1=r3;r3=r4;r4=_newprefile(r6);HEAP32[r4>>2]=r2;HEAP32[r4+4>>2]=172;if((r1|0)==0){r7=r6;r8=r3;_lua_setfield(r7,-2,r8);STACKTOP=r5;return}_lua_pushvalue(r6,-1);_lua_setfield(r6,-1001e3,r1);r7=r6;r8=r3;_lua_setfield(r7,-2,r8);STACKTOP=r5;return}function _newprefile(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_lua_newuserdata(r3,8);HEAP32[r1+4>>2]=0;_luaL_setmetatable(r3,4024);STACKTOP=r2;return r1}function _io_noclose(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_checkudata(r3,1,4024)+4|0;HEAP32[r1>>2]=172;_lua_pushnil(r3);_lua_pushlstring(r3,3688,26);STACKTOP=r2;return 2}function _io_close(r1){var r2,r3;r2=STACKTOP;r3=r1;if((_lua_type(r3,1)|0)==-1){_lua_getfield(r3,-1001e3,8240)}_tofile(r3);r1=_aux_close(r3);STACKTOP=r2;return r1}function _f_flush(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_fileresult(r3,(_fflush(_tofile(r3))|0)==0|0,0);STACKTOP=r2;return r1}function _f_lines(r1){var r2,r3;r2=STACKTOP;r3=r1;_tofile(r3);_aux_lines(r3,0);STACKTOP=r2;return 1}function _f_read(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_g_read(r3,_tofile(r3),2);STACKTOP=r2;return r1}function _f_seek(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;r3=r1;r1=_tofile(r3);r4=_luaL_checkoption(r3,2,8200,1920);r5=_luaL_optnumber(r3,3,0);r6=r5&-1;if((r6|0)==r5){r7=1}else{r7=(_luaL_argerror(r3,3,7720)|0)!=0}r4=_fseek(r1,r6,HEAP32[1936+(r4<<2)>>2]);if((r4|0)!=0){r8=_luaL_fileresult(r3,0,0);r9=r8;STACKTOP=r2;return r9}else{_lua_pushnumber(r3,_ftell(r1)|0);r8=1;r9=r8;STACKTOP=r2;return r9}}function _f_setvbuf(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;r1=_tofile(r3);r4=_luaL_checkoption(r3,2,0,1888);r5=_luaL_optinteger(r3,3,1024);r6=_luaL_fileresult(r3,(_setvbuf(r1,0,HEAP32[1904+(r4<<2)>>2],r5)|0)==0|0,0);STACKTOP=r2;return r6}function _f_write(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_tofile(r3);_lua_pushvalue(r3,1);r4=_g_write(r3,r1,2);STACKTOP=r2;return r4}function _f_gc(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_checkudata(r3,1,4024);if((HEAP32[r1+4>>2]|0)==0){STACKTOP=r2;return 0}if((HEAP32[r1>>2]|0)==0){STACKTOP=r2;return 0}_aux_close(r3);STACKTOP=r2;return 0}function _f_tostring(r1){var r2,r3,r4;r2=0;r3=STACKTOP;r4=r1;r1=_luaL_checkudata(r4,1,4024);if((HEAP32[r1+4>>2]|0)==0){_lua_pushlstring(r4,10016,13);STACKTOP=r3;return 1}else{_lua_pushfstring(r4,9808,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r1>>2],r2));STACKTOP=r2;STACKTOP=r3;return 1}}function _aux_close(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_luaL_checkudata(r3,1,4024);r4=HEAP32[r1+4>>2];HEAP32[r1+4>>2]=0;r1=FUNCTION_TABLE[r4](r3);STACKTOP=r2;return r1}function _tofile(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=STACKTOP;r4=r1;r1=_luaL_checkudata(r4,1,4024);if((HEAP32[r1+4>>2]|0)!=0){r5=r1;r6=r5|0;r7=HEAP32[r6>>2];STACKTOP=r3;return r7}_luaL_error(r4,9328,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r5=r1;r6=r5|0;r7=HEAP32[r6>>2];STACKTOP=r3;return r7}function _g_write(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;r7=r1;r1=r2;r2=r3;r3=_lua_gettop(r7)-r2|0;r8=1;while(1){r9=r3;r3=r9-1|0;if((r9|0)==0){break}if((_lua_type(r7,r2)|0)==3){if((r8|0)!=0){r9=_lua_tonumberx(r7,r2,0);r10=_fprintf(r1,9608,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r4>>3]=r9,r4));STACKTOP=r4;r11=(r10|0)>0}else{r11=0}r8=r11&1}else{r10=_luaL_checklstring(r7,r2,r6);if((r8|0)!=0){r9=_fwrite(r10,1,HEAP32[r6>>2],r1);r12=(r9|0)==(HEAP32[r6>>2]|0)}else{r12=0}r8=r12&1}r2=r2+1|0}if((r8|0)!=0){r13=1;r14=r13;STACKTOP=r5;return r14}else{r13=_luaL_fileresult(r7,r8,0);r14=r13;STACKTOP=r5;return r14}}function _g_read(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=_lua_gettop(r6)-1|0;_clearerr(r1);do{if((r3|0)==0){r7=_read_line(r6,r1,1);r8=r2+1|0}else{_luaL_checkstack(r6,r3+20|0,7568);r7=1;r8=r2;while(1){r9=r3;r3=r9-1|0;if((r9|0)!=0){r10=(r7|0)!=0}else{r10=0}if(!r10){r4=24;break}if((_lua_type(r6,r8)|0)==3){r9=_lua_tointegerx(r6,r8,0);if((r9|0)==0){r11=_test_eof(r6,r1)}else{r11=_read_chars(r6,r1,r9)}r7=r11}else{r9=_lua_tolstring(r6,r8,0);if((r9|0)!=0){if((HEAP8[r9|0]|0)==42){r12=1}else{r4=14}}else{r4=14}if(r4==14){r4=0;r12=(_luaL_argerror(r6,r8,7408)|0)!=0}r13=HEAP8[r9+1|0]|0;if((r13|0)==110){r7=_read_number(r6,r1)}else if((r13|0)==108){r7=_read_line(r6,r1,1)}else if((r13|0)==76){r7=_read_line(r6,r1,0)}else if((r13|0)==97){_read_all(r6,r1);r7=1}else{break}}r8=r8+1|0}if(r4==24){break}r14=_luaL_argerror(r6,r8,7240);r15=r14;STACKTOP=r5;return r15}}while(0);if((_ferror(r1)|0)!=0){r14=_luaL_fileresult(r6,0,0);r15=r14;STACKTOP=r5;return r15}if((r7|0)==0){_lua_settop(r6,-2);_lua_pushnil(r6)}r14=r8-r2|0;r15=r14;STACKTOP=r5;return r15}function _read_line(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1040|0;r6=r5;r7=r1;r1=r2;r2=r3;_luaL_buffinit(r7,r6);while(1){r3=_luaL_prepbuffsize(r6,1024);if((_fgets(r3,1024,r1)|0)==0){r4=3;break}r8=_strlen(r3);if((r8|0)!=0){if((HEAP8[r3+(r8-1)|0]|0)==10){r4=7;break}}r3=r6+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+r8}if(r4==3){_luaL_pushresult(r6);r9=_lua_rawlen(r7,-1)>>>0>0|0;r10=r9;STACKTOP=r5;return r10}else if(r4==7){r4=r6+8|0;HEAP32[r4>>2]=HEAP32[r4>>2]+(r8-r2);_luaL_pushresult(r6);r9=1;r10=r9;STACKTOP=r5;return r10}}function _test_eof(r1,r2){var r3,r4;r3=STACKTOP;r4=r2;r2=_fgetc(r4);_ungetc(r2,r4);_lua_pushlstring(r1,0,0);STACKTOP=r3;return(r2|0)!=-1|0}function _read_chars(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;STACKTOP=STACKTOP+1040|0;r5=r4;r6=r3;_luaL_buffinit(r1,r5);r1=_fread(_luaL_prepbuffsize(r5,r6),1,r6,r2);r2=r5+8|0;HEAP32[r2>>2]=HEAP32[r2>>2]+r1;_luaL_pushresult(r5);STACKTOP=r4;return r1>>>0>0|0}function _read_number(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r1;r1=_fscanf(r2,7088,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r5,r3));STACKTOP=r3;if((r1|0)==1){_lua_pushnumber(r6,HEAPF64[r5>>3]);r7=1;r8=r7;STACKTOP=r4;return r8}else{_lua_pushnil(r6);r7=0;r8=r7;STACKTOP=r4;return r8}}function _read_all(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+1040|0;r4=r3;r5=r2;r2=1024;_luaL_buffinit(r1,r4);while(1){r1=_fread(_luaL_prepbuffsize(r4,r2),1,r2,r5);r6=r4+8|0;HEAP32[r6>>2]=HEAP32[r6>>2]+r1;if(r1>>>0<r2>>>0){break}if(r2>>>0<=1073741823){r2=r2<<1}}_luaL_pushresult(r4);STACKTOP=r3;return}function _aux_lines(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=_lua_gettop(r4)-1|0;if((r1|0)<=17){r5=1}else{r5=(_luaL_argerror(r4,17,6824)|0)!=0}_lua_pushvalue(r4,1);_lua_pushinteger(r4,r1);_lua_pushboolean(r4,r2);r2=1;while(1){if((r2|0)>(r1|0)){break}_lua_pushvalue(r4,r2+1|0);r2=r2+1|0}_lua_pushcclosure(r4,166,r1+3|0);STACKTOP=r3;return}function _io_readline(r1){var r2,r3,r4,r5,r6,r7,r8;r2=0;r3=STACKTOP;r4=r1;r1=_lua_touserdata(r4,-1001001);r5=_lua_tointegerx(r4,-1001002,0);if((HEAP32[r1+4>>2]|0)==0){r6=_luaL_error(r4,6576,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r7=r6;r8=r7;STACKTOP=r3;return r8}_lua_settop(r4,1);r6=1;while(1){if((r6|0)>(r5|0)){break}_lua_pushvalue(r4,-1001e3-(r6+3)|0);r6=r6+1|0}r5=_g_read(r4,HEAP32[r1>>2],2);if((_lua_type(r4,-r5|0)|0)!=0){r7=r5;r8=r7;STACKTOP=r3;return r8}if((r5|0)>1){r1=_lua_tolstring(r4,-r5+1|0,0);r5=_luaL_error(r4,6424,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r1,r2));STACKTOP=r2;r7=r5;r8=r7;STACKTOP=r3;return r8}if((_lua_toboolean(r4,-1001003)|0)!=0){_lua_settop(r4,0);_lua_pushvalue(r4,-1001001);_aux_close(r4)}r7=0;r8=r7;STACKTOP=r3;return r8}function _io_flush(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_fileresult(r3,(_fflush(_getiofile(r3,8240))|0)==0|0,0);STACKTOP=r2;return r1}function _io_input(r1){var r2,r3;r2=STACKTOP;r3=_g_iofile(r1,4104,5080);STACKTOP=r2;return r3}function _io_lines(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;if((_lua_type(r3,1)|0)==-1){_lua_pushnil(r3)}if((_lua_type(r3,1)|0)==0){_lua_getfield(r3,-1001e3,4104);_lua_replace(r3,1);_tofile(r3);r4=0;r5=r3;r6=r4;_aux_lines(r5,r6);STACKTOP=r2;return 1}else{_opencheck(r3,_luaL_checklstring(r3,1,0),5080);_lua_replace(r3,1);r4=1;r5=r3;r6=r4;_aux_lines(r5,r6);STACKTOP=r2;return 1}}function _io_open(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=0;r3=STACKTOP;r4=r1;r1=_luaL_checklstring(r4,1,0);r5=_luaL_optlstring(r4,2,5080,0);r6=_newfile(r4);r7=0;do{if((HEAP8[r5+r7|0]|0)!=0){r8=r7;r7=r8+1|0;if((_strchr(4664,HEAP8[r5+r8|0]|0)|0)==0){break}if((HEAP8[r5+r7|0]|0)==43){r8=r7+1|0;r7=r8;if((r8|0)==0){break}}if((HEAP8[r5+r7|0]|0)==98){r8=r7+1|0;r7=r8;if((r8|0)==0){break}}if((HEAP8[r5+r7|0]|0)!=0){break}r8=_fopen(r1,r5);HEAP32[r6>>2]=r8;if((HEAP32[r6>>2]|0)==0){r9=_luaL_fileresult(r4,0,r1)}else{r9=1}r10=r9;r11=r10;STACKTOP=r3;return r11}}while(0);r9=_luaL_error(r4,4536,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r5,r2));STACKTOP=r2;r10=r9;r11=r10;STACKTOP=r3;return r11}function _io_output(r1){var r2,r3;r2=STACKTOP;r3=_g_iofile(r1,8240,4880);STACKTOP=r2;return r3}function _io_popen(r1){var r2,r3,r4,r5,r6;r2=0;r3=STACKTOP;r4=r1;r1=_luaL_checklstring(r4,1,0);_luaL_optlstring(r4,2,5080,0);r5=_newprefile(r4);_luaL_error(r4,4968,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;HEAP32[r5>>2]=0;HEAP32[r5+4>>2]=320;if((HEAP32[r5>>2]|0)==0){r6=_luaL_fileresult(r4,0,r1);STACKTOP=r3;return r6}else{r6=1;STACKTOP=r3;return r6}}function _io_read(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_g_read(r3,_getiofile(r3,4104),1);STACKTOP=r2;return r1}function _io_tmpfile(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=_newfile(r3);r4=_tmpfile();HEAP32[r1>>2]=r4;if((HEAP32[r1>>2]|0)==0){r5=_luaL_fileresult(r3,0,0);STACKTOP=r2;return r5}else{r5=1;STACKTOP=r2;return r5}}function _io_type(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checkany(r3,1);r1=_luaL_testudata(r3,1,4024);if((r1|0)==0){_lua_pushnil(r3);STACKTOP=r2;return 1}if((HEAP32[r1+4>>2]|0)==0){_lua_pushlstring(r3,5376,11)}else{_lua_pushlstring(r3,5192,4)}STACKTOP=r2;return 1}function _io_write(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_g_write(r3,_getiofile(r3,8240),1);STACKTOP=r2;return r1}function _getiofile(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1;r1=r2;_lua_getfield(r5,-1001e3,r1);r2=_lua_touserdata(r5,-1);if((HEAP32[r2+4>>2]|0)!=0){r6=r2;r7=r6|0;r8=HEAP32[r7>>2];STACKTOP=r4;return r8}_luaL_error(r5,5536,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r1+4,r3));STACKTOP=r3;r6=r2;r7=r6|0;r8=HEAP32[r7>>2];STACKTOP=r4;return r8}function _newfile(r1){var r2,r3;r2=STACKTOP;r3=_newprefile(r1);HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=284;STACKTOP=r2;return r3}function _io_fclose(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_luaL_checkudata(r3,1,4024)|0;r4=_luaL_fileresult(r3,(_fclose(HEAP32[r1>>2])|0)==0|0,0);STACKTOP=r2;return r4}function _io_pclose(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checkudata(r3,1,4024);r1=_luaL_execresult(r3,-1);STACKTOP=r2;return r1}function _g_iofile(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;if((_lua_type(r5,1)|0)<=0){r6=r5;r7=r1;_lua_getfield(r6,-1001e3,r7);STACKTOP=r4;return 1}r2=_lua_tolstring(r5,1,0);if((r2|0)!=0){_opencheck(r5,r2,r3)}else{_tofile(r5);_lua_pushvalue(r5,1)}_lua_setfield(r5,-1001e3,r1);r6=r5;r7=r1;_lua_getfield(r6,-1001e3,r7);STACKTOP=r4;return 1}function _opencheck(r1,r2,r3){var r4,r5,r6,r7;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=_newfile(r6);r7=_fopen(r1,r3);HEAP32[r2>>2]=r7;if((HEAP32[r2>>2]|0)!=0){STACKTOP=r5;return}r2=___errno_location();r7=_strerror(HEAP32[r2>>2]);_luaL_error(r6,4760,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r1,HEAP32[r4+8>>2]=r7,r4));STACKTOP=r4;STACKTOP=r5;return}function _luaopen_math(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_createtable(r3,0,27);_luaL_setfuncs(r3,408,0);_lua_pushnumber(r3,3.141592653589793);_lua_setfield(r3,-2,3952);_lua_pushnumber(r3,Infinity);_lua_setfield(r3,-2,10448);STACKTOP=r2;return 1}function _math_abs(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,Math_abs(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_acos(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,Math_acos(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_asin(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,Math_asin(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_atan2(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_checknumber(r3,1);_lua_pushnumber(r3,Math_atan2(r1,_luaL_checknumber(r3,2)));STACKTOP=r2;return 1}function _math_atan(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,Math_atan(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_ceil(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,Math_ceil(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_cosh(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,_cosh(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_cos(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,Math_cos(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_deg(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,_luaL_checknumber(r3,1)/.017453292519943295);STACKTOP=r2;return 1}function _math_exp(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,Math_exp(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_floor(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,Math_floor(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_fmod(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_checknumber(r3,1);_lua_pushnumber(r3,_fmod(r1,_luaL_checknumber(r3,2)));STACKTOP=r2;return 1}function _math_frexp(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;_lua_pushnumber(r4,_frexp(_luaL_checknumber(r4,1),r3));_lua_pushinteger(r4,HEAP32[r3>>2]);STACKTOP=r2;return 2}function _math_ldexp(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_checknumber(r3,1);_lua_pushnumber(r3,_ldexp(r1,_luaL_checkinteger(r3,2)));STACKTOP=r2;return 1}function _math_log(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;r3=r1;r1=_luaL_checknumber(r3,1);if((_lua_type(r3,2)|0)<=0){r4=Math_log(r1);r5=r3;r6=r4;_lua_pushnumber(r5,r6);STACKTOP=r2;return 1}r7=_luaL_checknumber(r3,2);if(r7==10){r4=_log10(r1)}else{r4=Math_log(r1)/Math_log(r7)}r5=r3;r6=r4;_lua_pushnumber(r5,r6);STACKTOP=r2;return 1}function _math_max(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;r1=_lua_gettop(r3);r4=_luaL_checknumber(r3,1);r5=2;while(1){if((r5|0)>(r1|0)){break}r6=_luaL_checknumber(r3,r5);if(r6>r4){r4=r6}r5=r5+1|0}_lua_pushnumber(r3,r4);STACKTOP=r2;return 1}function _math_min(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;r1=_lua_gettop(r3);r4=_luaL_checknumber(r3,1);r5=2;while(1){if((r5|0)>(r1|0)){break}r6=_luaL_checknumber(r3,r5);if(r6<r4){r4=r6}r5=r5+1|0}_lua_pushnumber(r3,r4);STACKTOP=r2;return 1}function _math_modf(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r1=_modf(_luaL_checknumber(r4,1),r3);_lua_pushnumber(r4,HEAPF64[r3>>3]);_lua_pushnumber(r4,r1);STACKTOP=r2;return 2}function _math_pow(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_checknumber(r3,1);_lua_pushnumber(r3,Math_pow(r1,_luaL_checknumber(r3,2)));STACKTOP=r2;return 1}function _math_rad(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,_luaL_checknumber(r3,1)*.017453292519943295);STACKTOP=r2;return 1}



function _math_random(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=0;r3=STACKTOP;r4=r1;r1=((_rand()|0)%2147483647&-1|0)/2147483647;r5=_lua_gettop(r4);if((r5|0)==1){r6=_luaL_checknumber(r4,1);if(1<=r6){r7=1}else{r7=(_luaL_argerror(r4,1,7384)|0)!=0}_lua_pushnumber(r4,Math_floor(r1*r6)+1)}else if((r5|0)==2){r6=_luaL_checknumber(r4,1);r7=_luaL_checknumber(r4,2);if(r6<=r7){r8=1}else{r8=(_luaL_argerror(r4,2,7384)|0)!=0}_lua_pushnumber(r4,Math_floor(r1*(r7-r6+1))+r6)}else if((r5|0)==0){_lua_pushnumber(r4,r1)}else{r1=_luaL_error(r4,7208,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r9=r1;r10=r9;STACKTOP=r3;return r10}r9=1;r10=r9;STACKTOP=r3;return r10}function _math_randomseed(r1){var r2;r2=STACKTOP;_srand(_luaL_checkunsigned(r1,1));_rand();STACKTOP=r2;return 0}function _math_sinh(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,_sinh(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_sin(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,Math_sin(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_sqrt(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,Math_sqrt(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_tanh(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,_tanh(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _math_tan(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushnumber(r3,Math_tan(_luaL_checknumber(r3,1)));STACKTOP=r2;return 1}function _luaopen_os(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_createtable(r3,0,11);_luaL_setfuncs(r3,80,0);STACKTOP=r2;return 1}function _os_clock(r1){var r2;r2=STACKTOP;_lua_pushnumber(r1,(_clock()|0)/1e6);STACKTOP=r2;return 1}function _os_date(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=STACKTOP;STACKTOP=STACKTOP+1304|0;r3=r2;r4=r2+56;r5=r2+64;r6=r2+1104;r7=r1;r1=_luaL_optlstring(r7,1,8184,0);if((_lua_type(r7,2)|0)<=0){r8=_time(0)}else{r8=_luaL_checknumber(r7,2)&-1}HEAP32[r3>>2]=r8;if((HEAP8[r1]|0)==33){r9=_gmtime(r3);r1=r1+1|0}else{r9=_localtime(r3)}if((r9|0)==0){_lua_pushnil(r7);STACKTOP=r2;return 1}if((_strcmp(r1,7952)|0)==0){_lua_createtable(r7,0,9);_setfield(r7,11096,HEAP32[r9>>2]);_setfield(r7,10840,HEAP32[r9+4>>2]);_setfield(r7,10656,HEAP32[r9+8>>2]);_setfield(r7,10480,HEAP32[r9+12>>2]);_setfield(r7,10216,HEAP32[r9+16>>2]+1|0);_setfield(r7,1e4,HEAP32[r9+20>>2]+1900|0);_setfield(r7,7704,HEAP32[r9+24>>2]+1|0);_setfield(r7,7552,HEAP32[r9+28>>2]+1|0);_setboolfield(r7,9792,HEAP32[r9+32>>2])}else{HEAP8[r4|0]=37;_luaL_buffinit(r7,r5);while(1){if((HEAP8[r1]|0)==0){break}if((HEAP8[r1]|0)!=37){if(HEAP32[r5+8>>2]>>>0<HEAP32[r5+4>>2]>>>0){r10=1}else{r10=(_luaL_prepbuffsize(r5,1)|0)!=0}r3=r1;r1=r3+1|0;r8=HEAP8[r3];r3=r5+8|0;r11=HEAP32[r3>>2];HEAP32[r3>>2]=r11+1;HEAP8[HEAP32[r5>>2]+r11|0]=r8}else{r1=_checkoption(r7,r1+1|0,r4|0);_luaL_addlstring(r5,r6|0,_strftime(r6|0,200,r4|0,r9))}}_luaL_pushresult(r5)}STACKTOP=r2;return 1}function _os_difftime(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_checknumber(r3,1)&-1;_lua_pushnumber(r3,_difftime(r1,_luaL_optnumber(r3,2,0)&-1));STACKTOP=r2;return 1}function _os_execute(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;r1=_luaL_optlstring(r3,1,0,0);r4=_system(r1);if((r1|0)!=0){r5=_luaL_execresult(r3,r4);r6=r5;STACKTOP=r2;return r6}else{_lua_pushboolean(r3,r4);r5=1;r6=r5;STACKTOP=r2;return r6}}function _os_exit(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;if((_lua_type(r3,1)|0)==1){r1=(_lua_toboolean(r3,1)|0)!=0;r4=r1?0:1}else{r4=_luaL_optinteger(r3,1,0)}if((_lua_toboolean(r3,2)|0)!=0){_lua_close(r3)}if((r3|0)!=0){_exit(r4)}else{STACKTOP=r2;return 0}}function _os_getenv(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_pushstring(r3,_getenv(_luaL_checklstring(r3,1,0)));STACKTOP=r2;return 1}function _os_remove(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_luaL_checklstring(r3,1,0);r4=_luaL_fileresult(r3,(_remove(r1)|0)==0|0,r1);STACKTOP=r2;return r4}function _os_rename(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_luaL_checklstring(r3,1,0);r4=_luaL_fileresult(r3,(_rename(r1,_luaL_checklstring(r3,2,0))|0)==0|0,r1);STACKTOP=r2;return r4}function _os_setlocale(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_luaL_optlstring(r3,1,0,0);r4=384+(_luaL_checkoption(r3,2,9312,352)<<2)|0;_lua_pushstring(r3,_setlocale(HEAP32[r4>>2],r1));STACKTOP=r2;return 1}function _os_time(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+48|0;r3=r2;r4=r1;if((_lua_type(r4,1)|0)<=0){r5=_time(0)}else{_luaL_checktype(r4,1,5);_lua_settop(r4,1);r1=_getfield(r4,11096,0);HEAP32[r3>>2]=r1;r1=_getfield(r4,10840,0);HEAP32[r3+4>>2]=r1;r1=_getfield(r4,10656,12);HEAP32[r3+8>>2]=r1;r1=_getfield(r4,10480,-1);HEAP32[r3+12>>2]=r1;r1=_getfield(r4,10216,-1)-1|0;HEAP32[r3+16>>2]=r1;r1=_getfield(r4,1e4,-1)-1900|0;HEAP32[r3+20>>2]=r1;r1=_getboolfield(r4,9792);HEAP32[r3+32>>2]=r1;r5=_mktime(r3)}if((r5|0)==-1){_lua_pushnil(r4);STACKTOP=r2;return 1}else{_lua_pushnumber(r4,r5|0);STACKTOP=r2;return 1}}function _os_tmpname(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+24|0;r4=r3;r5=r1;if(((_tmpnam(r4|0)|0)==0|0)!=0){r1=_luaL_error(r5,11456,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r6=r1;r7=r6;STACKTOP=r3;return r7}else{_lua_pushstring(r5,r4|0);r6=1;r7=r6;STACKTOP=r3;return r7}}function _getfield(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;r7=r1;r1=r2;r2=r3;_lua_getfield(r7,-1,r1);r3=_lua_tointegerx(r7,-1,r6);do{if((HEAP32[r6>>2]|0)==0){if((r2|0)>=0){r3=r2;break}r8=_luaL_error(r7,9560,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r1,r4));STACKTOP=r4;r9=r8;r10=r9;STACKTOP=r5;return r10}}while(0);_lua_settop(r7,-2);r9=r3;r10=r9;STACKTOP=r5;return r10}function _getboolfield(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;_lua_getfield(r4,-1,r2);if((_lua_type(r4,-1)|0)==0){r5=-1}else{r5=_lua_toboolean(r4,-1)}_lua_settop(r4,-2);STACKTOP=r3;return r5}function _setfield(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;_lua_pushinteger(r5,r3);_lua_setfield(r5,-2,r2);STACKTOP=r4;return}function _setboolfield(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;r1=r3;if((r1|0)<0){STACKTOP=r4;return}else{_lua_pushboolean(r5,r1);_lua_setfield(r5,-2,r2);STACKTOP=r4;return}}function _checkoption(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=0;L1:while(1){if(r3>>>0>=2){r4=14;break}do{if((HEAP8[r1]|0)!=0){if((_strchr(HEAP32[2240+(r3<<2)>>2],HEAP8[r1]|0)|0)==0){break}HEAP8[r2+1|0]=HEAP8[r1];if((HEAP8[HEAP32[2240+(r3+1<<2)>>2]]|0)==0){r4=6;break L1}if((HEAP8[r1+1|0]|0)!=0){if((_strchr(HEAP32[2240+(r3+1<<2)>>2],HEAP8[r1+1|0]|0)|0)!=0){r4=9;break L1}}}}while(0);r3=r3+2|0}if(r4==6){HEAP8[r2+2|0]=0;r8=r1+1|0;r9=r8;STACKTOP=r6;return r9}else if(r4==9){HEAP8[r2+2|0]=HEAP8[r1+1|0];HEAP8[r2+3|0]=0;r8=r1+2|0;r9=r8;STACKTOP=r6;return r9}else if(r4==14){r4=_lua_pushfstring(r7,7048,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r1,r5));STACKTOP=r5;_luaL_argerror(r7,1,r4);r8=r1;r9=r8;STACKTOP=r6;return r9}}function _luaopen_string(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_createtable(r3,0,14);_luaL_setfuncs(r3,176,0);_createmetatable(r3);STACKTOP=r2;return 1}function _createmetatable(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_createtable(r3,0,1);_lua_pushlstring(r3,12080,0);_lua_pushvalue(r3,-2);_lua_setmetatable(r3,-2);_lua_settop(r3,-2);_lua_pushvalue(r3,-2);_lua_setfield(r3,-2,10248);_lua_settop(r3,-2);STACKTOP=r2;return}function _str_byte(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r1;r1=_luaL_checklstring(r5,1,r4);r6=_luaL_optinteger(r5,2,1);r7=_posrelat(r6,HEAP32[r4>>2]);r6=_luaL_optinteger(r5,3,r7);r8=_posrelat(r6,HEAP32[r4>>2]);if(r7>>>0<1){r7=1}if(r8>>>0>HEAP32[r4>>2]>>>0){r8=HEAP32[r4>>2]}if(r7>>>0>r8>>>0){r9=0;r10=r9;STACKTOP=r3;return r10}r4=r8-r7+1|0;if((r7+r4|0)>>>0<=r8>>>0){r8=_luaL_error(r5,5344,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r9=r8;r10=r9;STACKTOP=r3;return r10}_luaL_checkstack(r5,r4,5344);r8=0;while(1){if((r8|0)>=(r4|0)){break}_lua_pushinteger(r5,HEAPU8[r1+(r7+r8-1)|0]);r8=r8+1|0}r9=r4;r10=r9;STACKTOP=r3;return r10}function _str_char(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+1040|0;r3=r2;r4=r1;r1=_lua_gettop(r4);r5=_luaL_buffinitsize(r4,r3,r1);r6=1;while(1){if((r6|0)>(r1|0)){break}r7=_luaL_checkinteger(r4,r6);if((r7&255|0)==(r7|0)){r8=1}else{r8=(_luaL_argerror(r4,r6,5512)|0)!=0}HEAP8[r5+(r6-1)|0]=r7;r6=r6+1|0}_luaL_pushresultsize(r3,r1);STACKTOP=r2;return 1}function _str_dump(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+1040|0;r4=r3;r5=r1;_luaL_checktype(r5,1,6);_lua_settop(r5,1);_luaL_buffinit(r5,r4);if((_lua_dump(r5,78,r4)|0)!=0){r1=_luaL_error(r5,5672,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r6=r1;r7=r6;STACKTOP=r3;return r7}else{_luaL_pushresult(r4);r6=1;r7=r6;STACKTOP=r3;return r7}}function _str_find(r1){var r2,r3;r2=STACKTOP;r3=_str_find_aux(r1,1);STACKTOP=r2;return r3}function _str_format(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183;r2=0;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+1080|0;r5=r4;r6=r4+8;r7=r4+1048;r8=r4+1072;r9=r1;r10=r9;r11=_lua_gettop(r10);r12=r11;r13=1;r14=r9;r15=r13;r16=_luaL_checklstring(r14,r15,r5);r17=r16;r18=r17;r19=HEAP32[r5>>2];r20=r18+r19|0;r21=r20;r22=r9;_luaL_buffinit(r22,r6);L1:while(1){r23=r17;r24=r21;r25=r23>>>0<r24>>>0;if(!r25){r2=33;break}r26=r17;r27=HEAP8[r26];r28=r27<<24>>24;r29=(r28|0)!=37;if(r29){r30=r6+8|0;r31=HEAP32[r30>>2];r32=r6+4|0;r33=HEAP32[r32>>2];r34=r31>>>0<r33>>>0;if(r34){r35=1}else{r36=_luaL_prepbuffsize(r6,1);r37=(r36|0)!=0;r35=r37}r38=r35&1;r39=r17;r40=r39+1|0;r17=r40;r41=HEAP8[r39];r42=r6+8|0;r43=HEAP32[r42>>2];r44=r43+1|0;HEAP32[r42>>2]=r44;r45=r6|0;r46=HEAP32[r45>>2];r47=r46+r43|0;HEAP8[r47]=r41}else{r48=r17;r49=r48+1|0;r17=r49;r50=HEAP8[r49];r51=r50<<24>>24;r52=(r51|0)==37;if(r52){r53=r6+8|0;r54=HEAP32[r53>>2];r55=r6+4|0;r56=HEAP32[r55>>2];r57=r54>>>0<r56>>>0;if(r57){r58=1}else{r59=_luaL_prepbuffsize(r6,1);r60=(r59|0)!=0;r58=r60}r61=r58&1;r62=r17;r63=r62+1|0;r17=r63;r64=HEAP8[r62];r65=r6+8|0;r66=HEAP32[r65>>2];r67=r66+1|0;HEAP32[r65>>2]=r67;r68=r6|0;r69=HEAP32[r68>>2];r70=r69+r66|0;HEAP8[r70]=r64}else{r71=_luaL_prepbuffsize(r6,512);r72=r71;r73=0;r74=r13;r75=r74+1|0;r13=r75;r76=r12;r77=(r75|0)>(r76|0);if(r77){r78=r9;r79=r13;r80=_luaL_argerror(r78,r79,7192)}r81=r9;r82=r17;r83=r7|0;r84=_scanformat(r81,r82,r83);r17=r84;r85=r17;r86=r85+1|0;r17=r86;r87=HEAP8[r85];r88=r87<<24>>24;L15:do{switch(r88|0){case 100:case 105:{r89=r9;r90=r13;r91=_luaL_checknumber(r89,r90);r92=r91;r93=r92;r94=r93&-1;r95=r94;r96=r92;r97=r95;r98=r97|0;r99=r96-r98;r100=r99;r101=r100;r102=-1<r101;if(r102){r103=r100;r104=r103<1;if(r104){r105=1}else{r2=17}}else{r2=17}if(r2==17){r2=0;r106=r9;r107=r13;r108=_luaL_argerror(r106,r107,7016);r109=(r108|0)!=0;r105=r109}r110=r105&1;r111=r7|0;_addlenmod(r111,6808);r112=r72;r113=r7|0;r114=r95;r115=_sprintf(r112,r113,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r114,r3));STACKTOP=r3;r73=r115;break};case 99:{r116=r72;r117=r7|0;r118=r9;r119=r13;r120=_luaL_checkinteger(r118,r119);r121=_sprintf(r116,r117,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r120,r3));STACKTOP=r3;r73=r121;break};case 111:case 117:case 120:case 88:{r122=r9;r123=r13;r124=_luaL_checknumber(r122,r123);r125=r124;r126=r125;r127=r126>=0?Math_floor(r126):Math_ceil(r126);r128=r127;r129=r125;r130=r128;r131=r130>>>0;r132=r129-r131;r133=r132;r134=r133;r135=-1<r134;if(r135){r136=r133;r137=r136<1;if(r137){r138=1}else{r2=21}}else{r2=21}if(r2==21){r2=0;r139=r9;r140=r13;r141=_luaL_argerror(r139,r140,6528);r142=(r141|0)!=0;r138=r142}r143=r138&1;r144=r7|0;_addlenmod(r144,6808);r145=r72;r146=r7|0;r147=r128;r148=_sprintf(r145,r146,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r147,r3));STACKTOP=r3;r73=r148;break};case 101:case 69:case 102:case 103:case 71:{r149=r7|0;_addlenmod(r149,12080);r150=r72;r151=r7|0;r152=r9;r153=r13;r154=_luaL_checknumber(r152,r153);r155=_sprintf(r150,r151,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r3>>3]=r154,r3));STACKTOP=r3;r73=r155;break};case 113:{r156=r9;r157=r13;_addquoted(r156,r6,r157);break};case 115:{r158=r9;r159=r13;r160=_luaL_tolstring(r158,r159,r8);r161=r160;r162=r7|0;r163=_strchr(r162,46);r164=(r163|0)!=0;do{if(!r164){r165=HEAP32[r8>>2];r166=r165>>>0>=100;if(!r166){break}_luaL_addvalue(r6);break L15}}while(0);r167=r72;r168=r7|0;r169=r161;r170=_sprintf(r167,r168,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r169,r3));STACKTOP=r3;r73=r170;r171=r9;_lua_settop(r171,-2);break};default:{r2=29;break L1}}}while(0);r172=r73;r173=r6+8|0;r174=HEAP32[r173>>2];r175=r174+r172|0;HEAP32[r173>>2]=r175}}}if(r2==29){r176=r9;r177=r17;r178=r177-1|0;r179=HEAP8[r178];r180=r179<<24>>24;r181=_luaL_error(r176,6376,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r180,r3));STACKTOP=r3;r182=r181;r183=r182;STACKTOP=r4;return r183}else if(r2==33){_luaL_pushresult(r6);r182=1;r183=r182;STACKTOP=r4;return r183}}function _gmatch(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checklstring(r3,1,0);_luaL_checklstring(r3,2,0);_lua_settop(r3,2);_lua_pushinteger(r3,0);_lua_pushcclosure(r3,182,3);STACKTOP=r2;return 1}function _str_gsub(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+1336|0;r4=r3;r5=r3+8;r6=r3+16;r7=r3+296;r8=r1;r1=_luaL_checklstring(r8,1,r4);r9=_luaL_checklstring(r8,2,r5);r10=_lua_type(r8,3);r11=_luaL_optinteger(r8,4,HEAP32[r4>>2]+1|0);r12=(HEAP8[r9]|0)==94|0;r13=0;do{if((r10|0)==3){r14=1}else{if((r10|0)==4){r14=1;break}if((r10|0)==6){r14=1;break}if((r10|0)==5){r14=1;break}r14=(_luaL_argerror(r8,3,7672)|0)!=0}}while(0);_luaL_buffinit(r8,r7);if((r12|0)!=0){r9=r9+1|0;HEAP32[r5>>2]=HEAP32[r5>>2]-1}HEAP32[r6+12>>2]=r8;HEAP32[r6>>2]=r1;HEAP32[r6+4>>2]=r1+HEAP32[r4>>2];HEAP32[r6+8>>2]=r9+HEAP32[r5>>2];while(1){if(r13>>>0>=r11>>>0){r2=24;break}HEAP32[r6+16>>2]=0;r5=_match(r6,r1,r9);if((r5|0)!=0){r13=r13+1|0;_add_value(r6,r7,r1,r5,r10)}do{if((r5|0)!=0){if(r5>>>0<=r1>>>0){r2=15;break}r1=r5}else{r2=15}}while(0);if(r2==15){r2=0;if(r1>>>0>=HEAP32[r6+4>>2]>>>0){r2=19;break}if(HEAP32[r7+8>>2]>>>0<HEAP32[r7+4>>2]>>>0){r15=1}else{r15=(_luaL_prepbuffsize(r7,1)|0)!=0}r5=r1;r1=r5+1|0;r4=HEAP8[r5];r5=r7+8|0;r14=HEAP32[r5>>2];HEAP32[r5>>2]=r14+1;HEAP8[HEAP32[r7>>2]+r14|0]=r4}if((r12|0)!=0){r2=22;break}}if(r2==19){r16=r1;r17=r6+4|0;r18=HEAP32[r17>>2];r19=r1;r20=r18;r21=r19;r22=r20-r21|0;_luaL_addlstring(r7,r16,r22);_luaL_pushresult(r7);r23=r8;r24=r13;_lua_pushinteger(r23,r24);STACKTOP=r3;return 2}else if(r2==22){r16=r1;r17=r6+4|0;r18=HEAP32[r17>>2];r19=r1;r20=r18;r21=r19;r22=r20-r21|0;_luaL_addlstring(r7,r16,r22);_luaL_pushresult(r7);r23=r8;r24=r13;_lua_pushinteger(r23,r24);STACKTOP=r3;return 2}else if(r2==24){r16=r1;r17=r6+4|0;r18=HEAP32[r17>>2];r19=r1;r20=r18;r21=r19;r22=r20-r21|0;_luaL_addlstring(r7,r16,r22);_luaL_pushresult(r7);r23=r8;r24=r13;_lua_pushinteger(r23,r24);STACKTOP=r3;return 2}}function _str_len(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;_luaL_checklstring(r4,1,r3);_lua_pushinteger(r4,HEAP32[r3>>2]);STACKTOP=r2;return 1}function _str_lower(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;STACKTOP=STACKTOP+1048|0;r3=r2;r4=r2+8;r5=r1;r1=_luaL_checklstring(r5,1,r3);r6=_luaL_buffinitsize(r5,r4,HEAP32[r3>>2]);r5=0;while(1){if(r5>>>0>=HEAP32[r3>>2]>>>0){break}r7=_tolower(HEAPU8[r1+r5|0])&255;HEAP8[r6+r5|0]=r7;r5=r5+1|0}_luaL_pushresultsize(r4,HEAP32[r3>>2]);STACKTOP=r2;return 1}function _str_match(r1){var r2,r3;r2=STACKTOP;r3=_str_find_aux(r1,0);STACKTOP=r2;return r3}function _str_rep(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+1056|0;r4=r3;r5=r3+8;r6=r3+16;r7=r1;r1=_luaL_checklstring(r7,1,r4);r8=_luaL_checkinteger(r7,2);r9=_luaL_optlstring(r7,3,12080,r5);L1:do{if((r8|0)<=0){_lua_pushlstring(r7,12080,0)}else{do{if((HEAP32[r4>>2]+HEAP32[r5>>2]|0)>>>0>=HEAP32[r4>>2]>>>0){if((HEAP32[r4>>2]+HEAP32[r5>>2]|0)>>>0>=(2147483647/(r8>>>0)&-1)>>>0){break}r10=Math_imul(r8,HEAP32[r4>>2])|0;r11=r10+Math_imul(r8-1|0,HEAP32[r5>>2])|0;r10=_luaL_buffinitsize(r7,r6,r11);while(1){r12=r8;r8=r12-1|0;if((r12|0)<=1){break}_memcpy(r10,r1,HEAP32[r4>>2])|0;r10=r10+HEAP32[r4>>2]|0;if(HEAP32[r5>>2]>>>0>0){_memcpy(r10,r9,HEAP32[r5>>2])|0;r10=r10+HEAP32[r5>>2]|0}}_memcpy(r10,r1,HEAP32[r4>>2])|0;_luaL_pushresultsize(r6,r11);break L1}}while(0);r12=_luaL_error(r7,10184,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r13=r12;r14=r13;STACKTOP=r3;return r14}}while(0);r13=1;r14=r13;STACKTOP=r3;return r14}function _str_reverse(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;STACKTOP=STACKTOP+1048|0;r3=r2;r4=r2+8;r5=r1;r1=_luaL_checklstring(r5,1,r3);r6=_luaL_buffinitsize(r5,r4,HEAP32[r3>>2]);r5=0;while(1){if(r5>>>0>=HEAP32[r3>>2]>>>0){break}HEAP8[r6+r5|0]=HEAP8[r1+(HEAP32[r3>>2]-r5-1)|0];r5=r5+1|0}_luaL_pushresultsize(r4,HEAP32[r3>>2]);STACKTOP=r2;return 1}function _str_sub(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r1=_luaL_checklstring(r4,1,r3);r5=_luaL_checkinteger(r4,2);r6=_posrelat(r5,HEAP32[r3>>2]);r5=_luaL_optinteger(r4,3,-1);r7=_posrelat(r5,HEAP32[r3>>2]);if(r6>>>0<1){r6=1}if(r7>>>0>HEAP32[r3>>2]>>>0){r7=HEAP32[r3>>2]}if(r6>>>0<=r7>>>0){_lua_pushlstring(r4,r1+r6-1|0,r7-r6+1|0);STACKTOP=r2;return 1}else{_lua_pushlstring(r4,12080,0);STACKTOP=r2;return 1}}function _str_upper(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;STACKTOP=STACKTOP+1048|0;r3=r2;r4=r2+8;r5=r1;r1=_luaL_checklstring(r5,1,r3);r6=_luaL_buffinitsize(r5,r4,HEAP32[r3>>2]);r5=0;while(1){if(r5>>>0>=HEAP32[r3>>2]>>>0){break}r7=_toupper(HEAPU8[r1+r5|0])&255;HEAP8[r6+r5|0]=r7;r5=r5+1|0}_luaL_pushresultsize(r4,HEAP32[r3>>2]);STACKTOP=r2;return 1}function _posrelat(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;if((r4|0)>=0){r5=r4;r6=r5;STACKTOP=r3;return r6}if((-r4|0)>>>0>r1>>>0){r5=0;r6=r5;STACKTOP=r3;return r6}else{r5=r1- -r4+1|0;r6=r5;STACKTOP=r3;return r6}}function _str_find_aux(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+296|0;r5=r4;r6=r4+8;r7=r4+16;r8=r1;r1=r2;r2=_luaL_checklstring(r8,1,r5);r9=_luaL_checklstring(r8,2,r6);r10=_luaL_optinteger(r8,3,1);r11=_posrelat(r10,HEAP32[r5>>2]);do{if(r11>>>0<1){r11=1}else{if(r11>>>0<=(HEAP32[r5>>2]+1|0)>>>0){break}_lua_pushnil(r8);r12=1;r13=r12;STACKTOP=r4;return r13}}while(0);do{if((r1|0)!=0){if((_lua_toboolean(r8,4)|0)==0){if((_nospecials(r9,HEAP32[r6>>2])|0)==0){r3=12;break}}r10=_lmemfind(r2+r11-1|0,HEAP32[r5>>2]-r11+1|0,r9,HEAP32[r6>>2]);if((r10|0)==0){break}_lua_pushinteger(r8,r10-r2+1|0);_lua_pushinteger(r8,r10-r2+HEAP32[r6>>2]|0);r12=2;r13=r12;STACKTOP=r4;return r13}else{r3=12}}while(0);do{if(r3==12){r10=r2+r11-1|0;r14=(HEAP8[r9]|0)==94|0;if((r14|0)!=0){r9=r9+1|0;HEAP32[r6>>2]=HEAP32[r6>>2]-1}HEAP32[r7+12>>2]=r8;HEAP32[r7>>2]=r2;HEAP32[r7+4>>2]=r2+HEAP32[r5>>2];HEAP32[r7+8>>2]=r9+HEAP32[r6>>2];while(1){HEAP32[r7+16>>2]=0;r15=_match(r7,r10,r9);r16=r15;if((r15|0)!=0){break}r15=r10;r10=r15+1|0;if(r15>>>0<HEAP32[r7+4>>2]>>>0){r17=(r14|0)!=0^1}else{r17=0}if(!r17){r3=23;break}}if(r3==23){break}if((r1|0)!=0){_lua_pushinteger(r8,r10-r2+1|0);_lua_pushinteger(r8,r16-r2|0);r12=_push_captures(r7,0,0)+2|0;r13=r12;STACKTOP=r4;return r13}else{r12=_push_captures(r7,r10,r16);r13=r12;STACKTOP=r4;return r13}}}while(0);_lua_pushnil(r8);r12=1;r13=r12;STACKTOP=r4;return r13}function _nospecials(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=0;while(1){if((_strpbrk(r5+r2|0,7936)|0)!=0){r3=3;break}r2=r2+(_strlen(r5+r2|0)+1)|0;if(r2>>>0>r1>>>0){r3=6;break}}if(r3==3){r6=0;r7=r6;STACKTOP=r4;return r7}else if(r3==6){r6=1;r7=r6;STACKTOP=r4;return r7}}function _lmemfind(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=r4;if((r3|0)==0){r8=r7;r9=r8;STACKTOP=r6;return r9}if(r3>>>0>r1>>>0){r8=0;r9=r8;STACKTOP=r6;return r9}r3=r3-1|0;r1=r1-r3|0;while(1){if(r1>>>0>0){r4=_memchr(r7,HEAP8[r2]|0,r1);r10=r4;r11=(r4|0)!=0}else{r11=0}if(!r11){r5=13;break}r10=r10+1|0;if((_memcmp(r10,r2+1|0,r3)|0)==0){r5=10;break}r1=r1-(r10-r7)|0;r7=r10}if(r5==10){r8=r10-1|0;r9=r8;STACKTOP=r6;return r9}else if(r5==13){r8=0;r9=r8;STACKTOP=r6;return r9}}function _match(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178;r4=0;r5=0;r6=STACKTOP;r7=r1;r8=r2;r9=r3;L1:while(1){r10=r9;r11=r7;r12=r11+8|0;r13=HEAP32[r12>>2];r14=(r10|0)==(r13|0);if(r14){r4=3;break}r15=r9;r16=HEAP8[r15];r17=r16<<24>>24;L4:do{if((r17|0)==36){r18=r9;r19=r18+1|0;r20=r7;r21=r20+8|0;r22=HEAP32[r21>>2];r23=(r19|0)==(r22|0);if(r23){r4=10;break L1}}else if((r17|0)==37){r24=r9;r25=r24+1|0;r26=HEAP8[r25];r27=r26<<24>>24;switch(r27|0){case 102:{r28=r9;r29=r28+2|0;r9=r29;r30=r9;r31=HEAP8[r30];r32=r31<<24>>24;r33=(r32|0)!=91;if(r33){r34=r7;r35=r34+12|0;r36=HEAP32[r35>>2];r37=_luaL_error(r36,9272,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}r38=r7;r39=r9;r40=_classend(r38,r39);r41=r40;r42=r8;r43=r7;r44=r43|0;r45=HEAP32[r44>>2];r46=(r42|0)==(r45|0);if(r46){r47=0}else{r48=r8;r49=r48-1|0;r50=HEAP8[r49];r51=r50<<24>>24;r47=r51}r52=r47&255;r53=r52;r54=r53;r55=r54&255;r56=r9;r57=r41;r58=r57-1|0;r59=_matchbracketclass(r55,r56,r58);r60=(r59|0)!=0;if(r60){r4=26;break L1}r61=r8;r62=HEAP8[r61];r63=r62&255;r64=r9;r65=r41;r66=r65-1|0;r67=_matchbracketclass(r63,r64,r66);r68=(r67|0)!=0;if(!r68){r4=26;break L1}r69=r41;r9=r69;continue L1;break};case 98:{r70=r7;r71=r8;r72=r9;r73=r72+2|0;r74=_matchbalance(r70,r71,r73);r8=r74;r75=r8;r76=(r75|0)==0;if(r76){r4=17;break L1}r77=r9;r78=r77+4|0;r9=r78;continue L1;break};case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:{r79=r7;r80=r8;r81=r9;r82=r81+1|0;r83=HEAP8[r82];r84=r83&255;r85=_match_capture(r79,r80,r84);r8=r85;r86=r8;r87=(r86|0)==0;if(r87){r4=29;break L1}r88=r9;r89=r88+2|0;r9=r89;continue L1;break};default:{break L4}}}else if((r17|0)==41){r4=8;break L1}else if((r17|0)==40){r4=5;break L1}}while(0);r90=r7;r91=r9;r92=_classend(r90,r91);r93=r92;r94=r8;r95=r7;r96=r95+4|0;r97=HEAP32[r96>>2];r98=r94>>>0<r97>>>0;if(r98){r99=r8;r100=HEAP8[r99];r101=r100&255;r102=r9;r103=r93;r104=_singlematch(r101,r102,r103);r105=(r104|0)!=0;r106=r105}else{r106=0}r107=r106&1;r108=r107;r109=r93;r110=HEAP8[r109];r111=r110<<24>>24;if((r111|0)==42){r4=40;break}else if((r111|0)==43){r4=41;break}else if((r111|0)==45){r4=45;break}else if((r111|0)!=63){r112=r108;r113=(r112|0)!=0;if(!r113){r4=47;break}r114=r8;r115=r114+1|0;r8=r115;r116=r93;r9=r116;continue}r117=r108;r118=(r117|0)!=0;if(r118){r119=r7;r120=r8;r121=r120+1|0;r122=r93;r123=r122+1|0;r124=_match(r119,r121,r123);r125=r124;r126=(r124|0)!=0;if(r126){r4=38;break}}r127=r93;r128=r127+1|0;r9=r128}if(r4==3){r129=r8;r130=r129;r131=r130;STACKTOP=r6;return r131}else if(r4==5){r132=r9;r133=r132+1|0;r134=HEAP8[r133];r135=r134<<24>>24;r136=(r135|0)==41;if(r136){r137=r7;r138=r8;r139=r9;r140=r139+2|0;r141=_start_capture(r137,r138,r140,-2);r130=r141;r131=r130;STACKTOP=r6;return r131}else{r142=r7;r143=r8;r144=r9;r145=r144+1|0;r146=_start_capture(r142,r143,r145,-1);r130=r146;r131=r130;STACKTOP=r6;return r131}}else if(r4==8){r147=r7;r148=r8;r149=r9;r150=r149+1|0;r151=_end_capture(r147,r148,r150);r130=r151;r131=r130;STACKTOP=r6;return r131}else if(r4==10){r152=r8;r153=r7;r154=r153+4|0;r155=HEAP32[r154>>2];r156=(r152|0)==(r155|0);if(r156){r157=r8;r158=r157}else{r158=0}r130=r158;r131=r130;STACKTOP=r6;return r131}else if(r4==17){r130=0;r131=r130;STACKTOP=r6;return r131}else if(r4==26){r130=0;r131=r130;STACKTOP=r6;return r131}else if(r4==29){r130=0;r131=r130;STACKTOP=r6;return r131}else if(r4==38){r159=r125;r130=r159;r131=r130;STACKTOP=r6;return r131}else if(r4==40){r160=r7;r161=r8;r162=r9;r163=r93;r164=_max_expand(r160,r161,r162,r163);r130=r164;r131=r130;STACKTOP=r6;return r131}else if(r4==41){r165=r108;r166=(r165|0)!=0;if(r166){r167=r7;r168=r8;r169=r168+1|0;r170=r9;r171=r93;r172=_max_expand(r167,r169,r170,r171);r173=r172}else{r173=0}r130=r173;r131=r130;STACKTOP=r6;return r131}else if(r4==45){r174=r7;r175=r8;r176=r9;r177=r93;r178=_min_expand(r174,r175,r176,r177);r130=r178;r131=r130;STACKTOP=r6;return r131}else if(r4==47){r130=0;r131=r130;STACKTOP=r6;return r131}}function _push_captures(r1,r2,r3){var r4,r5,r6,r7;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;do{if((HEAP32[r6+16>>2]|0)==0){if((r1|0)==0){r4=4;break}r7=1}else{r4=4}}while(0);if(r4==4){r7=HEAP32[r6+16>>2]}r4=r7;_luaL_checkstack(HEAP32[r6+12>>2],r4,9976);r7=0;while(1){if((r7|0)>=(r4|0)){break}_push_onecapture(r6,r7,r1,r2);r7=r7+1|0}STACKTOP=r5;return r4}function _push_onecapture(r1,r2,r3,r4){var r5,r6,r7;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=r4;if((r1|0)>=(HEAP32[r7+16>>2]|0)){if((r1|0)==0){_lua_pushlstring(HEAP32[r7+12>>2],r2,r3-r2|0)}else{_luaL_error(HEAP32[r7+12>>2],9768,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}STACKTOP=r6;return}r2=HEAP32[r7+20+(r1<<3)+4>>2];if((r2|0)==-1){_luaL_error(HEAP32[r7+12>>2],9536,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}if((r2|0)==-2){_lua_pushinteger(HEAP32[r7+12>>2],HEAP32[r7+20+(r1<<3)>>2]-HEAP32[r7>>2]+1|0)}else{_lua_pushlstring(HEAP32[r7+12>>2],HEAP32[r7+20+(r1<<3)>>2],r2)}STACKTOP=r6;return}function _start_capture(r1,r2,r3,r4){var r5,r6,r7,r8;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=HEAP32[r7+16>>2];if((r2|0)>=32){_luaL_error(HEAP32[r7+12>>2],9976,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}HEAP32[r7+20+(r2<<3)>>2]=r1;HEAP32[r7+20+(r2<<3)+4>>2]=r4;HEAP32[r7+16>>2]=r2+1;r2=_match(r7,r1,r3);r3=r2;if((r2|0)!=0){r8=r3;STACKTOP=r6;return r8}r2=r7+16|0;HEAP32[r2>>2]=HEAP32[r2>>2]-1;r8=r3;STACKTOP=r6;return r8}function _end_capture(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=_capture_to_close(r5);HEAP32[r5+20+(r2<<3)+4>>2]=r1-HEAP32[r5+20+(r2<<3)>>2];r6=_match(r5,r1,r3);r3=r6;if((r6|0)!=0){r7=r3;STACKTOP=r4;return r7}HEAP32[r5+20+(r2<<3)+4>>2]=-1;r7=r3;STACKTOP=r4;return r7}function _matchbalance(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;if(r2>>>0>=(HEAP32[r7+8>>2]-1|0)>>>0){_luaL_error(HEAP32[r7+12>>2],8344,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}if((HEAP8[r1]|0)!=(HEAP8[r2]|0)){r8=0;r9=r8;STACKTOP=r6;return r9}r5=HEAP8[r2]|0;r3=HEAP8[r2+1|0]|0;r2=1;while(1){r10=r1+1|0;r1=r10;if(r10>>>0>=HEAP32[r7+4>>2]>>>0){break}if((HEAP8[r1]|0)==(r3|0)){r10=r2-1|0;r2=r10;if((r10|0)==0){r4=9;break}}else{if((HEAP8[r1]|0)==(r5|0)){r2=r2+1|0}}}if(r4==9){r8=r1+1|0;r9=r8;STACKTOP=r6;return r9}r8=0;r9=r8;STACKTOP=r6;return r9}function _classend(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=r1;r1=r2+1|0;r6=HEAP8[r2]|0;if((r6|0)==37){if((r1|0)==(HEAP32[r5+8>>2]|0)){_luaL_error(HEAP32[r5+12>>2],8840,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3}r7=r1+1|0;r8=r7;STACKTOP=r4;return r8}else if((r6|0)==91){if((HEAP8[r1]|0)==94){r1=r1+1|0}while(1){if((r1|0)==(HEAP32[r5+8>>2]|0)){_luaL_error(HEAP32[r5+12>>2],8560,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3}r6=r1;r1=r6+1|0;do{if((HEAP8[r6]|0)==37){if(r1>>>0>=HEAP32[r5+8>>2]>>>0){break}r1=r1+1|0}}while(0);if((HEAP8[r1]|0)==93){break}}r7=r1+1|0;r8=r7;STACKTOP=r4;return r8}else{r7=r1;r8=r7;STACKTOP=r4;return r8}}function _matchbracketclass(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=1;if((HEAP8[r1+1|0]|0)==94){r3=0;r1=r1+1|0}L4:while(1){r7=r1+1|0;r1=r7;if(r7>>>0>=r2>>>0){r4=20;break}if((HEAP8[r1]|0)==37){r1=r1+1|0;if((_match_class(r6,HEAPU8[r1])|0)!=0){r4=7;break}}else{do{if((HEAP8[r1+1|0]|0)==45){if((r1+2|0)>>>0>=r2>>>0){r4=15;break}r1=r1+2|0;if((HEAPU8[r1-2|0]|0)<=(r6|0)){if((r6|0)<=(HEAPU8[r1]|0)){r4=13;break L4}}}else{r4=15}}while(0);if(r4==15){r4=0;if((HEAPU8[r1]|0)==(r6|0)){r4=16;break}}}}if(r4==7){r8=r3;r9=r8;STACKTOP=r5;return r9}else if(r4==13){r8=r3;r9=r8;STACKTOP=r5;return r9}else if(r4==16){r8=r3;r9=r8;STACKTOP=r5;return r9}else if(r4==20){r8=((r3|0)!=0^1)&1;r9=r8;STACKTOP=r5;return r9}}function _match_capture(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r2=_check_capture(r5,r2);r3=HEAP32[r5+20+(r2<<3)+4>>2];do{if((HEAP32[r5+4>>2]-r1|0)>>>0>=r3>>>0){if((_memcmp(HEAP32[r5+20+(r2<<3)>>2],r1,r3)|0)!=0){break}r6=r1+r3|0;r7=r6;STACKTOP=r4;return r7}}while(0);r6=0;r7=r6;STACKTOP=r4;return r7}function _singlematch(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=HEAP8[r1]|0;if((r2|0)==91){r6=_matchbracketclass(r5,r1,r3-1|0);r7=r6;STACKTOP=r4;return r7}else if((r2|0)==37){r6=_match_class(r5,HEAPU8[r1+1|0]);r7=r6;STACKTOP=r4;return r7}else if((r2|0)==46){r6=1;r7=r6;STACKTOP=r4;return r7}else{r6=(HEAPU8[r1]|0)==(r5|0)|0;r7=r6;STACKTOP=r4;return r7}}function _max_expand(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=r4;r4=0;while(1){if((r1+r4|0)>>>0<HEAP32[r7+4>>2]>>>0){r8=(_singlematch(HEAPU8[r1+r4|0],r2,r3)|0)!=0}else{r8=0}if(!r8){break}r4=r4+1|0}while(1){if((r4|0)<0){r5=11;break}r9=_match(r7,r1+r4|0,r3+1|0);if((r9|0)!=0){r5=9;break}r4=r4-1|0}if(r5==9){r10=r9;r11=r10;STACKTOP=r6;return r11}else if(r5==11){r10=0;r11=r10;STACKTOP=r6;return r11}}function _min_expand(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=r4;while(1){r8=_match(r7,r1,r3+1|0);if((r8|0)!=0){r5=3;break}if(r1>>>0>=HEAP32[r7+4>>2]>>>0){r5=7;break}if((_singlematch(HEAPU8[r1],r2,r3)|0)==0){r5=7;break}r1=r1+1|0}if(r5==3){r9=r8;r10=r9;STACKTOP=r6;return r10}else if(r5==7){r9=0;r10=r9;STACKTOP=r6;return r10}}function _match_class(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r3=0;r4=STACKTOP;r5=r1;r6=r2;r7=r6;r8=_tolower(r7);switch(r8|0){case 122:{r9=r5;r10=(r9|0)==0;r11=r10&1;r12=r11;break};case 112:{r13=r5;r14=_ispunct(r13);r12=r14;break};case 99:{r15=r5;r16=_iscntrl(r15);r12=r16;break};case 100:{r17=r5;r18=_isdigit(r17);r12=r18;break};case 115:{r19=r5;r20=_isspace(r19);r12=r20;break};case 120:{r21=r5;r22=_isxdigit(r21);r12=r22;break};case 97:{r23=r5;r24=_isalpha(r23);r12=r24;break};case 103:{r25=r5;r26=_isgraph(r25);r12=r26;break};case 108:{r27=r5;r28=_islower(r27);r12=r28;break};case 117:{r29=r5;r30=_isupper(r29);r12=r30;break};case 119:{r31=r5;r32=_isalnum(r31);r12=r32;break};default:{r33=r6;r34=r5;r35=(r33|0)==(r34|0);r36=r35&1;r37=r36;r38=r37;STACKTOP=r4;return r38}}r39=r6;r40=_islower(r39);r41=(r40|0)!=0;if(r41){r42=r12;r43=r42}else{r44=r12;r45=(r44|0)!=0;r46=r45^1;r47=r46&1;r43=r47}r37=r43;r38=r37;STACKTOP=r4;return r38}function _check_capture(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1;r1=r2;r1=r1-49|0;do{if((r1|0)>=0){if((r1|0)>=(HEAP32[r5+16>>2]|0)){break}if((HEAP32[r5+20+(r1<<3)+4>>2]|0)==-1){break}r6=r1;r7=r6;STACKTOP=r4;return r7}}while(0);r2=_luaL_error(HEAP32[r5+12>>2],9072,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r1+1,r3));STACKTOP=r3;r6=r2;r7=r6;STACKTOP=r4;return r7}function _capture_to_close(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=0;r4=STACKTOP;r5=r1;r1=HEAP32[r5+16>>2];r1=r1-1|0;while(1){if((r1|0)<0){r2=7;break}if((HEAP32[r5+20+(r1<<3)+4>>2]|0)==-1){r2=4;break}r1=r1-1|0}if(r2==4){r6=r1;r7=r6;STACKTOP=r4;return r7}else if(r2==7){r2=_luaL_error(HEAP32[r5+12>>2],8160,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;r6=r2;r7=r6;STACKTOP=r4;return r7}}function _add_value(r1,r2,r3,r4,r5){var r6,r7,r8,r9;r6=0;r7=STACKTOP;r8=r1;r1=r2;r2=r3;r3=r4;r4=HEAP32[r8+12>>2];r9=r5;if((r9|0)==5){_push_onecapture(r8,0,r2,r3);_lua_gettable(r4,3)}else if((r9|0)==6){_lua_pushvalue(r4,3);_lua_callk(r4,_push_captures(r8,r2,r3),1,0,0)}else{_add_s(r8,r1,r2,r3);STACKTOP=r7;return}if((_lua_toboolean(r4,-1)|0)!=0){if((_lua_isstring(r4,-1)|0)==0){r8=_lua_typename(r4,_lua_type(r4,-1));_luaL_error(r4,7512,(r6=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r6>>2]=r8,r6));STACKTOP=r6}}else{_lua_settop(r4,-2);_lua_pushlstring(r4,r2,r3-r2|0)}_luaL_addvalue(r1);STACKTOP=r7;return}function _add_s(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r7=r6;r8=r1;r1=r2;r2=r3;r3=r4;r4=_lua_tolstring(HEAP32[r8+12>>2],3,r7);r9=0;while(1){if(r9>>>0>=HEAP32[r7>>2]>>>0){break}if((HEAP8[r4+r9|0]|0)!=37){if(HEAP32[r1+8>>2]>>>0<HEAP32[r1+4>>2]>>>0){r10=1}else{r10=(_luaL_prepbuffsize(r1,1)|0)!=0}r11=HEAP8[r4+r9|0];r12=r1+8|0;r13=HEAP32[r12>>2];HEAP32[r12>>2]=r13+1;HEAP8[HEAP32[r1>>2]+r13|0]=r11}else{r9=r9+1|0;if((_isdigit(HEAPU8[r4+r9|0])|0)!=0){if((HEAP8[r4+r9|0]|0)==48){_luaL_addlstring(r1,r2,r3-r2|0)}else{_push_onecapture(r8,HEAP8[r4+r9|0]-49|0,r2,r3);_luaL_addvalue(r1)}}else{if((HEAP8[r4+r9|0]|0)!=37){_luaL_error(HEAP32[r8+12>>2],7312,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=37,r5));STACKTOP=r5}if(HEAP32[r1+8>>2]>>>0<HEAP32[r1+4>>2]>>>0){r14=1}else{r14=(_luaL_prepbuffsize(r1,1)|0)!=0}r11=HEAP8[r4+r9|0];r13=r1+8|0;r12=HEAP32[r13>>2];HEAP32[r13>>2]=r12+1;HEAP8[HEAP32[r1>>2]+r12|0]=r11}}r9=r9+1|0}STACKTOP=r6;return}function _gmatch_aux(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+296|0;r4=r3;r5=r3+280;r6=r3+288;r7=r1;r1=_lua_tolstring(r7,-1001001,r5);r8=_lua_tolstring(r7,-1001002,r6);HEAP32[r4+12>>2]=r7;HEAP32[r4>>2]=r1;HEAP32[r4+4>>2]=r1+HEAP32[r5>>2];HEAP32[r4+8>>2]=r8+HEAP32[r6>>2];r6=r1+_lua_tointegerx(r7,-1001003,0)|0;while(1){if(r6>>>0>HEAP32[r4+4>>2]>>>0){r2=9;break}HEAP32[r4+16>>2]=0;r5=_match(r4,r6,r8);r9=r5;if((r5|0)!=0){break}r6=r6+1|0}if(r2==9){r10=0;r11=r10;STACKTOP=r3;return r11}r2=r9-r1|0;if((r9|0)==(r6|0)){r2=r2+1|0}_lua_pushinteger(r7,r2);_lua_replace(r7,-1001003);r10=_push_captures(r4,r6,r9);r11=r10;STACKTOP=r3;return r11}function _scanformat(r1,r2,r3){var r4,r5,r6,r7;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=r1;while(1){if((HEAP8[r3]|0)!=0){r7=(_strchr(6088,HEAP8[r3]|0)|0)!=0}else{r7=0}if(!r7){break}r3=r3+1|0}if((r3-r1|0)>>>0>=6){_luaL_error(r6,5944,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4}if((_isdigit(HEAPU8[r3])|0)!=0){r3=r3+1|0}if((_isdigit(HEAPU8[r3])|0)!=0){r3=r3+1|0}if((HEAP8[r3]|0)==46){r3=r3+1|0;if((_isdigit(HEAPU8[r3])|0)!=0){r3=r3+1|0}if((_isdigit(HEAPU8[r3])|0)!=0){r3=r3+1|0}}if((_isdigit(HEAPU8[r3])|0)!=0){_luaL_error(r6,5824,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4}r4=r2;r2=r4+1|0;HEAP8[r4]=37;_memcpy(r2,r1,r3-r1+1|0)|0;r2=r2+(r3-r1+1)|0;HEAP8[r2]=0;STACKTOP=r5;return r3}function _addlenmod(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;r2=_strlen(r4);r5=_strlen(r1);r6=HEAP8[r4+(r2-1)|0];_strcpy(r4+r2-1|0,r1);HEAP8[r4+(r2+r5-1)|0]=r6;HEAP8[r4+(r2+r5)|0]=0;STACKTOP=r3;return}function _addquoted(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r4=0;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+24|0;r7=r6;r8=r6+8;r9=r2;r2=_luaL_checklstring(r1,r3,r7);if(HEAP32[r9+8>>2]>>>0<HEAP32[r9+4>>2]>>>0){r10=1}else{r10=(_luaL_prepbuffsize(r9,1)|0)!=0}r10=r9+8|0;r3=HEAP32[r10>>2];HEAP32[r10>>2]=r3+1;HEAP8[HEAP32[r9>>2]+r3|0]=34;while(1){r3=HEAP32[r7>>2];HEAP32[r7>>2]=r3-1;if((r3|0)==0){break}do{if((HEAP8[r2]|0)==34){r4=8}else{if((HEAP8[r2]|0)==92){r4=8;break}if((HEAP8[r2]|0)==10){r4=8;break}do{if((HEAP8[r2]|0)==0){r4=15}else{if((_iscntrl(HEAPU8[r2])|0)!=0){r4=15;break}if(HEAP32[r9+8>>2]>>>0<HEAP32[r9+4>>2]>>>0){r11=1}else{r11=(_luaL_prepbuffsize(r9,1)|0)!=0}r3=HEAP8[r2];r10=r9+8|0;r1=HEAP32[r10>>2];HEAP32[r10>>2]=r1+1;HEAP8[HEAP32[r9>>2]+r1|0]=r3}}while(0);if(r4==15){r4=0;if((_isdigit(HEAPU8[r2+1|0])|0)!=0){_sprintf(r8|0,6184,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=HEAPU8[r2],r5));STACKTOP=r5}else{_sprintf(r8|0,6272,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=HEAPU8[r2],r5));STACKTOP=r5}_luaL_addstring(r9,r8|0)}}}while(0);if(r4==8){r4=0;if(HEAP32[r9+8>>2]>>>0<HEAP32[r9+4>>2]>>>0){r12=1}else{r12=(_luaL_prepbuffsize(r9,1)|0)!=0}r3=r9+8|0;r1=HEAP32[r3>>2];HEAP32[r3>>2]=r1+1;HEAP8[HEAP32[r9>>2]+r1|0]=92;if(HEAP32[r9+8>>2]>>>0<HEAP32[r9+4>>2]>>>0){r13=1}else{r13=(_luaL_prepbuffsize(r9,1)|0)!=0}r1=HEAP8[r2];r3=r9+8|0;r10=HEAP32[r3>>2];HEAP32[r3>>2]=r10+1;HEAP8[HEAP32[r9>>2]+r10|0]=r1}r2=r2+1|0}if(HEAP32[r9+8>>2]>>>0<HEAP32[r9+4>>2]>>>0){r14=1;r15=r14&1;r16=r9;r17=r16+8|0;r18=HEAP32[r17>>2];r19=r18+1|0;HEAP32[r17>>2]=r19;r20=r9;r21=r20|0;r22=HEAP32[r21>>2];r23=r22+r18|0;HEAP8[r23]=34;STACKTOP=r6;return}r14=(_luaL_prepbuffsize(r9,1)|0)!=0;r15=r14&1;r16=r9;r17=r16+8|0;r18=HEAP32[r17>>2];r19=r18+1|0;HEAP32[r17>>2]=r19;r20=r9;r21=r20|0;r22=HEAP32[r21>>2];r23=r22+r18|0;HEAP8[r23]=34;STACKTOP=r6;return}function _writer(r1,r2,r3,r4){r1=STACKTOP;_luaL_addlstring(r4,r2,r3);STACKTOP=r1;return 0}function _luaopen_table(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_createtable(r3,0,6);_luaL_setfuncs(r3,24,0);STACKTOP=r2;return 1}function _tconcat(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+1048|0;r3=r2;r4=r2+1040;r5=r1;r1=_luaL_optlstring(r5,2,12072,r4);_luaL_checktype(r5,1,5);r6=_luaL_optinteger(r5,3,1);if((_lua_type(r5,4)|0)<=0){r7=_luaL_len(r5,1)}else{r7=_luaL_checkinteger(r5,4)}r8=r7;_luaL_buffinit(r5,r3);while(1){if((r6|0)>=(r8|0)){break}_addfield(r5,r3,r6);_luaL_addlstring(r3,r1,HEAP32[r4>>2]);r6=r6+1|0}if((r6|0)!=(r8|0)){_luaL_pushresult(r3);STACKTOP=r2;return 1}_addfield(r5,r3,r6);_luaL_pushresult(r3);STACKTOP=r2;return 1}function _tinsert(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=0;r3=STACKTOP;r4=r1;_luaL_checktype(r4,1,5);r1=_luaL_len(r4,1)+1|0;r5=_lua_gettop(r4);if((r5|0)==3){r6=_luaL_checkinteger(r4,2);if((r6|0)>(r1|0)){r1=r6}r7=r1;while(1){if((r7|0)<=(r6|0)){break}_lua_rawgeti(r4,1,r7-1|0);_lua_rawseti(r4,1,r7);r7=r7-1|0}}else if((r5|0)==2){r6=r1}else{r1=_luaL_error(r4,11808,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r8=r1;r9=r8;STACKTOP=r3;return r9}_lua_rawseti(r4,1,r6);r8=0;r9=r8;STACKTOP=r3;return r9}function _pack(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_lua_gettop(r3);_lua_createtable(r3,r1,1);_lua_pushinteger(r3,r1);_lua_setfield(r3,-2,2584);if((r1|0)<=0){STACKTOP=r2;return 1}_lua_pushvalue(r3,1);_lua_rawseti(r3,-2,1);_lua_replace(r3,1);r4=r1;while(1){if((r4|0)<2){break}_lua_rawseti(r3,1,r4);r4=r4-1|0}STACKTOP=r2;return 1}function _unpack(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=0;r3=STACKTOP;r4=r1;_luaL_checktype(r4,1,5);r1=_luaL_optinteger(r4,2,1);if((_lua_type(r4,3)|0)<=0){r5=_luaL_len(r4,1)}else{r5=_luaL_checkinteger(r4,3)}r6=r5;if((r1|0)>(r6|0)){r7=0;r8=r7;STACKTOP=r3;return r8}r5=r6-r1+1|0;do{if((r5|0)>0){if((_lua_checkstack(r4,r5)|0)==0){break}_lua_rawgeti(r4,1,r1);while(1){r9=r1;r1=r9+1|0;if((r9|0)>=(r6|0)){break}_lua_rawgeti(r4,1,r1)}r7=r5;r8=r7;STACKTOP=r3;return r8}}while(0);r5=_luaL_error(r4,2816,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r7=r5;r8=r7;STACKTOP=r3;return r8}function _tremove(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;_luaL_checktype(r3,1,5);r1=_luaL_len(r3,1);r4=_luaL_optinteger(r3,2,r1);do{if(1<=(r4|0)){if((r4|0)>(r1|0)){break}_lua_rawgeti(r3,1,r4);while(1){if((r4|0)>=(r1|0)){break}_lua_rawgeti(r3,1,r4+1|0);_lua_rawseti(r3,1,r4);r4=r4+1|0}_lua_pushnil(r3);_lua_rawseti(r3,1,r1);r5=1;r6=r5;STACKTOP=r2;return r6}}while(0);r5=0;r6=r5;STACKTOP=r2;return r6}function _sort(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_checktype(r3,1,5);r1=_luaL_len(r3,1);_luaL_checkstack(r3,40,12072);if((_lua_type(r3,2)|0)>0){_luaL_checktype(r3,2,6)}_lua_settop(r3,2);_auxsort(r3,1,r1);STACKTOP=r2;return 0}function _auxsort(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;while(1){if((r1|0)>=(r2|0)){r4=34;break}_lua_rawgeti(r7,1,r1);_lua_rawgeti(r7,1,r2);if((_sort_comp(r7,-1,-2)|0)!=0){_set2(r7,r1,r2)}else{_lua_settop(r7,-3)}if((r2-r1|0)==1){r4=7;break}r3=(r1+r2|0)/2&-1;_lua_rawgeti(r7,1,r3);_lua_rawgeti(r7,1,r1);if((_sort_comp(r7,-2,-1)|0)!=0){_set2(r7,r3,r1)}else{_lua_settop(r7,-2);_lua_rawgeti(r7,1,r2);if((_sort_comp(r7,-1,-2)|0)!=0){_set2(r7,r3,r2)}else{_lua_settop(r7,-3)}}if((r2-r1|0)==2){r4=15;break}_lua_rawgeti(r7,1,r3);_lua_pushvalue(r7,-1);_lua_rawgeti(r7,1,r2-1|0);_set2(r7,r3,r2-1|0);r3=r1;r8=r2-1|0;while(1){while(1){r9=r3+1|0;r3=r9;_lua_rawgeti(r7,1,r9);if((_sort_comp(r7,-1,-2)|0)==0){break}if((r3|0)>=(r2|0)){_luaL_error(r7,3144,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}_lua_settop(r7,-2)}while(1){r9=r8-1|0;r8=r9;_lua_rawgeti(r7,1,r9);if((_sort_comp(r7,-3,-1)|0)==0){break}if((r8|0)<=(r1|0)){_luaL_error(r7,3144,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}_lua_settop(r7,-2)}if((r8|0)<(r3|0)){break}_set2(r7,r3,r8)}_lua_settop(r7,-4);_lua_rawgeti(r7,1,r2-1|0);_lua_rawgeti(r7,1,r3);_set2(r7,r2-1|0,r3);if((r3-r1|0)<(r2-r3|0)){r8=r1;r3=r3-1|0;r1=r3+2|0}else{r8=r3+1|0;r3=r2;r2=r8-2|0}_auxsort(r7,r8,r3)}if(r4==7){STACKTOP=r6;return}else if(r4==15){STACKTOP=r6;return}else if(r4==34){STACKTOP=r6;return}}function _sort_comp(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((_lua_type(r5,2)|0)==0){r6=_lua_compare(r5,r1,r2,1);r7=r6;STACKTOP=r4;return r7}else{_lua_pushvalue(r5,2);_lua_pushvalue(r5,r1-1|0);_lua_pushvalue(r5,r2-2|0);_lua_callk(r5,2,1,0,0);r2=_lua_toboolean(r5,-1);_lua_settop(r5,-2);r6=r2;r7=r6;STACKTOP=r4;return r7}}function _set2(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;_lua_rawseti(r5,1,r2);_lua_rawseti(r5,1,r3);STACKTOP=r4;return}function _addfield(r1,r2,r3){var r4,r5,r6,r7;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;_lua_rawgeti(r6,1,r2);if((_lua_isstring(r6,-1)|0)!=0){r7=r1;_luaL_addvalue(r7);STACKTOP=r5;return}r3=_lua_typename(r6,_lua_type(r6,-1));_luaL_error(r6,11392,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r3,HEAP32[r4+8>>2]=r2,r4));STACKTOP=r4;r7=r1;_luaL_addvalue(r7);STACKTOP=r5;return}function _luaopen_package(r1){var r2,r3;r2=STACKTOP;r3=r1;_luaL_getsubtable(r3,-1001e3,3464);_lua_createtable(r3,0,1);_lua_pushcclosure(r3,14,0);_lua_setfield(r3,-2,10120);_lua_setmetatable(r3,-2);_lua_createtable(r3,0,2);_luaL_setfuncs(r3,328,0);_createsearcherstable(r3);_lua_setfield(r3,-2,7848);_setpath(r3,6152,4840,3976,3520);_setpath(r3,3136,2800,2568,11736);_lua_pushlstring(r3,11376,10);_lua_setfield(r3,-2,11080);_luaL_getsubtable(r3,-1001e3,10824);_lua_setfield(r3,-2,10632);_luaL_getsubtable(r3,-1001e3,10456);_lua_setfield(r3,-2,10176);_lua_rawgeti(r3,-1001e3,2);_lua_pushvalue(r3,-2);_luaL_setfuncs(r3,1672,1);_lua_settop(r3,-2);STACKTOP=r2;return 1}function _gctm(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaL_len(r3,1);while(1){if((r1|0)<1){break}_lua_rawgeti(r3,1,r1);_ll_unloadlib(_lua_touserdata(r3,-1));_lua_settop(r3,-2);r1=r1-1|0}STACKTOP=r2;return 0}function _createsearcherstable(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_createtable(r3,4,0);r1=0;while(1){if((HEAP32[2160+(r1<<2)>>2]|0)==0){break}_lua_pushvalue(r3,-2);_lua_pushcclosure(r3,HEAP32[2160+(r1<<2)>>2],1);_lua_rawseti(r3,-2,r1+1|0);r1=r1+1|0}STACKTOP=r2;return}function _setpath(r1,r2,r3,r4,r5){var r6,r7,r8,r9;r6=STACKTOP;r7=r1;r1=r2;r2=r5;r5=_getenv(r3);if((r5|0)==0){r5=_getenv(r4)}do{if((r5|0)!=0){if((_noenv(r7)|0)!=0){break}r5=_luaL_gsub(r7,r5,9264,9064);_luaL_gsub(r7,r5,8776,r2);_lua_remove(r7,-2);r8=r7;r9=r1;_lua_setfield(r8,-2,r9);STACKTOP=r6;return}}while(0);_lua_pushstring(r7,r2);r8=r7;r9=r1;_lua_setfield(r8,-2,r9);STACKTOP=r6;return}function _ll_require(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=_luaL_checklstring(r3,1,0);_lua_settop(r3,1);_lua_getfield(r3,-1001e3,10824);_lua_getfield(r3,2,r1);if((_lua_toboolean(r3,-1)|0)!=0){r4=1;r5=r4;STACKTOP=r2;return r5}_lua_settop(r3,-2);_findloader(r3,r1);_lua_pushstring(r3,r1);_lua_insert(r3,-2);_lua_callk(r3,2,1,0,0);if((_lua_type(r3,-1)|0)!=0){_lua_setfield(r3,2,r1)}_lua_getfield(r3,2,r1);if((_lua_type(r3,-1)|0)==0){_lua_pushboolean(r3,1);_lua_pushvalue(r3,-1);_lua_setfield(r3,2,r1)}r4=1;r5=r4;STACKTOP=r2;return r5}function _findloader(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+1040|0;r5=r4;r6=r1;r1=r2;_luaL_buffinit(r6,r5);_lua_getfield(r6,-1001001,7848);if((_lua_type(r6,3)|0)!=5){_luaL_error(r6,9728,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3}r2=1;while(1){_lua_rawgeti(r6,3,r2);if((_lua_type(r6,-1)|0)==0){_lua_settop(r6,-2);_luaL_pushresult(r5);r7=_lua_tolstring(r6,-1,0);_luaL_error(r6,9504,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r1,HEAP32[r3+8>>2]=r7,r3));STACKTOP=r3}_lua_pushstring(r6,r1);_lua_callk(r6,1,2,0,0);if((_lua_type(r6,-2)|0)==6){break}if((_lua_isstring(r6,-2)|0)!=0){_lua_settop(r6,-2);_luaL_addvalue(r5)}else{_lua_settop(r6,-3)}r2=r2+1|0}STACKTOP=r4;return}function _noenv(r1){var r2,r3;r2=STACKTOP;r3=r1;_lua_getfield(r3,-1001e3,8544);r1=_lua_toboolean(r3,-1);_lua_settop(r3,-2);STACKTOP=r2;return r1}function _searcher_preload(r1){var r2,r3,r4;r2=0;r3=STACKTOP;r4=r1;r1=_luaL_checklstring(r4,1,0);_lua_getfield(r4,-1001e3,10456);_lua_getfield(r4,-1,r1);if((_lua_type(r4,-1)|0)!=0){STACKTOP=r3;return 1}_lua_pushfstring(r4,6048,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r1,r2));STACKTOP=r2;STACKTOP=r3;return 1}function _searcher_Lua(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=_findfile(r3,_luaL_checklstring(r3,1,0),6152,8328);if((r1|0)==0){r4=1;r5=r4;STACKTOP=r2;return r5}else{r4=_checkload(r3,(_luaL_loadfilex(r3,r1,0)|0)==0|0,r1);r5=r4;STACKTOP=r2;return r5}}function _searcher_C(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;r1=_luaL_checklstring(r3,1,0);r4=_findfile(r3,r1,3136,8328);if((r4|0)==0){r5=1;r6=r5;STACKTOP=r2;return r6}else{r5=_checkload(r3,(_loadfunc(r3,r4,r1)|0)==0|0,r4);r6=r5;STACKTOP=r2;return r6}}function _searcher_Croot(r1){var r2,r3,r4,r5,r6,r7,r8;r2=0;r3=STACKTOP;r4=r1;r1=_luaL_checklstring(r4,1,0);r5=_strchr(r1,46);if((r5|0)==0){r6=0;r7=r6;STACKTOP=r3;return r7}_lua_pushlstring(r4,r1,r5-r1|0);r5=_findfile(r4,_lua_tolstring(r4,-1,0),3136,8328);if((r5|0)==0){r6=1;r7=r6;STACKTOP=r3;return r7}r8=_loadfunc(r4,r5,r1);if((r8|0)==0){_lua_pushstring(r4,r5);r6=2;r7=r6;STACKTOP=r3;return r7}if((r8|0)!=2){r6=_checkload(r4,0,r5);r7=r6;STACKTOP=r3;return r7}else{_lua_pushfstring(r4,8112,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=r1,HEAP32[r2+8>>2]=r5,r2));STACKTOP=r2;r6=1;r7=r6;STACKTOP=r3;return r7}}function _findfile(r1,r2,r3,r4){var r5,r6,r7;r5=0;r6=STACKTOP;r7=r1;r1=r3;_lua_getfield(r7,-1001001,r1);r3=_lua_tolstring(r7,-1,0);if((r3|0)==0){_luaL_error(r7,6776,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r1,r5));STACKTOP=r5}r5=_searchpath(r7,r2,r3,7664,r4);STACKTOP=r6;return r5}function _loadfunc(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r2=_luaL_gsub(r6,r2,7664,7504);r3=_strchr(r2,HEAP8[7304]|0);do{if((r3|0)!=0){r7=_lua_pushlstring(r6,r2,r3-r2|0);r8=_lua_pushfstring(r6,7168,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r7,r4));STACKTOP=r4;r7=r8;r8=_ll_loadfunc(r6,r1,r7);if((r8|0)==2){r2=r3+1|0;break}r9=r8;r10=r9;STACKTOP=r5;return r10}}while(0);r3=_lua_pushfstring(r6,7168,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r7=r3;r9=_ll_loadfunc(r6,r1,r7);r10=r9;STACKTOP=r5;return r10}function _checkload(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;r5=STACKTOP;r6=r1;r1=r3;if((r2|0)!=0){_lua_pushstring(r6,r1);r7=2;r8=r7;STACKTOP=r5;return r8}else{r2=_lua_tolstring(r6,1,0);r3=_lua_tolstring(r6,-1,0);r9=_luaL_error(r6,7888,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r1,HEAP32[r4+16>>2]=r3,r4));STACKTOP=r4;r7=r9;r8=r7;STACKTOP=r5;return r8}}function _ll_loadfunc(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=_ll_checkclib(r5,r1);do{if((r3|0)==0){r3=_ll_load(r5,r1,(HEAP8[r2]|0)==42|0);if((r3|0)!=0){_ll_addtoclib(r5,r1,r3);break}r6=1;r7=r6;STACKTOP=r4;return r7}}while(0);if((HEAP8[r2]|0)==42){_lua_pushboolean(r5,1);r6=0;r7=r6;STACKTOP=r4;return r7}r1=_ll_sym(r5,r3,r2);if((r1|0)==0){r6=2;r7=r6;STACKTOP=r4;return r7}else{_lua_pushcclosure(r5,r1,0);r6=0;r7=r6;STACKTOP=r4;return r7}}function _ll_checkclib(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;_lua_getfield(r4,-1001e3,3464);_lua_getfield(r4,-1,r2);r2=_lua_touserdata(r4,-1);_lua_settop(r4,-3);STACKTOP=r3;return r2}function _ll_load(r1,r2,r3){r3=STACKTOP;_lua_pushlstring(r1,6952,58);STACKTOP=r3;return 0}function _ll_addtoclib(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;_lua_getfield(r5,-1001e3,3464);_lua_pushlightuserdata(r5,r3);_lua_pushvalue(r5,-1);_lua_setfield(r5,-3,r2);_lua_rawseti(r5,-2,_luaL_len(r5,-2)+1|0);_lua_settop(r5,-2);STACKTOP=r4;return}function _ll_sym(r1,r2,r3){r3=STACKTOP;_lua_pushlstring(r1,6952,58);STACKTOP=r3;return 0}function _searchpath(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13;r6=0;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+1040|0;r9=r8;r10=r1;r1=r2;r2=r3;r3=r4;_luaL_buffinit(r10,r9);if((HEAP8[r3]|0)!=0){r1=_luaL_gsub(r10,r1,r3,r5)}while(1){r5=_pushnexttemplate(r10,r2);r2=r5;if((r5|0)==0){r6=8;break}r11=_luaL_gsub(r10,_lua_tolstring(r10,-1,0),6520,r1);_lua_remove(r10,-2);if((_readable(r11)|0)!=0){r6=6;break}_lua_pushfstring(r10,6352,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r11,r7));STACKTOP=r7;_lua_remove(r10,-2);_luaL_addvalue(r9)}if(r6==6){r12=r11;r13=r12;STACKTOP=r8;return r13}else if(r6==8){_luaL_pushresult(r9);r12=0;r13=r12;STACKTOP=r8;return r13}}function _pushnexttemplate(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;while(1){if((HEAP8[r1]|0)!=(HEAP8[6176]|0)){break}r1=r1+1|0}if((HEAP8[r1]|0)==0){r5=0;r6=r5;STACKTOP=r3;return r6}r2=_strchr(r1,HEAP8[6176]|0);if((r2|0)==0){r2=r1+_strlen(r1)|0}_lua_pushlstring(r4,r1,r2-r1|0);r5=r2;r6=r5;STACKTOP=r3;return r6}function _readable(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=_fopen(r1,6264);if((r3|0)==0){r4=0;r5=r4;STACKTOP=r2;return r5}else{_fclose(r3);r4=1;r5=r4;STACKTOP=r2;return r5}}function _ll_loadlib(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;r1=_luaL_checklstring(r3,1,0);r4=_ll_loadfunc(r3,r1,_luaL_checklstring(r3,2,0));if((r4|0)==0){r5=1;r6=r5;STACKTOP=r2;return r6}else{_lua_pushnil(r3);_lua_insert(r3,-2);_lua_pushstring(r3,(r4|0)==1?5664:5504);r5=3;r6=r5;STACKTOP=r2;return r6}}function _ll_searchpath(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;r3=r1;r1=_luaL_checklstring(r3,1,0);r4=_luaL_checklstring(r3,2,0);r5=_luaL_optlstring(r3,3,7664,0);if((_searchpath(r3,r1,r4,r5,_luaL_optlstring(r3,4,8328,0))|0)!=0){r6=1;r7=r6;STACKTOP=r2;return r7}else{_lua_pushnil(r3);_lua_insert(r3,-2);r6=2;r7=r6;STACKTOP=r2;return r7}}function _ll_unloadlib(r1){STACKTOP=STACKTOP;return}function _luaL_openlibs(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=1584;while(1){if((HEAP32[r1+4>>2]|0)==0){break}_luaL_requiref(r3,HEAP32[r1>>2],HEAP32[r1+4>>2],1);_lua_settop(r3,-2);r1=r1+8|0}_luaL_getsubtable(r3,-1001e3,3232);r1=12040;while(1){if((HEAP32[r1+4>>2]|0)==0){break}_lua_pushcclosure(r3,HEAP32[r1+4>>2],0);_lua_setfield(r3,-2,HEAP32[r1>>2]);r1=r1+8|0}_lua_settop(r3,-2);STACKTOP=r2;return}function _ldexp(r1,r2){return _scalbn(r1,r2)}function _malloc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86;r2=0;do{if(r1>>>0<245){if(r1>>>0<11){r3=16}else{r3=r1+11&-8}r4=r3>>>3;r5=HEAP32[12120>>2];r6=r5>>>(r4>>>0);if((r6&3|0)!=0){r7=(r6&1^1)+r4|0;r8=r7<<1;r9=12160+(r8<<2)|0;r10=12160+(r8+2<<2)|0;r8=HEAP32[r10>>2];r11=r8+8|0;r12=HEAP32[r11>>2];do{if((r9|0)==(r12|0)){HEAP32[12120>>2]=r5&~(1<<r7)}else{if(r12>>>0<HEAP32[12136>>2]>>>0){_abort()}r13=r12+12|0;if((HEAP32[r13>>2]|0)==(r8|0)){HEAP32[r13>>2]=r9;HEAP32[r10>>2]=r12;break}else{_abort()}}}while(0);r12=r7<<3;HEAP32[r8+4>>2]=r12|3;r10=r8+(r12|4)|0;HEAP32[r10>>2]=HEAP32[r10>>2]|1;r14=r11;return r14}if(r3>>>0<=HEAP32[12128>>2]>>>0){r15=r3;break}if((r6|0)!=0){r10=2<<r4;r12=r6<<r4&(r10|-r10);r10=(r12&-r12)-1|0;r12=r10>>>12&16;r9=r10>>>(r12>>>0);r10=r9>>>5&8;r13=r9>>>(r10>>>0);r9=r13>>>2&4;r16=r13>>>(r9>>>0);r13=r16>>>1&2;r17=r16>>>(r13>>>0);r16=r17>>>1&1;r18=(r10|r12|r9|r13|r16)+(r17>>>(r16>>>0))|0;r16=r18<<1;r17=12160+(r16<<2)|0;r13=12160+(r16+2<<2)|0;r16=HEAP32[r13>>2];r9=r16+8|0;r12=HEAP32[r9>>2];do{if((r17|0)==(r12|0)){HEAP32[12120>>2]=r5&~(1<<r18)}else{if(r12>>>0<HEAP32[12136>>2]>>>0){_abort()}r10=r12+12|0;if((HEAP32[r10>>2]|0)==(r16|0)){HEAP32[r10>>2]=r17;HEAP32[r13>>2]=r12;break}else{_abort()}}}while(0);r12=r18<<3;r13=r12-r3|0;HEAP32[r16+4>>2]=r3|3;r17=r16;r5=r17+r3|0;HEAP32[r17+(r3|4)>>2]=r13|1;HEAP32[r17+r12>>2]=r13;r12=HEAP32[12128>>2];if((r12|0)!=0){r17=HEAP32[12140>>2];r4=r12>>>3;r12=r4<<1;r6=12160+(r12<<2)|0;r11=HEAP32[12120>>2];r8=1<<r4;do{if((r11&r8|0)==0){HEAP32[12120>>2]=r11|r8;r19=r6;r20=12160+(r12+2<<2)|0}else{r4=12160+(r12+2<<2)|0;r7=HEAP32[r4>>2];if(r7>>>0>=HEAP32[12136>>2]>>>0){r19=r7;r20=r4;break}_abort()}}while(0);HEAP32[r20>>2]=r17;HEAP32[r19+12>>2]=r17;HEAP32[r17+8>>2]=r19;HEAP32[r17+12>>2]=r6}HEAP32[12128>>2]=r13;HEAP32[12140>>2]=r5;r14=r9;return r14}r12=HEAP32[12124>>2];if((r12|0)==0){r15=r3;break}r8=(r12&-r12)-1|0;r12=r8>>>12&16;r11=r8>>>(r12>>>0);r8=r11>>>5&8;r16=r11>>>(r8>>>0);r11=r16>>>2&4;r18=r16>>>(r11>>>0);r16=r18>>>1&2;r4=r18>>>(r16>>>0);r18=r4>>>1&1;r7=HEAP32[12424+((r8|r12|r11|r16|r18)+(r4>>>(r18>>>0))<<2)>>2];r18=r7;r4=r7;r16=(HEAP32[r7+4>>2]&-8)-r3|0;while(1){r7=HEAP32[r18+16>>2];if((r7|0)==0){r11=HEAP32[r18+20>>2];if((r11|0)==0){break}else{r21=r11}}else{r21=r7}r7=(HEAP32[r21+4>>2]&-8)-r3|0;r11=r7>>>0<r16>>>0;r18=r21;r4=r11?r21:r4;r16=r11?r7:r16}r18=r4;r9=HEAP32[12136>>2];if(r18>>>0<r9>>>0){_abort()}r5=r18+r3|0;r13=r5;if(r18>>>0>=r5>>>0){_abort()}r5=HEAP32[r4+24>>2];r6=HEAP32[r4+12>>2];do{if((r6|0)==(r4|0)){r17=r4+20|0;r7=HEAP32[r17>>2];if((r7|0)==0){r11=r4+16|0;r12=HEAP32[r11>>2];if((r12|0)==0){r22=0;break}else{r23=r12;r24=r11}}else{r23=r7;r24=r17}while(1){r17=r23+20|0;r7=HEAP32[r17>>2];if((r7|0)!=0){r23=r7;r24=r17;continue}r17=r23+16|0;r7=HEAP32[r17>>2];if((r7|0)==0){break}else{r23=r7;r24=r17}}if(r24>>>0<r9>>>0){_abort()}else{HEAP32[r24>>2]=0;r22=r23;break}}else{r17=HEAP32[r4+8>>2];if(r17>>>0<r9>>>0){_abort()}r7=r17+12|0;if((HEAP32[r7>>2]|0)!=(r4|0)){_abort()}r11=r6+8|0;if((HEAP32[r11>>2]|0)==(r4|0)){HEAP32[r7>>2]=r6;HEAP32[r11>>2]=r17;r22=r6;break}else{_abort()}}}while(0);L78:do{if((r5|0)!=0){r6=r4+28|0;r9=12424+(HEAP32[r6>>2]<<2)|0;do{if((r4|0)==(HEAP32[r9>>2]|0)){HEAP32[r9>>2]=r22;if((r22|0)!=0){break}HEAP32[12124>>2]=HEAP32[12124>>2]&~(1<<HEAP32[r6>>2]);break L78}else{if(r5>>>0<HEAP32[12136>>2]>>>0){_abort()}r17=r5+16|0;if((HEAP32[r17>>2]|0)==(r4|0)){HEAP32[r17>>2]=r22}else{HEAP32[r5+20>>2]=r22}if((r22|0)==0){break L78}}}while(0);if(r22>>>0<HEAP32[12136>>2]>>>0){_abort()}HEAP32[r22+24>>2]=r5;r6=HEAP32[r4+16>>2];do{if((r6|0)!=0){if(r6>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r22+16>>2]=r6;HEAP32[r6+24>>2]=r22;break}}}while(0);r6=HEAP32[r4+20>>2];if((r6|0)==0){break}if(r6>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r22+20>>2]=r6;HEAP32[r6+24>>2]=r22;break}}}while(0);if(r16>>>0<16){r5=r16+r3|0;HEAP32[r4+4>>2]=r5|3;r6=r18+(r5+4)|0;HEAP32[r6>>2]=HEAP32[r6>>2]|1}else{HEAP32[r4+4>>2]=r3|3;HEAP32[r18+(r3|4)>>2]=r16|1;HEAP32[r18+(r16+r3)>>2]=r16;r6=HEAP32[12128>>2];if((r6|0)!=0){r5=HEAP32[12140>>2];r9=r6>>>3;r6=r9<<1;r17=12160+(r6<<2)|0;r11=HEAP32[12120>>2];r7=1<<r9;do{if((r11&r7|0)==0){HEAP32[12120>>2]=r11|r7;r25=r17;r26=12160+(r6+2<<2)|0}else{r9=12160+(r6+2<<2)|0;r12=HEAP32[r9>>2];if(r12>>>0>=HEAP32[12136>>2]>>>0){r25=r12;r26=r9;break}_abort()}}while(0);HEAP32[r26>>2]=r5;HEAP32[r25+12>>2]=r5;HEAP32[r5+8>>2]=r25;HEAP32[r5+12>>2]=r17}HEAP32[12128>>2]=r16;HEAP32[12140>>2]=r13}r6=r4+8|0;if((r6|0)==0){r15=r3;break}else{r14=r6}return r14}else{if(r1>>>0>4294967231){r15=-1;break}r6=r1+11|0;r7=r6&-8;r11=HEAP32[12124>>2];if((r11|0)==0){r15=r7;break}r18=-r7|0;r9=r6>>>8;do{if((r9|0)==0){r27=0}else{if(r7>>>0>16777215){r27=31;break}r6=(r9+1048320|0)>>>16&8;r12=r9<<r6;r8=(r12+520192|0)>>>16&4;r10=r12<<r8;r12=(r10+245760|0)>>>16&2;r28=14-(r8|r6|r12)+(r10<<r12>>>15)|0;r27=r7>>>((r28+7|0)>>>0)&1|r28<<1}}while(0);r9=HEAP32[12424+(r27<<2)>>2];L126:do{if((r9|0)==0){r29=0;r30=r18;r31=0}else{if((r27|0)==31){r32=0}else{r32=25-(r27>>>1)|0}r4=0;r13=r18;r16=r9;r17=r7<<r32;r5=0;while(1){r28=HEAP32[r16+4>>2]&-8;r12=r28-r7|0;if(r12>>>0<r13>>>0){if((r28|0)==(r7|0)){r29=r16;r30=r12;r31=r16;break L126}else{r33=r16;r34=r12}}else{r33=r4;r34=r13}r12=HEAP32[r16+20>>2];r28=HEAP32[r16+16+(r17>>>31<<2)>>2];r10=(r12|0)==0|(r12|0)==(r28|0)?r5:r12;if((r28|0)==0){r29=r33;r30=r34;r31=r10;break}else{r4=r33;r13=r34;r16=r28;r17=r17<<1;r5=r10}}}}while(0);if((r31|0)==0&(r29|0)==0){r9=2<<r27;r18=r11&(r9|-r9);if((r18|0)==0){r15=r7;break}r9=(r18&-r18)-1|0;r18=r9>>>12&16;r5=r9>>>(r18>>>0);r9=r5>>>5&8;r17=r5>>>(r9>>>0);r5=r17>>>2&4;r16=r17>>>(r5>>>0);r17=r16>>>1&2;r13=r16>>>(r17>>>0);r16=r13>>>1&1;r35=HEAP32[12424+((r9|r18|r5|r17|r16)+(r13>>>(r16>>>0))<<2)>>2]}else{r35=r31}if((r35|0)==0){r36=r30;r37=r29}else{r16=r35;r13=r30;r17=r29;while(1){r5=(HEAP32[r16+4>>2]&-8)-r7|0;r18=r5>>>0<r13>>>0;r9=r18?r5:r13;r5=r18?r16:r17;r18=HEAP32[r16+16>>2];if((r18|0)!=0){r16=r18;r13=r9;r17=r5;continue}r18=HEAP32[r16+20>>2];if((r18|0)==0){r36=r9;r37=r5;break}else{r16=r18;r13=r9;r17=r5}}}if((r37|0)==0){r15=r7;break}if(r36>>>0>=(HEAP32[12128>>2]-r7|0)>>>0){r15=r7;break}r17=r37;r13=HEAP32[12136>>2];if(r17>>>0<r13>>>0){_abort()}r16=r17+r7|0;r11=r16;if(r17>>>0>=r16>>>0){_abort()}r5=HEAP32[r37+24>>2];r9=HEAP32[r37+12>>2];do{if((r9|0)==(r37|0)){r18=r37+20|0;r4=HEAP32[r18>>2];if((r4|0)==0){r10=r37+16|0;r28=HEAP32[r10>>2];if((r28|0)==0){r38=0;break}else{r39=r28;r40=r10}}else{r39=r4;r40=r18}while(1){r18=r39+20|0;r4=HEAP32[r18>>2];if((r4|0)!=0){r39=r4;r40=r18;continue}r18=r39+16|0;r4=HEAP32[r18>>2];if((r4|0)==0){break}else{r39=r4;r40=r18}}if(r40>>>0<r13>>>0){_abort()}else{HEAP32[r40>>2]=0;r38=r39;break}}else{r18=HEAP32[r37+8>>2];if(r18>>>0<r13>>>0){_abort()}r4=r18+12|0;if((HEAP32[r4>>2]|0)!=(r37|0)){_abort()}r10=r9+8|0;if((HEAP32[r10>>2]|0)==(r37|0)){HEAP32[r4>>2]=r9;HEAP32[r10>>2]=r18;r38=r9;break}else{_abort()}}}while(0);L176:do{if((r5|0)!=0){r9=r37+28|0;r13=12424+(HEAP32[r9>>2]<<2)|0;do{if((r37|0)==(HEAP32[r13>>2]|0)){HEAP32[r13>>2]=r38;if((r38|0)!=0){break}HEAP32[12124>>2]=HEAP32[12124>>2]&~(1<<HEAP32[r9>>2]);break L176}else{if(r5>>>0<HEAP32[12136>>2]>>>0){_abort()}r18=r5+16|0;if((HEAP32[r18>>2]|0)==(r37|0)){HEAP32[r18>>2]=r38}else{HEAP32[r5+20>>2]=r38}if((r38|0)==0){break L176}}}while(0);if(r38>>>0<HEAP32[12136>>2]>>>0){_abort()}HEAP32[r38+24>>2]=r5;r9=HEAP32[r37+16>>2];do{if((r9|0)!=0){if(r9>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r38+16>>2]=r9;HEAP32[r9+24>>2]=r38;break}}}while(0);r9=HEAP32[r37+20>>2];if((r9|0)==0){break}if(r9>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r38+20>>2]=r9;HEAP32[r9+24>>2]=r38;break}}}while(0);do{if(r36>>>0<16){r5=r36+r7|0;HEAP32[r37+4>>2]=r5|3;r9=r17+(r5+4)|0;HEAP32[r9>>2]=HEAP32[r9>>2]|1}else{HEAP32[r37+4>>2]=r7|3;HEAP32[r17+(r7|4)>>2]=r36|1;HEAP32[r17+(r36+r7)>>2]=r36;r9=r36>>>3;if(r36>>>0<256){r5=r9<<1;r13=12160+(r5<<2)|0;r18=HEAP32[12120>>2];r10=1<<r9;do{if((r18&r10|0)==0){HEAP32[12120>>2]=r18|r10;r41=r13;r42=12160+(r5+2<<2)|0}else{r9=12160+(r5+2<<2)|0;r4=HEAP32[r9>>2];if(r4>>>0>=HEAP32[12136>>2]>>>0){r41=r4;r42=r9;break}_abort()}}while(0);HEAP32[r42>>2]=r11;HEAP32[r41+12>>2]=r11;HEAP32[r17+(r7+8)>>2]=r41;HEAP32[r17+(r7+12)>>2]=r13;break}r5=r16;r10=r36>>>8;do{if((r10|0)==0){r43=0}else{if(r36>>>0>16777215){r43=31;break}r18=(r10+1048320|0)>>>16&8;r9=r10<<r18;r4=(r9+520192|0)>>>16&4;r28=r9<<r4;r9=(r28+245760|0)>>>16&2;r12=14-(r4|r18|r9)+(r28<<r9>>>15)|0;r43=r36>>>((r12+7|0)>>>0)&1|r12<<1}}while(0);r10=12424+(r43<<2)|0;HEAP32[r17+(r7+28)>>2]=r43;HEAP32[r17+(r7+20)>>2]=0;HEAP32[r17+(r7+16)>>2]=0;r13=HEAP32[12124>>2];r12=1<<r43;if((r13&r12|0)==0){HEAP32[12124>>2]=r13|r12;HEAP32[r10>>2]=r5;HEAP32[r17+(r7+24)>>2]=r10;HEAP32[r17+(r7+12)>>2]=r5;HEAP32[r17+(r7+8)>>2]=r5;break}if((r43|0)==31){r44=0}else{r44=25-(r43>>>1)|0}r12=r36<<r44;r13=HEAP32[r10>>2];while(1){if((HEAP32[r13+4>>2]&-8|0)==(r36|0)){break}r45=r13+16+(r12>>>31<<2)|0;r10=HEAP32[r45>>2];if((r10|0)==0){r2=151;break}else{r12=r12<<1;r13=r10}}if(r2==151){if(r45>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r45>>2]=r5;HEAP32[r17+(r7+24)>>2]=r13;HEAP32[r17+(r7+12)>>2]=r5;HEAP32[r17+(r7+8)>>2]=r5;break}}r12=r13+8|0;r10=HEAP32[r12>>2];r9=HEAP32[12136>>2];if(r13>>>0<r9>>>0){_abort()}if(r10>>>0<r9>>>0){_abort()}else{HEAP32[r10+12>>2]=r5;HEAP32[r12>>2]=r5;HEAP32[r17+(r7+8)>>2]=r10;HEAP32[r17+(r7+12)>>2]=r13;HEAP32[r17+(r7+24)>>2]=0;break}}}while(0);r17=r37+8|0;if((r17|0)==0){r15=r7;break}else{r14=r17}return r14}}while(0);r37=HEAP32[12128>>2];if(r15>>>0<=r37>>>0){r45=r37-r15|0;r36=HEAP32[12140>>2];if(r45>>>0>15){r44=r36;HEAP32[12140>>2]=r44+r15;HEAP32[12128>>2]=r45;HEAP32[r44+(r15+4)>>2]=r45|1;HEAP32[r44+r37>>2]=r45;HEAP32[r36+4>>2]=r15|3}else{HEAP32[12128>>2]=0;HEAP32[12140>>2]=0;HEAP32[r36+4>>2]=r37|3;r45=r36+(r37+4)|0;HEAP32[r45>>2]=HEAP32[r45>>2]|1}r14=r36+8|0;return r14}r36=HEAP32[12132>>2];if(r15>>>0<r36>>>0){r45=r36-r15|0;HEAP32[12132>>2]=r45;r36=HEAP32[12144>>2];r37=r36;HEAP32[12144>>2]=r37+r15;HEAP32[r37+(r15+4)>>2]=r45|1;HEAP32[r36+4>>2]=r15|3;r14=r36+8|0;return r14}do{if((HEAP32[12048>>2]|0)==0){r36=_sysconf(30);if((r36-1&r36|0)==0){HEAP32[12056>>2]=r36;HEAP32[12052>>2]=r36;HEAP32[12060>>2]=-1;HEAP32[12064>>2]=-1;HEAP32[12068>>2]=0;HEAP32[12564>>2]=0;r36=_time(0)&-16^1431655768;HEAP32[12048>>2]=r36;break}else{_abort()}}}while(0);r36=r15+48|0;r45=HEAP32[12056>>2];r37=r15+47|0;r44=r45+r37|0;r43=-r45|0;r45=r44&r43;if(r45>>>0<=r15>>>0){r14=0;return r14}r41=HEAP32[12560>>2];do{if((r41|0)!=0){r42=HEAP32[12552>>2];r38=r42+r45|0;if(r38>>>0<=r42>>>0|r38>>>0>r41>>>0){r14=0}else{break}return r14}}while(0);L268:do{if((HEAP32[12564>>2]&4|0)==0){r41=HEAP32[12144>>2];L270:do{if((r41|0)==0){r2=181}else{r38=r41;r42=12568;while(1){r46=r42|0;r39=HEAP32[r46>>2];if(r39>>>0<=r38>>>0){r47=r42+4|0;if((r39+HEAP32[r47>>2]|0)>>>0>r38>>>0){break}}r39=HEAP32[r42+8>>2];if((r39|0)==0){r2=181;break L270}else{r42=r39}}if((r42|0)==0){r2=181;break}r38=r44-HEAP32[12132>>2]&r43;if(r38>>>0>=2147483647){r48=0;break}r13=_sbrk(r38);r5=(r13|0)==(HEAP32[r46>>2]+HEAP32[r47>>2]|0);r49=r5?r13:-1;r50=r5?r38:0;r51=r13;r52=r38;r2=190}}while(0);do{if(r2==181){r41=_sbrk(0);if((r41|0)==-1){r48=0;break}r7=r41;r38=HEAP32[12052>>2];r13=r38-1|0;if((r13&r7|0)==0){r53=r45}else{r53=r45-r7+(r13+r7&-r38)|0}r38=HEAP32[12552>>2];r7=r38+r53|0;if(!(r53>>>0>r15>>>0&r53>>>0<2147483647)){r48=0;break}r13=HEAP32[12560>>2];if((r13|0)!=0){if(r7>>>0<=r38>>>0|r7>>>0>r13>>>0){r48=0;break}}r13=_sbrk(r53);r7=(r13|0)==(r41|0);r49=r7?r41:-1;r50=r7?r53:0;r51=r13;r52=r53;r2=190}}while(0);L290:do{if(r2==190){r13=-r52|0;if((r49|0)!=-1){r54=r50;r55=r49;r2=201;break L268}do{if((r51|0)!=-1&r52>>>0<2147483647&r52>>>0<r36>>>0){r7=HEAP32[12056>>2];r41=r37-r52+r7&-r7;if(r41>>>0>=2147483647){r56=r52;break}if((_sbrk(r41)|0)==-1){_sbrk(r13);r48=r50;break L290}else{r56=r41+r52|0;break}}else{r56=r52}}while(0);if((r51|0)==-1){r48=r50}else{r54=r56;r55=r51;r2=201;break L268}}}while(0);HEAP32[12564>>2]=HEAP32[12564>>2]|4;r57=r48;r2=198}else{r57=0;r2=198}}while(0);do{if(r2==198){if(r45>>>0>=2147483647){break}r48=_sbrk(r45);r51=_sbrk(0);if(!((r51|0)!=-1&(r48|0)!=-1&r48>>>0<r51>>>0)){break}r56=r51-r48|0;r51=r56>>>0>(r15+40|0)>>>0;r50=r51?r48:-1;if((r50|0)!=-1){r54=r51?r56:r57;r55=r50;r2=201}}}while(0);do{if(r2==201){r57=HEAP32[12552>>2]+r54|0;HEAP32[12552>>2]=r57;if(r57>>>0>HEAP32[12556>>2]>>>0){HEAP32[12556>>2]=r57}r57=HEAP32[12144>>2];L310:do{if((r57|0)==0){r45=HEAP32[12136>>2];if((r45|0)==0|r55>>>0<r45>>>0){HEAP32[12136>>2]=r55}HEAP32[12568>>2]=r55;HEAP32[12572>>2]=r54;HEAP32[12580>>2]=0;HEAP32[12156>>2]=HEAP32[12048>>2];HEAP32[12152>>2]=-1;r45=0;while(1){r50=r45<<1;r56=12160+(r50<<2)|0;HEAP32[12160+(r50+3<<2)>>2]=r56;HEAP32[12160+(r50+2<<2)>>2]=r56;r56=r45+1|0;if(r56>>>0<32){r45=r56}else{break}}r45=r55+8|0;if((r45&7|0)==0){r58=0}else{r58=-r45&7}r45=r54-40-r58|0;HEAP32[12144>>2]=r55+r58;HEAP32[12132>>2]=r45;HEAP32[r55+(r58+4)>>2]=r45|1;HEAP32[r55+(r54-36)>>2]=40;HEAP32[12148>>2]=HEAP32[12064>>2]}else{r45=12568;while(1){r59=HEAP32[r45>>2];r60=r45+4|0;r61=HEAP32[r60>>2];if((r55|0)==(r59+r61|0)){r2=213;break}r56=HEAP32[r45+8>>2];if((r56|0)==0){break}else{r45=r56}}do{if(r2==213){if((HEAP32[r45+12>>2]&8|0)!=0){break}r56=r57;if(!(r56>>>0>=r59>>>0&r56>>>0<r55>>>0)){break}HEAP32[r60>>2]=r61+r54;r56=HEAP32[12144>>2];r50=HEAP32[12132>>2]+r54|0;r51=r56;r48=r56+8|0;if((r48&7|0)==0){r62=0}else{r62=-r48&7}r48=r50-r62|0;HEAP32[12144>>2]=r51+r62;HEAP32[12132>>2]=r48;HEAP32[r51+(r62+4)>>2]=r48|1;HEAP32[r51+(r50+4)>>2]=40;HEAP32[12148>>2]=HEAP32[12064>>2];break L310}}while(0);if(r55>>>0<HEAP32[12136>>2]>>>0){HEAP32[12136>>2]=r55}r45=r55+r54|0;r50=12568;while(1){r63=r50|0;if((HEAP32[r63>>2]|0)==(r45|0)){r2=223;break}r51=HEAP32[r50+8>>2];if((r51|0)==0){break}else{r50=r51}}do{if(r2==223){if((HEAP32[r50+12>>2]&8|0)!=0){break}HEAP32[r63>>2]=r55;r45=r50+4|0;HEAP32[r45>>2]=HEAP32[r45>>2]+r54;r45=r55+8|0;if((r45&7|0)==0){r64=0}else{r64=-r45&7}r45=r55+(r54+8)|0;if((r45&7|0)==0){r65=0}else{r65=-r45&7}r45=r55+(r65+r54)|0;r51=r45;r48=r64+r15|0;r56=r55+r48|0;r52=r56;r37=r45-(r55+r64)-r15|0;HEAP32[r55+(r64+4)>>2]=r15|3;do{if((r51|0)==(HEAP32[12144>>2]|0)){r36=HEAP32[12132>>2]+r37|0;HEAP32[12132>>2]=r36;HEAP32[12144>>2]=r52;HEAP32[r55+(r48+4)>>2]=r36|1}else{if((r51|0)==(HEAP32[12140>>2]|0)){r36=HEAP32[12128>>2]+r37|0;HEAP32[12128>>2]=r36;HEAP32[12140>>2]=r52;HEAP32[r55+(r48+4)>>2]=r36|1;HEAP32[r55+(r36+r48)>>2]=r36;break}r36=r54+4|0;r49=HEAP32[r55+(r36+r65)>>2];if((r49&3|0)==1){r53=r49&-8;r47=r49>>>3;L355:do{if(r49>>>0<256){r46=HEAP32[r55+((r65|8)+r54)>>2];r43=HEAP32[r55+(r54+12+r65)>>2];r44=12160+(r47<<1<<2)|0;do{if((r46|0)!=(r44|0)){if(r46>>>0<HEAP32[12136>>2]>>>0){_abort()}if((HEAP32[r46+12>>2]|0)==(r51|0)){break}_abort()}}while(0);if((r43|0)==(r46|0)){HEAP32[12120>>2]=HEAP32[12120>>2]&~(1<<r47);break}do{if((r43|0)==(r44|0)){r66=r43+8|0}else{if(r43>>>0<HEAP32[12136>>2]>>>0){_abort()}r13=r43+8|0;if((HEAP32[r13>>2]|0)==(r51|0)){r66=r13;break}_abort()}}while(0);HEAP32[r46+12>>2]=r43;HEAP32[r66>>2]=r46}else{r44=r45;r13=HEAP32[r55+((r65|24)+r54)>>2];r42=HEAP32[r55+(r54+12+r65)>>2];do{if((r42|0)==(r44|0)){r41=r65|16;r7=r55+(r36+r41)|0;r38=HEAP32[r7>>2];if((r38|0)==0){r5=r55+(r41+r54)|0;r41=HEAP32[r5>>2];if((r41|0)==0){r67=0;break}else{r68=r41;r69=r5}}else{r68=r38;r69=r7}while(1){r7=r68+20|0;r38=HEAP32[r7>>2];if((r38|0)!=0){r68=r38;r69=r7;continue}r7=r68+16|0;r38=HEAP32[r7>>2];if((r38|0)==0){break}else{r68=r38;r69=r7}}if(r69>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r69>>2]=0;r67=r68;break}}else{r7=HEAP32[r55+((r65|8)+r54)>>2];if(r7>>>0<HEAP32[12136>>2]>>>0){_abort()}r38=r7+12|0;if((HEAP32[r38>>2]|0)!=(r44|0)){_abort()}r5=r42+8|0;if((HEAP32[r5>>2]|0)==(r44|0)){HEAP32[r38>>2]=r42;HEAP32[r5>>2]=r7;r67=r42;break}else{_abort()}}}while(0);if((r13|0)==0){break}r42=r55+(r54+28+r65)|0;r46=12424+(HEAP32[r42>>2]<<2)|0;do{if((r44|0)==(HEAP32[r46>>2]|0)){HEAP32[r46>>2]=r67;if((r67|0)!=0){break}HEAP32[12124>>2]=HEAP32[12124>>2]&~(1<<HEAP32[r42>>2]);break L355}else{if(r13>>>0<HEAP32[12136>>2]>>>0){_abort()}r43=r13+16|0;if((HEAP32[r43>>2]|0)==(r44|0)){HEAP32[r43>>2]=r67}else{HEAP32[r13+20>>2]=r67}if((r67|0)==0){break L355}}}while(0);if(r67>>>0<HEAP32[12136>>2]>>>0){_abort()}HEAP32[r67+24>>2]=r13;r44=r65|16;r42=HEAP32[r55+(r44+r54)>>2];do{if((r42|0)!=0){if(r42>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r67+16>>2]=r42;HEAP32[r42+24>>2]=r67;break}}}while(0);r42=HEAP32[r55+(r36+r44)>>2];if((r42|0)==0){break}if(r42>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r67+20>>2]=r42;HEAP32[r42+24>>2]=r67;break}}}while(0);r70=r55+((r53|r65)+r54)|0;r71=r53+r37|0}else{r70=r51;r71=r37}r36=r70+4|0;HEAP32[r36>>2]=HEAP32[r36>>2]&-2;HEAP32[r55+(r48+4)>>2]=r71|1;HEAP32[r55+(r71+r48)>>2]=r71;r36=r71>>>3;if(r71>>>0<256){r47=r36<<1;r49=12160+(r47<<2)|0;r42=HEAP32[12120>>2];r13=1<<r36;do{if((r42&r13|0)==0){HEAP32[12120>>2]=r42|r13;r72=r49;r73=12160+(r47+2<<2)|0}else{r36=12160+(r47+2<<2)|0;r46=HEAP32[r36>>2];if(r46>>>0>=HEAP32[12136>>2]>>>0){r72=r46;r73=r36;break}_abort()}}while(0);HEAP32[r73>>2]=r52;HEAP32[r72+12>>2]=r52;HEAP32[r55+(r48+8)>>2]=r72;HEAP32[r55+(r48+12)>>2]=r49;break}r47=r56;r13=r71>>>8;do{if((r13|0)==0){r74=0}else{if(r71>>>0>16777215){r74=31;break}r42=(r13+1048320|0)>>>16&8;r53=r13<<r42;r36=(r53+520192|0)>>>16&4;r46=r53<<r36;r53=(r46+245760|0)>>>16&2;r43=14-(r36|r42|r53)+(r46<<r53>>>15)|0;r74=r71>>>((r43+7|0)>>>0)&1|r43<<1}}while(0);r13=12424+(r74<<2)|0;HEAP32[r55+(r48+28)>>2]=r74;HEAP32[r55+(r48+20)>>2]=0;HEAP32[r55+(r48+16)>>2]=0;r49=HEAP32[12124>>2];r43=1<<r74;if((r49&r43|0)==0){HEAP32[12124>>2]=r49|r43;HEAP32[r13>>2]=r47;HEAP32[r55+(r48+24)>>2]=r13;HEAP32[r55+(r48+12)>>2]=r47;HEAP32[r55+(r48+8)>>2]=r47;break}if((r74|0)==31){r75=0}else{r75=25-(r74>>>1)|0}r43=r71<<r75;r49=HEAP32[r13>>2];while(1){if((HEAP32[r49+4>>2]&-8|0)==(r71|0)){break}r76=r49+16+(r43>>>31<<2)|0;r13=HEAP32[r76>>2];if((r13|0)==0){r2=296;break}else{r43=r43<<1;r49=r13}}if(r2==296){if(r76>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r76>>2]=r47;HEAP32[r55+(r48+24)>>2]=r49;HEAP32[r55+(r48+12)>>2]=r47;HEAP32[r55+(r48+8)>>2]=r47;break}}r43=r49+8|0;r13=HEAP32[r43>>2];r53=HEAP32[12136>>2];if(r49>>>0<r53>>>0){_abort()}if(r13>>>0<r53>>>0){_abort()}else{HEAP32[r13+12>>2]=r47;HEAP32[r43>>2]=r47;HEAP32[r55+(r48+8)>>2]=r13;HEAP32[r55+(r48+12)>>2]=r49;HEAP32[r55+(r48+24)>>2]=0;break}}}while(0);r14=r55+(r64|8)|0;return r14}}while(0);r50=r57;r48=12568;while(1){r77=HEAP32[r48>>2];if(r77>>>0<=r50>>>0){r78=HEAP32[r48+4>>2];r79=r77+r78|0;if(r79>>>0>r50>>>0){break}}r48=HEAP32[r48+8>>2]}r48=r77+(r78-39)|0;if((r48&7|0)==0){r80=0}else{r80=-r48&7}r48=r77+(r78-47+r80)|0;r56=r48>>>0<(r57+16|0)>>>0?r50:r48;r48=r56+8|0;r52=r55+8|0;if((r52&7|0)==0){r81=0}else{r81=-r52&7}r52=r54-40-r81|0;HEAP32[12144>>2]=r55+r81;HEAP32[12132>>2]=r52;HEAP32[r55+(r81+4)>>2]=r52|1;HEAP32[r55+(r54-36)>>2]=40;HEAP32[12148>>2]=HEAP32[12064>>2];HEAP32[r56+4>>2]=27;HEAP32[r48>>2]=HEAP32[12568>>2];HEAP32[r48+4>>2]=HEAP32[12572>>2];HEAP32[r48+8>>2]=HEAP32[12576>>2];HEAP32[r48+12>>2]=HEAP32[12580>>2];HEAP32[12568>>2]=r55;HEAP32[12572>>2]=r54;HEAP32[12580>>2]=0;HEAP32[12576>>2]=r48;r48=r56+28|0;HEAP32[r48>>2]=7;if((r56+32|0)>>>0<r79>>>0){r52=r48;while(1){r48=r52+4|0;HEAP32[r48>>2]=7;if((r52+8|0)>>>0<r79>>>0){r52=r48}else{break}}}if((r56|0)==(r50|0)){break}r52=r56-r57|0;r48=r50+(r52+4)|0;HEAP32[r48>>2]=HEAP32[r48>>2]&-2;HEAP32[r57+4>>2]=r52|1;HEAP32[r50+r52>>2]=r52;r48=r52>>>3;if(r52>>>0<256){r37=r48<<1;r51=12160+(r37<<2)|0;r45=HEAP32[12120>>2];r13=1<<r48;do{if((r45&r13|0)==0){HEAP32[12120>>2]=r45|r13;r82=r51;r83=12160+(r37+2<<2)|0}else{r48=12160+(r37+2<<2)|0;r43=HEAP32[r48>>2];if(r43>>>0>=HEAP32[12136>>2]>>>0){r82=r43;r83=r48;break}_abort()}}while(0);HEAP32[r83>>2]=r57;HEAP32[r82+12>>2]=r57;HEAP32[r57+8>>2]=r82;HEAP32[r57+12>>2]=r51;break}r37=r57;r13=r52>>>8;do{if((r13|0)==0){r84=0}else{if(r52>>>0>16777215){r84=31;break}r45=(r13+1048320|0)>>>16&8;r50=r13<<r45;r56=(r50+520192|0)>>>16&4;r48=r50<<r56;r50=(r48+245760|0)>>>16&2;r43=14-(r56|r45|r50)+(r48<<r50>>>15)|0;r84=r52>>>((r43+7|0)>>>0)&1|r43<<1}}while(0);r13=12424+(r84<<2)|0;HEAP32[r57+28>>2]=r84;HEAP32[r57+20>>2]=0;HEAP32[r57+16>>2]=0;r51=HEAP32[12124>>2];r43=1<<r84;if((r51&r43|0)==0){HEAP32[12124>>2]=r51|r43;HEAP32[r13>>2]=r37;HEAP32[r57+24>>2]=r13;HEAP32[r57+12>>2]=r57;HEAP32[r57+8>>2]=r57;break}if((r84|0)==31){r85=0}else{r85=25-(r84>>>1)|0}r43=r52<<r85;r51=HEAP32[r13>>2];while(1){if((HEAP32[r51+4>>2]&-8|0)==(r52|0)){break}r86=r51+16+(r43>>>31<<2)|0;r13=HEAP32[r86>>2];if((r13|0)==0){r2=331;break}else{r43=r43<<1;r51=r13}}if(r2==331){if(r86>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r86>>2]=r37;HEAP32[r57+24>>2]=r51;HEAP32[r57+12>>2]=r57;HEAP32[r57+8>>2]=r57;break}}r43=r51+8|0;r52=HEAP32[r43>>2];r13=HEAP32[12136>>2];if(r51>>>0<r13>>>0){_abort()}if(r52>>>0<r13>>>0){_abort()}else{HEAP32[r52+12>>2]=r37;HEAP32[r43>>2]=r37;HEAP32[r57+8>>2]=r52;HEAP32[r57+12>>2]=r51;HEAP32[r57+24>>2]=0;break}}}while(0);r57=HEAP32[12132>>2];if(r57>>>0<=r15>>>0){break}r52=r57-r15|0;HEAP32[12132>>2]=r52;r57=HEAP32[12144>>2];r43=r57;HEAP32[12144>>2]=r43+r15;HEAP32[r43+(r15+4)>>2]=r52|1;HEAP32[r57+4>>2]=r15|3;r14=r57+8|0;return r14}}while(0);r15=___errno_location();HEAP32[r15>>2]=12;r14=0;return r14}function _free(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40;r2=0;if((r1|0)==0){return}r3=r1-8|0;r4=r3;r5=HEAP32[12136>>2];if(r3>>>0<r5>>>0){_abort()}r6=HEAP32[r1-4>>2];r7=r6&3;if((r7|0)==1){_abort()}r8=r6&-8;r9=r1+(r8-8)|0;r10=r9;L10:do{if((r6&1|0)==0){r11=HEAP32[r3>>2];if((r7|0)==0){return}r12=-8-r11|0;r13=r1+r12|0;r14=r13;r15=r11+r8|0;if(r13>>>0<r5>>>0){_abort()}if((r14|0)==(HEAP32[12140>>2]|0)){r16=r1+(r8-4)|0;if((HEAP32[r16>>2]&3|0)!=3){r17=r14;r18=r15;break}HEAP32[12128>>2]=r15;HEAP32[r16>>2]=HEAP32[r16>>2]&-2;HEAP32[r1+(r12+4)>>2]=r15|1;HEAP32[r9>>2]=r15;return}r16=r11>>>3;if(r11>>>0<256){r11=HEAP32[r1+(r12+8)>>2];r19=HEAP32[r1+(r12+12)>>2];r20=12160+(r16<<1<<2)|0;do{if((r11|0)!=(r20|0)){if(r11>>>0<r5>>>0){_abort()}if((HEAP32[r11+12>>2]|0)==(r14|0)){break}_abort()}}while(0);if((r19|0)==(r11|0)){HEAP32[12120>>2]=HEAP32[12120>>2]&~(1<<r16);r17=r14;r18=r15;break}do{if((r19|0)==(r20|0)){r21=r19+8|0}else{if(r19>>>0<r5>>>0){_abort()}r22=r19+8|0;if((HEAP32[r22>>2]|0)==(r14|0)){r21=r22;break}_abort()}}while(0);HEAP32[r11+12>>2]=r19;HEAP32[r21>>2]=r11;r17=r14;r18=r15;break}r20=r13;r16=HEAP32[r1+(r12+24)>>2];r22=HEAP32[r1+(r12+12)>>2];do{if((r22|0)==(r20|0)){r23=r1+(r12+20)|0;r24=HEAP32[r23>>2];if((r24|0)==0){r25=r1+(r12+16)|0;r26=HEAP32[r25>>2];if((r26|0)==0){r27=0;break}else{r28=r26;r29=r25}}else{r28=r24;r29=r23}while(1){r23=r28+20|0;r24=HEAP32[r23>>2];if((r24|0)!=0){r28=r24;r29=r23;continue}r23=r28+16|0;r24=HEAP32[r23>>2];if((r24|0)==0){break}else{r28=r24;r29=r23}}if(r29>>>0<r5>>>0){_abort()}else{HEAP32[r29>>2]=0;r27=r28;break}}else{r23=HEAP32[r1+(r12+8)>>2];if(r23>>>0<r5>>>0){_abort()}r24=r23+12|0;if((HEAP32[r24>>2]|0)!=(r20|0)){_abort()}r25=r22+8|0;if((HEAP32[r25>>2]|0)==(r20|0)){HEAP32[r24>>2]=r22;HEAP32[r25>>2]=r23;r27=r22;break}else{_abort()}}}while(0);if((r16|0)==0){r17=r14;r18=r15;break}r22=r1+(r12+28)|0;r13=12424+(HEAP32[r22>>2]<<2)|0;do{if((r20|0)==(HEAP32[r13>>2]|0)){HEAP32[r13>>2]=r27;if((r27|0)!=0){break}HEAP32[12124>>2]=HEAP32[12124>>2]&~(1<<HEAP32[r22>>2]);r17=r14;r18=r15;break L10}else{if(r16>>>0<HEAP32[12136>>2]>>>0){_abort()}r11=r16+16|0;if((HEAP32[r11>>2]|0)==(r20|0)){HEAP32[r11>>2]=r27}else{HEAP32[r16+20>>2]=r27}if((r27|0)==0){r17=r14;r18=r15;break L10}}}while(0);if(r27>>>0<HEAP32[12136>>2]>>>0){_abort()}HEAP32[r27+24>>2]=r16;r20=HEAP32[r1+(r12+16)>>2];do{if((r20|0)!=0){if(r20>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r27+16>>2]=r20;HEAP32[r20+24>>2]=r27;break}}}while(0);r20=HEAP32[r1+(r12+20)>>2];if((r20|0)==0){r17=r14;r18=r15;break}if(r20>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r27+20>>2]=r20;HEAP32[r20+24>>2]=r27;r17=r14;r18=r15;break}}else{r17=r4;r18=r8}}while(0);r4=r17;if(r4>>>0>=r9>>>0){_abort()}r27=r1+(r8-4)|0;r5=HEAP32[r27>>2];if((r5&1|0)==0){_abort()}do{if((r5&2|0)==0){if((r10|0)==(HEAP32[12144>>2]|0)){r28=HEAP32[12132>>2]+r18|0;HEAP32[12132>>2]=r28;HEAP32[12144>>2]=r17;HEAP32[r17+4>>2]=r28|1;if((r17|0)!=(HEAP32[12140>>2]|0)){return}HEAP32[12140>>2]=0;HEAP32[12128>>2]=0;return}if((r10|0)==(HEAP32[12140>>2]|0)){r28=HEAP32[12128>>2]+r18|0;HEAP32[12128>>2]=r28;HEAP32[12140>>2]=r17;HEAP32[r17+4>>2]=r28|1;HEAP32[r4+r28>>2]=r28;return}r28=(r5&-8)+r18|0;r29=r5>>>3;L112:do{if(r5>>>0<256){r21=HEAP32[r1+r8>>2];r7=HEAP32[r1+(r8|4)>>2];r3=12160+(r29<<1<<2)|0;do{if((r21|0)!=(r3|0)){if(r21>>>0<HEAP32[12136>>2]>>>0){_abort()}if((HEAP32[r21+12>>2]|0)==(r10|0)){break}_abort()}}while(0);if((r7|0)==(r21|0)){HEAP32[12120>>2]=HEAP32[12120>>2]&~(1<<r29);break}do{if((r7|0)==(r3|0)){r30=r7+8|0}else{if(r7>>>0<HEAP32[12136>>2]>>>0){_abort()}r6=r7+8|0;if((HEAP32[r6>>2]|0)==(r10|0)){r30=r6;break}_abort()}}while(0);HEAP32[r21+12>>2]=r7;HEAP32[r30>>2]=r21}else{r3=r9;r6=HEAP32[r1+(r8+16)>>2];r20=HEAP32[r1+(r8|4)>>2];do{if((r20|0)==(r3|0)){r16=r1+(r8+12)|0;r22=HEAP32[r16>>2];if((r22|0)==0){r13=r1+(r8+8)|0;r11=HEAP32[r13>>2];if((r11|0)==0){r31=0;break}else{r32=r11;r33=r13}}else{r32=r22;r33=r16}while(1){r16=r32+20|0;r22=HEAP32[r16>>2];if((r22|0)!=0){r32=r22;r33=r16;continue}r16=r32+16|0;r22=HEAP32[r16>>2];if((r22|0)==0){break}else{r32=r22;r33=r16}}if(r33>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r33>>2]=0;r31=r32;break}}else{r16=HEAP32[r1+r8>>2];if(r16>>>0<HEAP32[12136>>2]>>>0){_abort()}r22=r16+12|0;if((HEAP32[r22>>2]|0)!=(r3|0)){_abort()}r13=r20+8|0;if((HEAP32[r13>>2]|0)==(r3|0)){HEAP32[r22>>2]=r20;HEAP32[r13>>2]=r16;r31=r20;break}else{_abort()}}}while(0);if((r6|0)==0){break}r20=r1+(r8+20)|0;r21=12424+(HEAP32[r20>>2]<<2)|0;do{if((r3|0)==(HEAP32[r21>>2]|0)){HEAP32[r21>>2]=r31;if((r31|0)!=0){break}HEAP32[12124>>2]=HEAP32[12124>>2]&~(1<<HEAP32[r20>>2]);break L112}else{if(r6>>>0<HEAP32[12136>>2]>>>0){_abort()}r7=r6+16|0;if((HEAP32[r7>>2]|0)==(r3|0)){HEAP32[r7>>2]=r31}else{HEAP32[r6+20>>2]=r31}if((r31|0)==0){break L112}}}while(0);if(r31>>>0<HEAP32[12136>>2]>>>0){_abort()}HEAP32[r31+24>>2]=r6;r3=HEAP32[r1+(r8+8)>>2];do{if((r3|0)!=0){if(r3>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r31+16>>2]=r3;HEAP32[r3+24>>2]=r31;break}}}while(0);r3=HEAP32[r1+(r8+12)>>2];if((r3|0)==0){break}if(r3>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r31+20>>2]=r3;HEAP32[r3+24>>2]=r31;break}}}while(0);HEAP32[r17+4>>2]=r28|1;HEAP32[r4+r28>>2]=r28;if((r17|0)!=(HEAP32[12140>>2]|0)){r34=r28;break}HEAP32[12128>>2]=r28;return}else{HEAP32[r27>>2]=r5&-2;HEAP32[r17+4>>2]=r18|1;HEAP32[r4+r18>>2]=r18;r34=r18}}while(0);r18=r34>>>3;if(r34>>>0<256){r4=r18<<1;r5=12160+(r4<<2)|0;r27=HEAP32[12120>>2];r31=1<<r18;do{if((r27&r31|0)==0){HEAP32[12120>>2]=r27|r31;r35=r5;r36=12160+(r4+2<<2)|0}else{r18=12160+(r4+2<<2)|0;r8=HEAP32[r18>>2];if(r8>>>0>=HEAP32[12136>>2]>>>0){r35=r8;r36=r18;break}_abort()}}while(0);HEAP32[r36>>2]=r17;HEAP32[r35+12>>2]=r17;HEAP32[r17+8>>2]=r35;HEAP32[r17+12>>2]=r5;return}r5=r17;r35=r34>>>8;do{if((r35|0)==0){r37=0}else{if(r34>>>0>16777215){r37=31;break}r36=(r35+1048320|0)>>>16&8;r4=r35<<r36;r31=(r4+520192|0)>>>16&4;r27=r4<<r31;r4=(r27+245760|0)>>>16&2;r18=14-(r31|r36|r4)+(r27<<r4>>>15)|0;r37=r34>>>((r18+7|0)>>>0)&1|r18<<1}}while(0);r35=12424+(r37<<2)|0;HEAP32[r17+28>>2]=r37;HEAP32[r17+20>>2]=0;HEAP32[r17+16>>2]=0;r18=HEAP32[12124>>2];r4=1<<r37;do{if((r18&r4|0)==0){HEAP32[12124>>2]=r18|r4;HEAP32[r35>>2]=r5;HEAP32[r17+24>>2]=r35;HEAP32[r17+12>>2]=r17;HEAP32[r17+8>>2]=r17}else{if((r37|0)==31){r38=0}else{r38=25-(r37>>>1)|0}r27=r34<<r38;r36=HEAP32[r35>>2];while(1){if((HEAP32[r36+4>>2]&-8|0)==(r34|0)){break}r39=r36+16+(r27>>>31<<2)|0;r31=HEAP32[r39>>2];if((r31|0)==0){r2=129;break}else{r27=r27<<1;r36=r31}}if(r2==129){if(r39>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r39>>2]=r5;HEAP32[r17+24>>2]=r36;HEAP32[r17+12>>2]=r17;HEAP32[r17+8>>2]=r17;break}}r27=r36+8|0;r28=HEAP32[r27>>2];r31=HEAP32[12136>>2];if(r36>>>0<r31>>>0){_abort()}if(r28>>>0<r31>>>0){_abort()}else{HEAP32[r28+12>>2]=r5;HEAP32[r27>>2]=r5;HEAP32[r17+8>>2]=r28;HEAP32[r17+12>>2]=r36;HEAP32[r17+24>>2]=0;break}}}while(0);r17=HEAP32[12152>>2]-1|0;HEAP32[12152>>2]=r17;if((r17|0)==0){r40=12576}else{return}while(1){r17=HEAP32[r40>>2];if((r17|0)==0){break}else{r40=r17+8|0}}HEAP32[12152>>2]=-1;return}function _realloc(r1,r2){var r3,r4,r5,r6;if((r1|0)==0){r3=_malloc(r2);return r3}if(r2>>>0>4294967231){r4=___errno_location();HEAP32[r4>>2]=12;r3=0;return r3}if(r2>>>0<11){r5=16}else{r5=r2+11&-8}r4=_try_realloc_chunk(r1-8|0,r5);if((r4|0)!=0){r3=r4+8|0;return r3}r4=_malloc(r2);if((r4|0)==0){r3=0;return r3}r5=HEAP32[r1-4>>2];r6=(r5&-8)-((r5&3|0)==0?8:4)|0;_memcpy(r4,r1,r6>>>0<r2>>>0?r6:r2)|0;_free(r1);r3=r4;return r3}function _try_realloc_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r3=r1+4|0;r4=HEAP32[r3>>2];r5=r4&-8;r6=r1;r7=r6+r5|0;r8=r7;r9=HEAP32[12136>>2];if(r6>>>0<r9>>>0){_abort()}r10=r4&3;if(!((r10|0)!=1&r6>>>0<r7>>>0)){_abort()}r11=r6+(r5|4)|0;r12=HEAP32[r11>>2];if((r12&1|0)==0){_abort()}if((r10|0)==0){if(r2>>>0<256){r13=0;return r13}do{if(r5>>>0>=(r2+4|0)>>>0){if((r5-r2|0)>>>0>HEAP32[12056>>2]<<1>>>0){break}else{r13=r1}return r13}}while(0);r13=0;return r13}if(r5>>>0>=r2>>>0){r10=r5-r2|0;if(r10>>>0<=15){r13=r1;return r13}HEAP32[r3>>2]=r4&1|r2|2;HEAP32[r6+(r2+4)>>2]=r10|3;HEAP32[r11>>2]=HEAP32[r11>>2]|1;_dispose_chunk(r6+r2|0,r10);r13=r1;return r13}if((r8|0)==(HEAP32[12144>>2]|0)){r10=HEAP32[12132>>2]+r5|0;if(r10>>>0<=r2>>>0){r13=0;return r13}r11=r10-r2|0;HEAP32[r3>>2]=r4&1|r2|2;HEAP32[r6+(r2+4)>>2]=r11|1;HEAP32[12144>>2]=r6+r2;HEAP32[12132>>2]=r11;r13=r1;return r13}if((r8|0)==(HEAP32[12140>>2]|0)){r11=HEAP32[12128>>2]+r5|0;if(r11>>>0<r2>>>0){r13=0;return r13}r10=r11-r2|0;if(r10>>>0>15){HEAP32[r3>>2]=r4&1|r2|2;HEAP32[r6+(r2+4)>>2]=r10|1;HEAP32[r6+r11>>2]=r10;r14=r6+(r11+4)|0;HEAP32[r14>>2]=HEAP32[r14>>2]&-2;r15=r6+r2|0;r16=r10}else{HEAP32[r3>>2]=r4&1|r11|2;r4=r6+(r11+4)|0;HEAP32[r4>>2]=HEAP32[r4>>2]|1;r15=0;r16=0}HEAP32[12128>>2]=r16;HEAP32[12140>>2]=r15;r13=r1;return r13}if((r12&2|0)!=0){r13=0;return r13}r15=(r12&-8)+r5|0;if(r15>>>0<r2>>>0){r13=0;return r13}r16=r15-r2|0;r4=r12>>>3;L52:do{if(r12>>>0<256){r11=HEAP32[r6+(r5+8)>>2];r10=HEAP32[r6+(r5+12)>>2];r14=12160+(r4<<1<<2)|0;do{if((r11|0)!=(r14|0)){if(r11>>>0<r9>>>0){_abort()}if((HEAP32[r11+12>>2]|0)==(r8|0)){break}_abort()}}while(0);if((r10|0)==(r11|0)){HEAP32[12120>>2]=HEAP32[12120>>2]&~(1<<r4);break}do{if((r10|0)==(r14|0)){r17=r10+8|0}else{if(r10>>>0<r9>>>0){_abort()}r18=r10+8|0;if((HEAP32[r18>>2]|0)==(r8|0)){r17=r18;break}_abort()}}while(0);HEAP32[r11+12>>2]=r10;HEAP32[r17>>2]=r11}else{r14=r7;r18=HEAP32[r6+(r5+24)>>2];r19=HEAP32[r6+(r5+12)>>2];do{if((r19|0)==(r14|0)){r20=r6+(r5+20)|0;r21=HEAP32[r20>>2];if((r21|0)==0){r22=r6+(r5+16)|0;r23=HEAP32[r22>>2];if((r23|0)==0){r24=0;break}else{r25=r23;r26=r22}}else{r25=r21;r26=r20}while(1){r20=r25+20|0;r21=HEAP32[r20>>2];if((r21|0)!=0){r25=r21;r26=r20;continue}r20=r25+16|0;r21=HEAP32[r20>>2];if((r21|0)==0){break}else{r25=r21;r26=r20}}if(r26>>>0<r9>>>0){_abort()}else{HEAP32[r26>>2]=0;r24=r25;break}}else{r20=HEAP32[r6+(r5+8)>>2];if(r20>>>0<r9>>>0){_abort()}r21=r20+12|0;if((HEAP32[r21>>2]|0)!=(r14|0)){_abort()}r22=r19+8|0;if((HEAP32[r22>>2]|0)==(r14|0)){HEAP32[r21>>2]=r19;HEAP32[r22>>2]=r20;r24=r19;break}else{_abort()}}}while(0);if((r18|0)==0){break}r19=r6+(r5+28)|0;r11=12424+(HEAP32[r19>>2]<<2)|0;do{if((r14|0)==(HEAP32[r11>>2]|0)){HEAP32[r11>>2]=r24;if((r24|0)!=0){break}HEAP32[12124>>2]=HEAP32[12124>>2]&~(1<<HEAP32[r19>>2]);break L52}else{if(r18>>>0<HEAP32[12136>>2]>>>0){_abort()}r10=r18+16|0;if((HEAP32[r10>>2]|0)==(r14|0)){HEAP32[r10>>2]=r24}else{HEAP32[r18+20>>2]=r24}if((r24|0)==0){break L52}}}while(0);if(r24>>>0<HEAP32[12136>>2]>>>0){_abort()}HEAP32[r24+24>>2]=r18;r14=HEAP32[r6+(r5+16)>>2];do{if((r14|0)!=0){if(r14>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r24+16>>2]=r14;HEAP32[r14+24>>2]=r24;break}}}while(0);r14=HEAP32[r6+(r5+20)>>2];if((r14|0)==0){break}if(r14>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r24+20>>2]=r14;HEAP32[r14+24>>2]=r24;break}}}while(0);if(r16>>>0<16){HEAP32[r3>>2]=r15|HEAP32[r3>>2]&1|2;r24=r6+(r15|4)|0;HEAP32[r24>>2]=HEAP32[r24>>2]|1;r13=r1;return r13}else{HEAP32[r3>>2]=HEAP32[r3>>2]&1|r2|2;HEAP32[r6+(r2+4)>>2]=r16|3;r3=r6+(r15|4)|0;HEAP32[r3>>2]=HEAP32[r3>>2]|1;_dispose_chunk(r6+r2|0,r16);r13=r1;return r13}}function _dispose_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37;r3=0;r4=r1;r5=r4+r2|0;r6=r5;r7=HEAP32[r1+4>>2];L1:do{if((r7&1|0)==0){r8=HEAP32[r1>>2];if((r7&3|0)==0){return}r9=r4+ -r8|0;r10=r9;r11=r8+r2|0;r12=HEAP32[12136>>2];if(r9>>>0<r12>>>0){_abort()}if((r10|0)==(HEAP32[12140>>2]|0)){r13=r4+(r2+4)|0;if((HEAP32[r13>>2]&3|0)!=3){r14=r10;r15=r11;break}HEAP32[12128>>2]=r11;HEAP32[r13>>2]=HEAP32[r13>>2]&-2;HEAP32[r4+(4-r8)>>2]=r11|1;HEAP32[r5>>2]=r11;return}r13=r8>>>3;if(r8>>>0<256){r16=HEAP32[r4+(8-r8)>>2];r17=HEAP32[r4+(12-r8)>>2];r18=12160+(r13<<1<<2)|0;do{if((r16|0)!=(r18|0)){if(r16>>>0<r12>>>0){_abort()}if((HEAP32[r16+12>>2]|0)==(r10|0)){break}_abort()}}while(0);if((r17|0)==(r16|0)){HEAP32[12120>>2]=HEAP32[12120>>2]&~(1<<r13);r14=r10;r15=r11;break}do{if((r17|0)==(r18|0)){r19=r17+8|0}else{if(r17>>>0<r12>>>0){_abort()}r20=r17+8|0;if((HEAP32[r20>>2]|0)==(r10|0)){r19=r20;break}_abort()}}while(0);HEAP32[r16+12>>2]=r17;HEAP32[r19>>2]=r16;r14=r10;r15=r11;break}r18=r9;r13=HEAP32[r4+(24-r8)>>2];r20=HEAP32[r4+(12-r8)>>2];do{if((r20|0)==(r18|0)){r21=16-r8|0;r22=r4+(r21+4)|0;r23=HEAP32[r22>>2];if((r23|0)==0){r24=r4+r21|0;r21=HEAP32[r24>>2];if((r21|0)==0){r25=0;break}else{r26=r21;r27=r24}}else{r26=r23;r27=r22}while(1){r22=r26+20|0;r23=HEAP32[r22>>2];if((r23|0)!=0){r26=r23;r27=r22;continue}r22=r26+16|0;r23=HEAP32[r22>>2];if((r23|0)==0){break}else{r26=r23;r27=r22}}if(r27>>>0<r12>>>0){_abort()}else{HEAP32[r27>>2]=0;r25=r26;break}}else{r22=HEAP32[r4+(8-r8)>>2];if(r22>>>0<r12>>>0){_abort()}r23=r22+12|0;if((HEAP32[r23>>2]|0)!=(r18|0)){_abort()}r24=r20+8|0;if((HEAP32[r24>>2]|0)==(r18|0)){HEAP32[r23>>2]=r20;HEAP32[r24>>2]=r22;r25=r20;break}else{_abort()}}}while(0);if((r13|0)==0){r14=r10;r15=r11;break}r20=r4+(28-r8)|0;r12=12424+(HEAP32[r20>>2]<<2)|0;do{if((r18|0)==(HEAP32[r12>>2]|0)){HEAP32[r12>>2]=r25;if((r25|0)!=0){break}HEAP32[12124>>2]=HEAP32[12124>>2]&~(1<<HEAP32[r20>>2]);r14=r10;r15=r11;break L1}else{if(r13>>>0<HEAP32[12136>>2]>>>0){_abort()}r9=r13+16|0;if((HEAP32[r9>>2]|0)==(r18|0)){HEAP32[r9>>2]=r25}else{HEAP32[r13+20>>2]=r25}if((r25|0)==0){r14=r10;r15=r11;break L1}}}while(0);if(r25>>>0<HEAP32[12136>>2]>>>0){_abort()}HEAP32[r25+24>>2]=r13;r18=16-r8|0;r20=HEAP32[r4+r18>>2];do{if((r20|0)!=0){if(r20>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r25+16>>2]=r20;HEAP32[r20+24>>2]=r25;break}}}while(0);r20=HEAP32[r4+(r18+4)>>2];if((r20|0)==0){r14=r10;r15=r11;break}if(r20>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r25+20>>2]=r20;HEAP32[r20+24>>2]=r25;r14=r10;r15=r11;break}}else{r14=r1;r15=r2}}while(0);r1=HEAP32[12136>>2];if(r5>>>0<r1>>>0){_abort()}r25=r4+(r2+4)|0;r26=HEAP32[r25>>2];do{if((r26&2|0)==0){if((r6|0)==(HEAP32[12144>>2]|0)){r27=HEAP32[12132>>2]+r15|0;HEAP32[12132>>2]=r27;HEAP32[12144>>2]=r14;HEAP32[r14+4>>2]=r27|1;if((r14|0)!=(HEAP32[12140>>2]|0)){return}HEAP32[12140>>2]=0;HEAP32[12128>>2]=0;return}if((r6|0)==(HEAP32[12140>>2]|0)){r27=HEAP32[12128>>2]+r15|0;HEAP32[12128>>2]=r27;HEAP32[12140>>2]=r14;HEAP32[r14+4>>2]=r27|1;HEAP32[r14+r27>>2]=r27;return}r27=(r26&-8)+r15|0;r19=r26>>>3;L100:do{if(r26>>>0<256){r7=HEAP32[r4+(r2+8)>>2];r20=HEAP32[r4+(r2+12)>>2];r8=12160+(r19<<1<<2)|0;do{if((r7|0)!=(r8|0)){if(r7>>>0<r1>>>0){_abort()}if((HEAP32[r7+12>>2]|0)==(r6|0)){break}_abort()}}while(0);if((r20|0)==(r7|0)){HEAP32[12120>>2]=HEAP32[12120>>2]&~(1<<r19);break}do{if((r20|0)==(r8|0)){r28=r20+8|0}else{if(r20>>>0<r1>>>0){_abort()}r13=r20+8|0;if((HEAP32[r13>>2]|0)==(r6|0)){r28=r13;break}_abort()}}while(0);HEAP32[r7+12>>2]=r20;HEAP32[r28>>2]=r7}else{r8=r5;r13=HEAP32[r4+(r2+24)>>2];r12=HEAP32[r4+(r2+12)>>2];do{if((r12|0)==(r8|0)){r9=r4+(r2+20)|0;r16=HEAP32[r9>>2];if((r16|0)==0){r17=r4+(r2+16)|0;r22=HEAP32[r17>>2];if((r22|0)==0){r29=0;break}else{r30=r22;r31=r17}}else{r30=r16;r31=r9}while(1){r9=r30+20|0;r16=HEAP32[r9>>2];if((r16|0)!=0){r30=r16;r31=r9;continue}r9=r30+16|0;r16=HEAP32[r9>>2];if((r16|0)==0){break}else{r30=r16;r31=r9}}if(r31>>>0<r1>>>0){_abort()}else{HEAP32[r31>>2]=0;r29=r30;break}}else{r9=HEAP32[r4+(r2+8)>>2];if(r9>>>0<r1>>>0){_abort()}r16=r9+12|0;if((HEAP32[r16>>2]|0)!=(r8|0)){_abort()}r17=r12+8|0;if((HEAP32[r17>>2]|0)==(r8|0)){HEAP32[r16>>2]=r12;HEAP32[r17>>2]=r9;r29=r12;break}else{_abort()}}}while(0);if((r13|0)==0){break}r12=r4+(r2+28)|0;r7=12424+(HEAP32[r12>>2]<<2)|0;do{if((r8|0)==(HEAP32[r7>>2]|0)){HEAP32[r7>>2]=r29;if((r29|0)!=0){break}HEAP32[12124>>2]=HEAP32[12124>>2]&~(1<<HEAP32[r12>>2]);break L100}else{if(r13>>>0<HEAP32[12136>>2]>>>0){_abort()}r20=r13+16|0;if((HEAP32[r20>>2]|0)==(r8|0)){HEAP32[r20>>2]=r29}else{HEAP32[r13+20>>2]=r29}if((r29|0)==0){break L100}}}while(0);if(r29>>>0<HEAP32[12136>>2]>>>0){_abort()}HEAP32[r29+24>>2]=r13;r8=HEAP32[r4+(r2+16)>>2];do{if((r8|0)!=0){if(r8>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r29+16>>2]=r8;HEAP32[r8+24>>2]=r29;break}}}while(0);r8=HEAP32[r4+(r2+20)>>2];if((r8|0)==0){break}if(r8>>>0<HEAP32[12136>>2]>>>0){_abort()}else{HEAP32[r29+20>>2]=r8;HEAP32[r8+24>>2]=r29;break}}}while(0);HEAP32[r14+4>>2]=r27|1;HEAP32[r14+r27>>2]=r27;if((r14|0)!=(HEAP32[12140>>2]|0)){r32=r27;break}HEAP32[12128>>2]=r27;return}else{HEAP32[r25>>2]=r26&-2;HEAP32[r14+4>>2]=r15|1;HEAP32[r14+r15>>2]=r15;r32=r15}}while(0);r15=r32>>>3;if(r32>>>0<256){r26=r15<<1;r25=12160+(r26<<2)|0;r29=HEAP32[12120>>2];r2=1<<r15;do{if((r29&r2|0)==0){HEAP32[12120>>2]=r29|r2;r33=r25;r34=12160+(r26+2<<2)|0}else{r15=12160+(r26+2<<2)|0;r4=HEAP32[r15>>2];if(r4>>>0>=HEAP32[12136>>2]>>>0){r33=r4;r34=r15;break}_abort()}}while(0);HEAP32[r34>>2]=r14;HEAP32[r33+12>>2]=r14;HEAP32[r14+8>>2]=r33;HEAP32[r14+12>>2]=r25;return}r25=r14;r33=r32>>>8;do{if((r33|0)==0){r35=0}else{if(r32>>>0>16777215){r35=31;break}r34=(r33+1048320|0)>>>16&8;r26=r33<<r34;r2=(r26+520192|0)>>>16&4;r29=r26<<r2;r26=(r29+245760|0)>>>16&2;r15=14-(r2|r34|r26)+(r29<<r26>>>15)|0;r35=r32>>>((r15+7|0)>>>0)&1|r15<<1}}while(0);r33=12424+(r35<<2)|0;HEAP32[r14+28>>2]=r35;HEAP32[r14+20>>2]=0;HEAP32[r14+16>>2]=0;r15=HEAP32[12124>>2];r26=1<<r35;if((r15&r26|0)==0){HEAP32[12124>>2]=r15|r26;HEAP32[r33>>2]=r25;HEAP32[r14+24>>2]=r33;HEAP32[r14+12>>2]=r14;HEAP32[r14+8>>2]=r14;return}if((r35|0)==31){r36=0}else{r36=25-(r35>>>1)|0}r35=r32<<r36;r36=HEAP32[r33>>2];while(1){if((HEAP32[r36+4>>2]&-8|0)==(r32|0)){break}r37=r36+16+(r35>>>31<<2)|0;r33=HEAP32[r37>>2];if((r33|0)==0){r3=126;break}else{r35=r35<<1;r36=r33}}if(r3==126){if(r37>>>0<HEAP32[12136>>2]>>>0){_abort()}HEAP32[r37>>2]=r25;HEAP32[r14+24>>2]=r36;HEAP32[r14+12>>2]=r14;HEAP32[r14+8>>2]=r14;return}r37=r36+8|0;r3=HEAP32[r37>>2];r35=HEAP32[12136>>2];if(r36>>>0<r35>>>0){_abort()}if(r3>>>0<r35>>>0){_abort()}HEAP32[r3+12>>2]=r25;HEAP32[r37>>2]=r25;HEAP32[r14+8>>2]=r3;HEAP32[r14+12>>2]=r36;HEAP32[r14+24>>2]=0;return}function ___floatscan(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+512|0;r6=r5;if((r2|0)==0){r7=-149;r8=24}else if((r2|0)==1){r7=-1074;r8=53}else if((r2|0)==2){r7=-1074;r8=53}else{r9=0;STACKTOP=r5;return r9}r2=r1+4|0;r10=r1+100|0;while(1){r11=HEAP32[r2>>2];if(r11>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r11+1;r12=HEAPU8[r11]}else{r12=___shgetc(r1)}if((_isspace(r12)|0)==0){break}}do{if((r12|0)==45|(r12|0)==43){r11=1-(((r12|0)==45)<<1)|0;r13=HEAP32[r2>>2];if(r13>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r13+1;r14=HEAPU8[r13];r15=r11;break}else{r14=___shgetc(r1);r15=r11;break}}else{r14=r12;r15=1}}while(0);r12=0;r11=r14;while(1){if((r11|32|0)!=(HEAP8[r12+3488|0]|0)){r16=r12;r17=r11;break}do{if(r12>>>0<7){r14=HEAP32[r2>>2];if(r14>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r14+1;r18=HEAPU8[r14];break}else{r18=___shgetc(r1);break}}else{r18=r11}}while(0);r14=r12+1|0;if(r14>>>0<8){r12=r14;r11=r18}else{r16=r14;r17=r18;break}}do{if((r16|0)==3){r4=23}else if((r16|0)!=8){r18=(r3|0)==0;if(!(r16>>>0<4|r18)){if((r16|0)==8){break}else{r4=23;break}}do{if((r16|0)==0){if((r17|32|0)==110){r11=HEAP32[r2>>2];if(r11>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r11+1;r19=HEAPU8[r11]}else{r19=___shgetc(r1)}if((r19|32|0)!=97){break}r11=HEAP32[r2>>2];if(r11>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r11+1;r20=HEAPU8[r11]}else{r20=___shgetc(r1)}if((r20|32|0)!=110){break}r11=HEAP32[r2>>2];if(r11>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r11+1;r21=HEAPU8[r11]}else{r21=___shgetc(r1)}if((r21|0)==40){r22=1}else{if((HEAP32[r10>>2]|0)==0){r9=NaN;STACKTOP=r5;return r9}HEAP32[r2>>2]=HEAP32[r2>>2]-1;r9=NaN;STACKTOP=r5;return r9}while(1){r11=HEAP32[r2>>2];if(r11>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r11+1;r23=HEAPU8[r11]}else{r23=___shgetc(r1)}if(!((r23-48|0)>>>0<10|(r23-65|0)>>>0<26)){if(!((r23-97|0)>>>0<26|(r23|0)==95)){break}}r22=r22+1|0}if((r23|0)==41){r9=NaN;STACKTOP=r5;return r9}r11=(HEAP32[r10>>2]|0)==0;if(!r11){HEAP32[r2>>2]=HEAP32[r2>>2]-1}if(r18){r12=___errno_location();HEAP32[r12>>2]=22;___shlim(r1,0);r9=0;STACKTOP=r5;return r9}if((r22|0)==0|r11){r9=NaN;STACKTOP=r5;return r9}else{r24=r22}while(1){r11=r24-1|0;HEAP32[r2>>2]=HEAP32[r2>>2]-1;if((r11|0)==0){r9=NaN;break}else{r24=r11}}STACKTOP=r5;return r9}do{if((r17|0)==48){r11=HEAP32[r2>>2];if(r11>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r11+1;r25=HEAPU8[r11]}else{r25=___shgetc(r1)}if((r25|32|0)!=120){if((HEAP32[r10>>2]|0)==0){r26=48;break}HEAP32[r2>>2]=HEAP32[r2>>2]-1;r26=48;break}r11=HEAP32[r2>>2];if(r11>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r11+1;r27=HEAPU8[r11];r28=0}else{r27=___shgetc(r1);r28=0}while(1){if((r27|0)==46){r4=68;break}else if((r27|0)!=48){r29=r27;r30=0;r31=0;r32=0;r33=0;r34=r28;r35=0;r36=0;r37=1;r38=0;r39=0;break}r11=HEAP32[r2>>2];if(r11>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r11+1;r27=HEAPU8[r11];r28=1;continue}else{r27=___shgetc(r1);r28=1;continue}}L103:do{if(r4==68){r11=HEAP32[r2>>2];if(r11>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r11+1;r40=HEAPU8[r11]}else{r40=___shgetc(r1)}if((r40|0)==48){r41=-1;r42=-1}else{r29=r40;r30=0;r31=0;r32=0;r33=0;r34=r28;r35=1;r36=0;r37=1;r38=0;r39=0;break}while(1){r11=HEAP32[r2>>2];if(r11>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r11+1;r43=HEAPU8[r11]}else{r43=___shgetc(r1)}if((r43|0)!=48){r29=r43;r30=0;r31=0;r32=r41;r33=r42;r34=1;r35=1;r36=0;r37=1;r38=0;r39=0;break L103}r11=_i64Add(r42,r41,-1,-1);r41=tempRet0;r42=r11}}}while(0);L116:while(1){r11=r29-48|0;do{if(r11>>>0<10){r44=r11;r4=82}else{r12=r29|32;r14=(r29|0)==46;if(!((r12-97|0)>>>0<6|r14)){r45=r29;break L116}if(r14){if((r35|0)==0){r46=r30;r47=r31;r48=r30;r49=r31;r50=r34;r51=1;r52=r36;r53=r37;r54=r38;r55=r39;break}else{r45=46;break L116}}else{r44=(r29|0)>57?r12-87|0:r11;r4=82;break}}}while(0);if(r4==82){r4=0;r11=0;do{if((r30|0)<(r11|0)|(r30|0)==(r11|0)&r31>>>0<8>>>0){r56=r36;r57=r37;r58=r38;r59=r44+(r39<<4)|0}else{r12=0;if((r30|0)<(r12|0)|(r30|0)==(r12|0)&r31>>>0<14>>>0){r12=r37*.0625;r56=r36;r57=r12;r58=r38+r12*(r44|0);r59=r39;break}if(!((r44|0)!=0&(r36|0)==0)){r56=r36;r57=r37;r58=r38;r59=r39;break}r56=1;r57=r37;r58=r38+r37*.5;r59=r39}}while(0);r11=_i64Add(r31,r30,1,0);r46=tempRet0;r47=r11;r48=r32;r49=r33;r50=1;r51=r35;r52=r56;r53=r57;r54=r58;r55=r59}r11=HEAP32[r2>>2];if(r11>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r11+1;r29=HEAPU8[r11];r30=r46;r31=r47;r32=r48;r33=r49;r34=r50;r35=r51;r36=r52;r37=r53;r38=r54;r39=r55;continue}else{r29=___shgetc(r1);r30=r46;r31=r47;r32=r48;r33=r49;r34=r50;r35=r51;r36=r52;r37=r53;r38=r54;r39=r55;continue}}if((r34|0)==0){r11=(HEAP32[r10>>2]|0)==0;if(!r11){HEAP32[r2>>2]=HEAP32[r2>>2]-1}do{if(r18){___shlim(r1,0)}else{if(r11){break}r12=HEAP32[r2>>2];HEAP32[r2>>2]=r12-1;if((r35|0)==0){break}HEAP32[r2>>2]=r12-2}}while(0);r9=(r15|0)*0;STACKTOP=r5;return r9}r11=(r35|0)==0;r12=r11?r31:r33;r14=r11?r30:r32;r11=0;if((r30|0)<(r11|0)|(r30|0)==(r11|0)&r31>>>0<8>>>0){r11=r39;r13=r30;r60=r31;while(1){r61=r11<<4;r62=_i64Add(r60,r13,1,0);r63=tempRet0;r64=0;if((r63|0)<(r64|0)|(r63|0)==(r64|0)&r62>>>0<8>>>0){r11=r61;r13=r63;r60=r62}else{r65=r61;break}}}else{r65=r39}do{if((r45|32|0)==112){r60=_scanexp(r1,r3);r13=tempRet0;if(!((r60|0)==0&(r13|0)==(-2147483648|0))){r66=r13;r67=r60;break}if(r18){___shlim(r1,0);r9=0;STACKTOP=r5;return r9}else{if((HEAP32[r10>>2]|0)==0){r66=0;r67=0;break}HEAP32[r2>>2]=HEAP32[r2>>2]-1;r66=0;r67=0;break}}else{if((HEAP32[r10>>2]|0)==0){r66=0;r67=0;break}HEAP32[r2>>2]=HEAP32[r2>>2]-1;r66=0;r67=0}}while(0);r60=_i64Add(r12<<2|0>>>30,r14<<2|r12>>>30,-32,-1);r13=_i64Add(r60,tempRet0,r67,r66);r60=tempRet0;if((r65|0)==0){r9=(r15|0)*0;STACKTOP=r5;return r9}r11=0;if((r60|0)>(r11|0)|(r60|0)==(r11|0)&r13>>>0>(-r7|0)>>>0){r11=___errno_location();HEAP32[r11>>2]=34;r9=(r15|0)*1.7976931348623157e+308*1.7976931348623157e+308;STACKTOP=r5;return r9}r11=r7-106|0;r61=(r11|0)<0|0?-1:0;if((r60|0)<(r61|0)|(r60|0)==(r61|0)&r13>>>0<r11>>>0){r11=___errno_location();HEAP32[r11>>2]=34;r9=(r15|0)*2.2250738585072014e-308*2.2250738585072014e-308;STACKTOP=r5;return r9}if((r65|0)>-1){r11=r65;r61=r38;r62=r60;r63=r13;while(1){r64=r11<<1;if(r61<.5){r68=r61;r69=r64}else{r68=r61-1;r69=r64|1}r64=r61+r68;r70=_i64Add(r63,r62,-1,-1);r71=tempRet0;if((r69|0)>-1){r11=r69;r61=r64;r62=r71;r63=r70}else{r72=r69;r73=r64;r74=r71;r75=r70;break}}}else{r72=r65;r73=r38;r74=r60;r75=r13}r63=0;r62=_i64Subtract(32,0,r7,(r7|0)<0|0?-1:0);r61=_i64Add(r75,r74,r62,tempRet0);r62=tempRet0;if((r63|0)>(r62|0)|(r63|0)==(r62|0)&r8>>>0>r61>>>0){r62=r61;r76=(r62|0)<0?0:r62}else{r76=r8}do{if((r76|0)<53){r62=r15|0;r61=_copysign(_scalbn(1,84-r76|0),r62);if(!((r76|0)<32&r73!=0)){r77=r73;r78=r72;r79=r61;r80=r62;break}r63=r72&1;r77=(r63|0)==0?0:r73;r78=(r63^1)+r72|0;r79=r61;r80=r62}else{r77=r73;r78=r72;r79=0;r80=r15|0}}while(0);r13=r80*r77+(r79+r80*(r78>>>0))-r79;if(r13==0){r60=___errno_location();HEAP32[r60>>2]=34}r9=_scalbnl(r13,r75);STACKTOP=r5;return r9}else{r26=r17}}while(0);r13=r7+r8|0;r60=3-r13|0;r62=r26;r61=0;while(1){if((r62|0)==46){r4=137;break}else if((r62|0)!=48){r81=r62;r82=0;r83=r61;r84=0;r85=0;break}r63=HEAP32[r2>>2];if(r63>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r63+1;r62=HEAPU8[r63];r61=1;continue}else{r62=___shgetc(r1);r61=1;continue}}L205:do{if(r4==137){r62=HEAP32[r2>>2];if(r62>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r62+1;r86=HEAPU8[r62]}else{r86=___shgetc(r1)}if((r86|0)==48){r87=-1;r88=-1}else{r81=r86;r82=1;r83=r61;r84=0;r85=0;break}while(1){r62=HEAP32[r2>>2];if(r62>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r62+1;r89=HEAPU8[r62]}else{r89=___shgetc(r1)}if((r89|0)!=48){r81=r89;r82=1;r83=1;r84=r87;r85=r88;break L205}r62=_i64Add(r88,r87,-1,-1);r87=tempRet0;r88=r62}}}while(0);r61=r6|0;HEAP32[r61>>2]=0;r62=r81-48|0;r63=(r81|0)==46;L219:do{if(r62>>>0<10|r63){r11=r6+496|0;r12=r84;r14=r85;r70=0;r71=0;r64=0;r90=r83;r91=r82;r92=0;r93=0;r94=r81;r95=r62;r96=r63;while(1){do{if(r96){if((r91|0)==0){r97=r93;r98=r92;r99=1;r100=r90;r101=r64;r102=r70;r103=r71;r104=r70;r105=r71}else{r106=r12;r107=r14;r108=r70;r109=r71;r110=r64;r111=r90;r112=r92;r113=r93;r114=r94;break L219}}else{r115=_i64Add(r71,r70,1,0);r116=tempRet0;r117=(r94|0)!=48;if((r92|0)>=125){if(!r117){r97=r93;r98=r92;r99=r91;r100=r90;r101=r64;r102=r116;r103=r115;r104=r12;r105=r14;break}HEAP32[r11>>2]=HEAP32[r11>>2]|1;r97=r93;r98=r92;r99=r91;r100=r90;r101=r64;r102=r116;r103=r115;r104=r12;r105=r14;break}r118=r6+(r92<<2)|0;if((r93|0)==0){r119=r95}else{r119=r94-48+(HEAP32[r118>>2]*10&-1)|0}HEAP32[r118>>2]=r119;r118=r93+1|0;r120=(r118|0)==9;r97=r120?0:r118;r98=(r120&1)+r92|0;r99=r91;r100=1;r101=r117?r115:r64;r102=r116;r103=r115;r104=r12;r105=r14}}while(0);r115=HEAP32[r2>>2];if(r115>>>0<HEAP32[r10>>2]>>>0){HEAP32[r2>>2]=r115+1;r121=HEAPU8[r115]}else{r121=___shgetc(r1)}r115=r121-48|0;r116=(r121|0)==46;if(r115>>>0<10|r116){r12=r104;r14=r105;r70=r102;r71=r103;r64=r101;r90=r100;r91=r99;r92=r98;r93=r97;r94=r121;r95=r115;r96=r116}else{r122=r104;r123=r105;r124=r102;r125=r103;r126=r101;r127=r100;r128=r99;r129=r98;r130=r97;r131=r121;r4=160;break}}}else{r122=r84;r123=r85;r124=0;r125=0;r126=0;r127=r83;r128=r82;r129=0;r130=0;r131=r81;r4=160}}while(0);if(r4==160){r63=(r128|0)==0;r106=r63?r124:r122;r107=r63?r125:r123;r108=r124;r109=r125;r110=r126;r111=r127;r112=r129;r113=r130;r114=r131}r63=(r111|0)!=0;do{if(r63){if((r114|32|0)!=101){r4=169;break}r62=_scanexp(r1,r3);r96=tempRet0;do{if((r62|0)==0&(r96|0)==(-2147483648|0)){if(r18){___shlim(r1,0);r9=0;STACKTOP=r5;return r9}else{if((HEAP32[r10>>2]|0)==0){r132=0;r133=0;break}HEAP32[r2>>2]=HEAP32[r2>>2]-1;r132=0;r133=0;break}}else{r132=r96;r133=r62}}while(0);r62=_i64Add(r133,r132,r107,r106);r134=tempRet0;r135=r62}else{r4=169}}while(0);do{if(r4==169){if((r114|0)<=-1){r134=r106;r135=r107;break}if((HEAP32[r10>>2]|0)==0){r134=r106;r135=r107;break}HEAP32[r2>>2]=HEAP32[r2>>2]-1;r134=r106;r135=r107}}while(0);if(!r63){r62=___errno_location();HEAP32[r62>>2]=22;___shlim(r1,0);r9=0;STACKTOP=r5;return r9}r62=HEAP32[r61>>2];if((r62|0)==0){r9=(r15|0)*0;STACKTOP=r5;return r9}r96=0;do{if((r135|0)==(r109|0)&(r134|0)==(r108|0)&((r108|0)<(r96|0)|(r108|0)==(r96|0)&r109>>>0<10>>>0)){if(r8>>>0<=30){if((r62>>>(r8>>>0)|0)!=0){break}}r9=(r15|0)*(r62>>>0);STACKTOP=r5;return r9}}while(0);r62=(r7|0)/-2&-1;r96=(r62|0)<0|0?-1:0;if((r134|0)>(r96|0)|(r134|0)==(r96|0)&r135>>>0>r62>>>0){r62=___errno_location();HEAP32[r62>>2]=34;r9=(r15|0)*1.7976931348623157e+308*1.7976931348623157e+308;STACKTOP=r5;return r9}r62=r7-106|0;r96=(r62|0)<0|0?-1:0;if((r134|0)<(r96|0)|(r134|0)==(r96|0)&r135>>>0<r62>>>0){r62=___errno_location();HEAP32[r62>>2]=34;r9=(r15|0)*2.2250738585072014e-308*2.2250738585072014e-308;STACKTOP=r5;return r9}if((r113|0)==0){r136=r112}else{if((r113|0)<9){r62=r6+(r112<<2)|0;r96=r113;r63=HEAP32[r62>>2];while(1){r137=r63*10&-1;r95=r96+1|0;if((r95|0)<9){r96=r95;r63=r137}else{break}}HEAP32[r62>>2]=r137}r136=r112+1|0}r63=r135;do{if((r110|0)<9){if(!((r110|0)<=(r63|0)&(r63|0)<18)){break}if((r63|0)==9){r9=(r15|0)*(HEAP32[r61>>2]>>>0);STACKTOP=r5;return r9}if((r63|0)<9){r9=(r15|0)*(HEAP32[r61>>2]>>>0)/(HEAP32[1992+(8-r63<<2)>>2]|0);STACKTOP=r5;return r9}r96=r8+27+(r63*-3&-1)|0;r95=HEAP32[r61>>2];if((r96|0)<=30){if((r95>>>(r96>>>0)|0)!=0){break}}r9=(r15|0)*(r95>>>0)*(HEAP32[1992+(r63-10<<2)>>2]|0);STACKTOP=r5;return r9}}while(0);r61=(r63|0)%9&-1;if((r61|0)==0){r138=0;r139=r136;r140=0;r141=r63}else{r62=(r63|0)>-1?r61:r61+9|0;r61=HEAP32[1992+(8-r62<<2)>>2];do{if((r136|0)==0){r142=0;r143=0;r144=r63}else{r95=1e9/(r61|0)&-1;r96=r63;r94=0;r93=0;r92=0;while(1){r91=r6+(r93<<2)|0;r90=HEAP32[r91>>2];r64=((r90>>>0)/(r61>>>0)&-1)+r92|0;HEAP32[r91>>2]=r64;r145=Math_imul((r90>>>0)%(r61>>>0)&-1,r95)|0;r90=r93+1|0;if((r93|0)==(r94|0)&(r64|0)==0){r146=r90&127;r147=r96-9|0}else{r146=r94;r147=r96}if((r90|0)==(r136|0)){break}else{r96=r147;r94=r146;r93=r90;r92=r145}}if((r145|0)==0){r142=r136;r143=r146;r144=r147;break}HEAP32[r6+(r136<<2)>>2]=r145;r142=r136+1|0;r143=r146;r144=r147}}while(0);r138=r143;r139=r142;r140=0;r141=9-r62+r144|0}L317:while(1){r61=r6+(r138<<2)|0;if((r141|0)<18){r63=r139;r92=r140;while(1){r93=0;r94=r63+127|0;r96=r63;while(1){r95=r94&127;r90=r6+(r95<<2)|0;r64=HEAP32[r90>>2];r91=_i64Add(r64<<29|0>>>3,0<<29|r64>>>3,r93,0);r64=tempRet0;r71=0;if(r64>>>0>r71>>>0|r64>>>0==r71>>>0&r91>>>0>1e9>>>0){r71=___udivdi3(r91,r64,1e9,0);r70=___uremdi3(r91,r64,1e9,0);r148=r71;r149=r70}else{r148=0;r149=r91}HEAP32[r90>>2]=r149;r90=(r95|0)==(r138|0);if((r95|0)!=(r96+127&127|0)|r90){r150=r96}else{r150=(r149|0)==0?r95:r96}if(r90){break}else{r93=r148;r94=r95-1|0;r96=r150}}r96=r92-29|0;if((r148|0)==0){r63=r150;r92=r96}else{r151=r96;r152=r150;r153=r148;break}}}else{if((r141|0)==18){r154=r139;r155=r140}else{r156=r138;r157=r139;r158=r140;r159=r141;break}while(1){if(HEAP32[r61>>2]>>>0>=9007199){r156=r138;r157=r154;r158=r155;r159=18;break L317}r92=0;r63=r154+127|0;r96=r154;while(1){r94=r63&127;r93=r6+(r94<<2)|0;r95=HEAP32[r93>>2];r90=_i64Add(r95<<29|0>>>3,0<<29|r95>>>3,r92,0);r95=tempRet0;r91=0;if(r95>>>0>r91>>>0|r95>>>0==r91>>>0&r90>>>0>1e9>>>0){r91=___udivdi3(r90,r95,1e9,0);r70=___uremdi3(r90,r95,1e9,0);r160=r91;r161=r70}else{r160=0;r161=r90}HEAP32[r93>>2]=r161;r93=(r94|0)==(r138|0);if((r94|0)!=(r96+127&127|0)|r93){r162=r96}else{r162=(r161|0)==0?r94:r96}if(r93){break}else{r92=r160;r63=r94-1|0;r96=r162}}r96=r155-29|0;if((r160|0)==0){r154=r162;r155=r96}else{r151=r96;r152=r162;r153=r160;break}}}r61=r138+127&127;if((r61|0)==(r152|0)){r96=r152+127&127;r63=r6+((r152+126&127)<<2)|0;HEAP32[r63>>2]=HEAP32[r63>>2]|HEAP32[r6+(r96<<2)>>2];r163=r96}else{r163=r152}HEAP32[r6+(r61<<2)>>2]=r153;r138=r61;r139=r163;r140=r151;r141=r141+9|0}L348:while(1){r164=r157+1&127;r62=r6+((r157+127&127)<<2)|0;r61=r156;r96=r158;r63=r159;while(1){r92=(r63|0)==18;r94=(r63|0)>27?9:1;r165=r61;r166=r96;while(1){r93=0;while(1){if((r93|0)>=2){r167=r93;break}r90=r93+r165&127;if((r90|0)==(r157|0)){r167=2;break}r70=HEAP32[r6+(r90<<2)>>2];r90=HEAP32[1984+(r93<<2)>>2];if(r70>>>0<r90>>>0){r167=2;break}if(r70>>>0>r90>>>0){r167=r93;break}else{r93=r93+1|0}}if((r167|0)==2&r92){break L348}r168=r94+r166|0;if((r165|0)==(r157|0)){r165=r157;r166=r168}else{break}}r92=(1<<r94)-1|0;r93=1e9>>>(r94>>>0);r90=r63;r70=r165;r91=r165;r95=0;while(1){r71=r6+(r91<<2)|0;r64=HEAP32[r71>>2];r14=(r64>>>(r94>>>0))+r95|0;HEAP32[r71>>2]=r14;r169=Math_imul(r64&r92,r93)|0;r64=(r91|0)==(r70|0)&(r14|0)==0;r14=r91+1&127;r170=r64?r90-9|0:r90;r171=r64?r14:r70;if((r14|0)==(r157|0)){break}else{r90=r170;r70=r171;r91=r14;r95=r169}}if((r169|0)==0){r61=r171;r96=r168;r63=r170;continue}if((r164|0)!=(r171|0)){break}HEAP32[r62>>2]=HEAP32[r62>>2]|1;r61=r171;r96=r168;r63=r170}HEAP32[r6+(r157<<2)>>2]=r169;r156=r171;r157=r164;r158=r168;r159=r170}r63=r165&127;if((r63|0)==(r157|0)){HEAP32[r6+(r164-1<<2)>>2]=0;r172=r164}else{r172=r157}r96=HEAP32[r6+(r63<<2)>>2]>>>0;r63=r165+1&127;if((r63|0)==(r172|0)){r61=r172+1&127;HEAP32[r6+(r61-1<<2)>>2]=0;r173=r61}else{r173=r172}r61=r15|0;r62=r61*(r96*1e9+(HEAP32[r6+(r63<<2)>>2]>>>0));r63=r166+53|0;r96=r63-r7|0;if((r96|0)<(r8|0)){r174=(r96|0)<0?0:r96;r175=1}else{r174=r8;r175=0}if((r174|0)<53){r95=_copysign(_scalbn(1,105-r174|0),r62);r91=_fmod(r62,_scalbn(1,53-r174|0));r176=r95;r177=r91;r178=r95+(r62-r91)}else{r176=0;r177=0;r178=r62}r62=r165+2&127;do{if((r62|0)==(r173|0)){r179=r177}else{r91=HEAP32[r6+(r62<<2)>>2];do{if(r91>>>0<5e8){if((r91|0)==0){if((r165+3&127|0)==(r173|0)){r180=r177;break}}r180=r61*.25+r177}else{if(r91>>>0>5e8){r180=r61*.75+r177;break}if((r165+3&127|0)==(r173|0)){r180=r61*.5+r177;break}else{r180=r61*.75+r177;break}}}while(0);if((53-r174|0)<=1){r179=r180;break}if(_fmod(r180,1)!=0){r179=r180;break}r179=r180+1}}while(0);r61=r178+r179-r176;do{if((r63&2147483647|0)>(-2-r13|0)){if(Math_abs(r61)<9007199254740992){r181=r61;r182=r175;r183=r166}else{r181=r61*.5;r182=(r175|0)!=0&(r174|0)==(r96|0)?0:r175;r183=r166+1|0}if((r183+53|0)<=(r60|0)){if(!((r182|0)!=0&r179!=0)){r184=r181;r185=r183;break}}r62=___errno_location();HEAP32[r62>>2]=34;r184=r181;r185=r183}else{r184=r61;r185=r166}}while(0);r9=_scalbnl(r184,r185);STACKTOP=r5;return r9}}while(0);if((HEAP32[r10>>2]|0)!=0){HEAP32[r2>>2]=HEAP32[r2>>2]-1}r18=___errno_location();HEAP32[r18>>2]=22;___shlim(r1,0);r9=0;STACKTOP=r5;return r9}}while(0);do{if(r4==23){r1=(HEAP32[r10>>2]|0)==0;if(!r1){HEAP32[r2>>2]=HEAP32[r2>>2]-1}if(r16>>>0<4|(r3|0)==0|r1){break}else{r186=r16}while(1){HEAP32[r2>>2]=HEAP32[r2>>2]-1;r1=r186-1|0;if(r1>>>0>3){r186=r1}else{break}}}}while(0);r9=(r15|0)*Infinity;STACKTOP=r5;return r9}function _scanexp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=r1+4|0;r4=HEAP32[r3>>2];r5=r1+100|0;if(r4>>>0<HEAP32[r5>>2]>>>0){HEAP32[r3>>2]=r4+1;r6=HEAPU8[r4]}else{r6=___shgetc(r1)}do{if((r6|0)==45|(r6|0)==43){r4=(r6|0)==45|0;r7=HEAP32[r3>>2];if(r7>>>0<HEAP32[r5>>2]>>>0){HEAP32[r3>>2]=r7+1;r8=HEAPU8[r7]}else{r8=___shgetc(r1)}if((r8-48|0)>>>0<10|(r2|0)==0){r9=r4;r10=r8;break}if((HEAP32[r5>>2]|0)==0){r9=r4;r10=r8;break}HEAP32[r3>>2]=HEAP32[r3>>2]-1;r9=r4;r10=r8}else{r9=0;r10=r6}}while(0);if((r10-48|0)>>>0>9){if((HEAP32[r5>>2]|0)==0){r11=-2147483648;r12=0;return tempRet0=r11,r12}HEAP32[r3>>2]=HEAP32[r3>>2]-1;r11=-2147483648;r12=0;return tempRet0=r11,r12}else{r13=r10;r14=0}while(1){r15=r13-48+r14|0;r10=HEAP32[r3>>2];if(r10>>>0<HEAP32[r5>>2]>>>0){HEAP32[r3>>2]=r10+1;r16=HEAPU8[r10]}else{r16=___shgetc(r1)}if(!((r16-48|0)>>>0<10&(r15|0)<214748364)){break}r13=r16;r14=r15*10&-1}r14=r15;r13=(r15|0)<0|0?-1:0;if((r16-48|0)>>>0<10){r15=r16;r10=r13;r6=r14;while(1){r8=___muldi3(r6,r10,10,0);r2=tempRet0;r4=_i64Add(r15,(r15|0)<0|0?-1:0,-48,-1);r7=_i64Add(r4,tempRet0,r8,r2);r2=tempRet0;r8=HEAP32[r3>>2];if(r8>>>0<HEAP32[r5>>2]>>>0){HEAP32[r3>>2]=r8+1;r17=HEAPU8[r8]}else{r17=___shgetc(r1)}r8=21474836;if((r17-48|0)>>>0<10&((r2|0)<(r8|0)|(r2|0)==(r8|0)&r7>>>0<2061584302>>>0)){r15=r17;r10=r2;r6=r7}else{r18=r17;r19=r2;r20=r7;break}}}else{r18=r16;r19=r13;r20=r14}if((r18-48|0)>>>0<10){while(1){r18=HEAP32[r3>>2];if(r18>>>0<HEAP32[r5>>2]>>>0){HEAP32[r3>>2]=r18+1;r21=HEAPU8[r18]}else{r21=___shgetc(r1)}if((r21-48|0)>>>0>=10){break}}}if((HEAP32[r5>>2]|0)!=0){HEAP32[r3>>2]=HEAP32[r3>>2]-1}r3=(r9|0)!=0;r9=_i64Subtract(0,0,r20,r19);r11=r3?tempRet0:r19;r12=r3?r9:r20;return tempRet0=r11,r12}function ___shlim(r1,r2){var r3,r4,r5;HEAP32[r1+104>>2]=r2;r3=HEAP32[r1+8>>2];r4=HEAP32[r1+4>>2];r5=r3-r4|0;HEAP32[r1+108>>2]=r5;if((r2|0)!=0&(r5|0)>(r2|0)){HEAP32[r1+100>>2]=r4+r2;return}else{HEAP32[r1+100>>2]=r3;return}}function ___shgetc(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=0;r3=r1+104|0;r4=HEAP32[r3>>2];if((r4|0)==0){r2=3}else{if((HEAP32[r1+108>>2]|0)<(r4|0)){r2=3}}do{if(r2==3){r4=___uflow(r1);if((r4|0)<0){break}r5=HEAP32[r3>>2];r6=HEAP32[r1+8>>2];do{if((r5|0)==0){r2=8}else{r7=HEAP32[r1+4>>2];r8=r5-HEAP32[r1+108>>2]-1|0;if((r6-r7|0)<=(r8|0)){r2=8;break}HEAP32[r1+100>>2]=r7+r8}}while(0);if(r2==8){HEAP32[r1+100>>2]=r6}r5=HEAP32[r1+4>>2];if((r6|0)!=0){r8=r1+108|0;HEAP32[r8>>2]=r6+1-r5+HEAP32[r8>>2]}r8=r5-1|0;if((HEAPU8[r8]|0)==(r4|0)){r9=r4;return r9}HEAP8[r8]=r4;r9=r4;return r9}}while(0);HEAP32[r1+100>>2]=0;r9=-1;return r9}function _scalbn(r1,r2){var r3,r4,r5,r6;do{if((r2|0)>1023){r3=r1*8.98846567431158e+307;r4=r2-1023|0;if((r4|0)<=1023){r5=r3;r6=r4;break}r4=r2-2046|0;r5=r3*8.98846567431158e+307;r6=(r4|0)>1023?1023:r4}else{if((r2|0)>=-1022){r5=r1;r6=r2;break}r4=r1*2.2250738585072014e-308;r3=r2+1022|0;if((r3|0)>=-1022){r5=r4;r6=r3;break}r3=r2+2044|0;r5=r4*2.2250738585072014e-308;r6=(r3|0)<-1022?-1022:r3}}while(0);return r5*(HEAP32[tempDoublePtr>>2]=0<<20|0>>>12,HEAP32[tempDoublePtr+4>>2]=r6+1023<<20|0>>>12,HEAPF64[tempDoublePtr>>3])}function _scalbnl(r1,r2){return _scalbn(r1,r2)}function ___toread(r1){var r2,r3,r4,r5,r6;r2=r1+74|0;r3=HEAP8[r2];HEAP8[r2]=r3-1&255|r3;r3=r1+20|0;r2=r1+44|0;if(HEAP32[r3>>2]>>>0>HEAP32[r2>>2]>>>0){FUNCTION_TABLE[HEAP32[r1+36>>2]](r1,0,0)}HEAP32[r1+16>>2]=0;HEAP32[r1+28>>2]=0;HEAP32[r3>>2]=0;r3=r1|0;r4=HEAP32[r3>>2];if((r4&20|0)==0){r5=HEAP32[r2>>2];HEAP32[r1+8>>2]=r5;HEAP32[r1+4>>2]=r5;r6=0;return r6}if((r4&4|0)==0){r6=-1;return r6}HEAP32[r3>>2]=r4|32;r6=-1;return r6}function ___uflow(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;do{if((HEAP32[r1+8>>2]|0)==0){if((___toread(r1)|0)==0){break}else{r4=-1}STACKTOP=r2;return r4}}while(0);if((FUNCTION_TABLE[HEAP32[r1+32>>2]](r1,r3,1)|0)!=1){r4=-1;STACKTOP=r2;return r4}r4=HEAPU8[r3];STACKTOP=r2;return r4}function _strtod(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=STACKTOP;STACKTOP=STACKTOP+112|0;r4=r3;_memset(r4,0,112)|0;r5=r4+4|0;HEAP32[r5>>2]=r1;r6=r4+8|0;HEAP32[r6>>2]=-1;HEAP32[r4+44>>2]=r1;HEAP32[r4+76>>2]=-1;___shlim(r4,0);r7=___floatscan(r4,1,1);r8=HEAP32[r5>>2]-HEAP32[r6>>2]+HEAP32[r4+108>>2]|0;if((r2|0)==0){STACKTOP=r3;return r7}if((r8|0)==0){r9=r1}else{r9=r1+r8|0}HEAP32[r2>>2]=r9;STACKTOP=r3;return r7}function _i64Add(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1+r3>>>0;r6=r2+r4+(r5>>>0<r1>>>0|0)>>>0;return tempRet0=r6,r5|0}function _i64Subtract(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1-r3>>>0;r6=r2-r4>>>0;r6=r2-r4-(r3>>>0>r1>>>0|0)>>>0;return tempRet0=r6,r5|0}function _bitshift64Shl(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2<<r3|(r1&r4<<32-r3)>>>32-r3;return r1<<r3}tempRet0=r1<<r3-32;return 0}function _bitshift64Lshr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=0;return r2>>>r3-32|0}function _bitshift64Ashr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=(r2|0)<0?-1:0;return r2>>r3-32|0}function _llvm_ctlz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[ctlz_i8+(r1>>>24)|0];if((r2|0)<8)return r2|0;r2=HEAP8[ctlz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[ctlz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[ctlz_i8+(r1&255)|0]+24|0}var ctlz_i8=allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"i8",ALLOC_DYNAMIC);function _llvm_cttz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[cttz_i8+(r1&255)|0];if((r2|0)<8)return r2|0;r2=HEAP8[cttz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[cttz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[cttz_i8+(r1>>>24)|0]+24|0}var cttz_i8=allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0],"i8",ALLOC_DYNAMIC);function ___muldsi3(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=0,r4=0,r5=0,r6=0,r7=0,r8=0,r9=0;r3=r1&65535;r4=r2&65535;r5=Math_imul(r4,r3)|0;r6=r1>>>16;r7=(r5>>>16)+Math_imul(r4,r6)|0;r8=r2>>>16;r9=Math_imul(r8,r3)|0;return(tempRet0=(r7>>>16)+Math_imul(r8,r6)+(((r7&65535)+r9|0)>>>16)|0,r7+r9<<16|r5&65535|0)|0}function ___divdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r5=r2>>31|((r2|0)<0?-1:0)<<1;r6=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r7=r4>>31|((r4|0)<0?-1:0)<<1;r8=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r9=_i64Subtract(r5^r1,r6^r2,r5,r6)|0;r10=tempRet0;r11=_i64Subtract(r7^r3,r8^r4,r7,r8)|0;r12=r7^r5;r13=r8^r6;r14=___udivmoddi4(r9,r10,r11,tempRet0,0)|0;r15=_i64Subtract(r14^r12,tempRet0^r13,r12,r13)|0;return(tempRet0=tempRet0,r15)|0}function ___remdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r15=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r15|0;r6=r2>>31|((r2|0)<0?-1:0)<<1;r7=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r8=r4>>31|((r4|0)<0?-1:0)<<1;r9=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r10=_i64Subtract(r6^r1,r7^r2,r6,r7)|0;r11=tempRet0;r12=_i64Subtract(r8^r3,r9^r4,r8,r9)|0;___udivmoddi4(r10,r11,r12,tempRet0,r5)|0;r13=_i64Subtract(HEAP32[r5>>2]^r6,HEAP32[r5+4>>2]^r7,r6,r7)|0;r14=tempRet0;STACKTOP=r15;return(tempRet0=r14,r13)|0}function ___muldi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0;r5=r1;r6=r3;r7=___muldsi3(r5,r6)|0;r8=tempRet0;r9=Math_imul(r2,r6)|0;return(tempRet0=Math_imul(r4,r5)+r9+r8|r8&0,r7&-1|0)|0}function ___udivdi3(r1,r2,r3,r4){var r5;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0;r5=___udivmoddi4(r1,r2,r3,r4,0)|0;return(tempRet0=tempRet0,r5)|0}function ___uremdi3(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r6|0;___udivmoddi4(r1,r2,r3,r4,r5)|0;STACKTOP=r6;return(tempRet0=HEAP32[r5+4>>2]|0,HEAP32[r5>>2]|0)|0}function ___udivmoddi4(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=r5|0;r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0,r16=0,r17=0,r18=0,r19=0,r20=0,r21=0,r22=0,r23=0,r24=0,r25=0,r26=0,r27=0,r28=0,r29=0,r30=0,r31=0,r32=0,r33=0,r34=0,r35=0,r36=0,r37=0,r38=0,r39=0,r40=0,r41=0,r42=0,r43=0,r44=0,r45=0,r46=0,r47=0,r48=0,r49=0,r50=0,r51=0,r52=0,r53=0,r54=0,r55=0,r56=0,r57=0,r58=0,r59=0,r60=0,r61=0,r62=0,r63=0,r64=0,r65=0,r66=0,r67=0,r68=0,r69=0;r6=r1;r7=r2;r8=r7;r9=r3;r10=r4;r11=r10;if((r8|0)==0){r12=(r5|0)!=0;if((r11|0)==0){if(r12){HEAP32[r5>>2]=(r6>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r6>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}else{if(!r12){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}}r13=(r11|0)==0;do{if((r9|0)==0){if(r13){if((r5|0)!=0){HEAP32[r5>>2]=(r8>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r8>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}if((r6|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=0;HEAP32[r5+4>>2]=(r8>>>0)%(r11>>>0)}r69=0;r68=(r8>>>0)/(r11>>>0)>>>0;return(tempRet0=r69,r68)|0}r14=r11-1|0;if((r14&r11|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r14&r8|r2&0}r69=0;r68=r8>>>((_llvm_cttz_i32(r11|0)|0)>>>0);return(tempRet0=r69,r68)|0}r15=_llvm_ctlz_i32(r11|0)|0;r16=r15-_llvm_ctlz_i32(r8|0)|0;if(r16>>>0<=30){r17=r16+1|0;r18=31-r16|0;r37=r17;r36=r8<<r18|r6>>>(r17>>>0);r35=r8>>>(r17>>>0);r34=0;r33=r6<<r18;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}else{if(!r13){r28=_llvm_ctlz_i32(r11|0)|0;r29=r28-_llvm_ctlz_i32(r8|0)|0;if(r29>>>0<=31){r30=r29+1|0;r31=31-r29|0;r32=r29-31>>31;r37=r30;r36=r6>>>(r30>>>0)&r32|r8<<r31;r35=r8>>>(r30>>>0)&r32;r34=0;r33=r6<<r31;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}r19=r9-1|0;if((r19&r9|0)!=0){r21=_llvm_ctlz_i32(r9|0)+33|0;r22=r21-_llvm_ctlz_i32(r8|0)|0;r23=64-r22|0;r24=32-r22|0;r25=r24>>31;r26=r22-32|0;r27=r26>>31;r37=r22;r36=r24-1>>31&r8>>>(r26>>>0)|(r8<<r24|r6>>>(r22>>>0))&r27;r35=r27&r8>>>(r22>>>0);r34=r6<<r23&r25;r33=(r8<<r23|r6>>>(r26>>>0))&r25|r6<<r24&r22-33>>31;break}if((r5|0)!=0){HEAP32[r5>>2]=r19&r6;HEAP32[r5+4>>2]=0}if((r9|0)==1){r69=r7|r2&0;r68=r1&-1|0;return(tempRet0=r69,r68)|0}else{r20=_llvm_cttz_i32(r9|0)|0;r69=r8>>>(r20>>>0)|0;r68=r8<<32-r20|r6>>>(r20>>>0)|0;return(tempRet0=r69,r68)|0}}}while(0);if((r37|0)==0){r64=r33;r63=r34;r62=r35;r61=r36;r60=0;r59=0}else{r38=r3&-1|0;r39=r10|r4&0;r40=_i64Add(r38,r39,-1,-1)|0;r41=tempRet0;r47=r33;r46=r34;r45=r35;r44=r36;r43=r37;r42=0;while(1){r48=r46>>>31|r47<<1;r49=r42|r46<<1;r50=r44<<1|r47>>>31|0;r51=r44>>>31|r45<<1|0;_i64Subtract(r40,r41,r50,r51)|0;r52=tempRet0;r53=r52>>31|((r52|0)<0?-1:0)<<1;r54=r53&1;r55=_i64Subtract(r50,r51,r53&r38,(((r52|0)<0?-1:0)>>31|((r52|0)<0?-1:0)<<1)&r39)|0;r56=r55;r57=tempRet0;r58=r43-1|0;if((r58|0)==0){break}else{r47=r48;r46=r49;r45=r57;r44=r56;r43=r58;r42=r54}}r64=r48;r63=r49;r62=r57;r61=r56;r60=0;r59=r54}r65=r63;r66=0;r67=r64|r66;if((r5|0)!=0){HEAP32[r5>>2]=r61;HEAP32[r5+4>>2]=r62}r69=(r65|0)>>>31|r67<<1|(r66<<1|r65>>>31)&0|r60;r68=(r65<<1|0>>>31)&-2|r59;return(tempRet0=r69,r68)|0}



function _incstep(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;r3=r1;r1=HEAP32[r3+12>>2];r4=HEAP32[r1+12>>2];r5=HEAP32[r1+164>>2];if((r5|0)<40){r5=40}r4=((r4|0)/200&-1)+1|0;if((r4|0)<(2147483644/(r5|0)&-1|0)){r6=Math_imul(r4,r5)|0}else{r6=2147483644}r4=r6;while(1){r4=r4-_singlestep(r3)|0;if((r4|0)>-1600){r7=(HEAPU8[r1+61|0]|0)!=5}else{r7=0}if(!r7){break}}if((HEAPU8[r1+61|0]|0)==5){r4=Math_imul(-((HEAP32[r1+20>>2]>>>0)/200&-1)|0,HEAP32[r1+156>>2])|0;r8=r1;r9=r4;_luaE_setdebt(r8,r9);STACKTOP=r2;return}else{r4=((r4|0)/(r5|0)&-1)*200&-1;r8=r1;r9=r4;_luaE_setdebt(r8,r9);STACKTOP=r2;return}}function _GCTM(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r1;r1=HEAP32[r6+12>>2];r7=r5;r8=_udata2finalize(r1);HEAP32[r7>>2]=r8;HEAP32[r7+8>>2]=HEAPU8[r8+4|0]|64;r8=_luaT_gettmbyobj(r6,r5,2);if((r8|0)==0){STACKTOP=r4;return}if((HEAP32[r8+8>>2]&15|0)!=6){STACKTOP=r4;return}r7=HEAP8[r6+41|0];r9=HEAPU8[r1+63|0];HEAP8[r6+41|0]=0;HEAP8[r1+63|0]=0;r10=r8;r8=HEAP32[r6+8>>2];r11=r8|0;r12=r10|0;HEAP32[r11>>2]=HEAP32[r12>>2];HEAP32[r11+4>>2]=HEAP32[r12+4>>2];HEAP32[r8+8>>2]=HEAP32[r10+8>>2];r10=r5;r5=HEAP32[r6+8>>2]+16|0;r8=r5|0;r12=r10|0;HEAP32[r8>>2]=HEAP32[r12>>2];HEAP32[r8+4>>2]=HEAP32[r12+4>>2];HEAP32[r5+8>>2]=HEAP32[r10+8>>2];r10=r6+8|0;HEAP32[r10>>2]=HEAP32[r10>>2]+32;r10=_luaD_pcall(r6,20,0,HEAP32[r6+8>>2]-32-HEAP32[r6+28>>2]|0,0);HEAP8[r6+41|0]=r7;HEAP8[r1+63|0]=r9;do{if((r10|0)!=0){if((r2|0)==0){break}if((r10|0)!=2){r13=r6;r14=r10;_luaD_throw(r13,r14)}if((HEAP32[HEAP32[r6+8>>2]-16+8>>2]&15|0)==4){r15=HEAP32[HEAP32[r6+8>>2]-16>>2]+16|0}else{r15=3936}_luaO_pushfstring(r6,10352,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r15,r3));STACKTOP=r3;r10=5;r13=r6;r14=r10;_luaD_throw(r13,r14)}}while(0);STACKTOP=r4;return}function _luaC_step(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=HEAP32[r3+12>>2];if((HEAP8[r1+63|0]|0)!=0){_luaC_forcestep(r3);STACKTOP=r2;return}else{_luaE_setdebt(r1,-1600);STACKTOP=r2;return}}function _luaC_fullgc(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+12>>2];r5=HEAPU8[r2+62|0];if((HEAPU8[r2+62|0]|0)==2){r6=1}else{r6=(HEAPU8[r2+61|0]|0)<=1}if((r1|0)!=0){HEAP8[r2+62|0]=1}else{HEAP8[r2+62|0]=0;_callallpendingfinalizers(r4,1)}if((r6&1|0)!=0){_entersweep(r4)}_luaC_runtilstate(r4,32);_luaC_runtilstate(r4,-33);_luaC_runtilstate(r4,32);if((r5|0)==2){_luaC_runtilstate(r4,1)}HEAP8[r2+62|0]=r5;_luaE_setdebt(r2,Math_imul(-(((HEAP32[r2+8>>2]+HEAP32[r2+12>>2]|0)>>>0)/200&-1)|0,HEAP32[r2+156>>2])|0);if((r1|0)!=0){STACKTOP=r3;return}_callallpendingfinalizers(r4,1);STACKTOP=r3;return}function _udata2finalize(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=HEAP32[r3+104>>2];HEAP32[r3+104>>2]=HEAP32[r1>>2];HEAP32[r1>>2]=HEAP32[r3+68>>2];HEAP32[r3+68>>2]=r1;r4=r1+5|0;HEAP8[r4]=HEAP8[r4]&239;if((HEAPU8[r3+62|0]|0)==2){r5=r1;STACKTOP=r2;return r5}if((HEAPU8[r3+61|0]|0)<=1){r5=r1;STACKTOP=r2;return r5}HEAP8[r1+5|0]=HEAPU8[r1+5|0]&-72|HEAP8[r3+60|0]&3&255;r5=r1;STACKTOP=r2;return r5}function _dothecall(r1,r2){var r3;r2=STACKTOP;r3=r1;_luaD_call(r3,HEAP32[r3+8>>2]-32|0,0,0);STACKTOP=r2;return}function _markroot(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;HEAP32[r3+88>>2]=0;HEAP32[r3+84>>2]=0;HEAP32[r3+96>>2]=0;HEAP32[r3+100>>2]=0;HEAP32[r3+92>>2]=0;do{if((HEAP32[r3+172>>2]|0)!=0){if((HEAP8[HEAP32[r3+172>>2]+5|0]&3|0)==0){break}_reallymarkobject(r3,HEAP32[r3+172>>2])}}while(0);if((HEAP32[r3+48>>2]&64|0)==0){r4=r3;_markmt(r4);r5=r3;_markbeingfnz(r5);STACKTOP=r2;return}if((HEAP8[HEAP32[r3+40>>2]+5|0]&3|0)==0){r4=r3;_markmt(r4);r5=r3;_markbeingfnz(r5);STACKTOP=r2;return}_reallymarkobject(r3,HEAP32[r3+40>>2]);r4=r3;_markmt(r4);r5=r3;_markbeingfnz(r5);STACKTOP=r2;return}function _propagatemark(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98;r2=0;r3=STACKTOP;r4=r1;r5=r4;r6=r5+84|0;r7=HEAP32[r6>>2];r8=r7;r9=r8;r10=r9;r11=r10+5|0;r12=HEAP8[r11];r13=r12&255;r14=r13|4;r15=r14&255;HEAP8[r11]=r15;r16=r8;r17=r16;r18=r17+4|0;r19=HEAP8[r18];r20=r19&255;switch(r20|0){case 9:{r21=r8;r22=r21;r23=r22;r24=r23;r25=r24+72|0;r26=HEAP32[r25>>2];r27=r4;r28=r27+84|0;HEAP32[r28>>2]=r26;r29=r4;r30=r23;r31=_traverseproto(r29,r30);r32=r31;break};case 6:{r33=r8;r34=r33;r35=r34;r36=r35;r37=r36;r38=r37+8|0;r39=HEAP32[r38>>2];r40=r4;r41=r40+84|0;HEAP32[r41>>2]=r39;r42=r4;r43=r36;r44=_traverseLclosure(r42,r43);r32=r44;break};case 8:{r45=r8;r46=r45;r47=r46;r48=r47;r49=r48+60|0;r50=HEAP32[r49>>2];r51=r4;r52=r51+84|0;HEAP32[r52>>2]=r50;r53=r4;r54=r53+88|0;r55=HEAP32[r54>>2];r56=r47;r57=r56+60|0;HEAP32[r57>>2]=r55;r58=r8;r59=r4;r60=r59+88|0;HEAP32[r60>>2]=r58;r61=r8;r62=r61;r63=r62+5|0;r64=HEAP8[r63];r65=r64&255;r66=r65&251;r67=r66&255;HEAP8[r63]=r67;r68=r4;r69=r47;r70=_traversestack(r68,r69);r32=r70;break};case 5:{r71=r8;r72=r71;r73=r72;r74=r73;r75=r74+24|0;r76=HEAP32[r75>>2];r77=r4;r78=r77+84|0;HEAP32[r78>>2]=r76;r79=r4;r80=r73;r81=_traversetable(r79,r80);r32=r81;break};case 38:{r82=r8;r83=r82;r84=r83;r85=r84;r86=r85;r87=r86+8|0;r88=HEAP32[r87>>2];r89=r4;r90=r89+84|0;HEAP32[r90>>2]=r88;r91=r4;r92=r85;r93=_traverseCclosure(r91,r92);r32=r93;break};default:{STACKTOP=r3;return}}r94=r32;r95=r4;r96=r95+16|0;r97=HEAP32[r96>>2];r98=r97+r94|0;HEAP32[r96>>2]=r98;STACKTOP=r3;return}function _atomic(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;r1=HEAP32[r3+12>>2];r4=-HEAP32[r1+16>>2]|0;do{if((r3|0)!=0){if((HEAP8[r3+5|0]&3|0)==0){break}_reallymarkobject(r1,r3)}}while(0);do{if((HEAP32[r1+48>>2]&64|0)!=0){if((HEAP8[HEAP32[r1+40>>2]+5|0]&3|0)==0){break}_reallymarkobject(r1,HEAP32[r1+40>>2])}}while(0);_markmt(r1);_remarkupvals(r1);_propagateall(r1);r4=r4+HEAP32[r1+16>>2]|0;_retraversegrays(r1);r4=r4-HEAP32[r1+16>>2]|0;_convergeephemerons(r1);_clearvalues(r1,HEAP32[r1+92>>2],0);_clearvalues(r1,HEAP32[r1+100>>2],0);r5=HEAP32[r1+92>>2];r6=HEAP32[r1+100>>2];r4=r4+HEAP32[r1+16>>2]|0;_separatetobefnz(r3,0);_markbeingfnz(r1);_propagateall(r1);r4=r4-HEAP32[r1+16>>2]|0;_convergeephemerons(r1);_clearkeys(r1,HEAP32[r1+96>>2],0);_clearkeys(r1,HEAP32[r1+100>>2],0);_clearvalues(r1,HEAP32[r1+92>>2],r5);_clearvalues(r1,HEAP32[r1+100>>2],r6);HEAP8[r1+60|0]=HEAPU8[r1+60|0]^3;r4=r4+HEAP32[r1+16>>2]|0;STACKTOP=r2;return r4}function _checkSizes(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=HEAP32[r3+12>>2];if((HEAPU8[r1+62|0]|0)==1){STACKTOP=r2;return}r4=(HEAP32[r1+32>>2]|0)/2&-1;if(HEAP32[r1+28>>2]>>>0<r4>>>0){_luaS_resize(r3,r4)}r4=_luaM_realloc_(r3,HEAP32[r1+144>>2],HEAP32[r1+152>>2],0);HEAP32[r1+144>>2]=r4;HEAP32[r1+152>>2]=0;STACKTOP=r2;return}function _markmt(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=0;while(1){if((r1|0)>=9){break}do{if((HEAP32[r3+252+(r1<<2)>>2]|0)!=0){if((HEAP8[HEAP32[r3+252+(r1<<2)>>2]+5|0]&3|0)==0){break}_reallymarkobject(r3,HEAP32[r3+252+(r1<<2)>>2])}}while(0);r1=r1+1|0}STACKTOP=r2;return}function _remarkupvals(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=HEAP32[r3+132>>2];while(1){if((r1|0)==(r3+112|0)){break}if((HEAP8[r1+5|0]&7|0)==0){do{if((HEAP32[HEAP32[r1+8>>2]+8>>2]&64|0)!=0){if((HEAP8[HEAP32[HEAP32[r1+8>>2]>>2]+5|0]&3|0)==0){break}_reallymarkobject(r3,HEAP32[HEAP32[r1+8>>2]>>2])}}while(0)}r1=HEAP32[r1+20>>2]}STACKTOP=r2;return}function _propagateall(r1){var r2,r3;r2=STACKTOP;r3=r1;while(1){if((HEAP32[r3+84>>2]|0)==0){break}_propagatemark(r3)}STACKTOP=r2;return}function _retraversegrays(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=HEAP32[r3+92>>2];r4=HEAP32[r3+88>>2];r5=HEAP32[r3+96>>2];HEAP32[r3+96>>2]=0;HEAP32[r3+88>>2]=0;HEAP32[r3+92>>2]=0;_propagateall(r3);_propagatelist(r3,r4);_propagatelist(r3,r1);_propagatelist(r3,r5);STACKTOP=r2;return}function _convergeephemerons(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;while(1){r1=HEAP32[r3+96>>2];HEAP32[r3+96>>2]=0;r4=0;while(1){r5=r1;r6=r5;if((r5|0)==0){break}r1=HEAP32[r6+24>>2];if((_traverseephemeron(r3,r6)|0)!=0){_propagateall(r3);r4=1}}if((r4|0)==0){break}}STACKTOP=r2;return}function _clearvalues(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;r5=r1;r1=r2;r2=r3;while(1){if((r1|0)==(r2|0)){break}r3=r1;r6=HEAP32[r3+16>>2]+(1<<HEAPU8[r3+7|0]<<5)|0;r7=0;while(1){if((r7|0)>=(HEAP32[r3+28>>2]|0)){break}r8=HEAP32[r3+12>>2]+(r7<<4)|0;if((_iscleared(r5,r8)|0)!=0){HEAP32[r8+8>>2]=0}r7=r7+1|0}r7=HEAP32[r3+16>>2]|0;while(1){if(r7>>>0>=r6>>>0){break}do{if((HEAP32[r7+8>>2]|0)!=0){if((_iscleared(r5,r7|0)|0)==0){break}HEAP32[r7+8>>2]=0;_removeentry(r7)}}while(0);r7=r7+32|0}r1=HEAP32[r1+24>>2]}STACKTOP=r4;return}function _markbeingfnz(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=HEAP32[r3+104>>2];while(1){if((r1|0)==0){break}HEAP8[r1+5|0]=HEAPU8[r1+5|0]&-72|HEAP8[r3+60|0]&3&255;_reallymarkobject(r3,r1);r1=HEAP32[r1>>2]}STACKTOP=r2;return}function _clearkeys(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;while(1){if((r1|0)==(r2|0)){break}r3=r1;r6=HEAP32[r3+16>>2]+(1<<HEAPU8[r3+7|0]<<5)|0;r7=HEAP32[r3+16>>2]|0;while(1){if(r7>>>0>=r6>>>0){break}do{if((HEAP32[r7+8>>2]|0)!=0){if((_iscleared(r5,r7+16|0)|0)==0){break}HEAP32[r7+8>>2]=0;_removeentry(r7)}}while(0);r7=r7+32|0}r1=HEAP32[r1+24>>2]}STACKTOP=r4;return}function _iscleared(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;if((HEAP32[r1+8>>2]&64|0)==0){r5=0;r6=r5;STACKTOP=r3;return r6}if((HEAP32[r1+8>>2]&15|0)!=4){r5=HEAP8[HEAP32[r1>>2]+5|0]&3;r6=r5;STACKTOP=r3;return r6}do{if((HEAP32[r1>>2]|0)!=0){if((HEAP8[HEAP32[r1>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[r1>>2])}}while(0);r5=0;r6=r5;STACKTOP=r3;return r6}function _removeentry(r1){var r2,r3;r2=STACKTOP;r3=r1;if((HEAP32[r3+24>>2]&64|0)==0){STACKTOP=r2;return}if((HEAP8[HEAP32[r3+16>>2]+5|0]&3|0)==0){STACKTOP=r2;return}HEAP32[r3+24>>2]=11;STACKTOP=r2;return}function _traverseephemeron(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=STACKTOP;r4=r1;r1=r2;r2=0;r5=0;r6=0;r7=HEAP32[r1+16>>2]+(1<<HEAPU8[r1+7|0]<<5)|0;r8=0;while(1){if((r8|0)>=(HEAP32[r1+28>>2]|0)){break}do{if((HEAP32[HEAP32[r1+12>>2]+(r8<<4)+8>>2]&64|0)!=0){if((HEAP8[HEAP32[HEAP32[r1+12>>2]+(r8<<4)>>2]+5|0]&3|0)==0){break}r2=1;_reallymarkobject(r4,HEAP32[HEAP32[r1+12>>2]+(r8<<4)>>2])}}while(0);r8=r8+1|0}r8=HEAP32[r1+16>>2]|0;while(1){if(r8>>>0>=r7>>>0){break}if((HEAP32[r8+8>>2]|0)==0){_removeentry(r8)}else{if((_iscleared(r4,r8+16|0)|0)!=0){r5=1;do{if((HEAP32[r8+8>>2]&64|0)!=0){if((HEAP8[HEAP32[r8>>2]+5|0]&3|0)==0){break}r6=1}}while(0)}else{do{if((HEAP32[r8+8>>2]&64|0)!=0){if((HEAP8[HEAP32[r8>>2]+5|0]&3|0)==0){break}r2=1;_reallymarkobject(r4,HEAP32[r8>>2])}}while(0)}}r8=r8+32|0}if((r6|0)!=0){HEAP32[r1+24>>2]=HEAP32[r4+96>>2];HEAP32[r4+96>>2]=r1;r9=r2;STACKTOP=r3;return r9}if((r5|0)!=0){HEAP32[r1+24>>2]=HEAP32[r4+100>>2];HEAP32[r4+100>>2]=r1}else{HEAP32[r1+24>>2]=HEAP32[r4+88>>2];HEAP32[r4+88>>2]=r1}r9=r2;STACKTOP=r3;return r9}function _propagatelist(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;HEAP32[r4+84>>2]=r2;_propagateall(r4);STACKTOP=r3;return}function _traversetable(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r3=STACKTOP;r4=r1;r1=r2;if((HEAP32[r1+8>>2]|0)==0){r5=0}else{if((HEAP8[HEAP32[r1+8>>2]+6|0]&8|0)!=0){r6=0}else{r6=_luaT_gettm(HEAP32[r1+8>>2],3,HEAP32[r4+196>>2])}r5=r6}r6=r5;do{if((HEAP32[r1+8>>2]|0)!=0){if((HEAP8[HEAP32[r1+8>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[r1+8>>2])}}while(0);do{if((r6|0)!=0){if((HEAP32[r6+8>>2]&15|0)!=4){break}r5=_strchr(HEAP32[r6>>2]+16|0,107);r2=_strchr(HEAP32[r6>>2]+16|0,118);if((r5|0)!=0){r7=1}else{r7=(r2|0)!=0}if(!r7){break}r8=r1+5|0;HEAP8[r8]=HEAP8[r8]&251;if((r5|0)!=0){if((r2|0)!=0){HEAP32[r1+24>>2]=HEAP32[r4+100>>2];HEAP32[r4+100>>2]=r1}else{_traverseephemeron(r4,r1)}}else{_traverseweakvalue(r4,r1)}r9=r1;r10=r9+28|0;r11=HEAP32[r10>>2];r12=r11<<4;r13=r12+32|0;r14=r1;r15=r14+7|0;r16=HEAP8[r15];r17=r16&255;r18=1<<r17;r19=r18<<5;r20=r13+r19|0;STACKTOP=r3;return r20}}while(0);_traversestrongtable(r4,r1);r9=r1;r10=r9+28|0;r11=HEAP32[r10>>2];r12=r11<<4;r13=r12+32|0;r14=r1;r15=r14+7|0;r16=HEAP8[r15];r17=r16&255;r18=1<<r17;r19=r18<<5;r20=r13+r19|0;STACKTOP=r3;return r20}function _traverseLclosure(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;do{if((HEAP32[r1+12>>2]|0)!=0){if((HEAP8[HEAP32[r1+12>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[r1+12>>2])}}while(0);r2=0;while(1){if((r2|0)>=(HEAPU8[r1+6|0]|0)){break}do{if((HEAP32[r1+16+(r2<<2)>>2]|0)!=0){if((HEAP8[HEAP32[r1+16+(r2<<2)>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[r1+16+(r2<<2)>>2])}}while(0);r2=r2+1|0}STACKTOP=r3;return(HEAPU8[r1+6|0]-1<<2)+20|0}function _traverseCclosure(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;r2=0;while(1){if((r2|0)>=(HEAPU8[r1+6|0]|0)){break}do{if((HEAP32[r1+16+(r2<<4)+8>>2]&64|0)!=0){if((HEAP8[HEAP32[r1+16+(r2<<4)>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[r1+16+(r2<<4)>>2])}}while(0);r2=r2+1|0}STACKTOP=r3;return(HEAPU8[r1+6|0]-1<<4)+32|0}function _traversestack(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r1+28>>2];if((r2|0)==0){r5=1;r6=r5;STACKTOP=r3;return r6}while(1){if(r2>>>0>=HEAP32[r1+8>>2]>>>0){break}do{if((HEAP32[r2+8>>2]&64|0)!=0){if((HEAP8[HEAP32[r2>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[r2>>2])}}while(0);r2=r2+16|0}if((HEAPU8[r4+61|0]|0)==1){r4=HEAP32[r1+28>>2]+(HEAP32[r1+32>>2]<<4)|0;while(1){if(r2>>>0>=r4>>>0){break}HEAP32[r2+8>>2]=0;r2=r2+16|0}}r5=(HEAP32[r1+32>>2]<<4)+112|0;r6=r5;STACKTOP=r3;return r6}function _traverseproto(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;do{if((HEAP32[r1+32>>2]|0)!=0){if((HEAP8[HEAP32[r1+32>>2]+5|0]&3|0)==0){break}HEAP32[r1+32>>2]=0}}while(0);do{if((HEAP32[r1+36>>2]|0)!=0){if((HEAP8[HEAP32[r1+36>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[r1+36>>2])}}while(0);r2=0;while(1){if((r2|0)>=(HEAP32[r1+44>>2]|0)){break}do{if((HEAP32[HEAP32[r1+8>>2]+(r2<<4)+8>>2]&64|0)!=0){if((HEAP8[HEAP32[HEAP32[r1+8>>2]+(r2<<4)>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[HEAP32[r1+8>>2]+(r2<<4)>>2])}}while(0);r2=r2+1|0}r2=0;while(1){if((r2|0)>=(HEAP32[r1+40>>2]|0)){break}do{if((HEAP32[HEAP32[r1+28>>2]+(r2<<3)>>2]|0)!=0){if((HEAP8[HEAP32[HEAP32[r1+28>>2]+(r2<<3)>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[HEAP32[r1+28>>2]+(r2<<3)>>2])}}while(0);r2=r2+1|0}r2=0;while(1){if((r2|0)>=(HEAP32[r1+56>>2]|0)){break}do{if((HEAP32[HEAP32[r1+16>>2]+(r2<<2)>>2]|0)!=0){if((HEAP8[HEAP32[HEAP32[r1+16>>2]+(r2<<2)>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[HEAP32[r1+16>>2]+(r2<<2)>>2])}}while(0);r2=r2+1|0}r2=0;while(1){if((r2|0)>=(HEAP32[r1+60>>2]|0)){break}do{if((HEAP32[HEAP32[r1+24>>2]+(r2*12&-1)>>2]|0)!=0){if((HEAP8[HEAP32[HEAP32[r1+24>>2]+(r2*12&-1)>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[HEAP32[r1+24>>2]+(r2*12&-1)>>2])}}while(0);r2=r2+1|0}STACKTOP=r3;return(HEAP32[r1+48>>2]<<2)+80+(HEAP32[r1+56>>2]<<2)+(HEAP32[r1+44>>2]<<4)+(HEAP32[r1+52>>2]<<2)+(HEAP32[r1+60>>2]*12&-1)+(HEAP32[r1+40>>2]<<3)|0}function _traverseweakvalue(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r1+16>>2]+(1<<HEAPU8[r1+7|0]<<5)|0;r5=(HEAP32[r1+28>>2]|0)>0|0;r6=HEAP32[r1+16>>2]|0;while(1){if(r6>>>0>=r2>>>0){break}if((HEAP32[r6+8>>2]|0)==0){_removeentry(r6)}else{do{if((HEAP32[r6+24>>2]&64|0)!=0){if((HEAP8[HEAP32[r6+16>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[r6+16>>2])}}while(0);do{if((r5|0)==0){if((_iscleared(r4,r6|0)|0)==0){break}r5=1}}while(0)}r6=r6+32|0}if((r5|0)!=0){HEAP32[r1+24>>2]=HEAP32[r4+92>>2];HEAP32[r4+92>>2]=r1;STACKTOP=r3;return}else{HEAP32[r1+24>>2]=HEAP32[r4+88>>2];HEAP32[r4+88>>2]=r1;STACKTOP=r3;return}}function _traversestrongtable(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r1+16>>2]+(1<<HEAPU8[r1+7|0]<<5)|0;r5=0;while(1){if((r5|0)>=(HEAP32[r1+28>>2]|0)){break}do{if((HEAP32[HEAP32[r1+12>>2]+(r5<<4)+8>>2]&64|0)!=0){if((HEAP8[HEAP32[HEAP32[r1+12>>2]+(r5<<4)>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[HEAP32[r1+12>>2]+(r5<<4)>>2])}}while(0);r5=r5+1|0}r5=HEAP32[r1+16>>2]|0;while(1){if(r5>>>0>=r2>>>0){break}if((HEAP32[r5+8>>2]|0)==0){_removeentry(r5)}else{do{if((HEAP32[r5+24>>2]&64|0)!=0){if((HEAP8[HEAP32[r5+16>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[r5+16>>2])}}while(0);do{if((HEAP32[r5+8>>2]&64|0)!=0){if((HEAP8[HEAP32[r5>>2]+5|0]&3|0)==0){break}_reallymarkobject(r4,HEAP32[r5>>2])}}while(0)}r5=r5+32|0}STACKTOP=r3;return}function _freeobj(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78;r3=0;r4=STACKTOP;r5=r1;r6=r2;r7=r6;r8=r7;r9=r8+4|0;r10=HEAP8[r9];r11=r10&255;switch(r11|0){case 10:{r12=r5;r13=r6;r14=r13;_luaF_freeupval(r12,r14);STACKTOP=r4;return;break};case 6:{r15=r5;r16=r6;r17=r16;r18=r6;r19=r18;r20=r19;r21=r20+6|0;r22=HEAP8[r21];r23=r22&255;r24=r23-1|0;r25=r24<<2;r26=r25+20|0;r27=_luaM_realloc_(r15,r17,r26,0);STACKTOP=r4;return;break};case 5:{r28=r5;r29=r6;r30=r29;_luaH_free(r28,r30);STACKTOP=r4;return;break};case 8:{r31=r5;r32=r6;r33=r32;_luaE_freethread(r31,r33);STACKTOP=r4;return;break};case 7:{r34=r5;r35=r6;r36=r35;r37=r6;r38=r37;r39=r38;r40=r39+16|0;r41=HEAP32[r40>>2];r42=r41+24|0;r43=_luaM_realloc_(r34,r36,r42,0);STACKTOP=r4;return;break};case 4:{r44=r5;r45=r44+12|0;r46=HEAP32[r45>>2];r47=r46+24|0;r48=r47+4|0;r49=HEAP32[r48>>2];r50=r49-1|0;HEAP32[r48>>2]=r50;break};case 9:{r51=r5;r52=r6;r53=r52;_luaF_freeproto(r51,r53);STACKTOP=r4;return;break};case 38:{r54=r5;r55=r6;r56=r55;r57=r6;r58=r57;r59=r58;r60=r59+6|0;r61=HEAP8[r60];r62=r61&255;r63=r62-1|0;r64=r63<<4;r65=r64+32|0;r66=_luaM_realloc_(r54,r56,r65,0);STACKTOP=r4;return;break};case 20:{break};default:{STACKTOP=r4;return}}r67=r5;r68=r6;r69=r68;r70=r6;r71=r70;r72=r71;r73=r72+12|0;r74=HEAP32[r73>>2];r75=r74+1|0;r76=r75;r77=r76+16|0;r78=_luaM_realloc_(r67,r69,r77,0);STACKTOP=r4;return}function _sweepthread(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;if((HEAP32[r1+28>>2]|0)==0){STACKTOP=r3;return}_sweeplist(r4,r1+56|0,-3);_luaE_freeCI(r1);if((HEAPU8[HEAP32[r4+12>>2]+62|0]|0)==1){STACKTOP=r3;return}_luaD_shrinkstack(r1);STACKTOP=r3;return}function _luaX_init(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=0;while(1){if((r1|0)>=22){break}r4=_luaS_new(r3,HEAP32[912+(r1<<2)>>2]);r5=r4+5|0;HEAP8[r5]=HEAPU8[r5]|32;HEAP8[r4+6|0]=r1+1;r1=r1+1|0}STACKTOP=r2;return}function _luaX_token2str(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1;r1=r2;if((r1|0)<257){if((HEAP8[r1+633|0]&4|0)!=0){r2=_luaO_pushfstring(HEAP32[r5+52>>2],3112,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r1,r3));STACKTOP=r3;r6=r2}else{r2=_luaO_pushfstring(HEAP32[r5+52>>2],9920,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r1,r3));STACKTOP=r3;r6=r2}r7=r6;r8=r7;STACKTOP=r4;return r8}else{r6=HEAP32[912+(r1-257<<2)>>2];if((r1|0)<286){r1=_luaO_pushfstring(HEAP32[r5+52>>2],7648,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6,r3));STACKTOP=r3;r7=r1;r8=r7;STACKTOP=r4;return r8}else{r7=r6;r8=r7;STACKTOP=r4;return r8}}}function _luaX_syntaxerror(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;_lexerror(r4,r2,HEAP32[r4+16>>2]);STACKTOP=r3;return}function _lexerror(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+64|0;r6=r5;r7=r1;r1=r2;r2=r3;_luaO_chunkid(r6|0,HEAP32[r7+68>>2]+16|0,60);r3=HEAP32[r7+4>>2];r8=_luaO_pushfstring(HEAP32[r7+52>>2],9488,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r6,HEAP32[r4+8>>2]=r3,HEAP32[r4+16>>2]=r1,r4));STACKTOP=r4;r1=r8;if((r2|0)==0){r9=r7;r10=r9+52|0;r11=HEAP32[r10>>2];_luaD_throw(r11,3);STACKTOP=r5;return}r8=HEAP32[r7+52>>2];r3=_txtToken(r7,r2);_luaO_pushfstring(r8,9248,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r1,HEAP32[r4+8>>2]=r3,r4));STACKTOP=r4;r9=r7;r10=r9+52|0;r11=HEAP32[r10>>2];_luaD_throw(r11,3);STACKTOP=r5;return}function _luaX_newstring(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=STACKTOP;r5=r1;r1=HEAP32[r5+52>>2];r6=_luaS_newlstr(r1,r2,r3);r3=r1+8|0;r2=HEAP32[r3>>2];HEAP32[r3>>2]=r2+16;r3=r2;r2=r6;HEAP32[r3>>2]=r2;HEAP32[r3+8>>2]=HEAPU8[r2+4|0]|64;r2=_luaH_set(r1,HEAP32[HEAP32[r5+48>>2]+4>>2],HEAP32[r1+8>>2]-16|0);if((HEAP32[r2+8>>2]|0)!=0){r7=r1;r8=r7+8|0;r9=HEAP32[r8>>2];r10=r9-16|0;HEAP32[r8>>2]=r10;r11=r6;STACKTOP=r4;return r11}r5=r2;HEAP32[r5>>2]=1;HEAP32[r5+8>>2]=1;if((HEAP32[HEAP32[r1+12>>2]+12>>2]|0)>0){_luaC_step(r1)}r7=r1;r8=r7+8|0;r9=HEAP32[r8>>2];r10=r9-16|0;HEAP32[r8>>2]=r10;r11=r6;STACKTOP=r4;return r11}function _luaX_setinput(r1,r2,r3,r4,r5){var r6,r7;r6=STACKTOP;r7=r1;r1=r2;HEAP8[r1+76|0]=46;HEAP32[r1+52>>2]=r7;HEAP32[r1>>2]=r5;HEAP32[r1+32>>2]=286;HEAP32[r1+56>>2]=r3;HEAP32[r1+48>>2]=0;HEAP32[r1+4>>2]=1;HEAP32[r1+8>>2]=1;HEAP32[r1+68>>2]=r4;r4=_luaS_new(r7,6008);HEAP32[r1+72>>2]=r4;r4=HEAP32[r1+72>>2]+5|0;HEAP8[r4]=HEAPU8[r4]|32;r4=_luaM_realloc_(HEAP32[r1+52>>2],HEAP32[HEAP32[r1+60>>2]>>2],HEAP32[HEAP32[r1+60>>2]+8>>2],32);HEAP32[HEAP32[r1+60>>2]>>2]=r4;HEAP32[HEAP32[r1+60>>2]+8>>2]=32;STACKTOP=r6;return}function _luaX_next(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;HEAP32[r3+8>>2]=HEAP32[r3+4>>2];if((HEAP32[r3+32>>2]|0)!=286){r1=r3+16|0;r4=r3+32|0;HEAP32[r1>>2]=HEAP32[r4>>2];HEAP32[r1+4>>2]=HEAP32[r4+4>>2];HEAP32[r1+8>>2]=HEAP32[r4+8>>2];HEAP32[r1+12>>2]=HEAP32[r4+12>>2];HEAP32[r3+32>>2]=286;STACKTOP=r2;return}else{r4=_llex(r3,r3+24|0);HEAP32[r3+16>>2]=r4;STACKTOP=r2;return}}function _llex(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545;r3=0;r4=STACKTOP;r5=r1;r6=r2;r7=r5;r8=r7+60|0;r9=HEAP32[r8>>2];r10=r9+4|0;HEAP32[r10>>2]=0;L1:while(1){r11=r5;r12=r11|0;r13=HEAP32[r12>>2];L3:do{switch(r13|0){case 10:case 13:{r14=r5;_inclinenumber(r14);break};case 45:{r15=r5;r16=r15+56|0;r17=HEAP32[r16>>2];r18=r17|0;r19=HEAP32[r18>>2];r20=r19-1|0;HEAP32[r18>>2]=r20;r21=r19>>>0>0;if(r21){r22=r5;r23=r22+56|0;r24=HEAP32[r23>>2];r25=r24+4|0;r26=HEAP32[r25>>2];r27=r26+1|0;HEAP32[r25>>2]=r27;r28=HEAP8[r26];r29=r28&255;r30=r29}else{r31=r5;r32=r31+56|0;r33=HEAP32[r32>>2];r34=_luaZ_fill(r33);r30=r34}r35=r5;r36=r35|0;HEAP32[r36>>2]=r30;r37=r5;r38=r37|0;r39=HEAP32[r38>>2];r40=(r39|0)!=45;if(r40){r3=12;break L1}r41=r5;r42=r41+56|0;r43=HEAP32[r42>>2];r44=r43|0;r45=HEAP32[r44>>2];r46=r45-1|0;HEAP32[r44>>2]=r46;r47=r45>>>0>0;if(r47){r48=r5;r49=r48+56|0;r50=HEAP32[r49>>2];r51=r50+4|0;r52=HEAP32[r51>>2];r53=r52+1|0;HEAP32[r51>>2]=r53;r54=HEAP8[r52];r55=r54&255;r56=r55}else{r57=r5;r58=r57+56|0;r59=HEAP32[r58>>2];r60=_luaZ_fill(r59);r56=r60}r61=r5;r62=r61|0;HEAP32[r62>>2]=r56;r63=r5;r64=r63|0;r65=HEAP32[r64>>2];r66=(r65|0)==91;do{if(r66){r67=r5;r68=_skip_sep(r67);r69=r68;r70=r5;r71=r70+60|0;r72=HEAP32[r71>>2];r73=r72+4|0;HEAP32[r73>>2]=0;r74=r69;r75=(r74|0)>=0;if(r75){r76=r5;r77=r69;_read_long_string(r76,0,r77);r78=r5;r79=r78+60|0;r80=HEAP32[r79>>2];r81=r80+4|0;HEAP32[r81>>2]=0;break L3}else{break}}}while(0);while(1){r82=r5;r83=r82|0;r84=HEAP32[r83>>2];r85=(r84|0)==10;do{if(r85){r86=0}else{r87=r5;r88=r87|0;r89=HEAP32[r88>>2];r90=(r89|0)==13;if(r90){r86=0;break}r91=r5;r92=r91|0;r93=HEAP32[r92>>2];r94=(r93|0)!=-1;r86=r94}}while(0);if(!r86){break}r95=r5;r96=r95+56|0;r97=HEAP32[r96>>2];r98=r97|0;r99=HEAP32[r98>>2];r100=r99-1|0;HEAP32[r98>>2]=r100;r101=r99>>>0>0;if(r101){r102=r5;r103=r102+56|0;r104=HEAP32[r103>>2];r105=r104+4|0;r106=HEAP32[r105>>2];r107=r106+1|0;HEAP32[r105>>2]=r107;r108=HEAP8[r106];r109=r108&255;r110=r109}else{r111=r5;r112=r111+56|0;r113=HEAP32[r112>>2];r114=_luaZ_fill(r113);r110=r114}r115=r5;r116=r115|0;HEAP32[r116>>2]=r110}break};case 32:case 12:case 9:case 11:{r117=r5;r118=r117+56|0;r119=HEAP32[r118>>2];r120=r119|0;r121=HEAP32[r120>>2];r122=r121-1|0;HEAP32[r120>>2]=r122;r123=r121>>>0>0;if(r123){r124=r5;r125=r124+56|0;r126=HEAP32[r125>>2];r127=r126+4|0;r128=HEAP32[r127>>2];r129=r128+1|0;HEAP32[r127>>2]=r129;r130=HEAP8[r128];r131=r130&255;r132=r131}else{r133=r5;r134=r133+56|0;r135=HEAP32[r134>>2];r136=_luaZ_fill(r135);r132=r136}r137=r5;r138=r137|0;HEAP32[r138>>2]=r132;break};case 91:{r3=30;break L1;break};case 61:{r3=35;break L1;break};case 60:{r3=44;break L1;break};case 62:{r3=53;break L1;break};case 126:{r3=62;break L1;break};case 58:{r3=71;break L1;break};case 34:case 39:{r3=80;break L1;break};case 46:{r3=81;break L1;break};case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:{break L1;break};case-1:{r3=93;break L1;break};default:{r3=94;break L1}}}while(0)}do{if(r3==12){r139=45;r140=r139;STACKTOP=r4;return r140}else if(r3==30){r141=r5;r142=_skip_sep(r141);r143=r142;r144=r143;r145=(r144|0)>=0;if(r145){r146=r5;r147=r6;r148=r143;_read_long_string(r146,r147,r148);r139=289;r140=r139;STACKTOP=r4;return r140}r149=r143;r150=(r149|0)==-1;if(!r150){r151=r5;_lexerror(r151,4720,289)}r139=91;r140=r139;STACKTOP=r4;return r140}else if(r3==35){r152=r5;r153=r152+56|0;r154=HEAP32[r153>>2];r155=r154|0;r156=HEAP32[r155>>2];r157=r156-1|0;HEAP32[r155>>2]=r157;r158=r156>>>0>0;if(r158){r159=r5;r160=r159+56|0;r161=HEAP32[r160>>2];r162=r161+4|0;r163=HEAP32[r162>>2];r164=r163+1|0;HEAP32[r162>>2]=r164;r165=HEAP8[r163];r166=r165&255;r167=r166}else{r168=r5;r169=r168+56|0;r170=HEAP32[r169>>2];r171=_luaZ_fill(r170);r167=r171}r172=r5;r173=r172|0;HEAP32[r173>>2]=r167;r174=r5;r175=r174|0;r176=HEAP32[r175>>2];r177=(r176|0)!=61;if(r177){r139=61;r140=r139;STACKTOP=r4;return r140}r178=r5;r179=r178+56|0;r180=HEAP32[r179>>2];r181=r180|0;r182=HEAP32[r181>>2];r183=r182-1|0;HEAP32[r181>>2]=r183;r184=r182>>>0>0;if(r184){r185=r5;r186=r185+56|0;r187=HEAP32[r186>>2];r188=r187+4|0;r189=HEAP32[r188>>2];r190=r189+1|0;HEAP32[r188>>2]=r190;r191=HEAP8[r189];r192=r191&255;r193=r192}else{r194=r5;r195=r194+56|0;r196=HEAP32[r195>>2];r197=_luaZ_fill(r196);r193=r197}r198=r5;r199=r198|0;HEAP32[r199>>2]=r193;r139=281;r140=r139;STACKTOP=r4;return r140}else if(r3==44){r200=r5;r201=r200+56|0;r202=HEAP32[r201>>2];r203=r202|0;r204=HEAP32[r203>>2];r205=r204-1|0;HEAP32[r203>>2]=r205;r206=r204>>>0>0;if(r206){r207=r5;r208=r207+56|0;r209=HEAP32[r208>>2];r210=r209+4|0;r211=HEAP32[r210>>2];r212=r211+1|0;HEAP32[r210>>2]=r212;r213=HEAP8[r211];r214=r213&255;r215=r214}else{r216=r5;r217=r216+56|0;r218=HEAP32[r217>>2];r219=_luaZ_fill(r218);r215=r219}r220=r5;r221=r220|0;HEAP32[r221>>2]=r215;r222=r5;r223=r222|0;r224=HEAP32[r223>>2];r225=(r224|0)!=61;if(r225){r139=60;r140=r139;STACKTOP=r4;return r140}r226=r5;r227=r226+56|0;r228=HEAP32[r227>>2];r229=r228|0;r230=HEAP32[r229>>2];r231=r230-1|0;HEAP32[r229>>2]=r231;r232=r230>>>0>0;if(r232){r233=r5;r234=r233+56|0;r235=HEAP32[r234>>2];r236=r235+4|0;r237=HEAP32[r236>>2];r238=r237+1|0;HEAP32[r236>>2]=r238;r239=HEAP8[r237];r240=r239&255;r241=r240}else{r242=r5;r243=r242+56|0;r244=HEAP32[r243>>2];r245=_luaZ_fill(r244);r241=r245}r246=r5;r247=r246|0;HEAP32[r247>>2]=r241;r139=283;r140=r139;STACKTOP=r4;return r140}else if(r3==53){r248=r5;r249=r248+56|0;r250=HEAP32[r249>>2];r251=r250|0;r252=HEAP32[r251>>2];r253=r252-1|0;HEAP32[r251>>2]=r253;r254=r252>>>0>0;if(r254){r255=r5;r256=r255+56|0;r257=HEAP32[r256>>2];r258=r257+4|0;r259=HEAP32[r258>>2];r260=r259+1|0;HEAP32[r258>>2]=r260;r261=HEAP8[r259];r262=r261&255;r263=r262}else{r264=r5;r265=r264+56|0;r266=HEAP32[r265>>2];r267=_luaZ_fill(r266);r263=r267}r268=r5;r269=r268|0;HEAP32[r269>>2]=r263;r270=r5;r271=r270|0;r272=HEAP32[r271>>2];r273=(r272|0)!=61;if(r273){r139=62;r140=r139;STACKTOP=r4;return r140}r274=r5;r275=r274+56|0;r276=HEAP32[r275>>2];r277=r276|0;r278=HEAP32[r277>>2];r279=r278-1|0;HEAP32[r277>>2]=r279;r280=r278>>>0>0;if(r280){r281=r5;r282=r281+56|0;r283=HEAP32[r282>>2];r284=r283+4|0;r285=HEAP32[r284>>2];r286=r285+1|0;HEAP32[r284>>2]=r286;r287=HEAP8[r285];r288=r287&255;r289=r288}else{r290=r5;r291=r290+56|0;r292=HEAP32[r291>>2];r293=_luaZ_fill(r292);r289=r293}r294=r5;r295=r294|0;HEAP32[r295>>2]=r289;r139=282;r140=r139;STACKTOP=r4;return r140}else if(r3==62){r296=r5;r297=r296+56|0;r298=HEAP32[r297>>2];r299=r298|0;r300=HEAP32[r299>>2];r301=r300-1|0;HEAP32[r299>>2]=r301;r302=r300>>>0>0;if(r302){r303=r5;r304=r303+56|0;r305=HEAP32[r304>>2];r306=r305+4|0;r307=HEAP32[r306>>2];r308=r307+1|0;HEAP32[r306>>2]=r308;r309=HEAP8[r307];r310=r309&255;r311=r310}else{r312=r5;r313=r312+56|0;r314=HEAP32[r313>>2];r315=_luaZ_fill(r314);r311=r315}r316=r5;r317=r316|0;HEAP32[r317>>2]=r311;r318=r5;r319=r318|0;r320=HEAP32[r319>>2];r321=(r320|0)!=61;if(r321){r139=126;r140=r139;STACKTOP=r4;return r140}r322=r5;r323=r322+56|0;r324=HEAP32[r323>>2];r325=r324|0;r326=HEAP32[r325>>2];r327=r326-1|0;HEAP32[r325>>2]=r327;r328=r326>>>0>0;if(r328){r329=r5;r330=r329+56|0;r331=HEAP32[r330>>2];r332=r331+4|0;r333=HEAP32[r332>>2];r334=r333+1|0;HEAP32[r332>>2]=r334;r335=HEAP8[r333];r336=r335&255;r337=r336}else{r338=r5;r339=r338+56|0;r340=HEAP32[r339>>2];r341=_luaZ_fill(r340);r337=r341}r342=r5;r343=r342|0;HEAP32[r343>>2]=r337;r139=284;r140=r139;STACKTOP=r4;return r140}else if(r3==71){r344=r5;r345=r344+56|0;r346=HEAP32[r345>>2];r347=r346|0;r348=HEAP32[r347>>2];r349=r348-1|0;HEAP32[r347>>2]=r349;r350=r348>>>0>0;if(r350){r351=r5;r352=r351+56|0;r353=HEAP32[r352>>2];r354=r353+4|0;r355=HEAP32[r354>>2];r356=r355+1|0;HEAP32[r354>>2]=r356;r357=HEAP8[r355];r358=r357&255;r359=r358}else{r360=r5;r361=r360+56|0;r362=HEAP32[r361>>2];r363=_luaZ_fill(r362);r359=r363}r364=r5;r365=r364|0;HEAP32[r365>>2]=r359;r366=r5;r367=r366|0;r368=HEAP32[r367>>2];r369=(r368|0)!=58;if(r369){r139=58;r140=r139;STACKTOP=r4;return r140}r370=r5;r371=r370+56|0;r372=HEAP32[r371>>2];r373=r372|0;r374=HEAP32[r373>>2];r375=r374-1|0;HEAP32[r373>>2]=r375;r376=r374>>>0>0;if(r376){r377=r5;r378=r377+56|0;r379=HEAP32[r378>>2];r380=r379+4|0;r381=HEAP32[r380>>2];r382=r381+1|0;HEAP32[r380>>2]=r382;r383=HEAP8[r381];r384=r383&255;r385=r384}else{r386=r5;r387=r386+56|0;r388=HEAP32[r387>>2];r389=_luaZ_fill(r388);r385=r389}r390=r5;r391=r390|0;HEAP32[r391>>2]=r385;r139=285;r140=r139;STACKTOP=r4;return r140}else if(r3==80){r392=r5;r393=r5;r394=r393|0;r395=HEAP32[r394>>2];r396=r6;_read_string(r392,r395,r396);r139=289;r140=r139;STACKTOP=r4;return r140}else if(r3==81){r397=r5;r398=r5;r399=r398|0;r400=HEAP32[r399>>2];_save(r397,r400);r401=r5;r402=r401+56|0;r403=HEAP32[r402>>2];r404=r403|0;r405=HEAP32[r404>>2];r406=r405-1|0;HEAP32[r404>>2]=r406;r407=r405>>>0>0;if(r407){r408=r5;r409=r408+56|0;r410=HEAP32[r409>>2];r411=r410+4|0;r412=HEAP32[r411>>2];r413=r412+1|0;HEAP32[r411>>2]=r413;r414=HEAP8[r412];r415=r414&255;r416=r415}else{r417=r5;r418=r417+56|0;r419=HEAP32[r418>>2];r420=_luaZ_fill(r419);r416=r420}r421=r5;r422=r421|0;HEAP32[r422>>2]=r416;r423=r5;r424=_check_next(r423,3960);r425=(r424|0)!=0;if(r425){r426=r5;r427=_check_next(r426,3960);r428=(r427|0)!=0;if(r428){r139=280;r140=r139;STACKTOP=r4;return r140}else{r139=279;r140=r139;STACKTOP=r4;return r140}}else{r429=r5;r430=r429|0;r431=HEAP32[r430>>2];r432=r431+1|0;r433=r432+632|0;r434=HEAP8[r433];r435=r434&255;r436=r435&2;r437=(r436|0)!=0;if(r437){break}else{r139=46;r140=r139;STACKTOP=r4;return r140}}}else if(r3==93){r139=286;r140=r139;STACKTOP=r4;return r140}else if(r3==94){r438=r5;r439=r438|0;r440=HEAP32[r439>>2];r441=r440+1|0;r442=r441+632|0;r443=HEAP8[r442];r444=r443&255;r445=r444&1;r446=(r445|0)!=0;if(!r446){r447=r5;r448=r447|0;r449=HEAP32[r448>>2];r450=r449;r451=r5;r452=r451+56|0;r453=HEAP32[r452>>2];r454=r453|0;r455=HEAP32[r454>>2];r456=r455-1|0;HEAP32[r454>>2]=r456;r457=r455>>>0>0;if(r457){r458=r5;r459=r458+56|0;r460=HEAP32[r459>>2];r461=r460+4|0;r462=HEAP32[r461>>2];r463=r462+1|0;HEAP32[r461>>2]=r463;r464=HEAP8[r462];r465=r464&255;r466=r465}else{r467=r5;r468=r467+56|0;r469=HEAP32[r468>>2];r470=_luaZ_fill(r469);r466=r470}r471=r5;r472=r471|0;HEAP32[r472>>2]=r466;r473=r450;r139=r473;r140=r139;STACKTOP=r4;return r140}while(1){r474=r5;r475=r5;r476=r475|0;r477=HEAP32[r476>>2];_save(r474,r477);r478=r5;r479=r478+56|0;r480=HEAP32[r479>>2];r481=r480|0;r482=HEAP32[r481>>2];r483=r482-1|0;HEAP32[r481>>2]=r483;r484=r482>>>0>0;if(r484){r485=r5;r486=r485+56|0;r487=HEAP32[r486>>2];r488=r487+4|0;r489=HEAP32[r488>>2];r490=r489+1|0;HEAP32[r488>>2]=r490;r491=HEAP8[r489];r492=r491&255;r493=r492}else{r494=r5;r495=r494+56|0;r496=HEAP32[r495>>2];r497=_luaZ_fill(r496);r493=r497}r498=r5;r499=r498|0;HEAP32[r499>>2]=r493;r500=r5;r501=r500|0;r502=HEAP32[r501>>2];r503=r502+1|0;r504=r503+632|0;r505=HEAP8[r504];r506=r505&255;r507=r506&3;r508=(r507|0)!=0;if(!r508){break}}r509=r5;r510=r5;r511=r510+60|0;r512=HEAP32[r511>>2];r513=r512|0;r514=HEAP32[r513>>2];r515=r5;r516=r515+60|0;r517=HEAP32[r516>>2];r518=r517+4|0;r519=HEAP32[r518>>2];r520=_luaX_newstring(r509,r514,r519);r521=r520;r522=r521;r523=r6;r524=r523;HEAP32[r524>>2]=r522;r525=r521;r526=r525;r527=r526+4|0;r528=HEAP8[r527];r529=r528&255;r530=(r529|0)==4;do{if(r530){r531=r521;r532=r531;r533=r532+6|0;r534=HEAP8[r533];r535=r534&255;r536=(r535|0)>0;if(!r536){break}r537=r521;r538=r537;r539=r538+6|0;r540=HEAP8[r539];r541=r540&255;r542=r541-1|0;r543=r542+257|0;r139=r543;r140=r139;STACKTOP=r4;return r140}}while(0);r139=288;r140=r139;STACKTOP=r4;return r140}}while(0);r544=r5;r545=r6;_read_numeral(r544,r545);r139=287;r140=r139;STACKTOP=r4;return r140}function _luaX_lookahead(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_llex(r3,r3+40|0);HEAP32[r3+32>>2]=r1;STACKTOP=r2;return HEAP32[r3+32>>2]}function _inclinenumber(r1){var r2,r3,r4,r5,r6,r7,r8;r2=0;r3=STACKTOP;r4=r1;r1=HEAP32[r4>>2];r5=HEAP32[r4+56>>2]|0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6-1;if(r6>>>0>0){r6=HEAP32[r4+56>>2]+4|0;r5=HEAP32[r6>>2];HEAP32[r6>>2]=r5+1;r7=HEAPU8[r5]}else{r7=_luaZ_fill(HEAP32[r4+56>>2])}HEAP32[r4>>2]=r7;if((HEAP32[r4>>2]|0)==10){r2=6}else{if((HEAP32[r4>>2]|0)==13){r2=6}}do{if(r2==6){if((HEAP32[r4>>2]|0)==(r1|0)){break}r7=HEAP32[r4+56>>2]|0;r5=HEAP32[r7>>2];HEAP32[r7>>2]=r5-1;if(r5>>>0>0){r5=HEAP32[r4+56>>2]+4|0;r7=HEAP32[r5>>2];HEAP32[r5>>2]=r7+1;r8=HEAPU8[r7]}else{r8=_luaZ_fill(HEAP32[r4+56>>2])}HEAP32[r4>>2]=r8}}while(0);r8=r4+4|0;r1=HEAP32[r8>>2]+1|0;HEAP32[r8>>2]=r1;if((r1|0)>=2147483645){_luaX_syntaxerror(r4,9696)}else{STACKTOP=r3;return}}function _skip_sep(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;r3=r1;r1=0;r4=HEAP32[r3>>2];_save(r3,HEAP32[r3>>2]);r5=HEAP32[r3+56>>2]|0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6-1;if(r6>>>0>0){r6=HEAP32[r3+56>>2]+4|0;r5=HEAP32[r6>>2];HEAP32[r6>>2]=r5+1;r7=HEAPU8[r5]}else{r7=_luaZ_fill(HEAP32[r3+56>>2])}HEAP32[r3>>2]=r7;while(1){if((HEAP32[r3>>2]|0)!=61){break}_save(r3,HEAP32[r3>>2]);r7=HEAP32[r3+56>>2]|0;r5=HEAP32[r7>>2];HEAP32[r7>>2]=r5-1;if(r5>>>0>0){r5=HEAP32[r3+56>>2]+4|0;r7=HEAP32[r5>>2];HEAP32[r5>>2]=r7+1;r8=HEAPU8[r7]}else{r8=_luaZ_fill(HEAP32[r3+56>>2])}HEAP32[r3>>2]=r8;r1=r1+1|0}if((HEAP32[r3>>2]|0)==(r4|0)){r9=r1;STACKTOP=r2;return r9}else{r9=-r1-1|0;STACKTOP=r2;return r9}}function _read_long_string(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;_save(r6,HEAP32[r6>>2]);r3=HEAP32[r6+56>>2]|0;r7=HEAP32[r3>>2];HEAP32[r3>>2]=r7-1;if(r7>>>0>0){r7=HEAP32[r6+56>>2]+4|0;r3=HEAP32[r7>>2];HEAP32[r7>>2]=r3+1;r8=HEAPU8[r3]}else{r8=_luaZ_fill(HEAP32[r6+56>>2])}HEAP32[r6>>2]=r8;if((HEAP32[r6>>2]|0)==10){r4=6}else{if((HEAP32[r6>>2]|0)==13){r4=6}}if(r4==6){_inclinenumber(r6)}while(1){r8=HEAP32[r6>>2];if((r8|0)==10|(r8|0)==13){_save(r6,10);_inclinenumber(r6);if((r1|0)==0){HEAP32[HEAP32[r6+60>>2]+4>>2]=0}}else if((r8|0)==93){if((_skip_sep(r6)|0)==(r2|0)){break}}else if((r8|0)==-1){r4=9;break}else{if((r1|0)!=0){_save(r6,HEAP32[r6>>2]);r8=HEAP32[r6+56>>2]|0;r3=HEAP32[r8>>2];HEAP32[r8>>2]=r3-1;if(r3>>>0>0){r3=HEAP32[r6+56>>2]+4|0;r8=HEAP32[r3>>2];HEAP32[r3>>2]=r8+1;r9=HEAPU8[r8]}else{r9=_luaZ_fill(HEAP32[r6+56>>2])}HEAP32[r6>>2]=r9}else{r8=HEAP32[r6+56>>2]|0;r3=HEAP32[r8>>2];HEAP32[r8>>2]=r3-1;if(r3>>>0>0){r3=HEAP32[r6+56>>2]+4|0;r8=HEAP32[r3>>2];HEAP32[r3>>2]=r8+1;r10=HEAPU8[r8]}else{r10=_luaZ_fill(HEAP32[r6+56>>2])}HEAP32[r6>>2]=r10}}}if(r4==9){_lexerror(r6,(r1|0)!=0?10152:9944,286)}_save(r6,HEAP32[r6>>2]);r4=HEAP32[r6+56>>2]|0;r10=HEAP32[r4>>2];HEAP32[r4>>2]=r10-1;if(r10>>>0>0){r10=HEAP32[r6+56>>2]+4|0;r4=HEAP32[r10>>2];HEAP32[r10>>2]=r4+1;r11=HEAPU8[r4]}else{r11=_luaZ_fill(HEAP32[r6+56>>2])}HEAP32[r6>>2]=r11;if((r1|0)==0){STACKTOP=r5;return}r11=_luaX_newstring(r6,HEAP32[HEAP32[r6+60>>2]>>2]+(r2+2)|0,HEAP32[HEAP32[r6+60>>2]+4>>2]-(r2+2<<1)|0);HEAP32[r1>>2]=r11;STACKTOP=r5;return}function _read_string(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244;r4=0;r5=STACKTOP;r6=r1;r7=r2;r8=r3;r9=r6;r10=r6;r11=r10|0;r12=HEAP32[r11>>2];_save(r9,r12);r13=r6;r14=r13+56|0;r15=HEAP32[r14>>2];r16=r15|0;r17=HEAP32[r16>>2];r18=r17-1|0;HEAP32[r16>>2]=r18;r19=r17>>>0>0;if(r19){r20=r6;r21=r20+56|0;r22=HEAP32[r21>>2];r23=r22+4|0;r24=HEAP32[r23>>2];r25=r24+1|0;HEAP32[r23>>2]=r25;r26=HEAP8[r24];r27=r26&255;r28=r27}else{r29=r6;r30=r29+56|0;r31=HEAP32[r30>>2];r32=_luaZ_fill(r31);r28=r32}r33=r6;r34=r33|0;HEAP32[r34>>2]=r28;while(1){r35=r6;r36=r35|0;r37=HEAP32[r36>>2];r38=r7;r39=(r37|0)!=(r38|0);if(!r39){r4=52;break}r40=r6;r41=r40|0;r42=HEAP32[r41>>2];if((r42|0)==10|(r42|0)==13){r4=8;break}else if((r42|0)==-1){r4=7;break}else if((r42|0)==92){r43=r6;r44=r43+56|0;r45=HEAP32[r44>>2];r46=r45|0;r47=HEAP32[r46>>2];r48=r47-1|0;HEAP32[r46>>2]=r48;r49=r47>>>0>0;if(r49){r50=r6;r51=r50+56|0;r52=HEAP32[r51>>2];r53=r52+4|0;r54=HEAP32[r53>>2];r55=r54+1|0;HEAP32[r53>>2]=r55;r56=HEAP8[r54];r57=r56&255;r58=r57}else{r59=r6;r60=r59+56|0;r61=HEAP32[r60>>2];r62=_luaZ_fill(r61);r58=r62}r63=r6;r64=r63|0;HEAP32[r64>>2]=r58;r65=r6;r66=r65|0;r67=HEAP32[r66>>2];switch(r67|0){case 97:{r68=7;r4=41;break};case 102:{r68=12;r4=41;break};case 110:{r68=10;r4=41;break};case 120:{r69=r6;r70=_readhexaesc(r69);r68=r70;r4=41;break};case 98:{r68=8;r4=41;break};case 92:case 34:case 39:{r71=r6;r72=r71|0;r73=HEAP32[r72>>2];r68=r73;r4=41;break};case-1:{break};case 118:{r68=11;r4=41;break};case 114:{r68=13;r4=41;break};case 122:{r74=r6;r75=r74+56|0;r76=HEAP32[r75>>2];r77=r76|0;r78=HEAP32[r77>>2];r79=r78-1|0;HEAP32[r77>>2]=r79;r80=r78>>>0>0;if(r80){r81=r6;r82=r81+56|0;r83=HEAP32[r82>>2];r84=r83+4|0;r85=HEAP32[r84>>2];r86=r85+1|0;HEAP32[r84>>2]=r86;r87=HEAP8[r85];r88=r87&255;r89=r88}else{r90=r6;r91=r90+56|0;r92=HEAP32[r91>>2];r93=_luaZ_fill(r92);r89=r93}r94=r6;r95=r94|0;HEAP32[r95>>2]=r89;while(1){r96=r6;r97=r96|0;r98=HEAP32[r97>>2];r99=r98+1|0;r100=r99+632|0;r101=HEAP8[r100];r102=r101&255;r103=r102&8;r104=(r103|0)!=0;if(!r104){break}r105=r6;r106=r105|0;r107=HEAP32[r106>>2];r108=(r107|0)==10;do{if(r108){r4=31}else{r109=r6;r110=r109|0;r111=HEAP32[r110>>2];r112=(r111|0)==13;if(r112){r4=31;break}r113=r6;r114=r113+56|0;r115=HEAP32[r114>>2];r116=r115|0;r117=HEAP32[r116>>2];r118=r117-1|0;HEAP32[r116>>2]=r118;r119=r117>>>0>0;if(r119){r120=r6;r121=r120+56|0;r122=HEAP32[r121>>2];r123=r122+4|0;r124=HEAP32[r123>>2];r125=r124+1|0;HEAP32[r123>>2]=r125;r126=HEAP8[r124];r127=r126&255;r128=r127}else{r129=r6;r130=r129+56|0;r131=HEAP32[r130>>2];r132=_luaZ_fill(r131);r128=r132}r133=r6;r134=r133|0;HEAP32[r134>>2]=r128}}while(0);if(r4==31){r4=0;r135=r6;_inclinenumber(r135)}}break};case 116:{r68=9;r4=41;break};case 10:case 13:{r136=r6;_inclinenumber(r136);r68=10;r4=45;break};default:{r137=r6;r138=r137|0;r139=HEAP32[r138>>2];r140=r139+1|0;r141=r140+632|0;r142=HEAP8[r141];r143=r142&255;r144=r143&2;r145=(r144|0)!=0;if(!r145){r146=r6;r147=r6;r148=r147|0;_escerror(r146,r148,1,10800)}r149=r6;r150=_readdecesc(r149);r68=r150;r4=45}}if(r4==41){r4=0;r151=r6;r152=r151+56|0;r153=HEAP32[r152>>2];r154=r153|0;r155=HEAP32[r154>>2];r156=r155-1|0;HEAP32[r154>>2]=r156;r157=r155>>>0>0;if(r157){r158=r6;r159=r158+56|0;r160=HEAP32[r159>>2];r161=r160+4|0;r162=HEAP32[r161>>2];r163=r162+1|0;HEAP32[r161>>2]=r163;r164=HEAP8[r162];r165=r164&255;r166=r165}else{r167=r6;r168=r167+56|0;r169=HEAP32[r168>>2];r170=_luaZ_fill(r169);r166=r170}r171=r6;r172=r171|0;HEAP32[r172>>2]=r166;r4=45}if(r4==45){r4=0;r173=r6;r174=r68;_save(r173,r174)}}else{r175=r6;r176=r6;r177=r176|0;r178=HEAP32[r177>>2];_save(r175,r178);r179=r6;r180=r179+56|0;r181=HEAP32[r180>>2];r182=r181|0;r183=HEAP32[r182>>2];r184=r183-1|0;HEAP32[r182>>2]=r184;r185=r183>>>0>0;if(r185){r186=r6;r187=r186+56|0;r188=HEAP32[r187>>2];r189=r188+4|0;r190=HEAP32[r189>>2];r191=r190+1|0;HEAP32[r189>>2]=r191;r192=HEAP8[r190];r193=r192&255;r194=r193}else{r195=r6;r196=r195+56|0;r197=HEAP32[r196>>2];r198=_luaZ_fill(r197);r194=r198}r199=r6;r200=r199|0;HEAP32[r200>>2]=r194}}if(r4==7){r201=r6;_lexerror(r201,11056,286)}else if(r4==8){r202=r6;_lexerror(r202,11056,289)}else if(r4==52){r203=r6;r204=r6;r205=r204|0;r206=HEAP32[r205>>2];_save(r203,r206);r207=r6;r208=r207+56|0;r209=HEAP32[r208>>2];r210=r209|0;r211=HEAP32[r210>>2];r212=r211-1|0;HEAP32[r210>>2]=r212;r213=r211>>>0>0;if(r213){r214=r6;r215=r214+56|0;r216=HEAP32[r215>>2];r217=r216+4|0;r218=HEAP32[r217>>2];r219=r218+1|0;HEAP32[r217>>2]=r219;r220=HEAP8[r218];r221=r220&255;r222=r221;r223=r6;r224=r223|0;HEAP32[r224>>2]=r222;r225=r6;r226=r6;r227=r226+60|0;r228=HEAP32[r227>>2];r229=r228|0;r230=HEAP32[r229>>2];r231=r230+1|0;r232=r6;r233=r232+60|0;r234=HEAP32[r233>>2];r235=r234+4|0;r236=HEAP32[r235>>2];r237=r236-2|0;r238=_luaX_newstring(r225,r231,r237);r239=r8;r240=r239;HEAP32[r240>>2]=r238;STACKTOP=r5;return}else{r241=r6;r242=r241+56|0;r243=HEAP32[r242>>2];r244=_luaZ_fill(r243);r222=r244;r223=r6;r224=r223|0;HEAP32[r224>>2]=r222;r225=r6;r226=r6;r227=r226+60|0;r228=HEAP32[r227>>2];r229=r228|0;r230=HEAP32[r229>>2];r231=r230+1|0;r232=r6;r233=r232+60|0;r234=HEAP32[r233>>2];r235=r234+4|0;r236=HEAP32[r235>>2];r237=r236-2|0;r238=_luaX_newstring(r225,r231,r237);r239=r8;r240=r239;HEAP32[r240>>2]=r238;STACKTOP=r5;return}}}function _save(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+60>>2];if((HEAP32[r2+4>>2]+1|0)>>>0<=HEAP32[r2+8>>2]>>>0){r5=r1;r6=r5&255;r7=r2;r8=r7+4|0;r9=HEAP32[r8>>2];r10=r9+1|0;HEAP32[r8>>2]=r10;r11=r2;r12=r11|0;r13=HEAP32[r12>>2];r14=r13+r9|0;HEAP8[r14]=r6;STACKTOP=r3;return}if(HEAP32[r2+8>>2]>>>0>=2147483646){_lexerror(r4,11296,0)}r15=HEAP32[r2+8>>2]<<1;if((r15+1|0)>>>0>4294967293){_luaM_toobig(HEAP32[r4+52>>2])}else{r16=_luaM_realloc_(HEAP32[r4+52>>2],HEAP32[r2>>2],HEAP32[r2+8>>2],r15)}HEAP32[r2>>2]=r16;HEAP32[r2+8>>2]=r15;r5=r1;r6=r5&255;r7=r2;r8=r7+4|0;r9=HEAP32[r8>>2];r10=r9+1|0;HEAP32[r8>>2]=r10;r11=r2;r12=r11|0;r13=HEAP32[r12>>2];r14=r13+r9|0;HEAP8[r14]=r6;STACKTOP=r3;return}function _check_next(r1,r2){var r3,r4,r5,r6,r7,r8;r3=STACKTOP;r4=r1;do{if((HEAP32[r4>>2]|0)!=0){if((_strchr(r2,HEAP32[r4>>2])|0)==0){break}_save(r4,HEAP32[r4>>2]);r1=HEAP32[r4+56>>2]|0;r5=HEAP32[r1>>2];HEAP32[r1>>2]=r5-1;if(r5>>>0>0){r5=HEAP32[r4+56>>2]+4|0;r1=HEAP32[r5>>2];HEAP32[r5>>2]=r1+1;r6=HEAPU8[r1]}else{r6=_luaZ_fill(HEAP32[r4+56>>2])}HEAP32[r4>>2]=r6;r7=1;r8=r7;STACKTOP=r3;return r8}}while(0);r7=0;r8=r7;STACKTOP=r3;return r8}function _read_numeral(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=STACKTOP;r4=r1;r1=r2;r2=3504;r5=HEAP32[r4>>2];_save(r4,HEAP32[r4>>2]);r6=HEAP32[r4+56>>2]|0;r7=HEAP32[r6>>2];HEAP32[r6>>2]=r7-1;if(r7>>>0>0){r7=HEAP32[r4+56>>2]+4|0;r6=HEAP32[r7>>2];HEAP32[r7>>2]=r6+1;r8=HEAPU8[r6]}else{r8=_luaZ_fill(HEAP32[r4+56>>2])}HEAP32[r4>>2]=r8;do{if((r5|0)==48){if((_check_next(r4,3120)|0)==0){break}r2=2784}}while(0);while(1){if((_check_next(r4,r2)|0)!=0){_check_next(r4,2552)}if((HEAP8[HEAP32[r4>>2]+633|0]&16|0)==0){if((HEAP32[r4>>2]|0)!=46){break}}_save(r4,HEAP32[r4>>2]);r5=HEAP32[r4+56>>2]|0;r8=HEAP32[r5>>2];HEAP32[r5>>2]=r8-1;if(r8>>>0>0){r8=HEAP32[r4+56>>2]+4|0;r5=HEAP32[r8>>2];HEAP32[r8>>2]=r5+1;r9=HEAPU8[r5]}else{r9=_luaZ_fill(HEAP32[r4+56>>2])}HEAP32[r4>>2]=r9}_save(r4,0);_buffreplace(r4,46,HEAP8[r4+76|0]);if((_luaO_str2d(HEAP32[HEAP32[r4+60>>2]>>2],HEAP32[HEAP32[r4+60>>2]+4>>2]-1|0,r1)|0)!=0){STACKTOP=r3;return}_trydecpoint(r4,r1);STACKTOP=r3;return}function _buffreplace(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=HEAP32[HEAP32[r5+60>>2]+4>>2];r6=HEAP32[HEAP32[r5+60>>2]>>2];while(1){r5=r3;r3=r5-1|0;if((r5|0)==0){break}if((HEAP8[r6+r3|0]|0)==(r1<<24>>24|0)){HEAP8[r6+r3|0]=r2}}STACKTOP=r4;return}function _trydecpoint(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=HEAP8[r4+76|0];r5=_localeconv()|0;HEAP8[r4+76|0]=HEAP8[HEAP32[r5>>2]|0];_buffreplace(r4,r1,HEAP8[r4+76|0]);if((_luaO_str2d(HEAP32[HEAP32[r4+60>>2]>>2],HEAP32[HEAP32[r4+60>>2]+4>>2]-1|0,r2)|0)!=0){STACKTOP=r3;return}else{_buffreplace(r4,HEAP8[r4+76|0],46);_lexerror(r4,11704,287)}}function _readhexaesc(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+16|0;r3=r2;r4=r1;r1=0;HEAP32[r3>>2]=120;r5=1;while(1){if((r5|0)>=3){break}r6=HEAP32[r4+56>>2]|0;r7=HEAP32[r6>>2];HEAP32[r6>>2]=r7-1;if(r7>>>0>0){r7=HEAP32[r4+56>>2]+4|0;r6=HEAP32[r7>>2];HEAP32[r7>>2]=r6+1;r8=HEAPU8[r6]}else{r8=_luaZ_fill(HEAP32[r4+56>>2])}HEAP32[r4>>2]=r8;HEAP32[r3+(r5<<2)>>2]=r8;if((HEAP8[HEAP32[r3+(r5<<2)>>2]+633|0]&16|0)==0){_escerror(r4,r3|0,r5+1|0,10416)}r1=(r1<<4)+_luaO_hexavalue(HEAP32[r3+(r5<<2)>>2])|0;r5=r5+1|0}STACKTOP=r2;return r1}function _escerror(r1,r2,r3,r4){var r5,r6,r7;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=r4;HEAP32[HEAP32[r6+60>>2]+4>>2]=0;_save(r6,92);r4=0;while(1){if((r4|0)<(r2|0)){r7=(HEAP32[r1+(r4<<2)>>2]|0)!=-1}else{r7=0}if(!r7){break}_save(r6,HEAP32[r1+(r4<<2)>>2]);r4=r4+1|0}_lexerror(r6,r3,289);STACKTOP=r5;return}function _readdecesc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+16|0;r3=r2;r4=r1;r1=0;r5=0;while(1){if((r5|0)<3){r6=(HEAP8[HEAP32[r4>>2]+633|0]&2|0)!=0}else{r6=0}if(!r6){break}HEAP32[r3+(r5<<2)>>2]=HEAP32[r4>>2];r1=(r1*10&-1)+HEAP32[r3+(r5<<2)>>2]-48|0;r7=HEAP32[r4+56>>2]|0;r8=HEAP32[r7>>2];HEAP32[r7>>2]=r8-1;if(r8>>>0>0){r8=HEAP32[r4+56>>2]+4|0;r7=HEAP32[r8>>2];HEAP32[r8>>2]=r7+1;r9=HEAPU8[r7]}else{r9=_luaZ_fill(HEAP32[r4+56>>2])}HEAP32[r4>>2]=r9;r5=r5+1|0}if((r1|0)<=255){r10=r1;STACKTOP=r2;return r10}_escerror(r4,r3|0,r5,10584);r10=r1;STACKTOP=r2;return r10}function _txtToken(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=r1;if((r2|0)==288|(r2|0)==289|(r2|0)==287){_save(r5,0);r2=_luaO_pushfstring(HEAP32[r5+52>>2],7648,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAP32[HEAP32[r5+60>>2]>>2],r3));STACKTOP=r3;r6=r2;r7=r6;STACKTOP=r4;return r7}else{r6=_luaX_token2str(r5,r1);r7=r6;STACKTOP=r4;return r7}}function _luaM_growaux_(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15;r7=0;r8=STACKTOP;r9=r1;r1=r2;r2=r3;r3=r4;r4=r5;r5=r6;do{if((HEAP32[r2>>2]|0)>=((r4|0)/2&-1|0)){if((HEAP32[r2>>2]|0)>=(r4|0)){_luaG_runerror(r9,11664,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=r5,HEAP32[r7+8>>2]=r4,r7));STACKTOP=r7}else{r10=r4;break}}else{r10=HEAP32[r2>>2]<<1;if((r10|0)<4){r10=4}}}while(0);if((r10+1|0)>>>0>(4294967293/(r3>>>0)&-1)>>>0){_luaM_toobig(r9);r11=r12;r13=r10;r14=r2;HEAP32[r14>>2]=r13;r15=r11;STACKTOP=r8;return r15}else{r12=_luaM_realloc_(r9,r1,Math_imul(HEAP32[r2>>2],r3)|0,Math_imul(r10,r3)|0);r11=r12;r13=r10;r14=r2;HEAP32[r14>>2]=r13;r15=r11;STACKTOP=r8;return r15}}function _luaM_toobig(r1){var r2,r3;r2=0;r3=STACKTOP;_luaG_runerror(r1,11624,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;STACKTOP=r3;return}function _luaM_realloc_(r1,r2,r3,r4){var r5,r6,r7,r8;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=r4;r4=HEAP32[r6+12>>2];if((r1|0)!=0){r7=r2}else{r7=0}r8=r7;r7=FUNCTION_TABLE[HEAP32[r4>>2]](HEAP32[r4+4>>2],r1,r2,r3);do{if((r7|0)==0){if(r3>>>0<=0){break}if((HEAP8[r4+63|0]|0)!=0){_luaC_fullgc(r6,1);r7=FUNCTION_TABLE[HEAP32[r4>>2]](HEAP32[r4+4>>2],r1,r2,r3)}if((r7|0)==0){_luaD_throw(r6,4)}else{break}}}while(0);HEAP32[r4+12>>2]=HEAP32[r4+12>>2]+r3-r8;STACKTOP=r5;return r7}function _luaO_int2fb(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=0;if(r3>>>0<8){r4=r3;r5=r4;STACKTOP=r2;return r5}while(1){if(r3>>>0<16){break}r3=(r3+1|0)>>>1;r1=r1+1|0}r4=r1+1<<3|r3-8;r5=r4;STACKTOP=r2;return r5}function _luaO_fb2int(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=r3>>3&31;if((r1|0)==0){r4=r3;r5=r4;STACKTOP=r2;return r5}else{r4=(r3&7)+8<<r1-1;r5=r4;STACKTOP=r2;return r5}}function _luaO_ceillog2(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=0;r3=r3-1|0;while(1){if(r3>>>0<256){break}r1=r1+8|0;r3=r3>>>8}STACKTOP=r2;return r1+HEAPU8[r3+1224|0]|0}function _luaO_arith(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36;r4=0;r5=STACKTOP;r6=r1;r7=r2;r8=r3;r9=r6;switch(r9|0){case 2:{r10=r7;r11=r8;r12=r10*r11;r13=r12;break};case 1:{r14=r7;r15=r8;r16=r14-r15;r13=r16;break};case 4:{r17=r7;r18=r7;r19=r8;r20=r18/r19;r21=Math_floor(r20);r22=r8;r23=r21*r22;r24=r17-r23;r13=r24;break};case 3:{r25=r7;r26=r8;r27=r25/r26;r13=r27;break};case 6:{r28=r7;r29=-0-r28;r13=r29;break};case 0:{r30=r7;r31=r8;r32=r30+r31;r13=r32;break};case 5:{r33=r7;r34=r8;r35=Math_pow(r33,r34);r13=r35;break};default:{r13=0}}r36=r13;STACKTOP=r5;return r36}function _luaO_hexavalue(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;if((HEAP8[r3+633|0]&2|0)!=0){r4=r3-48|0;r5=r4;STACKTOP=r2;return r5}else{r4=(r3|32)-97+10|0;r5=r4;STACKTOP=r2;return r5}}function _luaO_str2d(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r1;r1=r2;r2=r3;if((_strpbrk(r6,11272)|0)!=0){r7=0;r8=r7;STACKTOP=r4;return r8}if((_strpbrk(r6,11600)|0)!=0){r3=_lua_strx2number(r6,r5);HEAPF64[r2>>3]=r3}else{r3=_strtod(r6,r5);HEAPF64[r2>>3]=r3}if((HEAP32[r5>>2]|0)==(r6|0)){r7=0;r8=r7;STACKTOP=r4;return r8}while(1){if((HEAP8[HEAPU8[HEAP32[r5>>2]]+633|0]&8|0)==0){break}HEAP32[r5>>2]=HEAP32[r5>>2]+1}r7=(HEAP32[r5>>2]|0)==(r6+r1|0)|0;r8=r7;STACKTOP=r4;return r8}function _lua_strx2number(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+24|0;r5=r4;r6=r4+8;r7=r4+16;HEAP32[r5>>2]=r1;r1=r2;r2=0;HEAP32[r6>>2]=0;HEAP32[r7>>2]=0;r8=0;HEAP32[r1>>2]=HEAP32[r5>>2];while(1){if((HEAP8[HEAPU8[HEAP32[r5>>2]]+633|0]&8|0)==0){break}HEAP32[r5>>2]=HEAP32[r5>>2]+1}r8=_isneg(r5);do{if((HEAP8[HEAP32[r5>>2]]|0)==48){if((HEAP8[HEAP32[r5>>2]+1|0]|0)!=120){if((HEAP8[HEAP32[r5>>2]+1|0]|0)!=88){break}}HEAP32[r5>>2]=HEAP32[r5>>2]+2;r2=_readhexa(r5,r2,r7);if((HEAP8[HEAP32[r5>>2]]|0)==46){HEAP32[r5>>2]=HEAP32[r5>>2]+1;r2=_readhexa(r5,r2,r6)}do{if((HEAP32[r7>>2]|0)==0){if((HEAP32[r6>>2]|0)!=0){break}r9=0;r10=r9;STACKTOP=r4;return r10}}while(0);HEAP32[r6>>2]=HEAP32[r6>>2]*-4&-1;HEAP32[r1>>2]=HEAP32[r5>>2];if((HEAP8[HEAP32[r5>>2]]|0)==112){r3=15}else{if((HEAP8[HEAP32[r5>>2]]|0)==80){r3=15}else{r3=23}}do{if(r3==15){r11=0;HEAP32[r5>>2]=HEAP32[r5>>2]+1;r12=_isneg(r5);if((HEAP8[HEAPU8[HEAP32[r5>>2]]+633|0]&2|0)==0){break}while(1){if((HEAP8[HEAPU8[HEAP32[r5>>2]]+633|0]&2|0)==0){break}r13=HEAP32[r5>>2];HEAP32[r5>>2]=r13+1;r11=(r11*10&-1)+HEAP8[r13]-48|0}if((r12|0)!=0){r11=-r11|0}HEAP32[r6>>2]=HEAP32[r6>>2]+r11;r3=23}}while(0);if(r3==23){HEAP32[r1>>2]=HEAP32[r5>>2]}if((r8|0)!=0){r2=-0-r2}r9=_ldexp(r2,HEAP32[r6>>2]);r10=r9;STACKTOP=r4;return r10}}while(0);r9=0;r10=r9;STACKTOP=r4;return r10}function _luaO_pushvfstring(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168;r4=0;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+32|0;r7=r6;r8=r6+8;r9=r1;r10=r2;r11=r3;r12=0;L1:while(1){r13=r10;r14=_strchr(r13,37);r15=r14;r16=r15;r17=(r16|0)==0;if(r17){break}r18=r9;r19=r18+8|0;r20=HEAP32[r19>>2];r21=r20;r22=r9;r23=r10;r24=r15;r25=r10;r26=r24;r27=r25;r28=r26-r27|0;r29=_luaS_newlstr(r22,r23,r28);r30=r29;r31=r30;r32=r31;r33=r21;r34=r33|0;r35=r34;HEAP32[r35>>2]=r32;r36=r30;r37=r36;r38=r37+4|0;r39=HEAP8[r38];r40=r39&255;r41=r40|64;r42=r21;r43=r42+8|0;HEAP32[r43>>2]=r41;r44=r9;r45=r44+8|0;r46=HEAP32[r45>>2];r47=r46+16|0;HEAP32[r45>>2]=r47;r48=r9;r49=r48+24|0;r50=HEAP32[r49>>2];r51=r9;r52=r51+8|0;r53=HEAP32[r52>>2];r54=r50;r55=r53;r56=r54-r55|0;r57=(r56|0)/16&-1;r58=(r57|0)<=0;if(r58){r59=r9;_luaD_growstack(r59,0)}r60=r15;r61=r60+1|0;r62=HEAP8[r61];r63=r62<<24>>24;switch(r63|0){case 115:{r64=r11;r65=(tempInt=HEAP32[r64+4>>2],HEAP32[r64+4>>2]=tempInt+8,HEAP32[HEAP32[r64>>2]+tempInt>>2]);r66=r65;r67=r66;r68=(r67|0)==0;if(r68){r66=9208}r69=r9;r70=r66;r71=r66;r72=_strlen(r71);_pushstr(r69,r70,r72);break};case 99:{r73=r11;r74=(tempInt=HEAP32[r73+4>>2],HEAP32[r73+4>>2]=tempInt+8,HEAP32[HEAP32[r73>>2]+tempInt>>2]);r75=r74&255;HEAP8[r7]=r75;r76=r9;_pushstr(r76,r7,1);break};case 100:{r77=r9;r78=r77+8|0;r79=HEAP32[r78>>2];r80=r79;r81=r11;r82=(tempInt=HEAP32[r81+4>>2],HEAP32[r81+4>>2]=tempInt+8,HEAP32[HEAP32[r81>>2]+tempInt>>2]);r83=r82|0;r84=r80;r85=r84|0;r86=r85;HEAPF64[r86>>3]=r83;r87=r80;r88=r87+8|0;HEAP32[r88>>2]=3;r89=r9;r90=r89+8|0;r91=HEAP32[r90>>2];r92=r91+16|0;HEAP32[r90>>2]=r92;r93=r9;r94=r93+24|0;r95=HEAP32[r94>>2];r96=r9;r97=r96+8|0;r98=HEAP32[r97>>2];r99=r95;r100=r98;r101=r99-r100|0;r102=(r101|0)/16&-1;r103=(r102|0)<=0;if(r103){r104=r9;_luaD_growstack(r104,0)}break};case 102:{r105=r9;r106=r105+8|0;r107=HEAP32[r106>>2];r108=r107;r109=r11;r110=(tempInt=HEAP32[r109+4>>2],HEAP32[r109+4>>2]=tempInt+8,HEAPF64[HEAP32[r109>>2]+tempInt>>3]);r111=r108;r112=r111|0;r113=r112;HEAPF64[r113>>3]=r110;r114=r108;r115=r114+8|0;HEAP32[r115>>2]=3;r116=r9;r117=r116+8|0;r118=HEAP32[r117>>2];r119=r118+16|0;HEAP32[r117>>2]=r119;r120=r9;r121=r120+24|0;r122=HEAP32[r121>>2];r123=r9;r124=r123+8|0;r125=HEAP32[r124>>2];r126=r122;r127=r125;r128=r126-r127|0;r129=(r128|0)/16&-1;r130=(r129|0)<=0;if(r130){r131=r9;_luaD_growstack(r131,0)}break};case 112:{r132=r8|0;r133=r11;r134=(tempInt=HEAP32[r133+4>>2],HEAP32[r133+4>>2]=tempInt+8,HEAP32[HEAP32[r133>>2]+tempInt>>2]);r135=_sprintf(r132,7152,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r134,r5));STACKTOP=r5;r136=r135;r137=r9;r138=r8|0;r139=r136;_pushstr(r137,r138,r139);break};case 37:{r140=r9;_pushstr(r140,5648,1);break};default:{r4=22;break L1}}r141=r12;r142=r141+2|0;r12=r142;r143=r15;r144=r143+2|0;r10=r144}if(r4==22){r145=r9;r146=r15;r147=r146+1|0;r148=HEAP8[r147];r149=r148<<24>>24;_luaG_runerror(r145,4344,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r149,r5));STACKTOP=r5}r150=r9;r151=r10;r152=r10;r153=_strlen(r152);_pushstr(r150,r151,r153);r154=r12;r155=(r154|0)>0;if(!r155){r156=r9;r157=r156+8|0;r158=HEAP32[r157>>2];r159=r158-16|0;r160=r159|0;r161=r160;r162=HEAP32[r161>>2];r163=r162;r164=r163+16|0;r165=r164;STACKTOP=r6;return r165}r166=r9;r167=r12;r168=r167+1|0;_luaV_concat(r166,r168);r156=r9;r157=r156+8|0;r158=HEAP32[r157>>2];r159=r158-16|0;r160=r159|0;r161=r160;r162=HEAP32[r161>>2];r163=r162;r164=r163+16|0;r165=r164;STACKTOP=r6;return r165}function _pushstr(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=HEAP32[r5+8>>2];r6=_luaS_newlstr(r5,r2,r3);HEAP32[r1>>2]=r6;HEAP32[r1+8>>2]=HEAPU8[r6+4|0]|64;r6=r5+8|0;HEAP32[r6>>2]=HEAP32[r6>>2]+16;if(((HEAP32[r5+24>>2]-HEAP32[r5+8>>2]|0)/16&-1|0)<=0){_luaD_growstack(r5,0);STACKTOP=r4;return}else{STACKTOP=r4;return}}function _luaO_pushfstring(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r5|0;HEAP32[r6>>2]=r3;HEAP32[r6+4>>2]=0;r6=_luaO_pushvfstring(r1,r2,r5|0);STACKTOP=r4;return r6}function _luaO_chunkid(r1,r2,r3){var r4,r5,r6,r7;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=_strlen(r1);if((HEAP8[r1]|0)==61){if(r3>>>0<=r2>>>0){_memcpy(r6,r1+1|0,r3)|0}else{_memcpy(r6,r1+1|0,r2-1|0)|0;r6=r6+(r2-1)|0;HEAP8[r6]=0}STACKTOP=r5;return}if((HEAP8[r1]|0)==64){if(r3>>>0<=r2>>>0){_memcpy(r6,r1+1|0,r3)|0}else{r7=r6;HEAP8[r7]=HEAP8[3912];HEAP8[r7+1|0]=HEAP8[3913];HEAP8[r7+2|0]=HEAP8[3914];r6=r6+3|0;r2=r2-3|0;_memcpy(r6,r1+1+r3+ -r2|0,r2)|0}}else{r7=_strchr(r1,10);_memcpy(r6,3448,9)|0;r6=r6+9|0;r2=r2-15|0;do{if(r3>>>0<r2>>>0){if((r7|0)!=0){r4=14;break}_memcpy(r6,r1,r3)|0;r6=r6+r3|0}else{r4=14}}while(0);if(r4==14){if((r7|0)!=0){r3=r7-r1|0}if(r3>>>0>r2>>>0){r3=r2}_memcpy(r6,r1,r3)|0;r6=r6+r3|0;r3=r6;HEAP8[r3]=HEAP8[3912];HEAP8[r3+1|0]=HEAP8[3913];HEAP8[r3+2|0]=HEAP8[3914];r6=r6+3|0}r3=r6;HEAP8[r3]=HEAP8[3096];HEAP8[r3+1|0]=HEAP8[3097];HEAP8[r3+2|0]=HEAP8[3098]}STACKTOP=r5;return}function _isneg(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;if((HEAP8[HEAP32[r3>>2]]|0)==45){r1=r3;HEAP32[r1>>2]=HEAP32[r1>>2]+1;r4=1;r5=r4;STACKTOP=r2;return r5}if((HEAP8[HEAP32[r3>>2]]|0)==43){r1=r3;HEAP32[r1>>2]=HEAP32[r1>>2]+1}r4=0;r5=r4;STACKTOP=r2;return r5}function _readhexa(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;r1=r2;r2=r3;while(1){if((HEAP8[HEAPU8[HEAP32[r5>>2]]+633|0]&16|0)==0){break}r1=r1*16+(_luaO_hexavalue(HEAPU8[HEAP32[r5>>2]])|0);r3=r2;HEAP32[r3>>2]=HEAP32[r3>>2]+1;r3=r5;HEAP32[r3>>2]=HEAP32[r3>>2]+1}STACKTOP=r4;return r1}function _luaY_parser(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11;r7=STACKTOP;STACKTOP=STACKTOP+136|0;r8=r7;r9=r7+80;r10=r1;r1=r4;r4=_luaF_newLclosure(r10,1);r11=HEAP32[r10+8>>2];HEAP32[r11>>2]=r4;HEAP32[r11+8>>2]=70;r11=r10+8|0;HEAP32[r11>>2]=HEAP32[r11>>2]+16;if(((HEAP32[r10+24>>2]-HEAP32[r10+8>>2]|0)/16&-1|0)<=0){_luaD_growstack(r10,0)}r11=_luaF_newproto(r10);HEAP32[r4+12>>2]=r11;HEAP32[r9>>2]=r11;r11=_luaS_new(r10,r5);HEAP32[HEAP32[r9>>2]+36>>2]=r11;HEAP32[r8+60>>2]=r3;HEAP32[r8+64>>2]=r1;HEAP32[r1+28>>2]=0;HEAP32[r1+16>>2]=0;HEAP32[r1+4>>2]=0;_luaX_setinput(r10,r8,r2,HEAP32[HEAP32[r9>>2]+36>>2],r6);_mainfunc(r8,r9);STACKTOP=r7;return r4}function _mainfunc(r1,r2){var r3,r4,r5;r3=STACKTOP;STACKTOP=STACKTOP+40|0;r4=r3+16;r5=r1;r1=r2;_open_func(r5,r1,r3);HEAP8[HEAP32[r1>>2]+77|0]=1;_init_exp(r4,7,0);_newupvalue(r1,HEAP32[r5+72>>2],r4);_luaX_next(r5);_statlist(r5);_check(r5,286);_close_func(r5);STACKTOP=r3;return}function _open_func(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=HEAP32[r5+52>>2];HEAP32[r1+8>>2]=HEAP32[r5+48>>2];HEAP32[r1+12>>2]=r5;HEAP32[r5+48>>2]=r1;HEAP32[r1+20>>2]=0;HEAP32[r1+24>>2]=0;HEAP32[r1+28>>2]=-1;HEAP8[r1+48|0]=0;HEAP32[r1+32>>2]=0;HEAP32[r1+36>>2]=0;HEAP8[r1+47|0]=0;HEAP16[r1+44>>1]=0;HEAP8[r1+46|0]=0;HEAP32[r1+40>>2]=HEAP32[HEAP32[r5+64>>2]+4>>2];HEAP32[r1+16>>2]=0;r6=HEAP32[r1>>2];HEAP32[r6+36>>2]=HEAP32[r5+68>>2];HEAP8[r6+78|0]=2;r6=_luaH_new(r3);HEAP32[r1+4>>2]=r6;r6=HEAP32[r3+8>>2];HEAP32[r6>>2]=HEAP32[r1+4>>2];HEAP32[r6+8>>2]=69;r6=r3+8|0;HEAP32[r6>>2]=HEAP32[r6>>2]+16;if(((HEAP32[r3+24>>2]-HEAP32[r3+8>>2]|0)/16&-1|0)<=0){_luaD_growstack(r3,0);r7=r1;r8=r2;_enterblock(r7,r8,0);STACKTOP=r4;return}else{r7=r1;r8=r2;_enterblock(r7,r8,0);STACKTOP=r4;return}}function _init_exp(r1,r2,r3){var r4;r4=r1;HEAP32[r4+16>>2]=-1;HEAP32[r4+20>>2]=-1;HEAP32[r4>>2]=r2;HEAP32[r4+8>>2]=r3;STACKTOP=STACKTOP;return}function _newupvalue(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=HEAP32[r5>>2];r6=HEAP32[r3+40>>2];_checklimit(r5,HEAPU8[r5+47|0]+1|0,255,7632);if((HEAPU8[r5+47|0]+1|0)>(HEAP32[r3+40>>2]|0)){r7=_luaM_growaux_(HEAP32[HEAP32[r5+12>>2]+52>>2],HEAP32[r3+28>>2],r3+40|0,8,255,7632);HEAP32[r3+28>>2]=r7}while(1){if((r6|0)>=(HEAP32[r3+40>>2]|0)){break}r7=r6;r6=r7+1|0;HEAP32[HEAP32[r3+28>>2]+(r7<<3)>>2]=0}HEAP8[HEAP32[r3+28>>2]+(HEAPU8[r5+47|0]<<3)+4|0]=(HEAP32[r2>>2]|0)==7;HEAP8[HEAP32[r3+28>>2]+(HEAPU8[r5+47|0]<<3)+5|0]=HEAP32[r2+8>>2];HEAP32[HEAP32[r3+28>>2]+(HEAPU8[r5+47|0]<<3)>>2]=r1;if((HEAP8[r1+5|0]&3|0)==0){r8=r5;r9=r8+47|0;r10=HEAP8[r9];r11=r10+1&255;HEAP8[r9]=r11;r12=r10&255;STACKTOP=r4;return r12}if((HEAP8[r3+5|0]&4|0)==0){r8=r5;r9=r8+47|0;r10=HEAP8[r9];r11=r10+1&255;HEAP8[r9]=r11;r12=r10&255;STACKTOP=r4;return r12}_luaC_barrier_(HEAP32[HEAP32[r5+12>>2]+52>>2],r3,r1);r8=r5;r9=r8+47|0;r10=HEAP8[r9];r11=r10+1&255;HEAP8[r9]=r11;r12=r10&255;STACKTOP=r4;return r12}function _statlist(r1){var r2,r3,r4;r2=0;r3=STACKTOP;r4=r1;while(1){if(!((_block_follow(r4,1)|0)!=0^1)){r2=6;break}if((HEAP32[r4+16>>2]|0)==274){break}_statement(r4)}if(r2==6){STACKTOP=r3;return}_statement(r4);STACKTOP=r3;return}function _check(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;if((HEAP32[r4+16>>2]|0)!=(r1|0)){_error_expected(r4,r1)}else{STACKTOP=r3;return}}function _close_func(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=STACKTOP;r3=r1;r1=HEAP32[r3+52>>2];r4=HEAP32[r3+48>>2];r5=HEAP32[r4>>2];_luaK_ret(r4,0,0);_leaveblock(r4);if((HEAP32[r4+20>>2]+1|0)>>>0>1073741823){_luaM_toobig(r1)}else{r6=_luaM_realloc_(r1,HEAP32[r5+12>>2],HEAP32[r5+48>>2]<<2,HEAP32[r4+20>>2]<<2)}HEAP32[r5+12>>2]=r6;HEAP32[r5+48>>2]=HEAP32[r4+20>>2];if((HEAP32[r4+20>>2]+1|0)>>>0>1073741823){_luaM_toobig(r1)}else{r7=_luaM_realloc_(r1,HEAP32[r5+20>>2],HEAP32[r5+52>>2]<<2,HEAP32[r4+20>>2]<<2)}HEAP32[r5+20>>2]=r7;HEAP32[r5+52>>2]=HEAP32[r4+20>>2];if((HEAP32[r4+32>>2]+1|0)>>>0>268435455){_luaM_toobig(r1)}else{r8=_luaM_realloc_(r1,HEAP32[r5+8>>2],HEAP32[r5+44>>2]<<4,HEAP32[r4+32>>2]<<4)}HEAP32[r5+8>>2]=r8;HEAP32[r5+44>>2]=HEAP32[r4+32>>2];if((HEAP32[r4+36>>2]+1|0)>>>0>1073741823){_luaM_toobig(r1)}else{r9=_luaM_realloc_(r1,HEAP32[r5+16>>2],HEAP32[r5+56>>2]<<2,HEAP32[r4+36>>2]<<2)}HEAP32[r5+16>>2]=r9;HEAP32[r5+56>>2]=HEAP32[r4+36>>2];if((HEAP16[r4+44>>1]+1|0)>>>0>357913941){_luaM_toobig(r1)}else{r10=_luaM_realloc_(r1,HEAP32[r5+24>>2],HEAP32[r5+60>>2]*12&-1,HEAP16[r4+44>>1]*12&-1)}HEAP32[r5+24>>2]=r10;HEAP32[r5+60>>2]=HEAP16[r4+44>>1]|0;if((HEAPU8[r4+47|0]+1|0)>>>0>536870911){_luaM_toobig(r1)}else{r11=_luaM_realloc_(r1,HEAP32[r5+28>>2],HEAP32[r5+40>>2]<<3,HEAPU8[r4+47|0]<<3)}HEAP32[r5+28>>2]=r11;HEAP32[r5+40>>2]=HEAPU8[r4+47|0];HEAP32[r3+48>>2]=HEAP32[r4+8>>2];_anchor_token(r3);r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]-16;if((HEAP32[HEAP32[r1+12>>2]+12>>2]|0)<=0){STACKTOP=r2;return}_luaC_step(r1);STACKTOP=r2;return}function _leaveblock(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=HEAP32[r3+16>>2];r4=HEAP32[r3+12>>2];do{if((HEAP32[r1>>2]|0)!=0){if((HEAPU8[r1+9|0]|0)==0){break}r5=_luaK_jump(r3);_luaK_patchclose(r3,r5,HEAPU8[r1+8|0]);_luaK_patchtohere(r3,r5)}}while(0);if((HEAP8[r1+10|0]|0)!=0){_breaklabel(r4)}HEAP32[r3+16>>2]=HEAP32[r1>>2];_removevars(r3,HEAPU8[r1+8|0]);HEAP8[r3+48|0]=HEAP8[r3+46|0];HEAP32[HEAP32[r4+64>>2]+28>>2]=HEAP16[r1+4>>1]|0;if((HEAP32[r1>>2]|0)!=0){_movegotosout(r3,r1);STACKTOP=r2;return}if((HEAP16[r1+6>>1]|0)<(HEAP32[HEAP32[r4+64>>2]+16>>2]|0)){_undefgoto(r4,HEAP32[HEAP32[r4+64>>2]+12>>2]+(HEAP16[r1+6>>1]<<4)|0)}STACKTOP=r2;return}function _anchor_token(r1){var r2,r3;r2=STACKTOP;r3=r1;do{if((HEAP32[r3+16>>2]|0)!=288){if((HEAP32[r3+16>>2]|0)==289){break}STACKTOP=r2;return}}while(0);r1=HEAP32[r3+24>>2];_luaX_newstring(r3,r1+16|0,HEAP32[r1+12>>2]);STACKTOP=r2;return}function _breaklabel(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_luaS_new(HEAP32[r3+52>>2],6944);r4=_newlabelentry(r3,HEAP32[r3+64>>2]+24|0,r1,0,HEAP32[HEAP32[r3+48>>2]+20>>2]);_findgotos(r3,HEAP32[HEAP32[r3+64>>2]+24>>2]+(r4<<4)|0);STACKTOP=r2;return}function _removevars(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[HEAP32[r4+12>>2]+64>>2]+4|0;HEAP32[r2>>2]=HEAP32[r2>>2]-(HEAPU8[r4+46|0]-r1);while(1){if((HEAPU8[r4+46|0]|0)<=(r1|0)){break}r2=HEAP32[r4+20>>2];r5=r4+46|0;r6=HEAP8[r5]-1&255;HEAP8[r5]=r6;r5=_getlocvar(r4,r6&255)+8|0;HEAP32[r5>>2]=r2}STACKTOP=r3;return}function _movegotosout(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP16[r1+6>>1]|0;r5=HEAP32[HEAP32[r4+12>>2]+64>>2]+12|0;while(1){if((r2|0)>=(HEAP32[r5+4>>2]|0)){break}r6=HEAP32[r5>>2]+(r2<<4)|0;if((HEAPU8[r6+12|0]|0)>(HEAPU8[r1+8|0]|0)){if((HEAP8[r1+9|0]|0)!=0){_luaK_patchclose(r4,HEAP32[r6+4>>2],HEAPU8[r1+8|0])}HEAP8[r6+12|0]=HEAP8[r1+8|0]}if((_findlabel(HEAP32[r4+12>>2],r2)|0)==0){r2=r2+1|0}}STACKTOP=r3;return}function _undefgoto(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1;r1=r2;if((HEAPU8[HEAP32[r1>>2]+4|0]|0)==4){r6=(HEAPU8[HEAP32[r1>>2]+6|0]|0)>0}else{r6=0}r2=r6?9848:11328;r6=HEAP32[r1+8>>2];r7=_luaO_pushfstring(HEAP32[r5+52>>2],r2,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP32[r1>>2]+16,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;r2=r7;_semerror(r5,r2);STACKTOP=r4;return}function _semerror(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;HEAP32[r4+16>>2]=0;_luaX_syntaxerror(r4,r2);STACKTOP=r3;return}function _findlabel(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=HEAP32[HEAP32[r5+48>>2]+16>>2];r6=HEAP32[r5+64>>2];r7=HEAP32[r6+12>>2]+(r1<<4)|0;r8=HEAP16[r2+4>>1]|0;while(1){if((r8|0)>=(HEAP32[r6+28>>2]|0)){r3=11;break}r9=HEAP32[r6+24>>2]+(r8<<4)|0;if((_luaS_eqstr(HEAP32[r9>>2],HEAP32[r7>>2])|0)!=0){break}r8=r8+1|0}if(r3==11){r10=0;r11=r10;STACKTOP=r4;return r11}do{if((HEAPU8[r7+12|0]|0)>(HEAPU8[r9+12|0]|0)){if((HEAPU8[r2+9|0]|0)==0){if((HEAP32[r6+28>>2]|0)<=(HEAP16[r2+4>>1]|0)){break}}_luaK_patchclose(HEAP32[r5+48>>2],HEAP32[r7+4>>2],HEAPU8[r9+12|0])}}while(0);_closegoto(r5,r1,r9);r10=1;r11=r10;STACKTOP=r4;return r11}function _closegoto(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=HEAP32[r6+48>>2];r7=HEAP32[r6+64>>2]+12|0;r8=HEAP32[r7>>2]+(r1<<4)|0;if((HEAPU8[r8+12|0]|0)<(HEAPU8[r2+12|0]|0)){r9=_getlocvar(r3,HEAPU8[r8+12|0])|0;r10=HEAP32[r8+8>>2];r11=HEAP32[r9>>2]+16|0;r9=_luaO_pushfstring(HEAP32[r6+52>>2],9008,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAP32[r8>>2]+16,HEAP32[r4+8>>2]=r10,HEAP32[r4+16>>2]=r11,r4));STACKTOP=r4;_semerror(r6,r9)}_luaK_patchlist(r3,HEAP32[r8+4>>2],HEAP32[r2+4>>2]);r2=r1;while(1){if((r2|0)>=(HEAP32[r7+4>>2]-1|0)){break}r1=HEAP32[r7>>2]+(r2<<4)|0;r8=HEAP32[r7>>2]+(r2+1<<4)|0;HEAP32[r1>>2]=HEAP32[r8>>2];HEAP32[r1+4>>2]=HEAP32[r8+4>>2];HEAP32[r1+8>>2]=HEAP32[r8+8>>2];HEAP32[r1+12>>2]=HEAP32[r8+12>>2];r2=r2+1|0}r2=r7+4|0;HEAP32[r2>>2]=HEAP32[r2>>2]-1;STACKTOP=r5;return}function _getlocvar(r1,r2){var r3;r3=r1;STACKTOP=STACKTOP;return HEAP32[HEAP32[r3>>2]+24>>2]+(HEAP16[HEAP32[HEAP32[HEAP32[r3+12>>2]+64>>2]>>2]+(HEAP32[r3+40>>2]+r2<<1)>>1]*12&-1)|0}function _newlabelentry(r1,r2,r3,r4,r5){var r6,r7,r8;r6=STACKTOP;r7=r1;r1=r2;r2=HEAP32[r1+4>>2];if((r2+1|0)>(HEAP32[r1+8>>2]|0)){r8=_luaM_growaux_(HEAP32[r7+52>>2],HEAP32[r1>>2],r1+8|0,16,32767,5488);HEAP32[r1>>2]=r8}HEAP32[HEAP32[r1>>2]+(r2<<4)>>2]=r3;HEAP32[HEAP32[r1>>2]+(r2<<4)+8>>2]=r4;HEAP8[HEAP32[r1>>2]+(r2<<4)+12|0]=HEAP8[HEAP32[r7+48>>2]+46|0];HEAP32[HEAP32[r1>>2]+(r2<<4)+4>>2]=r5;r5=r1+4|0;HEAP32[r5>>2]=HEAP32[r5>>2]+1;STACKTOP=r6;return r2}function _findgotos(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+64>>2]+12|0;r5=HEAP16[HEAP32[HEAP32[r4+48>>2]+16>>2]+6>>1]|0;while(1){if((r5|0)>=(HEAP32[r2+4>>2]|0)){break}if((_luaS_eqstr(HEAP32[HEAP32[r2>>2]+(r5<<4)>>2],HEAP32[r1>>2])|0)!=0){_closegoto(r4,r5,r1)}else{r5=r5+1|0}}STACKTOP=r3;return}function _error_expected(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1;r1=HEAP32[r5+52>>2];r6=_luaX_token2str(r5,r2);r2=_luaO_pushfstring(r1,4288,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6,r3));STACKTOP=r3;_luaX_syntaxerror(r5,r2);STACKTOP=r4;return}function _block_follow(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=0;r4=STACKTOP;r5=r1;r6=r2;r7=r5;r8=r7+16|0;r9=r8|0;r10=HEAP32[r9>>2];switch(r10|0){case 260:case 261:case 262:case 286:{r11=1;break};case 277:{r12=r6;r11=r12;break};default:{r11=0}}r13=r11;STACKTOP=r4;return r13}function _statement(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62;r2=0;r3=STACKTOP;r4=r1;r5=r4;r6=r5+4|0;r7=HEAP32[r6>>2];r8=r7;r9=r4;_enterlevel(r9);r10=r4;r11=r10+16|0;r12=r11|0;r13=HEAP32[r12>>2];switch(r13|0){case 59:{r14=r4;_luaX_next(r14);break};case 267:{r15=r4;r16=r8;_ifstat(r15,r16);break};case 278:{r17=r4;r18=r8;_whilestat(r17,r18);break};case 259:{r19=r4;_luaX_next(r19);r20=r4;_block(r20);r21=r4;r22=r8;_check_match(r21,262,259,r22);break};case 264:{r23=r4;r24=r8;_forstat(r23,r24);break};case 273:{r25=r4;r26=r8;_repeatstat(r25,r26);break};case 265:{r27=r4;r28=r8;_funcstat(r27,r28);break};case 269:{r29=r4;_luaX_next(r29);r30=r4;r31=_testnext(r30,265);r32=(r31|0)!=0;if(r32){r33=r4;_localfunc(r33)}else{r34=r4;_localstat(r34)}break};case 285:{r35=r4;_luaX_next(r35);r36=r4;r37=r4;r38=_str_checkname(r37);r39=r8;_labelstat(r36,r38,r39);break};case 274:{r40=r4;_luaX_next(r40);r41=r4;_retstat(r41);break};case 258:case 266:{r42=r4;r43=r4;r44=r43+48|0;r45=HEAP32[r44>>2];r46=_luaK_jump(r45);_gotostat(r42,r46);break};default:{r47=r4;_exprstat(r47)}}r48=r4;r49=r48+48|0;r50=HEAP32[r49>>2];r51=r50+46|0;r52=HEAP8[r51];r53=r4;r54=r53+48|0;r55=HEAP32[r54>>2];r56=r55+48|0;HEAP8[r56]=r52;r57=r4;r58=r57+52|0;r59=HEAP32[r58>>2];r60=r59+38|0;r61=HEAP16[r60>>1];r62=r61-1&65535;HEAP16[r60>>1]=r62;STACKTOP=r3;return}function _enterlevel(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=HEAP32[r3+52>>2];r4=r1+38|0;HEAP16[r4>>1]=HEAP16[r4>>1]+1;_checklimit(HEAP32[r3+48>>2],HEAPU16[r1+38>>1],200,3432);STACKTOP=r2;return}function _ifstat(r1,r2){var r3,r4,r5;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r1;r1=r2;r2=HEAP32[r5+48>>2];HEAP32[r4>>2]=-1;_test_then_block(r5,r4);while(1){if((HEAP32[r5+16>>2]|0)!=261){break}_test_then_block(r5,r4)}if((_testnext(r5,260)|0)!=0){_block(r5)}_check_match(r5,262,267,r1);_luaK_patchtohere(r2,HEAP32[r4>>2]);STACKTOP=r3;return}function _whilestat(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r1;r1=HEAP32[r4+48>>2];_luaX_next(r4);r5=_luaK_getlabel(r1);r6=_cond(r4);_enterblock(r1,r3,1);_checknext(r4,259);_block(r4);_luaK_patchlist(r1,_luaK_jump(r1),r5);_check_match(r4,262,278,r2);_leaveblock(r1);_luaK_patchtohere(r1,r6);STACKTOP=r3;return}function _block(r1){var r2,r3;r2=STACKTOP;STACKTOP=STACKTOP+16|0;r3=r1;r1=HEAP32[r3+48>>2];_enterblock(r1,r2,0);_statlist(r3);_leaveblock(r1);STACKTOP=r2;return}function _check_match(r1,r2,r3,r4){var r5,r6,r7;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r4;if((_testnext(r7,r1)|0)!=0){STACKTOP=r6;return}if((r2|0)==(HEAP32[r7+4>>2]|0)){_error_expected(r7,r1)}else{r6=HEAP32[r7+52>>2];r4=_luaX_token2str(r7,r1);r1=_luaX_token2str(r7,r3);r3=_luaO_pushfstring(r6,7800,(r5=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r5>>2]=r4,HEAP32[r5+8>>2]=r1,HEAP32[r5+16>>2]=r2,r5));STACKTOP=r5;_luaX_syntaxerror(r7,r3)}}function _forstat(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r1;r1=r2;r2=HEAP32[r4+48>>2];_enterblock(r2,r3,1);_luaX_next(r4);r5=_str_checkname(r4);r6=HEAP32[r4+16>>2];if((r6|0)==61){_fornum(r4,r5,r1);r7=r4;r8=r1;_check_match(r7,262,264,r8);r9=r2;_leaveblock(r9);STACKTOP=r3;return}else if((r6|0)==44|(r6|0)==268){_forlist(r4,r5);r7=r4;r8=r1;_check_match(r7,262,264,r8);r9=r2;_leaveblock(r9);STACKTOP=r3;return}else{_luaX_syntaxerror(r4,9416)}}function _repeatstat(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=STACKTOP;STACKTOP=STACKTOP+32|0;r4=r3+16;r5=r1;r1=HEAP32[r5+48>>2];r6=_luaK_getlabel(r1);_enterblock(r1,r3,1);_enterblock(r1,r4,0);_luaX_next(r5);_statlist(r5);_check_match(r5,277,273,r2);r2=_cond(r5);if((HEAP8[r4+9|0]|0)==0){r7=r1;_leaveblock(r7);r8=r1;r9=r2;r10=r6;_luaK_patchlist(r8,r9,r10);r11=r1;_leaveblock(r11);STACKTOP=r3;return}_luaK_patchclose(r1,r2,HEAPU8[r4+8|0]);r7=r1;_leaveblock(r7);r8=r1;r9=r2;r10=r6;_luaK_patchlist(r8,r9,r10);r11=r1;_leaveblock(r11);STACKTOP=r3;return}function _funcstat(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+48|0;r4=r3;r5=r3+24;r6=r1;r1=r2;_luaX_next(r6);_body(r6,r5,_funcname(r6,r4),r1);_luaK_storevar(HEAP32[r6+48>>2],r4,r5);_luaK_fixline(HEAP32[r6+48>>2],r1);STACKTOP=r3;return}function _testnext(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;if((HEAP32[r4+16>>2]|0)==(r2|0)){_luaX_next(r4);r5=1;r6=r5;STACKTOP=r3;return r6}else{r5=0;r6=r5;STACKTOP=r3;return r6}}function _localfunc(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r1;r1=HEAP32[r4+48>>2];_new_localvar(r4,_str_checkname(r4));_adjustlocalvars(r4,1);_body(r4,r3,0,HEAP32[r4+4>>2]);r4=HEAP32[r1+20>>2];r5=_getlocvar(r1,HEAP32[r3+8>>2])+4|0;HEAP32[r5>>2]=r4;STACKTOP=r2;return}function _localstat(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r1;r1=0;while(1){_new_localvar(r4,_str_checkname(r4));r1=r1+1|0;if((_testnext(r4,44)|0)==0){break}}if((_testnext(r4,61)|0)!=0){r5=_explist(r4,r3)}else{HEAP32[r3>>2]=0;r5=0}_adjust_assign(r4,r1,r5,r3);_adjustlocalvars(r4,r1);STACKTOP=r2;return}function _labelstat(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=STACKTOP;r5=r1;r1=r2;r2=HEAP32[r5+48>>2];r6=HEAP32[r5+64>>2]+24|0;_checkrepeated(r2,r6,r1);_checknext(r5,285);r7=_newlabelentry(r5,r6,r1,r3,HEAP32[r2+20>>2]);_skipnoopstat(r5);if((_block_follow(r5,0)|0)==0){r8=r5;r9=r7;r10=r6;r11=r10|0;r12=HEAP32[r11>>2];r13=r12+(r9<<4)|0;_findgotos(r8,r13);STACKTOP=r4;return}HEAP8[HEAP32[r6>>2]+(r7<<4)+12|0]=HEAP8[HEAP32[r2+16>>2]+8|0];r8=r5;r9=r7;r10=r6;r11=r10|0;r12=HEAP32[r11>>2];r13=r12+(r9<<4)|0;_findgotos(r8,r13);STACKTOP=r4;return}function _str_checkname(r1){var r2,r3;r2=STACKTOP;r3=r1;_check(r3,288);r1=HEAP32[r3+24>>2];_luaX_next(r3);STACKTOP=r2;return r1}function _retstat(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+24|0;r4=r3;r5=r1;r1=HEAP32[r5+48>>2];do{if((_block_follow(r5,1)|0)==0){if((HEAP32[r5+16>>2]|0)==59){break}r6=_explist(r5,r4);do{if((HEAP32[r4>>2]|0)==12){r2=6}else{if((HEAP32[r4>>2]|0)==13){r2=6;break}if((r6|0)==1){r7=_luaK_exp2anyreg(r1,r4)}else{_luaK_exp2nextreg(r1,r4);r7=HEAPU8[r1+46|0]}}}while(0);if(r2==6){_luaK_setreturns(r1,r4,-1);do{if((HEAP32[r4>>2]|0)==12){if((r6|0)!=1){break}HEAP32[HEAP32[HEAP32[r1>>2]+12>>2]+(HEAP32[r4+8>>2]<<2)>>2]=HEAP32[HEAP32[HEAP32[r1>>2]+12>>2]+(HEAP32[r4+8>>2]<<2)>>2]&-64|30}}while(0);r7=HEAPU8[r1+46|0];r6=-1}r8=r1;r9=r7;r10=r6;_luaK_ret(r8,r9,r10);r11=r5;r12=_testnext(r11,59);STACKTOP=r3;return}}while(0);r6=0;r7=0;r8=r1;r9=r7;r10=r6;_luaK_ret(r8,r9,r10);r11=r5;r12=_testnext(r11,59);STACKTOP=r3;return}function _gotostat(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=HEAP32[r4+4>>2];if((_testnext(r4,266)|0)!=0){r5=_str_checkname(r4)}else{_luaX_next(r4);r5=_luaS_new(HEAP32[r4+52>>2],6944)}_findlabel(r4,_newlabelentry(r4,HEAP32[r4+64>>2]+12|0,r5,r1,r2));STACKTOP=r3;return}function _exprstat(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+32|0;r3=r2;r4=r1;r1=HEAP32[r4+48>>2];_suffixedexp(r4,r3+8|0);do{if((HEAP32[r4+16>>2]|0)!=61){if((HEAP32[r4+16>>2]|0)==44){break}if((HEAP32[r3+8>>2]|0)!=12){_luaX_syntaxerror(r4,3896)}HEAP32[HEAP32[HEAP32[r1>>2]+12>>2]+(HEAP32[r3+16>>2]<<2)>>2]=HEAP32[HEAP32[HEAP32[r1>>2]+12>>2]+(HEAP32[r3+16>>2]<<2)>>2]&-8372225|16384;STACKTOP=r2;return}}while(0);HEAP32[r3>>2]=0;_assignment(r4,r3,1);STACKTOP=r2;return}function _suffixedexp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+48|0;r5=r4;r6=r4+24;r7=r1;r8=r2;r9=r7;r10=r9+48|0;r11=HEAP32[r10>>2];r12=r11;r13=r7;r14=r13+4|0;r15=HEAP32[r14>>2];r16=r15;r17=r7;r18=r8;_primaryexp(r17,r18);L1:while(1){r19=r7;r20=r19+16|0;r21=r20|0;r22=HEAP32[r21>>2];switch(r22|0){case 46:{r23=r7;r24=r8;_fieldsel(r23,r24);break};case 91:{r25=r12;r26=r8;_luaK_exp2anyregup(r25,r26);r27=r7;_yindex(r27,r5);r28=r12;r29=r8;_luaK_indexed(r28,r29,r5);break};case 58:{r30=r7;_luaX_next(r30);r31=r7;_checkname(r31,r6);r32=r12;r33=r8;_luaK_self(r32,r33,r6);r34=r7;r35=r8;r36=r16;_funcargs(r34,r35,r36);break};case 40:case 289:case 123:{r37=r12;r38=r8;_luaK_exp2nextreg(r37,r38);r39=r7;r40=r8;r41=r16;_funcargs(r39,r40,r41);break};default:{break L1}}}STACKTOP=r4;return}function _assignment(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;STACKTOP=STACKTOP+56|0;r5=r4;r6=r4+24;r7=r1;r1=r2;r2=r3;if(7>HEAP32[r1+8>>2]>>>0){r8=r7;_luaX_syntaxerror(r8,3896)}if(HEAP32[r1+8>>2]>>>0>9){r8=r7;_luaX_syntaxerror(r8,3896)}if((_testnext(r7,44)|0)!=0){HEAP32[r6>>2]=r1;_suffixedexp(r7,r6+8|0);if((HEAP32[r6+8>>2]|0)!=9){_check_conflict(r7,r1,r6+8|0)}_checklimit(HEAP32[r7+48>>2],r2+HEAPU16[HEAP32[r7+52>>2]+38>>1]|0,200,3432);_assignment(r7,r6,r2+1|0)}else{_checknext(r7,61);r6=_explist(r7,r5);if((r6|0)==(r2|0)){_luaK_setoneret(HEAP32[r7+48>>2],r5);_luaK_storevar(HEAP32[r7+48>>2],r1+8|0,r5);STACKTOP=r4;return}_adjust_assign(r7,r2,r6,r5);if((r6|0)>(r2|0)){r8=HEAP32[r7+48>>2]+48|0;HEAP8[r8]=HEAPU8[r8]-(r6-r2)}}_init_exp(r5,6,HEAPU8[HEAP32[r7+48>>2]+48|0]-1|0);_luaK_storevar(HEAP32[r7+48>>2],r1+8|0,r5);STACKTOP=r4;return}function _check_conflict(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r2;r2=r3;r3=HEAP32[r1+48>>2];r1=HEAPU8[r3+48|0];r6=0;while(1){if((r5|0)==0){break}if((HEAP32[r5+8>>2]|0)==9){do{if((HEAPU8[r5+19|0]|0)==(HEAP32[r2>>2]|0)){if((HEAPU8[r5+18|0]|0)!=(HEAP32[r2+8>>2]|0)){break}r6=1;HEAP8[r5+19|0]=7;HEAP8[r5+18|0]=r1}}while(0);do{if((HEAP32[r2>>2]|0)==7){if((HEAP16[r5+16>>1]|0)!=(HEAP32[r2+8>>2]|0)){break}r6=1;HEAP16[r5+16>>1]=r1}}while(0)}r5=HEAP32[r5>>2]}if((r6|0)==0){STACKTOP=r4;return}_luaK_codeABC(r3,(HEAP32[r2>>2]|0)==7?0:5,r1,HEAP32[r2+8>>2],0);_luaK_reserveregs(r3,1);STACKTOP=r4;return}function _checklimit(r1,r2,r3,r4){var r5,r6;r5=STACKTOP;r6=r3;if((r2|0)>(r6|0)){_errorlimit(r1,r6,r4)}else{STACKTOP=r5;return}}function _checknext(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;_check(r4,r2);_luaX_next(r4);STACKTOP=r3;return}function _explist(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;r2=1;_expr(r4,r1);while(1){if((_testnext(r4,44)|0)==0){break}_luaK_exp2nextreg(HEAP32[r4+48>>2],r1);_expr(r4,r1);r2=r2+1|0}STACKTOP=r3;return r2}function _adjust_assign(r1,r2,r3,r4){var r5,r6;r5=STACKTOP;r6=r4;r4=HEAP32[r1+48>>2];r1=r2-r3|0;do{if((HEAP32[r6>>2]|0)!=12){if((HEAP32[r6>>2]|0)==13){break}if((HEAP32[r6>>2]|0)!=0){_luaK_exp2nextreg(r4,r6)}if((r1|0)>0){r3=HEAPU8[r4+48|0];_luaK_reserveregs(r4,r1);_luaK_nil(r4,r3,r1)}STACKTOP=r5;return}}while(0);r1=r1+1|0;if((r1|0)<0){r1=0}_luaK_setreturns(r4,r6,r1);if((r1|0)>1){_luaK_reserveregs(r4,r1-1|0)}STACKTOP=r5;return}function _expr(r1,r2){var r3;r3=STACKTOP;_subexpr(r1,r2,0);STACKTOP=r3;return}function _subexpr(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=STACKTOP;STACKTOP=STACKTOP+24|0;r5=r4;r6=r1;r1=r2;r2=r3;_enterlevel(r6);r3=_getunopr(HEAP32[r6+16>>2]);if((r3|0)!=3){r7=HEAP32[r6+4>>2];_luaX_next(r6);_subexpr(r6,r1,8);_luaK_prefix(HEAP32[r6+48>>2],r3,r1,r7)}else{_simpleexp(r6,r1)}r7=_getbinopr(HEAP32[r6+16>>2]);while(1){if((r7|0)!=15){r8=(HEAPU8[296+(r7<<1)|0]|0)>(r2|0)}else{r8=0}if(!r8){break}r3=HEAP32[r6+4>>2];_luaX_next(r6);_luaK_infix(HEAP32[r6+48>>2],r7,r1);r9=_subexpr(r6,r5,HEAPU8[297+(r7<<1)|0]);_luaK_posfix(HEAP32[r6+48>>2],r7,r1,r5,r3);r7=r9}r5=HEAP32[r6+52>>2]+38|0;HEAP16[r5>>1]=HEAP16[r5>>1]-1;STACKTOP=r4;return r7}function _getunopr(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;if((r3|0)==271){r4=1}else if((r3|0)==45){r4=0}else if((r3|0)==35){r4=2}else{r4=3}STACKTOP=r2;return r4}function _simpleexp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54;r3=0;r4=STACKTOP;r5=r1;r6=r2;r7=r5;r8=r7+16|0;r9=r8|0;r10=HEAP32[r9>>2];L1:do{switch(r10|0){case 265:{r11=r5;_luaX_next(r11);r12=r5;r13=r6;r14=r5;r15=r14+4|0;r16=HEAP32[r15>>2];_body(r12,r13,0,r16);STACKTOP=r4;return;break};case 263:{r17=r6;_init_exp(r17,3,0);break};case 280:{r18=r5;r19=r18+48|0;r20=HEAP32[r19>>2];r21=r20;r22=r21;r23=r22|0;r24=HEAP32[r23>>2];r25=r24+77|0;r26=HEAP8[r25];r27=r26<<24>>24!=0;if(r27){r28=r6;r29=r21;r30=_luaK_codeABC(r29,38,0,1,0);_init_exp(r28,13,r30);break L1}else{r31=r5;_luaX_syntaxerror(r31,3048)}break};case 123:{r32=r5;r33=r6;_constructor(r32,r33);STACKTOP=r4;return;break};case 287:{r34=r6;_init_exp(r34,5,0);r35=r5;r36=r35+16|0;r37=r36+8|0;r38=r37;r39=HEAPF64[r38>>3];r40=r6;r41=r40+8|0;r42=r41;HEAPF64[r42>>3]=r39;break};case 289:{r43=r5;r44=r6;r45=r5;r46=r45+16|0;r47=r46+8|0;r48=r47;r49=HEAP32[r48>>2];_codestring(r43,r44,r49);break};case 270:{r50=r6;_init_exp(r50,1,0);break};case 276:{r51=r6;_init_exp(r51,2,0);break};default:{r52=r5;r53=r6;_suffixedexp(r52,r53);STACKTOP=r4;return}}}while(0);r54=r5;_luaX_next(r54);STACKTOP=r4;return}function _getbinopr(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=STACKTOP;r4=r1;r5=r4;switch(r5|0){case 37:{r6=4;break};case 94:{r6=5;break};case 279:{r6=6;break};case 284:{r6=10;break};case 43:{r6=0;break};case 42:{r6=2;break};case 45:{r6=1;break};case 62:{r6=11;break};case 282:{r6=12;break};case 257:{r6=13;break};case 272:{r6=14;break};case 281:{r6=7;break};case 60:{r6=8;break};case 283:{r6=9;break};case 47:{r6=3;break};default:{r6=15}}r7=r6;STACKTOP=r3;return r7}function _codestring(r1,r2,r3){var r4;r4=STACKTOP;_init_exp(r2,4,_luaK_stringK(HEAP32[r1+48>>2],r3));STACKTOP=r4;return}function _constructor(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+40|0;r5=r4;r6=r1;r1=r2;r2=HEAP32[r6+48>>2];r7=HEAP32[r6+4>>2];r8=_luaK_codeABC(r2,11,0,0,0);HEAP32[r5+36>>2]=0;HEAP32[r5+28>>2]=0;HEAP32[r5+32>>2]=0;HEAP32[r5+24>>2]=r1;_init_exp(r1,11,r8);_init_exp(r5|0,0,0);_luaK_exp2nextreg(HEAP32[r6+48>>2],r1);_checknext(r6,123);while(1){if((HEAP32[r6+16>>2]|0)==125){r3=3;break}_closelistfield(r2,r5);_field(r6,r5);if((_testnext(r6,44)|0)!=0){r9=1}else{r9=(_testnext(r6,59)|0)!=0}if(!r9){break}}_check_match(r6,125,123,r7);_lastlistfield(r2,r5);r7=HEAP32[HEAP32[HEAP32[r2>>2]+12>>2]+(r8<<2)>>2]&8388607;r6=r7|_luaO_int2fb(HEAP32[r5+32>>2])<<23&-8388608;HEAP32[HEAP32[HEAP32[r2>>2]+12>>2]+(r8<<2)>>2]=r6;r6=HEAP32[HEAP32[HEAP32[r2>>2]+12>>2]+(r8<<2)>>2]&-8372225;r7=r6|_luaO_int2fb(HEAP32[r5+28>>2])<<14&8372224;HEAP32[HEAP32[HEAP32[r2>>2]+12>>2]+(r8<<2)>>2]=r7;STACKTOP=r4;return}function _body(r1,r2,r3,r4){var r5,r6,r7;r5=STACKTOP;STACKTOP=STACKTOP+72|0;r6=r5;r7=r1;r1=r4;r4=_addprototype(r7);HEAP32[r6>>2]=r4;HEAP32[HEAP32[r6>>2]+64>>2]=r1;_open_func(r7,r6,r5+56);_checknext(r7,40);if((r3|0)!=0){_new_localvarliteral_(r7,2768,4);_adjustlocalvars(r7,1)}_parlist(r7);_checknext(r7,41);_statlist(r7);HEAP32[HEAP32[r6>>2]+68>>2]=HEAP32[r7+4>>2];_check_match(r7,262,265,r1);_codeclosure(r7,r2);_close_func(r7);STACKTOP=r5;return}function _addprototype(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;r3=r1;r1=HEAP32[r3+52>>2];r4=HEAP32[r3+48>>2];r3=HEAP32[r4>>2];if((HEAP32[r4+36>>2]|0)>=(HEAP32[r3+56>>2]|0)){r5=HEAP32[r3+56>>2];if((HEAP32[r4+36>>2]+1|0)>(HEAP32[r3+56>>2]|0)){r6=_luaM_growaux_(r1,HEAP32[r3+16>>2],r3+56|0,4,262143,11256);HEAP32[r3+16>>2]=r6}while(1){if((r5|0)>=(HEAP32[r3+56>>2]|0)){break}r6=r5;r5=r6+1|0;HEAP32[HEAP32[r3+16>>2]+(r6<<2)>>2]=0}}r5=_luaF_newproto(r1);r6=r5;r7=r4+36|0;r4=HEAP32[r7>>2];HEAP32[r7>>2]=r4+1;HEAP32[HEAP32[r3+16>>2]+(r4<<2)>>2]=r5;if((HEAP8[r6+5|0]&3|0)==0){r8=r6;STACKTOP=r2;return r8}if((HEAP8[r3+5|0]&4|0)==0){r8=r6;STACKTOP=r2;return r8}_luaC_barrier_(r1,r3,r6);r8=r6;STACKTOP=r2;return r8}function _new_localvarliteral_(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;_new_localvar(r5,_luaX_newstring(r5,r2,r3));STACKTOP=r4;return}function _adjustlocalvars(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r2;r2=HEAP32[r1+48>>2];HEAP8[r2+46|0]=HEAPU8[r2+46|0]+r4;while(1){if((r4|0)==0){break}r1=HEAP32[r2+20>>2];r5=_getlocvar(r2,HEAPU8[r2+46|0]-r4|0)+4|0;HEAP32[r5>>2]=r1;r4=r4-1|0}STACKTOP=r3;return}function _parlist(r1){var r2,r3,r4,r5,r6,r7,r8;r2=0;r3=STACKTOP;r4=r1;r1=HEAP32[r4+48>>2];r5=HEAP32[r1>>2];r6=0;HEAP8[r5+77|0]=0;do{if((HEAP32[r4+16>>2]|0)!=41){while(1){r7=HEAP32[r4+16>>2];if((r7|0)==288){_new_localvar(r4,_str_checkname(r4));r6=r6+1|0}else if((r7|0)==280){_luaX_next(r4);HEAP8[r5+77|0]=1}else{r2=6;break}if((HEAP8[r5+77|0]|0)!=0){r8=0}else{r8=(_testnext(r4,44)|0)!=0}if(!r8){r2=11;break}}if(r2==6){_luaX_syntaxerror(r4,11992)}else if(r2==11){break}}}while(0);_adjustlocalvars(r4,r6);HEAP8[r5+76|0]=HEAP8[r1+46|0];_luaK_reserveregs(r1,HEAPU8[r1+46|0]);STACKTOP=r3;return}function _codeclosure(r1,r2){var r3,r4;r3=STACKTOP;r4=r2;r2=HEAP32[HEAP32[r1+48>>2]+8>>2];_init_exp(r4,11,_luaK_codeABx(r2,37,0,HEAP32[r2+36>>2]-1|0));_luaK_exp2nextreg(r2,r4);STACKTOP=r3;return}function _new_localvar(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=HEAP32[r4+48>>2];r5=HEAP32[r4+64>>2];r6=_registerlocalvar(r4,r2);_checklimit(r1,HEAP32[r5+4>>2]+1-HEAP32[r1+40>>2]|0,200,11608);if((HEAP32[r5+4>>2]+2|0)>(HEAP32[r5+8>>2]|0)){r1=_luaM_growaux_(HEAP32[r4+52>>2],HEAP32[r5>>2],r5+8|0,2,2147483645,11608);HEAP32[r5>>2]=r1}r1=r5+4|0;r4=HEAP32[r1>>2];HEAP32[r1>>2]=r4+1;HEAP16[HEAP32[r5>>2]+(r4<<1)>>1]=r6;STACKTOP=r3;return}function _registerlocalvar(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+48>>2];r5=HEAP32[r2>>2];r6=HEAP32[r5+60>>2];if((HEAP16[r2+44>>1]+1|0)>(HEAP32[r5+60>>2]|0)){r7=_luaM_growaux_(HEAP32[r4+52>>2],HEAP32[r5+24>>2],r5+60|0,12,32767,11608);HEAP32[r5+24>>2]=r7}while(1){if((r6|0)>=(HEAP32[r5+60>>2]|0)){break}r7=r6;r6=r7+1|0;HEAP32[HEAP32[r5+24>>2]+(r7*12&-1)>>2]=0}HEAP32[HEAP32[r5+24>>2]+(HEAP16[r2+44>>1]*12&-1)>>2]=r1;if((HEAP8[r1+5|0]&3|0)==0){r8=r2;r9=r8+44|0;r10=HEAP16[r9>>1];r11=r10+1&65535;HEAP16[r9>>1]=r11;r12=r10<<16>>16;STACKTOP=r3;return r12}if((HEAP8[r5+5|0]&4|0)==0){r8=r2;r9=r8+44|0;r10=HEAP16[r9>>1];r11=r10+1&65535;HEAP16[r9>>1]=r11;r12=r10<<16>>16;STACKTOP=r3;return r12}_luaC_barrier_(HEAP32[r4+52>>2],r5,r1);r8=r2;r9=r8+44|0;r10=HEAP16[r9>>1];r11=r10+1&65535;HEAP16[r9>>1]=r11;r12=r10<<16>>16;STACKTOP=r3;return r12}function _closelistfield(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;if((HEAP32[r1>>2]|0)==0){STACKTOP=r3;return}_luaK_exp2nextreg(r4,r1|0);HEAP32[r1>>2]=0;if((HEAP32[r1+36>>2]|0)!=50){STACKTOP=r3;return}_luaK_setlist(r4,HEAP32[HEAP32[r1+24>>2]+8>>2],HEAP32[r1+32>>2],HEAP32[r1+36>>2]);HEAP32[r1+36>>2]=0;STACKTOP=r3;return}function _field(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+16>>2];if((r2|0)==288){if((_luaX_lookahead(r4)|0)!=61){_listfield(r4,r1)}else{_recfield(r4,r1)}STACKTOP=r3;return}else if((r2|0)==91){_recfield(r4,r1);STACKTOP=r3;return}else{_listfield(r4,r1);STACKTOP=r3;return}}function _lastlistfield(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;if((HEAP32[r1+36>>2]|0)==0){STACKTOP=r3;return}do{if((HEAP32[r1>>2]|0)!=12){if((HEAP32[r1>>2]|0)==13){break}if((HEAP32[r1>>2]|0)!=0){_luaK_exp2nextreg(r4,r1|0)}_luaK_setlist(r4,HEAP32[HEAP32[r1+24>>2]+8>>2],HEAP32[r1+32>>2],HEAP32[r1+36>>2]);STACKTOP=r3;return}}while(0);_luaK_setreturns(r4,r1|0,-1);_luaK_setlist(r4,HEAP32[HEAP32[r1+24>>2]+8>>2],HEAP32[r1+32>>2],-1);r4=r1+32|0;HEAP32[r4>>2]=HEAP32[r4>>2]-1;STACKTOP=r3;return}function _listfield(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;_expr(r4,r1|0);_checklimit(HEAP32[r4+48>>2],HEAP32[r1+32>>2],2147483645,10976);r4=r1+32|0;HEAP32[r4>>2]=HEAP32[r4>>2]+1;r4=r1+36|0;HEAP32[r4>>2]=HEAP32[r4>>2]+1;STACKTOP=r3;return}function _recfield(r1,r2){var r3,r4,r5,r6,r7,r8;r3=STACKTOP;STACKTOP=STACKTOP+48|0;r4=r3;r5=r3+24;r6=r1;r1=r2;r2=HEAP32[r6+48>>2];r7=HEAPU8[HEAP32[r6+48>>2]+48|0];if((HEAP32[r6+16>>2]|0)==288){_checklimit(r2,HEAP32[r1+28>>2],2147483645,10976);_checkname(r6,r4)}else{_yindex(r6,r4)}r8=r1+28|0;HEAP32[r8>>2]=HEAP32[r8>>2]+1;_checknext(r6,61);r8=_luaK_exp2RK(r2,r4);_expr(r6,r5);r6=HEAP32[HEAP32[r1+24>>2]+8>>2];_luaK_codeABC(r2,10,r6,r8,_luaK_exp2RK(r2,r5));HEAP8[r2+48|0]=r7;STACKTOP=r3;return}function _checkname(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;_codestring(r4,r2,_str_checkname(r4));STACKTOP=r3;return}function _yindex(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;_luaX_next(r4);_expr(r4,r1);_luaK_exp2val(HEAP32[r4+48>>2],r1);_checknext(r4,93);STACKTOP=r3;return}function _errorlimit(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;r5=STACKTOP;r6=r1;r1=HEAP32[HEAP32[r6+12>>2]+52>>2];r7=HEAP32[HEAP32[r6>>2]+64>>2];if((r7|0)==0){r8=10768}else{r9=_luaO_pushfstring(r1,10560,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r7,r4));STACKTOP=r4;r8=r9}r9=_luaO_pushfstring(r1,10304,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r3,HEAP32[r4+8>>2]=r2,HEAP32[r4+16>>2]=r8,r4));STACKTOP=r4;_luaX_syntaxerror(HEAP32[r6+12>>2],r9);STACKTOP=r5;return}function _primaryexp(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+16>>2];if((r2|0)==288){_singlevar(r4,r1);STACKTOP=r3;return}else if((r2|0)==40){r2=HEAP32[r4+4>>2];_luaX_next(r4);_expr(r4,r1);_check_match(r4,41,40,r2);_luaK_dischargevars(HEAP32[r4+48>>2],r1);STACKTOP=r3;return}else{_luaX_syntaxerror(r4,9896)}}function _fieldsel(r1,r2){var r3,r4,r5;r3=STACKTOP;STACKTOP=STACKTOP+24|0;r4=r3;r5=r1;r1=r2;r2=HEAP32[r5+48>>2];_luaK_exp2anyregup(r2,r1);_luaX_next(r5);_checkname(r5,r4);_luaK_indexed(r2,r1,r4);STACKTOP=r3;return}function _funcargs(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r4=STACKTOP;STACKTOP=STACKTOP+24|0;r5=r4;r6=r1;r1=r2;r2=r3;r3=HEAP32[r6+48>>2];r7=HEAP32[r6+16>>2];if((r7|0)==289){_codestring(r6,r5,HEAP32[r6+24>>2]);_luaX_next(r6)}else if((r7|0)==40){_luaX_next(r6);if((HEAP32[r6+16>>2]|0)==41){HEAP32[r5>>2]=0}else{_explist(r6,r5);_luaK_setreturns(r3,r5,-1)}_check_match(r6,41,40,r2)}else if((r7|0)==123){_constructor(r6,r5)}else{_luaX_syntaxerror(r6,10088)}r6=HEAP32[r1+8>>2];do{if((HEAP32[r5>>2]|0)!=12){if((HEAP32[r5>>2]|0)==13){break}if((HEAP32[r5>>2]|0)!=0){_luaK_exp2nextreg(r3,r5)}r8=HEAPU8[r3+48|0]-(r6+1)|0;r9=r1;r10=r3;r11=r6;r12=r8;r13=r12+1|0;r14=_luaK_codeABC(r10,29,r11,r13,2);_init_exp(r9,12,r14);r15=r3;r16=r2;_luaK_fixline(r15,r16);r17=r6;r18=r17+1|0;r19=r18&255;r20=r3;r21=r20+48|0;HEAP8[r21]=r19;STACKTOP=r4;return}}while(0);r8=-1;r9=r1;r10=r3;r11=r6;r12=r8;r13=r12+1|0;r14=_luaK_codeABC(r10,29,r11,r13,2);_init_exp(r9,12,r14);r15=r3;r16=r2;_luaK_fixline(r15,r16);r17=r6;r18=r17+1|0;r19=r18&255;r20=r3;r21=r20+48|0;HEAP8[r21]=r19;STACKTOP=r4;return}function _singlevar(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+24|0;r4=r3;r5=r1;r1=r2;r2=_str_checkname(r5);r6=HEAP32[r5+48>>2];if((_singlevaraux(r6,r2,r1,1)|0)!=0){STACKTOP=r3;return}_singlevaraux(r6,HEAP32[r5+72>>2],r1,1);_codestring(r5,r4,r2);_luaK_indexed(r6,r1,r4);STACKTOP=r3;return}function _singlevaraux(r1,r2,r3,r4){var r5,r6,r7,r8;r5=STACKTOP;r6=r1;r1=r2;r2=r3;if((r6|0)==0){r7=0;r8=r7;STACKTOP=r5;return r8}r3=_searchvar(r6,r1);if((r3|0)>=0){_init_exp(r2,7,r3);if((r4|0)==0){_markupval(r6,r3)}r7=7;r8=r7;STACKTOP=r5;return r8}r3=_searchupvalue(r6,r1);do{if((r3|0)<0){if((_singlevaraux(HEAP32[r6+8>>2],r1,r2,0)|0)!=0){r3=_newupvalue(r6,r1,r2);break}r7=0;r8=r7;STACKTOP=r5;return r8}}while(0);_init_exp(r2,8,r3);r7=8;r8=r7;STACKTOP=r5;return r8}function _searchvar(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=HEAPU8[r5+46|0]-1|0;while(1){if((r2|0)<0){r3=7;break}r6=_getlocvar(r5,r2)|0;if((_luaS_eqstr(r1,HEAP32[r6>>2])|0)!=0){r3=4;break}r2=r2-1|0}if(r3==4){r7=r2;r8=r7;STACKTOP=r4;return r8}else if(r3==7){r7=-1;r8=r7;STACKTOP=r4;return r8}}function _markupval(r1,r2){var r3,r4;r3=STACKTOP;r4=r2;r2=HEAP32[r1+16>>2];while(1){if((HEAPU8[r2+8|0]|0)<=(r4|0)){break}r2=HEAP32[r2>>2]}HEAP8[r2+9|0]=1;STACKTOP=r3;return}function _searchupvalue(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=HEAP32[HEAP32[r5>>2]+28>>2];r6=0;while(1){if((r6|0)>=(HEAPU8[r5+47|0]|0)){r3=7;break}if((_luaS_eqstr(HEAP32[r2+(r6<<3)>>2],r1)|0)!=0){r3=4;break}r6=r6+1|0}if(r3==4){r7=r6;r8=r7;STACKTOP=r4;return r8}else if(r3==7){r7=-1;r8=r7;STACKTOP=r4;return r8}}function _checkrepeated(r1,r2,r3){var r4,r5,r6,r7,r8;r4=0;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=HEAP16[HEAP32[r7+16>>2]+4>>1]|0;while(1){if((r3|0)>=(HEAP32[r1+4>>2]|0)){r4=7;break}if((_luaS_eqstr(r2,HEAP32[HEAP32[r1>>2]+(r3<<4)>>2])|0)!=0){r4=4;break}r3=r3+1|0}if(r4==4){r8=HEAP32[HEAP32[r1>>2]+(r3<<4)+8>>2];r3=_luaO_pushfstring(HEAP32[HEAP32[r7+12>>2]+52>>2],9648,(r5=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r5>>2]=r2+16,HEAP32[r5+8>>2]=r8,r5));STACKTOP=r5;_semerror(HEAP32[r7+12>>2],r3)}else if(r4==7){STACKTOP=r6;return}}function _skipnoopstat(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;while(1){if((HEAP32[r3+16>>2]|0)==59){r4=1}else{r4=(HEAP32[r3+16>>2]|0)==285}if(!r4){break}_statement(r3)}STACKTOP=r2;return}function _funcname(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=r2;r2=0;_singlevar(r4,r1);while(1){if((HEAP32[r4+16>>2]|0)!=46){break}_fieldsel(r4,r1)}if((HEAP32[r4+16>>2]|0)!=58){r5=r2;STACKTOP=r3;return r5}r2=1;_fieldsel(r4,r1);r5=r2;STACKTOP=r3;return r5}function _enterblock(r1,r2,r3){var r4;r4=r1;r1=r2;HEAP8[r1+10|0]=r3;HEAP8[r1+8|0]=HEAP8[r4+46|0];HEAP16[r1+4>>1]=HEAP32[HEAP32[HEAP32[r4+12>>2]+64>>2]+28>>2];HEAP16[r1+6>>1]=HEAP32[HEAP32[HEAP32[r4+12>>2]+64>>2]+16>>2];HEAP8[r1+9|0]=0;HEAP32[r1>>2]=HEAP32[r4+16>>2];HEAP32[r4+16>>2]=r1;STACKTOP=STACKTOP;return}function _cond(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r1;_expr(r4,r3);if((HEAP32[r3>>2]|0)==1){HEAP32[r3>>2]=3}_luaK_goiftrue(HEAP32[r4+48>>2],r3);STACKTOP=r2;return HEAP32[r3+20>>2]}function _fornum(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=STACKTOP;r5=r1;r1=r3;r3=HEAP32[r5+48>>2];r6=HEAPU8[r3+48|0];_new_localvarliteral_(r5,8472,11);_new_localvarliteral_(r5,8280,11);_new_localvarliteral_(r5,8080,10);_new_localvar(r5,r2);_checknext(r5,61);_exp1(r5);_checknext(r5,44);_exp1(r5);if((_testnext(r5,44)|0)!=0){_exp1(r5);r7=r5;r8=r6;r9=r1;_forbody(r7,r8,r9,1,1);STACKTOP=r4;return}else{r2=HEAPU8[r3+48|0];_luaK_codek(r3,r2,_luaK_numberK(r3,1));_luaK_reserveregs(r3,1);r7=r5;r8=r6;r9=r1;_forbody(r7,r8,r9,1,1);STACKTOP=r4;return}}function _forlist(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+24|0;r4=r3;r5=r1;r1=HEAP32[r5+48>>2];r6=4;r7=HEAPU8[r1+48|0];_new_localvarliteral_(r5,9216,15);_new_localvarliteral_(r5,8976,11);_new_localvarliteral_(r5,8704,13);_new_localvar(r5,r2);while(1){if((_testnext(r5,44)|0)==0){break}_new_localvar(r5,_str_checkname(r5));r6=r6+1|0}_checknext(r5,268);r2=HEAP32[r5+4>>2];_adjust_assign(r5,3,_explist(r5,r4),r4);_luaK_checkstack(r1,3);_forbody(r5,r7,r2,r6-3|0,0);STACKTOP=r3;return}function _forbody(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r6=STACKTOP;STACKTOP=STACKTOP+16|0;r7=r1;r1=r2;r2=r3;r3=r4;r4=r5;r5=HEAP32[r7+48>>2];_adjustlocalvars(r7,3);_checknext(r7,259);if((r4|0)!=0){r8=_luaK_codeABx(r5,33,r1,131070)}else{r8=_luaK_jump(r5)}r9=r8;_enterblock(r5,r6,0);_adjustlocalvars(r7,r3);_luaK_reserveregs(r5,r3);_block(r7);_leaveblock(r5);_luaK_patchtohere(r5,r9);if((r4|0)!=0){r10=_luaK_codeABx(r5,32,r1,131070);r11=r5;r12=r10;r13=r9;r14=r13+1|0;_luaK_patchlist(r11,r12,r14);r15=r5;r16=r2;_luaK_fixline(r15,r16);STACKTOP=r6;return}else{_luaK_codeABC(r5,34,r1,0,r3);_luaK_fixline(r5,r2);r10=_luaK_codeABx(r5,35,r1+2|0,131070);r11=r5;r12=r10;r13=r9;r14=r13+1|0;_luaK_patchlist(r11,r12,r14);r15=r5;r16=r2;_luaK_fixline(r15,r16);STACKTOP=r6;return}}function _exp1(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r1;_expr(r4,r3);_luaK_exp2nextreg(HEAP32[r4+48>>2],r3);STACKTOP=r2;return HEAP32[r3+8>>2]}function _test_then_block(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+40|0;r5=r4;r6=r4+16;r7=r1;r1=r2;r2=HEAP32[r7+48>>2];_luaX_next(r7);_expr(r7,r6);_checknext(r7,275);do{if((HEAP32[r7+16>>2]|0)==266){r3=3}else{if((HEAP32[r7+16>>2]|0)==258){r3=3;break}_luaK_goiftrue(HEAP32[r7+48>>2],r6);_enterblock(r2,r5,0);r8=HEAP32[r6+20>>2]}}while(0);do{if(r3==3){_luaK_goiffalse(HEAP32[r7+48>>2],r6);_enterblock(r2,r5,0);_gotostat(r7,HEAP32[r6+16>>2]);_skipnoopstat(r7);if((_block_follow(r7,0)|0)!=0){_leaveblock(r2);STACKTOP=r4;return}else{r8=_luaK_jump(r2);break}}}while(0);_statlist(r7);_leaveblock(r2);if((HEAP32[r7+16>>2]|0)==260){r3=10}else{if((HEAP32[r7+16>>2]|0)==261){r3=10}}if(r3==10){_luaK_concat(r2,r1,_luaK_jump(r2))}_luaK_patchtohere(r2,r8);STACKTOP=r4;return}function _luaE_setdebt(r1,r2){var r3;r3=r1;r1=r2;r2=r3+8|0;HEAP32[r2>>2]=HEAP32[r2>>2]-(r1-HEAP32[r3+12>>2]);HEAP32[r3+12>>2]=r1;STACKTOP=STACKTOP;return}function _luaE_extendCI(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaM_realloc_(r3,0,0,40);HEAP32[HEAP32[r3+16>>2]+12>>2]=r1;HEAP32[r1+8>>2]=HEAP32[r3+16>>2];HEAP32[r1+12>>2]=0;STACKTOP=r2;return r1}function _luaE_freeCI(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;r1=HEAP32[r3+16>>2];r4=HEAP32[r1+12>>2];HEAP32[r1+12>>2]=0;while(1){r5=r4;r1=r5;if((r5|0)==0){break}r4=HEAP32[r1+12>>2];_luaM_realloc_(r3,r1,40,0)}STACKTOP=r2;return}function _lua_newthread(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;if((HEAP32[HEAP32[r3+12>>2]+12>>2]|0)>0){_luaC_step(r3)}r1=_luaC_newobj(r3,8,112,0,0);r4=HEAP32[r3+8>>2];HEAP32[r4>>2]=r1;HEAP32[r4+8>>2]=72;r4=r3+8|0;HEAP32[r4>>2]=HEAP32[r4>>2]+16;_preinit_state(r1,HEAP32[r3+12>>2]);HEAP8[r1+40|0]=HEAP8[r3+40|0];HEAP32[r1+44>>2]=HEAP32[r3+44>>2];HEAP32[r1+52>>2]=HEAP32[r3+52>>2];HEAP32[r1+48>>2]=HEAP32[r1+44>>2];_stack_init(r1,r3);STACKTOP=r2;return r1}function _preinit_state(r1,r2){var r3;r3=r1;HEAP32[r3+12>>2]=r2;HEAP32[r3+28>>2]=0;HEAP32[r3+16>>2]=0;HEAP32[r3+32>>2]=0;HEAP32[r3+64>>2]=0;HEAP16[r3+38>>1]=0;HEAP32[r3+52>>2]=0;HEAP8[r3+40|0]=0;HEAP32[r3+44>>2]=0;HEAP8[r3+41|0]=1;HEAP32[r3+48>>2]=HEAP32[r3+44>>2];HEAP32[r3+56>>2]=0;HEAP16[r3+36>>1]=1;HEAP8[r3+6|0]=0;HEAP32[r3+68>>2]=0;STACKTOP=STACKTOP;return}function _stack_init(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=_luaM_realloc_(r2,0,0,640);HEAP32[r4+28>>2]=r1;HEAP32[r4+32>>2]=40;r1=0;while(1){if((r1|0)>=40){break}HEAP32[HEAP32[r4+28>>2]+(r1<<4)+8>>2]=0;r1=r1+1|0}HEAP32[r4+8>>2]=HEAP32[r4+28>>2];HEAP32[r4+24>>2]=HEAP32[r4+28>>2]+(HEAP32[r4+32>>2]<<4)-80;r1=r4+72|0;HEAP32[r1+8>>2]=0;HEAP32[r1+12>>2]=0;HEAP8[r1+18|0]=0;HEAP32[r1>>2]=HEAP32[r4+8>>2];r2=r4+8|0;r5=HEAP32[r2>>2];HEAP32[r2>>2]=r5+16;HEAP32[r5+8>>2]=0;HEAP32[r1+4>>2]=HEAP32[r4+8>>2]+320;HEAP32[r4+16>>2]=r1;STACKTOP=r3;return}function _luaE_freethread(r1,r2){var r3,r4;r3=STACKTOP;r4=r2;_luaF_close(r4,HEAP32[r4+28>>2]);_freestack(r4);_luaM_realloc_(r1,r4|0,112,0);STACKTOP=r3;return}function _freestack(r1){var r2,r3;r2=STACKTOP;r3=r1;if((HEAP32[r3+28>>2]|0)==0){STACKTOP=r2;return}else{HEAP32[r3+16>>2]=r3+72;_luaE_freeCI(r3);_luaM_realloc_(r3,HEAP32[r3+28>>2],HEAP32[r3+32>>2]<<4,0);STACKTOP=r2;return}}function _lua_newstate(r1,r2){var r3,r4,r5,r6,r7,r8;r3=STACKTOP;r4=r1;r1=r2;r2=FUNCTION_TABLE[r4](r1,0,8,400);if((r2|0)==0){r5=0;r6=r5;STACKTOP=r3;return r6}r7=r2|0;r8=r2+112|0;HEAP32[r7>>2]=0;HEAP8[r7+4|0]=8;HEAP8[r8+60|0]=33;HEAP8[r7+5|0]=HEAP8[r8+60|0]&3;HEAP8[r8+62|0]=0;_preinit_state(r7,r8);HEAP32[r8>>2]=r4;HEAP32[r8+4>>2]=r1;HEAP32[r8+172>>2]=r7;r1=_makeseed(r7);HEAP32[r8+56>>2]=r1;HEAP32[r8+128>>2]=r8+112;HEAP32[r8+132>>2]=r8+112;HEAP8[r8+63|0]=0;HEAP32[r8+20>>2]=0;HEAP32[r8+32>>2]=0;HEAP32[r8+28>>2]=0;HEAP32[r8+24>>2]=0;HEAP32[r8+48>>2]=0;HEAP32[r8+144>>2]=0;HEAP32[r8+152>>2]=0;HEAP32[r8+168>>2]=0;r1=_lua_version(0);HEAP32[r8+176>>2]=r1;HEAP8[r8+61|0]=5;HEAP32[r8+68>>2]=0;HEAP32[r8+72>>2]=0;HEAP32[r8+104>>2]=0;HEAP32[r8+80>>2]=0;HEAP32[r8+76>>2]=0;HEAP32[r8+88>>2]=0;HEAP32[r8+84>>2]=0;HEAP32[r8+100>>2]=0;HEAP32[r8+96>>2]=0;HEAP32[r8+92>>2]=0;HEAP32[r8+8>>2]=400;HEAP32[r8+12>>2]=0;HEAP32[r8+156>>2]=200;HEAP32[r8+160>>2]=200;HEAP32[r8+164>>2]=200;r1=0;while(1){if((r1|0)>=9){break}HEAP32[r8+252+(r1<<2)>>2]=0;r1=r1+1|0}if((_luaD_rawrunprotected(r7,90,0)|0)!=0){_close_state(r7);r7=0}r5=r7;r6=r5;STACKTOP=r3;return r6}function _makeseed(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+56|0;r3=r2;r4=r2+16;r5=r2+24;r6=r2+32;r7=r2+40;r8=r2+48;r9=_time(0);HEAP32[r4>>2]=r9;r9=0;HEAP32[r5>>2]=r1;r1=r3+r9|0;r10=r5;HEAP8[r1]=HEAP8[r10];HEAP8[r1+1|0]=HEAP8[r10+1|0];HEAP8[r1+2|0]=HEAP8[r10+2|0];HEAP8[r1+3|0]=HEAP8[r10+3|0];r9=r9+4|0;HEAP32[r6>>2]=r4;r10=r3+r9|0;r1=r6;HEAP8[r10]=HEAP8[r1];HEAP8[r10+1|0]=HEAP8[r1+1|0];HEAP8[r10+2|0]=HEAP8[r1+2|0];HEAP8[r10+3|0]=HEAP8[r1+3|0];r9=r9+4|0;HEAP32[r7>>2]=1208;r1=r3+r9|0;r10=r7;HEAP8[r1]=HEAP8[r10];HEAP8[r1+1|0]=HEAP8[r10+1|0];HEAP8[r1+2|0]=HEAP8[r10+2|0];HEAP8[r1+3|0]=HEAP8[r10+3|0];r9=r9+4|0;HEAP32[r8>>2]=222;r10=r3+r9|0;r1=r8;HEAP8[r10]=HEAP8[r1];HEAP8[r10+1|0]=HEAP8[r1+1|0];HEAP8[r10+2|0]=HEAP8[r1+2|0];HEAP8[r10+3|0]=HEAP8[r1+3|0];r9=r9+4|0;r1=_luaS_hash(r3|0,r9,HEAP32[r4>>2]);STACKTOP=r2;return r1}function _f_luaopen(r1,r2){var r3,r4;r2=STACKTOP;r3=r1;r1=HEAP32[r3+12>>2];_stack_init(r3,r3);_init_registry(r3,r1);_luaS_resize(r3,32);_luaT_init(r3);_luaX_init(r3);r4=_luaS_newlstr(r3,9152,17);HEAP32[r1+180>>2]=r4;r4=HEAP32[r1+180>>2]+5|0;HEAP8[r4]=HEAPU8[r4]|32;HEAP8[r1+63|0]=1;STACKTOP=r2;return}function _close_state(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=HEAP32[r3+12>>2];_luaF_close(r3,HEAP32[r3+28>>2]);_luaC_freeallobjects(r3);_luaM_realloc_(r3,HEAP32[HEAP32[r3+12>>2]+24>>2],HEAP32[HEAP32[r3+12>>2]+32>>2]<<2,0);r4=_luaM_realloc_(r3,HEAP32[r1+144>>2],HEAP32[r1+152>>2],0);HEAP32[r1+144>>2]=r4;HEAP32[r1+152>>2]=0;_freestack(r3);FUNCTION_TABLE[HEAP32[r1>>2]](HEAP32[r1+4>>2],r3|0,400,0);STACKTOP=r2;return}function _lua_close(r1){var r2,r3;r2=STACKTOP;r3=r1;r3=HEAP32[HEAP32[r3+12>>2]+172>>2];_close_state(r3);STACKTOP=r2;return}function _init_registry(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=r1;r1=_luaH_new(r5);r6=r2+40|0;HEAP32[r6>>2]=r1;HEAP32[r6+8>>2]=69;_luaH_resize(r5,r1,2,0);r6=r4;HEAP32[r6>>2]=r5;HEAP32[r6+8>>2]=72;_luaH_setint(r5,r1,1,r4);r6=r4;r2=_luaH_new(r5);HEAP32[r6>>2]=r2;HEAP32[r6+8>>2]=69;_luaH_setint(r5,r1,2,r4);STACKTOP=r3;return}function _luaS_eqlngstr(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+12>>2];if((r4|0)==(r1|0)){r5=1;r6=r5&1;STACKTOP=r3;return r6}if((r2|0)==(HEAP32[r1+12>>2]|0)){r7=(_memcmp(r4+16|0,r1+16|0,r2)|0)==0}else{r7=0}r5=r7;r6=r5&1;STACKTOP=r3;return r6}function _luaS_eqstr(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;r4=r1;r1=r2;if((HEAPU8[r4+4|0]|0)!=(HEAPU8[r1+4|0]|0)){r5=0;r6=r5&1;STACKTOP=r3;return r6}if((HEAPU8[r4+4|0]|0)==4){r7=(r4|0)==(r1|0)|0}else{r7=_luaS_eqlngstr(r4,r1)}r5=(r7|0)!=0;r6=r5&1;STACKTOP=r3;return r6}function _luaS_hash(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=r2;r2=r3^r1;r3=(r1>>>5)+1|0;r6=r1;while(1){if(r6>>>0<r3>>>0){break}r2=r2^(r2<<5)+(r2>>>2)+HEAPU8[r5+(r6-1)|0];r6=r6-r3|0}STACKTOP=r4;return r2}function _luaS_resize(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+12>>2]+24|0;_luaC_runtilstate(r4,-5);if((r1|0)>(HEAP32[r2+8>>2]|0)){if((r1+1|0)>>>0>1073741823){_luaM_toobig(r4)}else{r5=_luaM_realloc_(r4,HEAP32[r2>>2],HEAP32[r2+8>>2]<<2,r1<<2)}HEAP32[r2>>2]=r5;r6=HEAP32[r2+8>>2];while(1){if((r6|0)>=(r1|0)){break}HEAP32[HEAP32[r2>>2]+(r6<<2)>>2]=0;r6=r6+1|0}}r6=0;while(1){if((r6|0)>=(HEAP32[r2+8>>2]|0)){break}r5=HEAP32[HEAP32[r2>>2]+(r6<<2)>>2];HEAP32[HEAP32[r2>>2]+(r6<<2)>>2]=0;while(1){if((r5|0)==0){break}r7=HEAP32[r5>>2];r8=HEAP32[r5+8>>2]&r1-1;HEAP32[r5>>2]=HEAP32[HEAP32[r2>>2]+(r8<<2)>>2];HEAP32[HEAP32[r2>>2]+(r8<<2)>>2]=r5;r8=r5+5|0;HEAP8[r8]=HEAP8[r8]&191;r5=r7}r6=r6+1|0}if((r1|0)>=(HEAP32[r2+8>>2]|0)){r9=r1;r10=r2;r11=r10+8|0;HEAP32[r11>>2]=r9;STACKTOP=r3;return}if((r1+1|0)>>>0>1073741823){_luaM_toobig(r4)}else{r12=_luaM_realloc_(r4,HEAP32[r2>>2],HEAP32[r2+8>>2]<<2,r1<<2)}HEAP32[r2>>2]=r12;r9=r1;r10=r2;r11=r10+8|0;HEAP32[r11>>2]=r9;STACKTOP=r3;return}function _luaS_newlstr(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if(r2>>>0<=40){r6=_internshrstr(r5,r1,r2);r7=r6;STACKTOP=r4;return r7}if((r2+1|0)>>>0>4294967277){_luaM_toobig(r5)}r6=_createstrobj(r5,r1,r2,20,HEAP32[HEAP32[r5+12>>2]+56>>2],0);r7=r6;STACKTOP=r4;return r7}function _internshrstr(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=HEAP32[r6+12>>2];r7=_luaS_hash(r1,r2,HEAP32[r3+56>>2]);r8=HEAP32[HEAP32[r3+24>>2]+((r7&HEAP32[r3+32>>2]-1)<<2)>>2];L1:while(1){if((r8|0)==0){r4=11;break}r9=r8;do{if((r7|0)==(HEAP32[r9+8>>2]|0)){if((HEAP32[r9+12>>2]|0)!=(r2|0)){break}if((_memcmp(r1,r9+16|0,r2)|0)==0){break L1}}}while(0);r8=HEAP32[r8>>2]}if(r4==11){r10=_newshrstr(r6,r1,r2,r7);r11=r10;STACKTOP=r5;return r11}if(((HEAPU8[r8+5|0]^3)&(HEAPU8[HEAP32[r6+12>>2]+60|0]^3)|0)==0){r6=r8+5|0;HEAP8[r6]=HEAPU8[r6]^3}r10=r9;r11=r10;STACKTOP=r5;return r11}function _createstrobj(r1,r2,r3,r4,r5,r6){var r7,r8;r7=STACKTOP;r8=r3;r3=_luaC_newobj(r1,r4,r8+17|0,r6,0);HEAP32[r3+12>>2]=r8;HEAP32[r3+8>>2]=r5;HEAP8[r3+6|0]=0;_memcpy(r3+16|0,r2,r8)|0;HEAP8[r3+16+r8|0]=0;STACKTOP=r7;return r3}function _luaS_new(r1,r2){var r3,r4;r3=STACKTOP;r4=r2;r2=_luaS_newlstr(r1,r4,_strlen(r4));STACKTOP=r3;return r2}function _luaS_newudata(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;r1=r2;if(r1>>>0>4294967269){_luaM_toobig(r5)}else{r2=_luaC_newobj(r5,7,r1+24|0,0,0);HEAP32[r2+16>>2]=r1;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=r3;STACKTOP=r4;return r2}}function _newshrstr(r1,r2,r3,r4){var r5,r6,r7;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=r4;r4=HEAP32[r6+12>>2]+24|0;do{if(HEAP32[r4+4>>2]>>>0>=HEAP32[r4+8>>2]>>>0){if((HEAP32[r4+8>>2]|0)>1073741822){break}_luaS_resize(r6,HEAP32[r4+8>>2]<<1)}}while(0);r7=_createstrobj(r6,r1,r2,4,r3,HEAP32[r4>>2]+((r3&HEAP32[r4+8>>2]-1)<<2)|0);r3=r4+4|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;STACKTOP=r5;return r7}function _luaH_next(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=STACKTOP;r6=r2;r2=r3;r3=_findindex(r1,r6,r2);r3=r3+1|0;while(1){if((r3|0)>=(HEAP32[r6+28>>2]|0)){break}if((HEAP32[HEAP32[r6+12>>2]+(r3<<4)+8>>2]|0)!=0){r4=4;break}r3=r3+1|0}if(r4==4){r1=r2;HEAPF64[r1>>3]=r3+1|0;HEAP32[r1+8>>2]=3;r1=HEAP32[r6+12>>2]+(r3<<4)|0;r7=r2+16|0;r8=r7|0;r9=r1|0;HEAP32[r8>>2]=HEAP32[r9>>2];HEAP32[r8+4>>2]=HEAP32[r9+4>>2];HEAP32[r7+8>>2]=HEAP32[r1+8>>2];r10=1;r11=r10;STACKTOP=r5;return r11}r3=r3-HEAP32[r6+28>>2]|0;while(1){if((r3|0)>=(1<<HEAPU8[r6+7|0]|0)){r4=13;break}if((HEAP32[HEAP32[r6+16>>2]+(r3<<5)+8>>2]|0)!=0){r4=10;break}r3=r3+1|0}if(r4==10){r1=HEAP32[r6+16>>2]+(r3<<5)+16|0;r7=r2;r9=r7|0;r8=r1|0;HEAP32[r9>>2]=HEAP32[r8>>2];HEAP32[r9+4>>2]=HEAP32[r8+4>>2];HEAP32[r7+8>>2]=HEAP32[r1+8>>2];r1=HEAP32[r6+16>>2]+(r3<<5)|0;r3=r2+16|0;r2=r3|0;r6=r1|0;HEAP32[r2>>2]=HEAP32[r6>>2];HEAP32[r2+4>>2]=HEAP32[r6+4>>2];HEAP32[r3+8>>2]=HEAP32[r1+8>>2];r10=1;r11=r10;STACKTOP=r5;return r11}else if(r4==13){r10=0;r11=r10;STACKTOP=r5;return r11}}function _findindex(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;if((HEAP32[r2+8>>2]|0)==0){r8=-1;r9=r8;STACKTOP=r6;return r9}r3=_arrayindex(r2);do{if(0<(r3|0)){if((r3|0)>(HEAP32[r1+28>>2]|0)){break}r8=r3-1|0;r9=r8;STACKTOP=r6;return r9}}while(0);r10=_mainposition(r1,r2);L10:while(1){if((HEAP32[r10+24>>2]|0)==(HEAP32[r2+8>>2]|0)){if((_luaV_equalobj_(0,r10+16|0,r2)|0)!=0){break}}do{if((HEAP32[r10+24>>2]|0)==11){if((HEAP32[r2+8>>2]&64|0)==0){break}if((HEAP32[r10+16>>2]|0)==(HEAP32[r2>>2]|0)){break L10}}}while(0);r10=HEAP32[r10+28>>2];if((r10|0)==0){r4=15;break}}if(r4==15){_luaG_runerror(r7,6912,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}r3=(r10-HEAP32[r1+16>>2]|0)/32&-1;r8=r3+HEAP32[r1+28>>2]|0;r9=r8;STACKTOP=r6;return r9}function _luaH_resize(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=HEAP32[r1+28>>2];r7=HEAPU8[r1+7|0];r8=HEAP32[r1+16>>2];if((r2|0)>(r3|0)){_setarrayvector(r6,r1,r2)}_setnodevector(r6,r1,r4);if((r2|0)<(r3|0)){HEAP32[r1+28>>2]=r2;r9=r2;while(1){if((r9|0)>=(r3|0)){break}if((HEAP32[HEAP32[r1+12>>2]+(r9<<4)+8>>2]|0)!=0){_luaH_setint(r6,r1,r9+1|0,HEAP32[r1+12>>2]+(r9<<4)|0)}r9=r9+1|0}if((r2+1|0)>>>0>268435455){_luaM_toobig(r6)}else{r10=_luaM_realloc_(r6,HEAP32[r1+12>>2],r3<<4,r2<<4)}HEAP32[r1+12>>2]=r10}r9=(1<<r7)-1|0;while(1){if((r9|0)<0){break}r10=r8+(r9<<5)|0;if((HEAP32[r10+8>>2]|0)!=0){r2=r10|0;r3=_luaH_set(r6,r1,r10+16|0);r10=r3|0;r4=r2|0;HEAP32[r10>>2]=HEAP32[r4>>2];HEAP32[r10+4>>2]=HEAP32[r4+4>>2];HEAP32[r3+8>>2]=HEAP32[r2+8>>2]}r9=r9-1|0}if((r8|0)==1952){STACKTOP=r5;return}_luaM_realloc_(r6,r8,1<<r7<<5,0);STACKTOP=r5;return}function _setarrayvector(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((r2+1|0)>>>0>268435455){_luaM_toobig(r5)}else{r6=_luaM_realloc_(r5,HEAP32[r1+12>>2],HEAP32[r1+28>>2]<<4,r2<<4)}HEAP32[r1+12>>2]=r6;r6=HEAP32[r1+28>>2];while(1){if((r6|0)>=(r2|0)){break}HEAP32[HEAP32[r1+12>>2]+(r6<<4)+8>>2]=0;r6=r6+1|0}HEAP32[r1+28>>2]=r2;STACKTOP=r4;return}function _setnodevector(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;if((r2|0)==0){HEAP32[r1+16>>2]=1952;r7=0;r8=r7;r9=r8&255;r10=r1;r11=r10+7|0;HEAP8[r11]=r9;r12=r2;r13=r1;r14=r13+16|0;r15=HEAP32[r14>>2];r16=r15+(r12<<5)|0;r17=r1;r18=r17+20|0;HEAP32[r18>>2]=r16;STACKTOP=r5;return}r7=_luaO_ceillog2(r2);if((r7|0)>30){_luaG_runerror(r6,8952,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4}r2=1<<r7;if((r2+1|0)>>>0>134217727){_luaM_toobig(r6)}else{r19=_luaM_realloc_(r6,0,0,r2<<5)}HEAP32[r1+16>>2]=r19;r19=0;while(1){if((r19|0)>=(r2|0)){break}r6=HEAP32[r1+16>>2]+(r19<<5)|0;HEAP32[r6+28>>2]=0;HEAP32[r6+24>>2]=0;HEAP32[r6+8>>2]=0;r19=r19+1|0}r8=r7;r9=r8&255;r10=r1;r11=r10+7|0;HEAP8[r11]=r9;r12=r2;r13=r1;r14=r13+16|0;r15=HEAP32[r14>>2];r16=r15+(r12<<5)|0;r17=r1;r18=r17+20|0;HEAP32[r18>>2]=r16;STACKTOP=r5;return}function _luaH_setint(r1,r2,r3,r4){var r5,r6,r7,r8;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r2;r2=r3;r3=_luaH_getint(r7,r2);if((r3|0)!=1208){r8=r3}else{r3=r6;HEAPF64[r3>>3]=r2|0;HEAP32[r3+8>>2]=3;r8=_luaH_newkey(r1,r7,r6)}r6=r4;r4=r8;r8=r4|0;r7=r6|0;HEAP32[r8>>2]=HEAP32[r7>>2];HEAP32[r8+4>>2]=HEAP32[r7+4>>2];HEAP32[r4+8>>2]=HEAP32[r6+8>>2];STACKTOP=r5;return}function _luaH_set(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r2;r2=r3;r3=_luaH_get(r5,r2);if((r3|0)!=1208){r6=r3;r7=r6;STACKTOP=r4;return r7}else{r6=_luaH_newkey(r1,r5,r2);r7=r6;STACKTOP=r4;return r7}}function _luaH_resizearray(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r2;if((HEAP32[r5+16>>2]|0)==1952){r6=0}else{r6=1<<HEAPU8[r5+7|0]}_luaH_resize(r1,r5,r3,r6);STACKTOP=r4;return}function _luaH_new(r1){var r2,r3;r2=STACKTOP;r3=r1;r1=_luaC_newobj(r3,5,32,0,0);HEAP32[r1+8>>2]=0;HEAP8[r1+6|0]=-1;HEAP32[r1+12>>2]=0;HEAP32[r1+28>>2]=0;_setnodevector(r3,r1,0);STACKTOP=r2;return r1}function _luaH_free(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;if((HEAP32[r1+16>>2]|0)!=1952){_luaM_realloc_(r4,HEAP32[r1+16>>2],1<<HEAPU8[r1+7|0]<<5,0)}_luaM_realloc_(r4,HEAP32[r1+12>>2],HEAP32[r1+28>>2]<<4,0);_luaM_realloc_(r4,r1,32,0);STACKTOP=r3;return}function _luaH_newkey(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;if((HEAP32[r2+8>>2]|0)==0){_luaG_runerror(r7,8648,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}do{if((HEAP32[r2+8>>2]|0)==3){if(HEAPF64[r2>>3]==HEAPF64[r2>>3]){break}_luaG_runerror(r7,11224,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}}while(0);r5=_mainposition(r1,r2);if((HEAP32[r5+8>>2]|0)==0){if((r5|0)==1952){r4=9}}else{r4=9}if(r4==9){r4=_getfreepos(r1);if((r4|0)==0){_rehash(r7,r1,r2);r8=_luaH_set(r7,r1,r2);r9=r8;STACKTOP=r6;return r9}r3=_mainposition(r1,r5+16|0);if((r3|0)!=(r5|0)){while(1){if((HEAP32[r3+28>>2]|0)==(r5|0)){break}r3=HEAP32[r3+28>>2]}HEAP32[r3+28>>2]=r4;r3=r4;r10=r5;HEAP32[r3>>2]=HEAP32[r10>>2];HEAP32[r3+4>>2]=HEAP32[r10+4>>2];HEAP32[r3+8>>2]=HEAP32[r10+8>>2];HEAP32[r3+12>>2]=HEAP32[r10+12>>2];HEAP32[r3+16>>2]=HEAP32[r10+16>>2];HEAP32[r3+20>>2]=HEAP32[r10+20>>2];HEAP32[r3+24>>2]=HEAP32[r10+24>>2];HEAP32[r3+28>>2]=HEAP32[r10+28>>2];HEAP32[r5+28>>2]=0;HEAP32[r5+8>>2]=0}else{HEAP32[r4+28>>2]=HEAP32[r5+28>>2];HEAP32[r5+28>>2]=r4;r5=r4}}r4=r2;r10=r5+16|0;r3=r10|0;r11=r4|0;HEAP32[r3>>2]=HEAP32[r11>>2];HEAP32[r3+4>>2]=HEAP32[r11+4>>2];HEAP32[r10+8>>2]=HEAP32[r4+8>>2];do{if((HEAP32[r2+8>>2]&64|0)!=0){if((HEAP8[HEAP32[r2>>2]+5|0]&3|0)==0){break}if((HEAP8[r1+5|0]&4|0)==0){break}_luaC_barrierback_(r7,r1)}}while(0);r8=r5|0;r9=r8;STACKTOP=r6;return r9}function _mainposition(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152;r3=0;r4=STACKTOP;r5=r1;r6=r2;r7=r6;r8=r7+8|0;r9=HEAP32[r8>>2];r10=r9&63;switch(r10|0){case 4:{r11=r6;r12=r11|0;r13=r12;r14=HEAP32[r13>>2];r15=r14;r16=r15;r17=r16+8|0;r18=HEAP32[r17>>2];r19=r5;r20=r19+7|0;r21=HEAP8[r20];r22=r21&255;r23=1<<r22;r24=r23-1|0;r25=r18&r24;r26=r5;r27=r26+16|0;r28=HEAP32[r27>>2];r29=r28+(r25<<5)|0;r30=r29;r31=r30;STACKTOP=r4;return r31;break};case 2:{r32=r6;r33=r32|0;r34=r33;r35=HEAP32[r34>>2];r36=r35;r37=r5;r38=r37+7|0;r39=HEAP8[r38];r40=r39&255;r41=1<<r40;r42=r41-1|0;r43=r42|1;r44=(r36>>>0)%(r43>>>0)&-1;r45=r5;r46=r45+16|0;r47=HEAP32[r46>>2];r48=r47+(r44<<5)|0;r30=r48;r31=r30;STACKTOP=r4;return r31;break};case 22:{r49=r6;r50=r49|0;r51=r50;r52=HEAP32[r51>>2];r53=r52;r54=r5;r55=r54+7|0;r56=HEAP8[r55];r57=r56&255;r58=1<<r57;r59=r58-1|0;r60=r59|1;r61=(r53>>>0)%(r60>>>0)&-1;r62=r5;r63=r62+16|0;r64=HEAP32[r63>>2];r65=r64+(r61<<5)|0;r30=r65;r31=r30;STACKTOP=r4;return r31;break};case 20:{r66=r6;r67=r66|0;r68=r67;r69=HEAP32[r68>>2];r70=r69;r71=r70;r72=r71;r73=r72;r74=r73+6|0;r75=HEAP8[r74];r76=r75&255;r77=(r76|0)==0;if(r77){r78=r71;r79=r78+16|0;r80=r79;r81=r71;r82=r81;r83=r82+12|0;r84=HEAP32[r83>>2];r85=r71;r86=r85;r87=r86+8|0;r88=HEAP32[r87>>2];r89=_luaS_hash(r80,r84,r88);r90=r71;r91=r90;r92=r91+8|0;HEAP32[r92>>2]=r89;r93=r71;r94=r93;r95=r94+6|0;HEAP8[r95]=1}r96=r6;r97=r96|0;r98=r97;r99=HEAP32[r98>>2];r100=r99;r101=r100;r102=r101+8|0;r103=HEAP32[r102>>2];r104=r5;r105=r104+7|0;r106=HEAP8[r105];r107=r106&255;r108=1<<r107;r109=r108-1|0;r110=r103&r109;r111=r5;r112=r111+16|0;r113=HEAP32[r112>>2];r114=r113+(r110<<5)|0;r30=r114;r31=r30;STACKTOP=r4;return r31;break};case 3:{r115=r5;r116=r6;r117=r116|0;r118=r117;r119=HEAPF64[r118>>3];r120=_hashnum(r115,r119);r30=r120;r31=r30;STACKTOP=r4;return r31;break};case 1:{r121=r6;r122=r121|0;r123=r122;r124=HEAP32[r123>>2];r125=r5;r126=r125+7|0;r127=HEAP8[r126];r128=r127&255;r129=1<<r128;r130=r129-1|0;r131=r124&r130;r132=r5;r133=r132+16|0;r134=HEAP32[r133>>2];r135=r134+(r131<<5)|0;r30=r135;r31=r30;STACKTOP=r4;return r31;break};default:{r136=r6;r137=r136|0;r138=r137;r139=HEAP32[r138>>2];r140=r139;r141=r5;r142=r141+7|0;r143=HEAP8[r142];r144=r143&255;r145=1<<r144;r146=r145-1|0;r147=r146|1;r148=(r140>>>0)%(r147>>>0)&-1;r149=r5;r150=r149+16|0;r151=HEAP32[r150>>2];r152=r151+(r148<<5)|0;r30=r152;r31=r30;STACKTOP=r4;return r31}}}



function _lua_checkstack(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r1;HEAP32[r4>>2]=r2;r2=HEAP32[r5+16>>2];if(((HEAP32[r5+24>>2]-HEAP32[r5+8>>2]|0)/16&-1|0)>(HEAP32[r4>>2]|0)){r6=1}else{if((((HEAP32[r5+8>>2]-HEAP32[r5+28>>2]|0)/16&-1)+5|0)>(1e6-HEAP32[r4>>2]|0)){r6=0}else{r6=(_luaD_rawrunprotected(r5,226,r4)|0)==0|0}}if((r6|0)==0){r7=r6;STACKTOP=r3;return r7}if(HEAP32[r2+4>>2]>>>0>=(HEAP32[r5+8>>2]+(HEAP32[r4>>2]<<4)|0)>>>0){r7=r6;STACKTOP=r3;return r7}HEAP32[r2+4>>2]=HEAP32[r5+8>>2]+(HEAP32[r4>>2]<<4);r7=r6;STACKTOP=r3;return r7}function _growstack(r1,r2){var r3;r3=STACKTOP;_luaD_growstack(r1,HEAP32[r2>>2]);STACKTOP=r3;return}function _lua_xmove(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((r5|0)==(r1|0)){STACKTOP=r4;return}r3=r5+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+(-r2<<4);r3=0;while(1){if((r3|0)>=(r2|0)){break}r6=HEAP32[r5+8>>2]+(r3<<4)|0;r7=r1+8|0;r8=HEAP32[r7>>2];HEAP32[r7>>2]=r8+16;r7=r8;r8=r7|0;r9=r6|0;HEAP32[r8>>2]=HEAP32[r9>>2];HEAP32[r8+4>>2]=HEAP32[r9+4>>2];HEAP32[r7+8>>2]=HEAP32[r6+8>>2];r3=r3+1|0}STACKTOP=r4;return}function _lua_atpanic(r1,r2){var r3;r3=r1;r1=HEAP32[HEAP32[r3+12>>2]+168>>2];HEAP32[HEAP32[r3+12>>2]+168>>2]=r2;STACKTOP=STACKTOP;return r1}function _lua_version(r1){var r2,r3,r4,r5;r2=STACKTOP;r3=r1;if((r3|0)==0){r4=896;r5=r4;STACKTOP=r2;return r5}else{r4=HEAP32[HEAP32[r3+12>>2]+176>>2];r5=r4;STACKTOP=r2;return r5}}function _lua_absindex(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=r2;do{if((r1|0)<=0){if((r1|0)<=-1001e3){break}r5=((HEAP32[r4+8>>2]-HEAP32[HEAP32[r4+16>>2]>>2]|0)/16&-1)+r1|0;STACKTOP=r3;return r5}}while(0);r5=r1;STACKTOP=r3;return r5}function _lua_gettop(r1){var r2;r2=r1;STACKTOP=STACKTOP;return(HEAP32[r2+8>>2]-(HEAP32[HEAP32[r2+16>>2]>>2]+16)|0)/16&-1}function _lua_settop(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[HEAP32[r4+16>>2]>>2];if((r1|0)<0){r5=r4+8|0;HEAP32[r5>>2]=HEAP32[r5>>2]+(r1+1<<4);STACKTOP=r3;return}while(1){if(HEAP32[r4+8>>2]>>>0>=(r2+16+(r1<<4)|0)>>>0){break}r5=r4+8|0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6+16;HEAP32[r6+8>>2]=0}HEAP32[r4+8>>2]=r2+16+(r1<<4);STACKTOP=r3;return}function _lua_remove(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;r4=r1;r1=_index2addr(r4,r2);while(1){r2=r1+16|0;r1=r2;if(r2>>>0>=HEAP32[r4+8>>2]>>>0){break}r2=r1;r5=r1-16|0;r6=r5|0;r7=r2|0;HEAP32[r6>>2]=HEAP32[r7>>2];HEAP32[r6+4>>2]=HEAP32[r7+4>>2];HEAP32[r5+8>>2]=HEAP32[r2+8>>2]}r1=r4+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]-16;STACKTOP=r3;return}function _index2addr(r1,r2){var r3,r4,r5,r6,r7,r8;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+16>>2];if((r1|0)>0){r5=HEAP32[r2>>2]+(r1<<4)|0;if(r5>>>0>=HEAP32[r4+8>>2]>>>0){r6=1208;r7=r6;STACKTOP=r3;return r7}else{r6=r5;r7=r6;STACKTOP=r3;return r7}}if((r1|0)>-1001e3){r6=HEAP32[r4+8>>2]+(r1<<4)|0;r7=r6;STACKTOP=r3;return r7}if((r1|0)==-1001e3){r6=HEAP32[r4+12>>2]+40|0;r7=r6;STACKTOP=r3;return r7}r1=-1001e3-r1|0;if((HEAP32[HEAP32[r2>>2]+8>>2]|0)==22){r6=1208;r7=r6;STACKTOP=r3;return r7}r4=HEAP32[HEAP32[r2>>2]>>2];if((r1|0)<=(HEAPU8[r4+6|0]|0)){r8=r4+16+(r1-1<<4)|0}else{r8=1208}r6=r8;r7=r6;STACKTOP=r3;return r7}function _lua_insert(r1,r2){var r3,r4,r5,r6,r7,r8;r3=STACKTOP;r4=r1;r1=_index2addr(r4,r2);r2=HEAP32[r4+8>>2];while(1){if(r2>>>0<=r1>>>0){break}r5=r2-16|0;r6=r2;r7=r6|0;r8=r5|0;HEAP32[r7>>2]=HEAP32[r8>>2];HEAP32[r7+4>>2]=HEAP32[r8+4>>2];HEAP32[r6+8>>2]=HEAP32[r5+8>>2];r2=r2-16|0}r2=HEAP32[r4+8>>2];r4=r1;r1=r4|0;r5=r2|0;HEAP32[r1>>2]=HEAP32[r5>>2];HEAP32[r1+4>>2]=HEAP32[r5+4>>2];HEAP32[r4+8>>2]=HEAP32[r2+8>>2];STACKTOP=r3;return}function _lua_replace(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;_moveto(r4,HEAP32[r4+8>>2]-16|0,r2);r2=r4+8|0;HEAP32[r2>>2]=HEAP32[r2>>2]-16;STACKTOP=r3;return}function _moveto(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=r1;r6=_index2addr(r5,r2);r7=r6|0;r8=r3|0;HEAP32[r7>>2]=HEAP32[r8>>2];HEAP32[r7+4>>2]=HEAP32[r8+4>>2];HEAP32[r6+8>>2]=HEAP32[r3+8>>2];if((r2|0)>=-1001e3){STACKTOP=r4;return}do{if((HEAP32[r1+8>>2]&64|0)!=0){if((HEAP8[HEAP32[r1>>2]+5|0]&3|0)==0){break}if((HEAP8[HEAP32[HEAP32[HEAP32[r5+16>>2]>>2]>>2]+5|0]&4|0)==0){break}_luaC_barrier_(r5,HEAP32[HEAP32[HEAP32[r5+16>>2]>>2]>>2],HEAP32[r1>>2])}}while(0);STACKTOP=r4;return}function _lua_copy(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;_moveto(r5,_index2addr(r5,r2),r3);STACKTOP=r4;return}function _lua_pushvalue(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=_index2addr(r4,r2);r2=HEAP32[r4+8>>2];r5=r2|0;r6=r1|0;HEAP32[r5>>2]=HEAP32[r6>>2];HEAP32[r5+4>>2]=HEAP32[r6+4>>2];HEAP32[r2+8>>2]=HEAP32[r1+8>>2];r1=r4+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16;STACKTOP=r3;return}function _lua_type(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=_index2addr(r1,r2);if((r4|0)!=1208){r5=HEAP32[r4+8>>2]&15;STACKTOP=r3;return r5}else{r5=-1;STACKTOP=r3;return r5}}function _lua_typename(r1,r2){STACKTOP=STACKTOP;return HEAP32[1048+(r2+1<<2)>>2]}function _lua_iscfunction(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=_index2addr(r1,r2);if((HEAP32[r4+8>>2]|0)==22){r5=1;r6=r5&1;STACKTOP=r3;return r6}r5=(HEAP32[r4+8>>2]|0)==102;r6=r5&1;STACKTOP=r3;return r6}function _lua_isnumber(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=_index2addr(r1,r2);if((HEAP32[r4+8>>2]|0)==3){r5=1;r6=r5&1;STACKTOP=r3;return r6}r2=_luaV_tonumber(r4,r3);r4=r2;r5=(r2|0)!=0;r6=r5&1;STACKTOP=r3;return r6}function _lua_isstring(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=_lua_type(r1,r2);if((r4|0)==4){r5=1;r6=r5&1;STACKTOP=r3;return r6}r5=(r4|0)==3;r6=r5&1;STACKTOP=r3;return r6}function _lua_rawequal(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=_index2addr(r5,r2);r2=_index2addr(r5,r3);do{if((r1|0)!=1208){if((r2|0)==1208){break}if((HEAP32[r1+8>>2]|0)==(HEAP32[r2+8>>2]|0)){r6=(_luaV_equalobj_(0,r1,r2)|0)!=0}else{r6=0}r7=r6&1;STACKTOP=r4;return r7}}while(0);r7=0;STACKTOP=r4;return r7}function _lua_compare(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=STACKTOP;r6=r1;r1=0;r7=_index2addr(r6,r2);r2=_index2addr(r6,r3);if((r7|0)==1208){r8=r1;STACKTOP=r5;return r8}if((r2|0)==1208){r8=r1;STACKTOP=r5;return r8}r3=r4;if((r3|0)==0){if((HEAP32[r7+8>>2]|0)==(HEAP32[r2+8>>2]|0)){r9=(_luaV_equalobj_(r6,r7,r2)|0)!=0}else{r9=0}r1=r9&1}else if((r3|0)==1){r1=_luaV_lessthan(r6,r7,r2)}else if((r3|0)==2){r1=_luaV_lessequal(r6,r7,r2)}r8=r1;STACKTOP=r5;return r8}function _lua_tonumberx(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r3;r3=_index2addr(r1,r2);do{if((HEAP32[r3+8>>2]|0)!=3){r2=_luaV_tonumber(r3,r4);r3=r2;if((r2|0)!=0){break}if((r5|0)!=0){HEAP32[r5>>2]=0}r6=0;r7=r6;STACKTOP=r4;return r7}}while(0);if((r5|0)!=0){HEAP32[r5>>2]=1}r6=HEAPF64[r3>>3];r7=r6;STACKTOP=r4;return r7}function _lua_tointegerx(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r3;r3=_index2addr(r1,r2);do{if((HEAP32[r3+8>>2]|0)!=3){r2=_luaV_tonumber(r3,r4);r3=r2;if((r2|0)!=0){break}if((r5|0)!=0){HEAP32[r5>>2]=0}r6=0;r7=r6;STACKTOP=r4;return r7}}while(0);r2=HEAPF64[r3>>3]&-1;if((r5|0)!=0){HEAP32[r5>>2]=1}r6=r2;r7=r6;STACKTOP=r4;return r7}function _lua_tounsignedx(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;STACKTOP=STACKTOP+24|0;r5=r4+16;r6=r3;r3=_index2addr(r1,r2);do{if((HEAP32[r3+8>>2]|0)!=3){r2=_luaV_tonumber(r3,r4);r3=r2;if((r2|0)!=0){break}if((r6|0)!=0){HEAP32[r6>>2]=0}r7=0;r8=r7;STACKTOP=r4;return r8}}while(0);HEAPF64[r5>>3]=HEAPF64[r3>>3]+6755399441055744;r3=HEAP32[r5+(((HEAP32[908>>2]|0)==33)<<2)>>2];if((r6|0)!=0){HEAP32[r6>>2]=1}r7=r3;r8=r7;STACKTOP=r4;return r8}function _lua_toboolean(r1,r2){var r3,r4,r5,r6,r7,r8;r3=STACKTOP;r4=_index2addr(r1,r2);if((HEAP32[r4+8>>2]|0)==0){r5=1;r6=r5^1;r7=r6&1;STACKTOP=r3;return r7}if((HEAP32[r4+8>>2]|0)==1){r8=(HEAP32[r4>>2]|0)==0}else{r8=0}r5=r8;r6=r5^1;r7=r6&1;STACKTOP=r3;return r7}function _lua_tolstring(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=_index2addr(r5,r1);do{if((HEAP32[r3+8>>2]&15|0)!=4){if((_luaV_tostring(r5,r3)|0)!=0){if((HEAP32[HEAP32[r5+12>>2]+12>>2]|0)>0){_luaC_step(r5)}r3=_index2addr(r5,r1);break}if((r2|0)!=0){HEAP32[r2>>2]=0}r6=0;r7=r6;STACKTOP=r4;return r7}}while(0);if((r2|0)!=0){HEAP32[r2>>2]=HEAP32[HEAP32[r3>>2]+12>>2]}r6=HEAP32[r3>>2]+16|0;r7=r6;STACKTOP=r4;return r7}function _lua_rawlen(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=_index2addr(r1,r2);r2=HEAP32[r4+8>>2]&15;if((r2|0)==4){r5=HEAP32[HEAP32[r4>>2]+12>>2];r6=r5;STACKTOP=r3;return r6}else if((r2|0)==7){r5=HEAP32[HEAP32[r4>>2]+16>>2];r6=r5;STACKTOP=r3;return r6}else if((r2|0)==5){r5=_luaH_getn(HEAP32[r4>>2]);r6=r5;STACKTOP=r3;return r6}else{r5=0;r6=r5;STACKTOP=r3;return r6}}function _lua_touserdata(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=_index2addr(r1,r2);r2=HEAP32[r4+8>>2]&15;if((r2|0)==7){r5=HEAP32[r4>>2]+24|0;r6=r5;STACKTOP=r3;return r6}else if((r2|0)==2){r5=HEAP32[r4>>2];r6=r5;STACKTOP=r3;return r6}else{r5=0;r6=r5;STACKTOP=r3;return r6}}function _lua_tothread(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=_index2addr(r1,r2);if((HEAP32[r4+8>>2]|0)==72){r5=HEAP32[r4>>2];STACKTOP=r3;return r5}else{r5=0;STACKTOP=r3;return r5}}function _lua_topointer(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51;r3=0;r4=STACKTOP;r5=r1;r6=r2;r7=r5;r8=r6;r9=_index2addr(r7,r8);r10=r9;r11=r10;r12=r11+8|0;r13=HEAP32[r12>>2];r14=r13&63;switch(r14|0){case 8:{r15=r10;r16=r15|0;r17=r16;r18=HEAP32[r17>>2];r19=r18;r20=r19;r21=r20;r22=r21;STACKTOP=r4;return r22;break};case 5:{r23=r10;r24=r23|0;r25=r24;r26=HEAP32[r25>>2];r27=r26;r28=r27;r21=r28;r22=r21;STACKTOP=r4;return r22;break};case 22:{r29=r10;r30=r29|0;r31=r30;r32=HEAP32[r31>>2];r33=r32;r34=r33;r21=r34;r22=r21;STACKTOP=r4;return r22;break};case 7:case 2:{r35=r5;r36=r6;r37=_lua_touserdata(r35,r36);r21=r37;r22=r21;STACKTOP=r4;return r22;break};case 6:{r38=r10;r39=r38|0;r40=r39;r41=HEAP32[r40>>2];r42=r41;r43=r42;r44=r43;r21=r44;r22=r21;STACKTOP=r4;return r22;break};case 38:{r45=r10;r46=r45|0;r47=r46;r48=HEAP32[r47>>2];r49=r48;r50=r49;r51=r50;r21=r51;r22=r21;STACKTOP=r4;return r22;break};default:{r21=0;r22=r21;STACKTOP=r4;return r22}}}function _lua_pushnil(r1){var r2;r2=r1;HEAP32[HEAP32[r2+8>>2]+8>>2]=0;r1=r2+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16;STACKTOP=STACKTOP;return}function _lua_pushnumber(r1,r2){var r3;r3=r1;r1=HEAP32[r3+8>>2];HEAPF64[r1>>3]=r2;HEAP32[r1+8>>2]=3;r1=r3+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16;STACKTOP=STACKTOP;return}function _lua_pushinteger(r1,r2){var r3;r3=r1;r1=HEAP32[r3+8>>2];HEAPF64[r1>>3]=r2|0;HEAP32[r1+8>>2]=3;r1=r3+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16;STACKTOP=STACKTOP;return}function _lua_pushunsigned(r1,r2){var r3,r4;r3=r1;r1=r2;if(r1>>>0<=2147483647){r4=r1|0}else{r4=r1>>>0}r1=HEAP32[r3+8>>2];HEAPF64[r1>>3]=r4;HEAP32[r1+8>>2]=3;r1=r3+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16;STACKTOP=STACKTOP;return}function _lua_pushlstring(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;if((HEAP32[HEAP32[r5+12>>2]+12>>2]|0)>0){_luaC_step(r5)}r1=_luaS_newlstr(r5,r2,r3);r3=HEAP32[r5+8>>2];r2=r1;HEAP32[r3>>2]=r2;HEAP32[r3+8>>2]=HEAPU8[r2+4|0]|64;r2=r5+8|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;STACKTOP=r4;return r1+16|0}function _lua_pushstring(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;r4=r1;r1=r2;if((r1|0)==0){_lua_pushnil(r4);r5=0;r6=r5;STACKTOP=r3;return r6}if((HEAP32[HEAP32[r4+12>>2]+12>>2]|0)>0){_luaC_step(r4)}r2=_luaS_new(r4,r1);r1=HEAP32[r4+8>>2];r7=r2;HEAP32[r1>>2]=r7;HEAP32[r1+8>>2]=HEAPU8[r7+4|0]|64;r7=r4+8|0;HEAP32[r7>>2]=HEAP32[r7>>2]+16;r5=r2+16|0;r6=r5;STACKTOP=r3;return r6}function _lua_pushvfstring(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;if((HEAP32[HEAP32[r5+12>>2]+12>>2]|0)>0){_luaC_step(r5)}r1=_luaO_pushvfstring(r5,r2,r3);STACKTOP=r4;return r1}function _lua_pushfstring(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r1;if((HEAP32[HEAP32[r6+12>>2]+12>>2]|0)>0){_luaC_step(r6)}r1=r5|0;HEAP32[r1>>2]=r3;HEAP32[r1+4>>2]=0;r1=_luaO_pushvfstring(r6,r2,r5|0);STACKTOP=r4;return r1}function _lua_pushcclosure(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((r2|0)==0){r3=HEAP32[r5+8>>2];HEAP32[r3>>2]=r1;HEAP32[r3+8>>2]=22;r6=r5;r7=r6+8|0;r8=HEAP32[r7>>2];r9=r8+16|0;HEAP32[r7>>2]=r9;STACKTOP=r4;return}if((HEAP32[HEAP32[r5+12>>2]+12>>2]|0)>0){_luaC_step(r5)}r3=_luaF_newCclosure(r5,r2);HEAP32[r3+12>>2]=r1;r1=r5+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+(-r2<<4);while(1){r1=r2;r2=r1-1|0;if((r1|0)==0){break}r1=HEAP32[r5+8>>2]+(r2<<4)|0;r10=r3+16+(r2<<4)|0;r11=r10|0;r12=r1|0;HEAP32[r11>>2]=HEAP32[r12>>2];HEAP32[r11+4>>2]=HEAP32[r12+4>>2];HEAP32[r10+8>>2]=HEAP32[r1+8>>2]}r2=HEAP32[r5+8>>2];HEAP32[r2>>2]=r3;HEAP32[r2+8>>2]=102;r6=r5;r7=r6+8|0;r8=HEAP32[r7>>2];r9=r8+16|0;HEAP32[r7>>2]=r9;STACKTOP=r4;return}function _lua_pushboolean(r1,r2){var r3;r3=r1;r1=HEAP32[r3+8>>2];HEAP32[r1>>2]=(r2|0)!=0;HEAP32[r1+8>>2]=1;r1=r3+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16;STACKTOP=STACKTOP;return}function _lua_pushlightuserdata(r1,r2){var r3;r3=r1;r1=HEAP32[r3+8>>2];HEAP32[r1>>2]=r2;HEAP32[r1+8>>2]=2;r1=r3+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16;STACKTOP=STACKTOP;return}function _lua_pushthread(r1){var r2;r2=r1;r1=HEAP32[r2+8>>2];HEAP32[r1>>2]=r2;HEAP32[r1+8>>2]=72;r1=r2+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16;STACKTOP=STACKTOP;return(HEAP32[HEAP32[r2+12>>2]+172>>2]|0)==(r2|0)|0}function _lua_getglobal(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=_luaH_getint(HEAP32[HEAP32[r4+12>>2]+40>>2],2);r5=r4+8|0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6+16;r5=r6;r6=_luaS_new(r4,r2);HEAP32[r5>>2]=r6;HEAP32[r5+8>>2]=HEAPU8[r6+4|0]|64;_luaV_gettable(r4,r1,HEAP32[r4+8>>2]-16|0,HEAP32[r4+8>>2]-16|0);STACKTOP=r3;return}function _lua_gettable(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=_index2addr(r4,r2);_luaV_gettable(r4,r1,HEAP32[r4+8>>2]-16|0,HEAP32[r4+8>>2]-16|0);STACKTOP=r3;return}function _lua_getfield(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=_index2addr(r5,r2);r2=HEAP32[r5+8>>2];r6=_luaS_new(r5,r3);HEAP32[r2>>2]=r6;HEAP32[r2+8>>2]=HEAPU8[r6+4|0]|64;r6=r5+8|0;HEAP32[r6>>2]=HEAP32[r6>>2]+16;_luaV_gettable(r5,r1,HEAP32[r5+8>>2]-16|0,HEAP32[r5+8>>2]-16|0);STACKTOP=r4;return}function _lua_rawget(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=_index2addr(r4,r2)|0;r2=_luaH_get(HEAP32[r1>>2],HEAP32[r4+8>>2]-16|0);r1=HEAP32[r4+8>>2]-16|0;r4=r1|0;r5=r2|0;HEAP32[r4>>2]=HEAP32[r5>>2];HEAP32[r4+4>>2]=HEAP32[r5+4>>2];HEAP32[r1+8>>2]=HEAP32[r2+8>>2];STACKTOP=r3;return}function _lua_rawgeti(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=_index2addr(r5,r2)|0;r2=_luaH_getint(HEAP32[r1>>2],r3);r3=HEAP32[r5+8>>2];r1=r3|0;r6=r2|0;HEAP32[r1>>2]=HEAP32[r6>>2];HEAP32[r1+4>>2]=HEAP32[r6+4>>2];HEAP32[r3+8>>2]=HEAP32[r2+8>>2];r2=r5+8|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;STACKTOP=r4;return}function _lua_createtable(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((HEAP32[HEAP32[r5+12>>2]+12>>2]|0)>0){_luaC_step(r5)}r3=_luaH_new(r5);r6=HEAP32[r5+8>>2];HEAP32[r6>>2]=r3;HEAP32[r6+8>>2]=69;r6=r5+8|0;HEAP32[r6>>2]=HEAP32[r6>>2]+16;do{if((r1|0)<=0){if((r2|0)>0){break}STACKTOP=r4;return}}while(0);_luaH_resize(r5,r3,r1,r2);STACKTOP=r4;return}function _lua_getmetatable(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;r4=r1;r1=0;r5=_index2addr(r4,r2);r2=HEAP32[r5+8>>2]&15;if((r2|0)==5){r1=HEAP32[HEAP32[r5>>2]+8>>2]}else if((r2|0)==7){r1=HEAP32[HEAP32[r5>>2]+8>>2]}else{r1=HEAP32[HEAP32[r4+12>>2]+252+((HEAP32[r5+8>>2]&15)<<2)>>2]}if((r1|0)==0){r6=0;r7=r6;STACKTOP=r3;return r7}else{r5=HEAP32[r4+8>>2];HEAP32[r5>>2]=r1;HEAP32[r5+8>>2]=69;r5=r4+8|0;HEAP32[r5>>2]=HEAP32[r5>>2]+16;r6=1;r7=r6;STACKTOP=r3;return r7}}function _lua_getuservalue(r1,r2){var r3,r4,r5,r6,r7,r8;r3=STACKTOP;r4=r1;r1=_index2addr(r4,r2);if((HEAP32[HEAP32[r1>>2]+12>>2]|0)!=0){r2=HEAP32[r4+8>>2];HEAP32[r2>>2]=HEAP32[HEAP32[r1>>2]+12>>2];HEAP32[r2+8>>2]=69;r5=r4;r6=r5+8|0;r7=HEAP32[r6>>2];r8=r7+16|0;HEAP32[r6>>2]=r8;STACKTOP=r3;return}else{HEAP32[HEAP32[r4+8>>2]+8>>2]=0;r5=r4;r6=r5+8|0;r7=HEAP32[r6>>2];r8=r7+16|0;HEAP32[r6>>2]=r8;STACKTOP=r3;return}}function _lua_setglobal(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=_luaH_getint(HEAP32[HEAP32[r4+12>>2]+40>>2],2);r5=r4+8|0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6+16;r5=r6;r6=_luaS_new(r4,r2);HEAP32[r5>>2]=r6;HEAP32[r5+8>>2]=HEAPU8[r6+4|0]|64;_luaV_settable(r4,r1,HEAP32[r4+8>>2]-16|0,HEAP32[r4+8>>2]-32|0);r1=r4+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]-32;STACKTOP=r3;return}function _lua_setfield(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=_index2addr(r5,r2);r2=r5+8|0;r6=HEAP32[r2>>2];HEAP32[r2>>2]=r6+16;r2=r6;r6=_luaS_new(r5,r3);HEAP32[r2>>2]=r6;HEAP32[r2+8>>2]=HEAPU8[r6+4|0]|64;_luaV_settable(r5,r1,HEAP32[r5+8>>2]-16|0,HEAP32[r5+8>>2]-32|0);r1=r5+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]-32;STACKTOP=r4;return}function _lua_rawset(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=STACKTOP;r4=r1;r1=_index2addr(r4,r2);r2=HEAP32[r4+8>>2]-16|0;r5=_luaH_set(r4,HEAP32[r1>>2],HEAP32[r4+8>>2]-32|0);r6=r5|0;r7=r2|0;HEAP32[r6>>2]=HEAP32[r7>>2];HEAP32[r6+4>>2]=HEAP32[r7+4>>2];HEAP32[r5+8>>2]=HEAP32[r2+8>>2];HEAP8[HEAP32[r1>>2]+6|0]=0;if((HEAP32[HEAP32[r4+8>>2]-16+8>>2]&64|0)==0){r8=r4;r9=r8+8|0;r10=HEAP32[r9>>2];r11=r10-32|0;HEAP32[r9>>2]=r11;STACKTOP=r3;return}if((HEAP8[HEAP32[HEAP32[r4+8>>2]-16>>2]+5|0]&3|0)==0){r8=r4;r9=r8+8|0;r10=HEAP32[r9>>2];r11=r10-32|0;HEAP32[r9>>2]=r11;STACKTOP=r3;return}if((HEAP8[HEAP32[r1>>2]+5|0]&4|0)==0){r8=r4;r9=r8+8|0;r10=HEAP32[r9>>2];r11=r10-32|0;HEAP32[r9>>2]=r11;STACKTOP=r3;return}_luaC_barrierback_(r4,HEAP32[r1>>2]);r8=r4;r9=r8+8|0;r10=HEAP32[r9>>2];r11=r10-32|0;HEAP32[r9>>2]=r11;STACKTOP=r3;return}function _lua_rawseti(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;r1=_index2addr(r5,r2);_luaH_setint(r5,HEAP32[r1>>2],r3,HEAP32[r5+8>>2]-16|0);do{if((HEAP32[HEAP32[r5+8>>2]-16+8>>2]&64|0)!=0){if((HEAP8[HEAP32[HEAP32[r5+8>>2]-16>>2]+5|0]&3|0)==0){break}if((HEAP8[HEAP32[r1>>2]+5|0]&4|0)==0){break}_luaC_barrierback_(r5,HEAP32[r1>>2])}}while(0);r1=r5+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]-16;STACKTOP=r4;return}function _lua_setmetatable(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=STACKTOP;r4=r1;r1=_index2addr(r4,r2);if((HEAP32[HEAP32[r4+8>>2]-16+8>>2]|0)==0){r5=0}else{r5=HEAP32[HEAP32[r4+8>>2]-16>>2]}r2=HEAP32[r1+8>>2]&15;if((r2|0)==5){HEAP32[HEAP32[r1>>2]+8>>2]=r5;if((r5|0)!=0){do{if((HEAP8[r5+5|0]&3|0)!=0){if((HEAP8[HEAP32[r1>>2]+5|0]&4|0)==0){break}_luaC_barrierback_(r4,HEAP32[r1>>2])}}while(0)}_luaC_checkfinalizer(r4,HEAP32[r1>>2],r5);r6=r4;r7=r6+8|0;r8=HEAP32[r7>>2];r9=r8-16|0;HEAP32[r7>>2]=r9;STACKTOP=r3;return 1}else if((r2|0)==7){HEAP32[HEAP32[r1>>2]+8>>2]=r5;if((r5|0)!=0){do{if((HEAP8[r5+5|0]&3|0)!=0){if((HEAP8[HEAP32[r1>>2]+5|0]&4|0)==0){break}_luaC_barrier_(r4,HEAP32[r1>>2],r5)}}while(0);_luaC_checkfinalizer(r4,HEAP32[r1>>2],r5)}r6=r4;r7=r6+8|0;r8=HEAP32[r7>>2];r9=r8-16|0;HEAP32[r7>>2]=r9;STACKTOP=r3;return 1}else{HEAP32[HEAP32[r4+12>>2]+252+((HEAP32[r1+8>>2]&15)<<2)>>2]=r5;r6=r4;r7=r6+8|0;r8=HEAP32[r7>>2];r9=r8-16|0;HEAP32[r7>>2]=r9;STACKTOP=r3;return 1}}function _lua_setuservalue(r1,r2){var r3,r4,r5,r6,r7,r8;r3=STACKTOP;r4=r1;r1=_index2addr(r4,r2);if((HEAP32[HEAP32[r4+8>>2]-16+8>>2]|0)==0){HEAP32[HEAP32[r1>>2]+12>>2]=0;r5=r4;r6=r5+8|0;r7=HEAP32[r6>>2];r8=r7-16|0;HEAP32[r6>>2]=r8;STACKTOP=r3;return}HEAP32[HEAP32[r1>>2]+12>>2]=HEAP32[HEAP32[r4+8>>2]-16>>2];do{if((HEAP8[HEAP32[HEAP32[r4+8>>2]-16>>2]+5|0]&3|0)!=0){if((HEAP8[HEAP32[r1>>2]+5|0]&4|0)==0){break}_luaC_barrier_(r4,HEAP32[r1>>2],HEAP32[HEAP32[r4+8>>2]-16>>2])}}while(0);r5=r4;r6=r5+8|0;r7=HEAP32[r6>>2];r8=r7-16|0;HEAP32[r6>>2]=r8;STACKTOP=r3;return}function _lua_getctx(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;if((HEAP8[HEAP32[r4+16>>2]+18|0]&8|0)==0){r5=0;r6=r5;STACKTOP=r3;return r6}if((r1|0)!=0){HEAP32[r1>>2]=HEAP32[HEAP32[r4+16>>2]+24>>2]}r5=HEAPU8[HEAP32[r4+16>>2]+37|0];r6=r5;STACKTOP=r3;return r6}function _lua_callk(r1,r2,r3,r4,r5){var r6,r7,r8;r6=0;r7=STACKTOP;r8=r1;r1=r3;r3=r4;r4=r5;r5=HEAP32[r8+8>>2]+(-(r2+1|0)<<4)|0;do{if((r4|0)!=0){if((HEAPU16[r8+36>>1]|0)!=0){r6=4;break}HEAP32[HEAP32[r8+16>>2]+28>>2]=r4;HEAP32[HEAP32[r8+16>>2]+24>>2]=r3;_luaD_call(r8,r5,r1,1)}else{r6=4}}while(0);if(r6==4){_luaD_call(r8,r5,r1,0)}if((r1|0)!=-1){STACKTOP=r7;return}if(HEAP32[HEAP32[r8+16>>2]+4>>2]>>>0>=HEAP32[r8+8>>2]>>>0){STACKTOP=r7;return}HEAP32[HEAP32[r8+16>>2]+4>>2]=HEAP32[r8+8>>2];STACKTOP=r7;return}function _lua_pcallk(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+8|0;r9=r8;r10=r1;r1=r3;r3=r4;r4=r5;r5=r6;if((r3|0)==0){r11=0}else{r6=_index2addr(r10,r3);r11=r6-HEAP32[r10+28>>2]|0}HEAP32[r9>>2]=HEAP32[r10+8>>2]+(-(r2+1|0)<<4);do{if((r5|0)==0){r7=6}else{if((HEAPU16[r10+36>>1]|0)>0){r7=6;break}r2=HEAP32[r10+16>>2];HEAP32[r2+28>>2]=r5;HEAP32[r2+24>>2]=r4;HEAP32[r2+20>>2]=HEAP32[r9>>2]-HEAP32[r10+28>>2];HEAP8[r2+36|0]=HEAP8[r10+41|0];HEAP32[r2+32>>2]=HEAP32[r10+68>>2];HEAP32[r10+68>>2]=r11;r6=r2+18|0;HEAP8[r6]=HEAPU8[r6]|16;_luaD_call(r10,HEAP32[r9>>2],r1,1);r6=r2+18|0;HEAP8[r6]=HEAPU8[r6]&-17;HEAP32[r10+68>>2]=HEAP32[r2+32>>2];r12=0}}while(0);if(r7==6){HEAP32[r9+4>>2]=r1;r12=_luaD_pcall(r10,64,r9,HEAP32[r9>>2]-HEAP32[r10+28>>2]|0,r11)}if((r1|0)!=-1){r13=r12;STACKTOP=r8;return r13}if(HEAP32[HEAP32[r10+16>>2]+4>>2]>>>0>=HEAP32[r10+8>>2]>>>0){r13=r12;STACKTOP=r8;return r13}HEAP32[HEAP32[r10+16>>2]+4>>2]=HEAP32[r10+8>>2];r13=r12;STACKTOP=r8;return r13}function _f_call(r1,r2){var r3,r4;r3=STACKTOP;r4=r2;_luaD_call(r1,HEAP32[r4>>2],HEAP32[r4+4>>2],0);STACKTOP=r3;return}function _lua_load(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10;r6=STACKTOP;STACKTOP=STACKTOP+24|0;r7=r6;r8=r1;r1=r4;if((r1|0)==0){r1=12032}_luaZ_init(r8,r7,r2,r3);r3=_luaD_protectedparser(r8,r7,r1,r5);if((r3|0)!=0){r9=r3;STACKTOP=r6;return r9}r5=HEAP32[HEAP32[r8+8>>2]-16>>2];if((HEAPU8[r5+6|0]|0)==1){r1=_luaH_getint(HEAP32[HEAP32[r8+12>>2]+40>>2],2);r7=r1;r2=HEAP32[HEAP32[r5+16>>2]+8>>2];r4=r2|0;r10=r7|0;HEAP32[r4>>2]=HEAP32[r10>>2];HEAP32[r4+4>>2]=HEAP32[r10+4>>2];HEAP32[r2+8>>2]=HEAP32[r7+8>>2];do{if((HEAP32[r1+8>>2]&64|0)!=0){if((HEAP8[HEAP32[r1>>2]+5|0]&3|0)==0){break}if((HEAP8[HEAP32[r5+16>>2]+5|0]&4|0)==0){break}_luaC_barrier_(r8,HEAP32[r5+16>>2],HEAP32[r1>>2])}}while(0)}r9=r3;STACKTOP=r6;return r9}function _lua_dump(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=HEAP32[r5+8>>2]-16|0;if((HEAP32[r1+8>>2]|0)==70){r6=_luaU_dump(r5,HEAP32[HEAP32[r1>>2]+12>>2],r2,r3,0);r7=r6;STACKTOP=r4;return r7}else{r6=1;r7=r6;STACKTOP=r4;return r7}}function _lua_status(r1){STACKTOP=STACKTOP;return HEAPU8[r1+6|0]}function _lua_gc(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93;r4=0;r5=STACKTOP;r6=r1;r7=r2;r8=r3;r9=0;r10=r6;r11=r10+12|0;r12=HEAP32[r11>>2];r13=r12;r14=r7;switch(r14|0){case 9:{r15=r13;r16=r15+63|0;r17=HEAP8[r16];r18=r17&255;r9=r18;r19=r9;STACKTOP=r5;return r19;break};case 7:{r20=r13;r21=r20+164|0;r22=HEAP32[r21>>2];r9=r22;r23=r8;r24=r13;r25=r24+164|0;HEAP32[r25>>2]=r23;r19=r9;STACKTOP=r5;return r19;break};case 6:{r26=r13;r27=r26+156|0;r28=HEAP32[r27>>2];r9=r28;r29=r8;r30=r13;r31=r30+156|0;HEAP32[r31>>2]=r29;r19=r9;STACKTOP=r5;return r19;break};case 11:{r32=r6;_luaC_changemode(r32,0);r19=r9;STACKTOP=r5;return r19;break};case 0:{r33=r13;r34=r33+63|0;HEAP8[r34]=0;r19=r9;STACKTOP=r5;return r19;break};case 10:{r35=r6;_luaC_changemode(r35,2);r19=r9;STACKTOP=r5;return r19;break};case 8:{r36=r13;r37=r36+160|0;r38=HEAP32[r37>>2];r9=r38;r39=r8;r40=r13;r41=r40+160|0;HEAP32[r41>>2]=r39;r19=r9;STACKTOP=r5;return r19;break};case 1:{r42=r13;_luaE_setdebt(r42,0);r43=r13;r44=r43+63|0;HEAP8[r44]=1;r19=r9;STACKTOP=r5;return r19;break};case 2:{r45=r6;_luaC_fullgc(r45,0);r19=r9;STACKTOP=r5;return r19;break};case 3:{r46=r13;r47=r46+8|0;r48=HEAP32[r47>>2];r49=r13;r50=r49+12|0;r51=HEAP32[r50>>2];r52=r48+r51|0;r53=r52>>>10;r9=r53;r19=r9;STACKTOP=r5;return r19;break};case 4:{r54=r13;r55=r54+8|0;r56=HEAP32[r55>>2];r57=r13;r58=r57+12|0;r59=HEAP32[r58>>2];r60=r56+r59|0;r61=r60&1023;r9=r61;r19=r9;STACKTOP=r5;return r19;break};case 5:{r62=r13;r63=r62+62|0;r64=HEAP8[r63];r65=r64&255;r66=(r65|0)==2;if(r66){r67=r13;r68=r67+20|0;r69=HEAP32[r68>>2];r70=(r69|0)==0;r71=r70&1;r9=r71;r72=r6;_luaC_forcestep(r72)}else{r73=r8;r74=r73<<10;r75=r74-1600|0;r76=r75;r77=r13;r78=r77+63|0;r79=HEAP8[r78];r80=r79<<24>>24!=0;if(r80){r81=r13;r82=r81+12|0;r83=HEAP32[r82>>2];r84=r76;r85=r84+r83|0;r76=r85}r86=r13;r87=r76;_luaE_setdebt(r86,r87);r88=r6;_luaC_forcestep(r88);r89=r13;r90=r89+61|0;r91=HEAP8[r90];r92=r91&255;r93=(r92|0)==5;if(r93){r9=1}}r19=r9;STACKTOP=r5;return r19;break};default:{r9=-1;r19=r9;STACKTOP=r5;return r19}}}function _lua_error(r1){var r2,r3;r2=STACKTOP;_luaG_errormsg(r1);STACKTOP=r2;return r3}function _lua_next(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=_index2addr(r4,r2)|0;r2=_luaH_next(r4,HEAP32[r1>>2],HEAP32[r4+8>>2]-16|0);if((r2|0)!=0){r1=r4+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16;r5=r2;STACKTOP=r3;return r5}else{r1=r4+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]-16;r5=r2;STACKTOP=r3;return r5}}function _lua_concat(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;if((r1|0)>=2){if((HEAP32[HEAP32[r4+12>>2]+12>>2]|0)>0){_luaC_step(r4)}_luaV_concat(r4,r1);STACKTOP=r3;return}else{if((r1|0)==0){r1=HEAP32[r4+8>>2];r2=_luaS_newlstr(r4,12112,0);HEAP32[r1>>2]=r2;HEAP32[r1+8>>2]=HEAPU8[r2+4|0]|64;r2=r4+8|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16}STACKTOP=r3;return}}function _lua_len(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=_index2addr(r4,r2);_luaV_objlen(r4,HEAP32[r4+8>>2],r1);r1=r4+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16;STACKTOP=r3;return}function _lua_newuserdata(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;if((HEAP32[HEAP32[r4+12>>2]+12>>2]|0)>0){_luaC_step(r4)}r1=_luaS_newudata(r4,r2,0);r2=HEAP32[r4+8>>2];HEAP32[r2>>2]=r1;HEAP32[r2+8>>2]=71;r2=r4+8|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;STACKTOP=r3;return r1+24|0}function _lua_getupvalue(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r1;HEAP32[r5>>2]=0;r1=_aux_upvalue(_index2addr(r6,r2),r3,r5,0);if((r1|0)==0){r7=r1;STACKTOP=r4;return r7}r3=HEAP32[r5>>2];r5=HEAP32[r6+8>>2];r2=r5|0;r8=r3|0;HEAP32[r2>>2]=HEAP32[r8>>2];HEAP32[r2+4>>2]=HEAP32[r8+4>>2];HEAP32[r5+8>>2]=HEAP32[r3+8>>2];r3=r6+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+16;r7=r1;STACKTOP=r4;return r7}function _aux_upvalue(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=r4;r4=HEAP32[r6+8>>2]&63;if((r4|0)==6){r7=HEAP32[r6>>2];r8=HEAP32[r7+12>>2];do{if(1<=(r1|0)){if((r1|0)>(HEAP32[r8+40>>2]|0)){break}HEAP32[r2>>2]=HEAP32[HEAP32[r7+16+(r1-1<<2)>>2]+8>>2];if((r3|0)!=0){HEAP32[r3>>2]=HEAP32[r7+16+(r1-1<<2)>>2]}r9=HEAP32[HEAP32[r8+28>>2]+(r1-1<<3)>>2];if((r9|0)==0){r10=12112}else{r10=r9+16|0}r11=r10;r12=r11;STACKTOP=r5;return r12}}while(0);r11=0;r12=r11;STACKTOP=r5;return r12}else if((r4|0)==38){r4=HEAP32[r6>>2];do{if(1<=(r1|0)){if((r1|0)>(HEAPU8[r4+6|0]|0)){break}HEAP32[r2>>2]=r4+16+(r1-1<<4);if((r3|0)!=0){HEAP32[r3>>2]=r4}r11=12112;r12=r11;STACKTOP=r5;return r12}}while(0);r11=0;r12=r11;STACKTOP=r5;return r12}else{r11=0;r12=r11;STACKTOP=r5;return r12}}function _lua_setupvalue(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r4+8;r7=r1;HEAP32[r5>>2]=0;HEAP32[r6>>2]=0;r1=_aux_upvalue(_index2addr(r7,r2),r3,r5,r6);if((r1|0)==0){r8=r1;STACKTOP=r4;return r8}r3=r7+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]-16;r3=HEAP32[r7+8>>2];r2=HEAP32[r5>>2];r5=r2|0;r9=r3|0;HEAP32[r5>>2]=HEAP32[r9>>2];HEAP32[r5+4>>2]=HEAP32[r9+4>>2];HEAP32[r2+8>>2]=HEAP32[r3+8>>2];do{if((HEAP32[HEAP32[r7+8>>2]+8>>2]&64|0)!=0){if((HEAP8[HEAP32[HEAP32[r7+8>>2]>>2]+5|0]&3|0)==0){break}if((HEAP8[HEAP32[r6>>2]+5|0]&4|0)==0){break}_luaC_barrier_(r7,HEAP32[r6>>2],HEAP32[HEAP32[r7+8>>2]>>2])}}while(0);r8=r1;STACKTOP=r4;return r8}function _lua_upvalueid(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=_index2addr(r5,r1);r6=HEAP32[r3+8>>2]&63;if((r6|0)==38){r7=HEAP32[r3>>2]+16+(r2-1<<4)|0;r8=r7;STACKTOP=r4;return r8}else if((r6|0)==6){r6=_getupvalref(r5,r1,r2,0);r7=HEAP32[r6>>2];r8=r7;STACKTOP=r4;return r8}else{r7=0;r8=r7;STACKTOP=r4;return r8}}function _getupvalref(r1,r2,r3,r4){var r5,r6;r5=STACKTOP;r6=r4;r4=_index2addr(r1,r2)|0;r2=HEAP32[r4>>2];if((r6|0)!=0){HEAP32[r6>>2]=r2}STACKTOP=r5;return r2+16+(r3-1<<2)|0}function _lua_upvaluejoin(r1,r2,r3,r4,r5){var r6,r7,r8;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r7=r6;r8=r1;r1=_getupvalref(r8,r2,r3,r7);r3=_getupvalref(r8,r4,r5,0);HEAP32[r1>>2]=HEAP32[r3>>2];if((HEAP8[HEAP32[r3>>2]+5|0]&3|0)==0){STACKTOP=r6;return}if((HEAP8[HEAP32[r7>>2]+5|0]&4|0)==0){STACKTOP=r6;return}_luaC_barrier_(r8,HEAP32[r7>>2],HEAP32[r3>>2]);STACKTOP=r6;return}function _luaK_nil(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=r1+r2-1|0;if((HEAP32[r6+20>>2]|0)>(HEAP32[r6+24>>2]|0)){r7=HEAP32[HEAP32[r6>>2]+12>>2]+(HEAP32[r6+20>>2]-1<<2)|0;L3:do{if((HEAP32[r7>>2]>>>0&63|0)==4){r8=HEAP32[r7>>2]>>>6&255;r9=r8+(HEAP32[r7>>2]>>>23&511)|0;if((r8|0)<=(r1|0)){if((r1|0)>(r9+1|0)){r4=5}}else{r4=5}do{if(r4==5){if((r1|0)<=(r8|0)){if((r8|0)<=(r3+1|0)){break}}break L3}}while(0);if((r8|0)<(r1|0)){r1=r8}if((r9|0)>(r3|0)){r3=r9}HEAP32[r7>>2]=HEAP32[r7>>2]&-16321|r1<<6&16320;HEAP32[r7>>2]=HEAP32[r7>>2]&8388607|r3-r1<<23&-8388608;STACKTOP=r5;return}}while(0)}_luaK_codeABC(r6,4,r1,r2-1|0,0);STACKTOP=r5;return}function _luaK_codeABC(r1,r2,r3,r4,r5){var r6,r7;r6=STACKTOP;r7=_luaK_code(r1,r2<<0|r3<<6|r4<<23|r5<<14);STACKTOP=r6;return r7}function _luaK_jump(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r1=HEAP32[r4+28>>2];HEAP32[r4+28>>2]=-1;r5=_luaK_codeABx(r4,23,0,131070);HEAP32[r3>>2]=r5;_luaK_concat(r4,r3,r1);STACKTOP=r2;return HEAP32[r3>>2]}function _luaK_codeABx(r1,r2,r3,r4){var r5,r6;r5=STACKTOP;r6=_luaK_code(r1,r2<<0|r3<<6|r4<<14);STACKTOP=r5;return r6}function _luaK_concat(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((r2|0)==-1){STACKTOP=r4;return}if((HEAP32[r1>>2]|0)==-1){HEAP32[r1>>2]=r2}else{r3=HEAP32[r1>>2];while(1){r1=_getjump(r5,r3);if((r1|0)==-1){break}r3=r1}_fixjump(r5,r3,r2)}STACKTOP=r4;return}function _luaK_ret(r1,r2,r3){var r4;r4=STACKTOP;_luaK_codeABC(r1,31,r2,r3+1|0,0);STACKTOP=r4;return}function _luaK_getlabel(r1){var r2;r2=r1;HEAP32[r2+24>>2]=HEAP32[r2+20>>2];STACKTOP=STACKTOP;return HEAP32[r2+20>>2]}function _luaK_patchlist(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((r2|0)==(HEAP32[r5+20>>2]|0)){_luaK_patchtohere(r5,r1);STACKTOP=r4;return}else{_patchlistaux(r5,r1,r2,255,r2);STACKTOP=r4;return}}function _luaK_patchtohere(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;_luaK_getlabel(r4);_luaK_concat(r4,r4+28|0,r2);STACKTOP=r3;return}function _patchlistaux(r1,r2,r3,r4,r5){var r6,r7;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=r4;r4=r5;while(1){if((r1|0)==-1){break}r5=_getjump(r7,r1);if((_patchtestreg(r7,r1,r3)|0)!=0){_fixjump(r7,r1,r2)}else{_fixjump(r7,r1,r4)}r1=r5}STACKTOP=r6;return}function _luaK_patchclose(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r2=r2+1|0;while(1){if((r1|0)==-1){break}r3=_getjump(r5,r1);HEAP32[HEAP32[HEAP32[r5>>2]+12>>2]+(r1<<2)>>2]=HEAP32[HEAP32[HEAP32[r5>>2]+12>>2]+(r1<<2)>>2]&-16321|r2<<6&16320;r1=r3}STACKTOP=r4;return}function _getjump(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r2;r2=(HEAP32[HEAP32[HEAP32[r1>>2]+12>>2]+(r4<<2)>>2]>>>14&262143)-131071|0;if((r2|0)==-1){r5=-1;r6=r5;STACKTOP=r3;return r6}else{r5=r4+1+r2|0;r6=r5;STACKTOP=r3;return r6}}function _fixjump(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=r2;r2=HEAP32[HEAP32[r5>>2]+12>>2]+(r1<<2)|0;r6=r3-(r1+1)|0;if((Math_abs(r6)|0)>131071){_luaX_syntaxerror(HEAP32[r5+12>>2],5776)}else{HEAP32[r2>>2]=HEAP32[r2>>2]&16383|r6+131071<<14&-16384;STACKTOP=r4;return}}function _luaK_code(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=HEAP32[r4>>2];_dischargejpc(r4);if((HEAP32[r4+20>>2]+1|0)>(HEAP32[r1+48>>2]|0)){r5=_luaM_growaux_(HEAP32[HEAP32[r4+12>>2]+52>>2],HEAP32[r1+12>>2],r1+48|0,4,2147483645,7296);HEAP32[r1+12>>2]=r5}HEAP32[HEAP32[r1+12>>2]+(HEAP32[r4+20>>2]<<2)>>2]=r2;if((HEAP32[r4+20>>2]+1|0)>(HEAP32[r1+52>>2]|0)){r2=_luaM_growaux_(HEAP32[HEAP32[r4+12>>2]+52>>2],HEAP32[r1+20>>2],r1+52|0,4,2147483645,7296);HEAP32[r1+20>>2]=r2}HEAP32[HEAP32[r1+20>>2]+(HEAP32[r4+20>>2]<<2)>>2]=HEAP32[HEAP32[r4+12>>2]+8>>2];r1=r4+20|0;r4=HEAP32[r1>>2];HEAP32[r1>>2]=r4+1;STACKTOP=r3;return r4}function _luaK_codek(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((r2|0)<=262143){r6=_luaK_codeABx(r5,1,r1,r2);r7=r6;STACKTOP=r4;return r7}else{r3=_luaK_codeABx(r5,2,r1,0);_codeextraarg(r5,r2);r6=r3;r7=r6;STACKTOP=r4;return r7}}function _codeextraarg(r1,r2){var r3,r4;r3=STACKTOP;r4=_luaK_code(r1,39|r2<<6);STACKTOP=r3;return r4}function _luaK_checkstack(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=HEAPU8[r4+48|0]+r2|0;if((r1|0)<=(HEAPU8[HEAP32[r4>>2]+78|0]|0)){STACKTOP=r3;return}if((r1|0)>=250){_luaX_syntaxerror(HEAP32[r4+12>>2],9448)}HEAP8[HEAP32[r4>>2]+78|0]=r1;STACKTOP=r3;return}function _luaK_reserveregs(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;_luaK_checkstack(r4,r1);r2=r4+48|0;HEAP8[r2]=HEAPU8[r2]+r1;STACKTOP=r3;return}function _luaK_stringK(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=r4;r6=r2;HEAP32[r5>>2]=r6;HEAP32[r5+8>>2]=HEAPU8[r6+4|0]|64;r6=_addk(r1,r4,r4);STACKTOP=r3;return r6}function _addk(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r1;r1=r3;r3=HEAP32[HEAP32[r6+12>>2]+52>>2];r7=_luaH_set(r3,HEAP32[r6+4>>2],r2);r2=HEAP32[r6>>2];if((HEAP32[r7+8>>2]|0)==3){HEAPF64[r5>>3]=HEAPF64[r7>>3]+6755399441055744;r8=HEAP32[r5+(((HEAP32[2548>>2]|0)==33)<<2)>>2];do{if((HEAP32[HEAP32[r2+8>>2]+(r8<<4)+8>>2]|0)==(HEAP32[r1+8>>2]|0)){if((_luaV_equalobj_(0,HEAP32[r2+8>>2]+(r8<<4)|0,r1)|0)==0){break}r9=r8;r10=r9;STACKTOP=r4;return r10}}while(0)}r5=HEAP32[r2+44>>2];r8=HEAP32[r6+32>>2];r11=r7;HEAPF64[r11>>3]=r8|0;HEAP32[r11+8>>2]=3;if((r8+1|0)>(HEAP32[r2+44>>2]|0)){r11=_luaM_growaux_(r3,HEAP32[r2+8>>2],r2+44|0,16,67108863,8528);HEAP32[r2+8>>2]=r11}while(1){if((r5|0)>=(HEAP32[r2+44>>2]|0)){break}r11=r5;r5=r11+1|0;HEAP32[HEAP32[r2+8>>2]+(r11<<4)+8>>2]=0}r5=r1;r11=HEAP32[r2+8>>2]+(r8<<4)|0;r7=r11|0;r12=r5|0;HEAP32[r7>>2]=HEAP32[r12>>2];HEAP32[r7+4>>2]=HEAP32[r12+4>>2];HEAP32[r11+8>>2]=HEAP32[r5+8>>2];r5=r6+32|0;HEAP32[r5>>2]=HEAP32[r5>>2]+1;do{if((HEAP32[r1+8>>2]&64|0)!=0){if((HEAP8[HEAP32[r1>>2]+5|0]&3|0)==0){break}if((HEAP8[r2+5|0]&4|0)==0){break}_luaC_barrier_(r3,r2,HEAP32[r1>>2])}}while(0);r9=r8;r10=r9;STACKTOP=r4;return r10}function _luaK_numberK(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=STACKTOP;STACKTOP=STACKTOP+24|0;r4=r3;r5=r3+8;r6=r1;HEAPF64[r4>>3]=r2;r2=HEAP32[HEAP32[r6+12>>2]+52>>2];r1=r5;HEAPF64[r1>>3]=HEAPF64[r4>>3];HEAP32[r1+8>>2]=3;do{if(HEAPF64[r4>>3]!=0){if(HEAPF64[r4>>3]!=HEAPF64[r4>>3]){break}r7=_addk(r6,r5,r5);r8=r7;STACKTOP=r3;return r8}}while(0);r1=HEAP32[r2+8>>2];r9=_luaS_newlstr(r2,r4,8);HEAP32[r1>>2]=r9;HEAP32[r1+8>>2]=HEAPU8[r9+4|0]|64;r9=r2+8|0;HEAP32[r9>>2]=HEAP32[r9>>2]+16;if(((HEAP32[r2+24>>2]-HEAP32[r2+8>>2]|0)/16&-1|0)<=0){_luaD_growstack(r2,0)}r7=_addk(r6,HEAP32[r2+8>>2]-16|0,r5);r5=r2+8|0;HEAP32[r5>>2]=HEAP32[r5>>2]-16;r8=r7;STACKTOP=r3;return r8}function _luaK_setreturns(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((HEAP32[r1>>2]|0)==12){HEAP32[HEAP32[HEAP32[r5>>2]+12>>2]+(HEAP32[r1+8>>2]<<2)>>2]=HEAP32[HEAP32[HEAP32[r5>>2]+12>>2]+(HEAP32[r1+8>>2]<<2)>>2]&-8372225|r2+1<<14&8372224;STACKTOP=r4;return}if((HEAP32[r1>>2]|0)==13){HEAP32[HEAP32[HEAP32[r5>>2]+12>>2]+(HEAP32[r1+8>>2]<<2)>>2]=HEAP32[HEAP32[HEAP32[r5>>2]+12>>2]+(HEAP32[r1+8>>2]<<2)>>2]&8388607|r2+1<<23&-8388608;HEAP32[HEAP32[HEAP32[r5>>2]+12>>2]+(HEAP32[r1+8>>2]<<2)>>2]=HEAP32[HEAP32[HEAP32[r5>>2]+12>>2]+(HEAP32[r1+8>>2]<<2)>>2]&-16321|HEAPU8[r5+48|0]<<6&16320;_luaK_reserveregs(r5,1)}STACKTOP=r4;return}function _luaK_setoneret(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;if((HEAP32[r1>>2]|0)==12){HEAP32[r1>>2]=6;HEAP32[r1+8>>2]=HEAP32[HEAP32[HEAP32[r4>>2]+12>>2]+(HEAP32[r1+8>>2]<<2)>>2]>>>6&255;STACKTOP=r3;return}if((HEAP32[r1>>2]|0)==13){HEAP32[HEAP32[HEAP32[r4>>2]+12>>2]+(HEAP32[r1+8>>2]<<2)>>2]=HEAP32[HEAP32[HEAP32[r4>>2]+12>>2]+(HEAP32[r1+8>>2]<<2)>>2]&8388607|16777216;HEAP32[r1>>2]=11}STACKTOP=r3;return}function _luaK_dischargevars(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66;r3=0;r4=STACKTOP;r5=r1;r6=r2;r7=r6;r8=r7|0;r9=HEAP32[r8>>2];switch(r9|0){case 13:case 12:{r10=r5;r11=r6;_luaK_setoneret(r10,r11);STACKTOP=r4;return;break};case 7:{r12=r6;r13=r12|0;HEAP32[r13>>2]=6;STACKTOP=r4;return;break};case 8:{r14=r5;r15=r6;r16=r15+8|0;r17=r16;r18=HEAP32[r17>>2];r19=_luaK_codeABC(r14,5,0,r18,0);r20=r6;r21=r20+8|0;r22=r21;HEAP32[r22>>2]=r19;r23=r6;r24=r23|0;HEAP32[r24>>2]=11;STACKTOP=r4;return;break};case 9:{r25=6;r26=r5;r27=r6;r28=r27+8|0;r29=r28;r30=r29|0;r31=HEAP16[r30>>1];r32=r31<<16>>16;_freereg(r26,r32);r33=r6;r34=r33+8|0;r35=r34;r36=r35+3|0;r37=HEAP8[r36];r38=r37&255;r39=(r38|0)==7;if(r39){r40=r5;r41=r6;r42=r41+8|0;r43=r42;r44=r43+2|0;r45=HEAP8[r44];r46=r45&255;_freereg(r40,r46);r25=7}r47=r5;r48=r25;r49=r6;r50=r49+8|0;r51=r50;r52=r51+2|0;r53=HEAP8[r52];r54=r53&255;r55=r6;r56=r55+8|0;r57=r56;r58=r57|0;r59=HEAP16[r58>>1];r60=r59<<16>>16;r61=_luaK_codeABC(r47,r48,0,r54,r60);r62=r6;r63=r62+8|0;r64=r63;HEAP32[r64>>2]=r61;r65=r6;r66=r65|0;HEAP32[r66>>2]=11;STACKTOP=r4;return;break};default:{STACKTOP=r4;return}}}function _freereg(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;if((r1&256|0)!=0){STACKTOP=r3;return}if((r1|0)<(HEAPU8[r4+46|0]|0)){STACKTOP=r3;return}r1=r4+48|0;HEAP8[r1]=HEAP8[r1]-1;STACKTOP=r3;return}function _luaK_exp2nextreg(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;_luaK_dischargevars(r4,r1);_freeexp(r4,r1);_luaK_reserveregs(r4,1);_exp2reg(r4,r1,HEAPU8[r4+48|0]-1|0);STACKTOP=r3;return}function _freeexp(r1,r2){var r3,r4;r3=STACKTOP;r4=r2;if((HEAP32[r4>>2]|0)!=6){STACKTOP=r3;return}_freereg(r1,HEAP32[r4+8>>2]);STACKTOP=r3;return}function _exp2reg(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;_discharge2reg(r6,r1,r2);if((HEAP32[r1>>2]|0)==10){_luaK_concat(r6,r1+16|0,HEAP32[r1+8>>2])}if((HEAP32[r1+16>>2]|0)==(HEAP32[r1+20>>2]|0)){r7=r1;r8=r7+16|0;HEAP32[r8>>2]=-1;r9=r1;r10=r9+20|0;HEAP32[r10>>2]=-1;r11=r2;r12=r1;r13=r12+8|0;r14=r13;HEAP32[r14>>2]=r11;r15=r1;r16=r15|0;HEAP32[r16>>2]=6;STACKTOP=r5;return}r3=-1;r17=-1;if((_need_value(r6,HEAP32[r1+16>>2])|0)!=0){r4=6}else{if((_need_value(r6,HEAP32[r1+20>>2])|0)!=0){r4=6}}if(r4==6){if((HEAP32[r1>>2]|0)==10){r18=-1}else{r18=_luaK_jump(r6)}r3=_code_label(r6,r2,0,1);r17=_code_label(r6,r2,1,0);_luaK_patchtohere(r6,r18)}r18=_luaK_getlabel(r6);_patchlistaux(r6,HEAP32[r1+20>>2],r18,r2,r3);_patchlistaux(r6,HEAP32[r1+16>>2],r18,r2,r17);r7=r1;r8=r7+16|0;HEAP32[r8>>2]=-1;r9=r1;r10=r9+20|0;HEAP32[r10>>2]=-1;r11=r2;r12=r1;r13=r12+8|0;r14=r13;HEAP32[r14>>2]=r11;r15=r1;r16=r15|0;HEAP32[r16>>2]=6;STACKTOP=r5;return}function _luaK_exp2anyreg(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;_luaK_dischargevars(r4,r1);do{if((HEAP32[r1>>2]|0)==6){if((HEAP32[r1+16>>2]|0)==(HEAP32[r1+20>>2]|0)){r5=HEAP32[r1+8>>2];r6=r5;STACKTOP=r3;return r6}if((HEAP32[r1+8>>2]|0)<(HEAPU8[r4+46|0]|0)){break}_exp2reg(r4,r1,HEAP32[r1+8>>2]);r5=HEAP32[r1+8>>2];r6=r5;STACKTOP=r3;return r6}}while(0);_luaK_exp2nextreg(r4,r1);r5=HEAP32[r1+8>>2];r6=r5;STACKTOP=r3;return r6}function _luaK_exp2anyregup(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;do{if((HEAP32[r1>>2]|0)==8){if((HEAP32[r1+16>>2]|0)!=(HEAP32[r1+20>>2]|0)){break}STACKTOP=r3;return}}while(0);_luaK_exp2anyreg(r4,r1);STACKTOP=r3;return}function _luaK_exp2val(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;if((HEAP32[r1+16>>2]|0)!=(HEAP32[r1+20>>2]|0)){_luaK_exp2anyreg(r4,r1);STACKTOP=r3;return}else{_luaK_dischargevars(r4,r1);STACKTOP=r3;return}}function _luaK_exp2RK(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65;r3=0;r4=STACKTOP;r5=r1;r6=r2;r7=r5;r8=r6;_luaK_exp2val(r7,r8);r9=r6;r10=r9|0;r11=HEAP32[r10>>2];L1:do{switch(r11|0){case 2:case 3:case 1:{r12=r5;r13=r12+32|0;r14=HEAP32[r13>>2];r15=(r14|0)<=255;if(!r15){break L1}r16=r6;r17=r16|0;r18=HEAP32[r17>>2];r19=(r18|0)==1;if(r19){r20=r5;r21=_nilK(r20);r22=r21}else{r23=r5;r24=r6;r25=r24|0;r26=HEAP32[r25>>2];r27=(r26|0)==2;r28=r27&1;r29=_boolK(r23,r28);r22=r29}r30=r6;r31=r30+8|0;r32=r31;HEAP32[r32>>2]=r22;r33=r6;r34=r33|0;HEAP32[r34>>2]=4;r35=r6;r36=r35+8|0;r37=r36;r38=HEAP32[r37>>2];r39=r38|256;r40=r39;r41=r40;STACKTOP=r4;return r41;break};case 5:{r42=r5;r43=r6;r44=r43+8|0;r45=r44;r46=HEAPF64[r45>>3];r47=_luaK_numberK(r42,r46);r48=r6;r49=r48+8|0;r50=r49;HEAP32[r50>>2]=r47;r51=r6;r52=r51|0;HEAP32[r52>>2]=4;r3=9;break};case 4:{r3=9;break};default:{}}}while(0);do{if(r3==9){r53=r6;r54=r53+8|0;r55=r54;r56=HEAP32[r55>>2];r57=(r56|0)<=255;if(!r57){break}r58=r6;r59=r58+8|0;r60=r59;r61=HEAP32[r60>>2];r62=r61|256;r40=r62;r41=r40;STACKTOP=r4;return r41}}while(0);r63=r5;r64=r6;r65=_luaK_exp2anyreg(r63,r64);r40=r65;r41=r40;STACKTOP=r4;return r41}function _nilK(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+32|0;r3=r2;r4=r2+16;r5=r1;HEAP32[r4+8>>2]=0;r1=r3;HEAP32[r1>>2]=HEAP32[r5+4>>2];HEAP32[r1+8>>2]=69;r1=_addk(r5,r3,r4);STACKTOP=r2;return r1}function _boolK(r1,r2){var r3,r4,r5;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=r4;HEAP32[r5>>2]=r2;HEAP32[r5+8>>2]=1;r5=_addk(r1,r4,r4);STACKTOP=r3;return r5}function _luaK_storevar(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=HEAP32[r1>>2];if((r3|0)==7){_freeexp(r5,r2);_exp2reg(r5,r2,HEAP32[r1+8>>2]);STACKTOP=r4;return}else if((r3|0)==9){r6=(HEAPU8[r1+11|0]|0)==7?10:8;r7=_luaK_exp2RK(r5,r2);_luaK_codeABC(r5,r6,HEAPU8[r1+10|0],HEAP16[r1+8>>1]|0,r7)}else if((r3|0)==8){r3=_luaK_exp2anyreg(r5,r2);_luaK_codeABC(r5,9,r3,HEAP32[r1+8>>2],0)}_freeexp(r5,r2);STACKTOP=r4;return}function _luaK_self(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=r2;r2=r3;_luaK_exp2anyreg(r5,r1);r3=HEAP32[r1+8>>2];_freeexp(r5,r1);HEAP32[r1+8>>2]=HEAPU8[r5+48|0];HEAP32[r1>>2]=6;_luaK_reserveregs(r5,2);r6=HEAP32[r1+8>>2];_luaK_codeABC(r5,12,r6,r3,_luaK_exp2RK(r5,r2));_freeexp(r5,r2);STACKTOP=r4;return}function _luaK_goiftrue(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=r2;_luaK_dischargevars(r4,r1);r2=HEAP32[r1>>2];if((r2|0)==4|(r2|0)==5|(r2|0)==2){r5=-1}else if((r2|0)==10){_invertjump(r4,r1);r5=HEAP32[r1+8>>2]}else{r5=_jumponcond(r4,r1,0)}_luaK_concat(r4,r1+20|0,r5);_luaK_patchtohere(r4,HEAP32[r1+16>>2]);HEAP32[r1+16>>2]=-1;STACKTOP=r3;return}function _invertjump(r1,r2){var r3,r4;r3=STACKTOP;r4=_getjumpcontrol(r1,HEAP32[r2+8>>2]);HEAP32[r4>>2]=HEAP32[r4>>2]&-16321|(((HEAP32[r4>>2]>>>6&255|0)!=0^1)&1)<<6&16320;STACKTOP=r3;return}function _jumponcond(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;r5=r1;r1=r2;r2=r3;do{if((HEAP32[r1>>2]|0)==11){r3=HEAP32[HEAP32[HEAP32[r5>>2]+12>>2]+(HEAP32[r1+8>>2]<<2)>>2];if((r3>>>0&63|0)!=20){break}r6=r5+20|0;HEAP32[r6>>2]=HEAP32[r6>>2]-1;r7=_condjump(r5,27,r3>>>23&511,0,((r2|0)!=0^1)&1);r8=r7;STACKTOP=r4;return r8}}while(0);_discharge2anyreg(r5,r1);_freeexp(r5,r1);r7=_condjump(r5,28,255,HEAP32[r1+8>>2],r2);r8=r7;STACKTOP=r4;return r8}function _luaK_goiffalse(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=r2;_luaK_dischargevars(r4,r1);r2=HEAP32[r1>>2];if((r2|0)==1|(r2|0)==3){r5=-1}else if((r2|0)==10){r5=HEAP32[r1+8>>2]}else{r5=_jumponcond(r4,r1,1)}_luaK_concat(r4,r1+16|0,r5);_luaK_patchtohere(r4,HEAP32[r1+20>>2]);HEAP32[r1+20>>2]=-1;STACKTOP=r3;return}function _luaK_indexed(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r2;HEAP8[r5+10|0]=HEAP32[r5+8>>2];r2=_luaK_exp2RK(r1,r3)&65535;HEAP16[r5+8>>1]=r2;HEAP8[r5+11|0]=(HEAP32[r5>>2]|0)==8?8:7;HEAP32[r5>>2]=9;STACKTOP=r4;return}function _luaK_prefix(r1,r2,r3,r4){var r5,r6,r7;r5=STACKTOP;STACKTOP=STACKTOP+24|0;r6=r5;r7=r1;r1=r3;r3=r4;HEAP32[r6+20>>2]=-1;HEAP32[r6+16>>2]=-1;HEAP32[r6>>2]=5;HEAPF64[r6+8>>3]=0;r4=r2;if((r4|0)==0){if((_isnumeral(r1)|0)!=0){HEAPF64[r1+8>>3]=-0-HEAPF64[r1+8>>3]}else{_luaK_exp2anyreg(r7,r1);_codearith(r7,19,r1,r6,r3)}STACKTOP=r5;return}else if((r4|0)==1){_codenot(r7,r1);STACKTOP=r5;return}else if((r4|0)==2){_luaK_exp2anyreg(r7,r1);_codearith(r7,21,r1,r6,r3);STACKTOP=r5;return}else{STACKTOP=r5;return}}function _isnumeral(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;do{if((HEAP32[r3>>2]|0)==5){if((HEAP32[r3+16>>2]|0)!=-1){r4=0;break}r4=(HEAP32[r3+20>>2]|0)==-1}else{r4=0}}while(0);STACKTOP=r2;return r4&1}function _codearith(r1,r2,r3,r4,r5){var r6,r7,r8,r9;r6=0;r7=STACKTOP;r8=r1;r1=r2;r2=r3;r3=r4;r4=r5;if((_constfolding(r1,r2,r3)|0)!=0){STACKTOP=r7;return}do{if((r1|0)!=19){if((r1|0)==21){r6=6;break}r9=_luaK_exp2RK(r8,r3)}else{r6=6}}while(0);if(r6==6){r9=0}r6=r9;r9=_luaK_exp2RK(r8,r2);if((r9|0)>(r6|0)){_freeexp(r8,r2);_freeexp(r8,r3)}else{_freeexp(r8,r3);_freeexp(r8,r2)}r3=_luaK_codeABC(r8,r1,0,r9,r6);HEAP32[r2+8>>2]=r3;HEAP32[r2>>2]=11;_luaK_fixline(r8,r4);STACKTOP=r7;return}function _codenot(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52;r3=0;r4=STACKTOP;r5=r1;r6=r2;r7=r5;r8=r6;_luaK_dischargevars(r7,r8);r9=r6;r10=r9|0;r11=HEAP32[r10>>2];switch(r11|0){case 10:{r12=r5;r13=r6;_invertjump(r12,r13);break};case 4:case 5:case 2:{r14=r6;r15=r14|0;HEAP32[r15>>2]=3;break};case 11:case 6:{r16=r5;r17=r6;_discharge2anyreg(r16,r17);r18=r5;r19=r6;_freeexp(r18,r19);r20=r5;r21=r6;r22=r21+8|0;r23=r22;r24=HEAP32[r23>>2];r25=_luaK_codeABC(r20,20,0,r24,0);r26=r6;r27=r26+8|0;r28=r27;HEAP32[r28>>2]=r25;r29=r6;r30=r29|0;HEAP32[r30>>2]=11;break};case 1:case 3:{r31=r6;r32=r31|0;HEAP32[r32>>2]=2;break};default:{}}r33=r6;r34=r33+20|0;r35=HEAP32[r34>>2];r36=r35;r37=r6;r38=r37+16|0;r39=HEAP32[r38>>2];r40=r6;r41=r40+20|0;HEAP32[r41>>2]=r39;r42=r36;r43=r6;r44=r43+16|0;HEAP32[r44>>2]=r42;r45=r5;r46=r6;r47=r46+20|0;r48=HEAP32[r47>>2];_removevalues(r45,r48);r49=r5;r50=r6;r51=r50+16|0;r52=HEAP32[r51>>2];_removevalues(r49,r52);STACKTOP=r4;return}function _luaK_infix(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r4=0;r5=STACKTOP;r6=r1;r7=r2;r8=r3;r9=r7;switch(r9|0){case 13:{r10=r6;r11=r8;_luaK_goiftrue(r10,r11);STACKTOP=r5;return;break};case 6:{r12=r6;r13=r8;_luaK_exp2nextreg(r12,r13);STACKTOP=r5;return;break};case 0:case 1:case 2:case 3:case 4:case 5:{r14=r8;r15=_isnumeral(r14);r16=(r15|0)!=0;if(!r16){r17=r6;r18=r8;r19=_luaK_exp2RK(r17,r18)}STACKTOP=r5;return;break};case 14:{r20=r6;r21=r8;_luaK_goiffalse(r20,r21);STACKTOP=r5;return;break};default:{r22=r6;r23=r8;r24=_luaK_exp2RK(r22,r23);STACKTOP=r5;return}}}function _luaK_posfix(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122;r6=0;r7=STACKTOP;r8=r1;r9=r2;r10=r3;r11=r4;r12=r5;r13=r9;switch(r13|0){case 6:{r14=r8;r15=r11;_luaK_exp2val(r14,r15);r16=r11;r17=r16|0;r18=HEAP32[r17>>2];r19=(r18|0)==11;do{if(r19){r20=r11;r21=r20+8|0;r22=r21;r23=HEAP32[r22>>2];r24=r8;r25=r24|0;r26=HEAP32[r25>>2];r27=r26+12|0;r28=HEAP32[r27>>2];r29=r28+(r23<<2)|0;r30=HEAP32[r29>>2];r31=r30>>>0;r32=r31&63;r33=(r32|0)==22;if(!r33){r6=7;break}r34=r8;r35=r10;_freeexp(r34,r35);r36=r11;r37=r36+8|0;r38=r37;r39=HEAP32[r38>>2];r40=r8;r41=r40|0;r42=HEAP32[r41>>2];r43=r42+12|0;r44=HEAP32[r43>>2];r45=r44+(r39<<2)|0;r46=HEAP32[r45>>2];r47=r46&8388607;r48=r10;r49=r48+8|0;r50=r49;r51=HEAP32[r50>>2];r52=r51<<23;r53=r52&-8388608;r54=r47|r53;r55=r11;r56=r55+8|0;r57=r56;r58=HEAP32[r57>>2];r59=r8;r60=r59|0;r61=HEAP32[r60>>2];r62=r61+12|0;r63=HEAP32[r62>>2];r64=r63+(r58<<2)|0;HEAP32[r64>>2]=r54;r65=r10;r66=r65|0;HEAP32[r66>>2]=11;r67=r11;r68=r67+8|0;r69=r68;r70=HEAP32[r69>>2];r71=r10;r72=r71+8|0;r73=r72;HEAP32[r73>>2]=r70}else{r6=7}}while(0);if(r6==7){r74=r8;r75=r11;_luaK_exp2nextreg(r74,r75);r76=r8;r77=r10;r78=r11;r79=r12;_codearith(r76,22,r77,r78,r79)}STACKTOP=r7;return;break};case 13:{r80=r8;r81=r11;_luaK_dischargevars(r80,r81);r82=r8;r83=r11;r84=r83+20|0;r85=r10;r86=r85+20|0;r87=HEAP32[r86>>2];_luaK_concat(r82,r84,r87);r88=r10;r89=r11;r90=r88;r91=r89;HEAP32[r90>>2]=HEAP32[r91>>2];HEAP32[r90+4>>2]=HEAP32[r91+4>>2];HEAP32[r90+8>>2]=HEAP32[r91+8>>2];HEAP32[r90+12>>2]=HEAP32[r91+12>>2];HEAP32[r90+16>>2]=HEAP32[r91+16>>2];HEAP32[r90+20>>2]=HEAP32[r91+20>>2];STACKTOP=r7;return;break};case 0:case 1:case 2:case 3:case 4:case 5:{r92=r8;r93=r9;r94=r93|0;r95=r94+13|0;r96=r10;r97=r11;r98=r12;_codearith(r92,r95,r96,r97,r98);STACKTOP=r7;return;break};case 7:case 8:case 9:{r99=r8;r100=r9;r101=r100-7|0;r102=r101+24|0;r103=r10;r104=r11;_codecomp(r99,r102,1,r103,r104);STACKTOP=r7;return;break};case 10:case 11:case 12:{r105=r8;r106=r9;r107=r106-10|0;r108=r107+24|0;r109=r10;r110=r11;_codecomp(r105,r108,0,r109,r110);STACKTOP=r7;return;break};case 14:{r111=r8;r112=r11;_luaK_dischargevars(r111,r112);r113=r8;r114=r11;r115=r114+16|0;r116=r10;r117=r116+16|0;r118=HEAP32[r117>>2];_luaK_concat(r113,r115,r118);r119=r10;r120=r11;r121=r119;r122=r120;HEAP32[r121>>2]=HEAP32[r122>>2];HEAP32[r121+4>>2]=HEAP32[r122+4>>2];HEAP32[r121+8>>2]=HEAP32[r122+8>>2];HEAP32[r121+12>>2]=HEAP32[r122+12>>2];HEAP32[r121+16>>2]=HEAP32[r122+16>>2];HEAP32[r121+20>>2]=HEAP32[r122+20>>2];STACKTOP=r7;return;break};default:{STACKTOP=r7;return}}}function _codecomp(r1,r2,r3,r4,r5){var r6,r7,r8;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=r4;r4=r5;r5=_luaK_exp2RK(r7,r3);r8=_luaK_exp2RK(r7,r4);_freeexp(r7,r4);_freeexp(r7,r3);do{if((r2|0)==0){if((r1|0)==24){break}r4=r5;r5=r8;r8=r4;r2=1}}while(0);r4=_condjump(r7,r1,r2,r5,r8);HEAP32[r3+8>>2]=r4;HEAP32[r3>>2]=10;STACKTOP=r6;return}function _luaK_fixline(r1,r2){var r3;r3=r1;HEAP32[HEAP32[HEAP32[r3>>2]+20>>2]+(HEAP32[r3+20>>2]-1<<2)>>2]=r2;STACKTOP=STACKTOP;return}function _luaK_setlist(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12;r5=STACKTOP;r6=r1;r1=r2;r2=r4;r4=((r3-1|0)/50&-1)+1|0;if((r2|0)==-1){r7=0}else{r7=r2}r2=r7;if((r4|0)<=511){_luaK_codeABC(r6,36,r1,r2,r4);r8=r1;r9=r8+1|0;r10=r9&255;r11=r6;r12=r11+48|0;HEAP8[r12]=r10;STACKTOP=r5;return}if((r4|0)>67108863){_luaX_syntaxerror(HEAP32[r6+12>>2],11016)}_luaK_codeABC(r6,36,r1,r2,0);_codeextraarg(r6,r4);r8=r1;r9=r8+1|0;r10=r9&255;r11=r6;r12=r11+48|0;HEAP8[r12]=r10;STACKTOP=r5;return}function _condjump(r1,r2,r3,r4,r5){var r6,r7;r6=STACKTOP;r7=r1;_luaK_codeABC(r7,r2,r3,r4,r5);r5=_luaK_jump(r7);STACKTOP=r6;return r5}function _discharge2anyreg(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;if((HEAP32[r1>>2]|0)==6){STACKTOP=r3;return}_luaK_reserveregs(r4,1);_discharge2reg(r4,r1,HEAPU8[r4+48|0]-1|0);STACKTOP=r3;return}function _removevalues(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;while(1){if((r1|0)==-1){break}_patchtestreg(r4,r1,255);r1=_getjump(r4,r1)}STACKTOP=r3;return}function _patchtestreg(r1,r2,r3){var r4,r5,r6,r7,r8;r4=0;r5=STACKTOP;r6=r3;r3=_getjumpcontrol(r1,r2);if((HEAP32[r3>>2]>>>0&63|0)!=28){r7=0;r8=r7;STACKTOP=r5;return r8}do{if((r6|0)!=255){if((r6|0)==(HEAP32[r3>>2]>>>23&511|0)){r4=6;break}HEAP32[r3>>2]=HEAP32[r3>>2]&-16321|r6<<6&16320}else{r4=6}}while(0);if(r4==6){HEAP32[r3>>2]=27|(HEAP32[r3>>2]>>>23&511)<<6|(HEAP32[r3>>2]>>>14&511)<<14}r7=1;r8=r7;STACKTOP=r5;return r8}function _getjumpcontrol(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r2;r2=HEAP32[HEAP32[r1>>2]+12>>2]+(r4<<2)|0;do{if((r4|0)>=1){if((HEAP8[1168+(HEAP32[r2-4>>2]>>>0&63)|0]&128|0)==0){break}r5=r2-4|0;r6=r5;STACKTOP=r3;return r6}}while(0);r5=r2;r6=r5;STACKTOP=r3;return r6}function _discharge2reg(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77;r4=0;r5=STACKTOP;r6=r1;r7=r2;r8=r3;r9=r6;r10=r7;_luaK_dischargevars(r9,r10);r11=r7;r12=r11|0;r13=HEAP32[r12>>2];switch(r13|0){case 1:{r14=r6;r15=r8;_luaK_nil(r14,r15,1);break};case 3:case 2:{r16=r6;r17=r8;r18=r7;r19=r18|0;r20=HEAP32[r19>>2];r21=(r20|0)==2;r22=r21&1;r23=_luaK_codeABC(r16,3,r17,r22,0);break};case 5:{r24=r6;r25=r8;r26=r6;r27=r7;r28=r27+8|0;r29=r28;r30=HEAPF64[r29>>3];r31=_luaK_numberK(r26,r30);r32=_luaK_codek(r24,r25,r31);break};case 6:{r33=r8;r34=r7;r35=r34+8|0;r36=r35;r37=HEAP32[r36>>2];r38=(r33|0)!=(r37|0);if(r38){r39=r6;r40=r8;r41=r7;r42=r41+8|0;r43=r42;r44=HEAP32[r43>>2];r45=_luaK_codeABC(r39,0,r40,r44,0)}break};case 11:{r46=r7;r47=r46+8|0;r48=r47;r49=HEAP32[r48>>2];r50=r6;r51=r50|0;r52=HEAP32[r51>>2];r53=r52+12|0;r54=HEAP32[r53>>2];r55=r54+(r49<<2)|0;r56=r55;r57=r56;r58=HEAP32[r57>>2];r59=r58&-16321;r60=r8;r61=r60<<6;r62=r61&16320;r63=r59|r62;r64=r56;HEAP32[r64>>2]=r63;break};case 4:{r65=r6;r66=r8;r67=r7;r68=r67+8|0;r69=r68;r70=HEAP32[r69>>2];r71=_luaK_codek(r65,r66,r70);break};default:{STACKTOP=r5;return}}r72=r8;r73=r7;r74=r73+8|0;r75=r74;HEAP32[r75>>2]=r72;r76=r7;r77=r76|0;HEAP32[r77>>2]=6;STACKTOP=r5;return}function _constfolding(r1,r2,r3){var r4,r5,r6,r7,r8;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;do{if((_isnumeral(r1)|0)!=0){if((_isnumeral(r2)|0)==0){break}if((r6|0)==16){r4=6}else{if((r6|0)==17){r4=6}}do{if(r4==6){if(HEAPF64[r2+8>>3]!=0){break}r7=0;r8=r7;STACKTOP=r5;return r8}}while(0);r3=_luaO_arith(r6-13|0,HEAPF64[r1+8>>3],HEAPF64[r2+8>>3]);HEAPF64[r1+8>>3]=r3;r7=1;r8=r7;STACKTOP=r5;return r8}}while(0);r7=0;r8=r7;STACKTOP=r5;return r8}function _need_value(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1;r1=r2;while(1){if((r1|0)==-1){r3=7;break}r2=_getjumpcontrol(r5,r1);if((HEAP32[r2>>2]>>>0&63|0)!=28){r3=4;break}r1=_getjump(r5,r1)}if(r3==4){r6=1;r7=r6;STACKTOP=r4;return r7}else if(r3==7){r6=0;r7=r6;STACKTOP=r4;return r7}}function _code_label(r1,r2,r3,r4){var r5,r6;r5=STACKTOP;r6=r1;_luaK_getlabel(r6);r1=_luaK_codeABC(r6,3,r2,r3,r4);STACKTOP=r5;return r1}function _dischargejpc(r1){var r2,r3;r2=STACKTOP;r3=r1;_patchlistaux(r3,HEAP32[r3+28>>2],HEAP32[r3+20>>2],255,HEAP32[r3+20>>2]);HEAP32[r3+28>>2]=-1;STACKTOP=r2;return}function _lua_sethook(r1,r2,r3,r4){var r5,r6,r7;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=r4;if((r1|0)==0){r5=3}else{if((r2|0)==0){r5=3}}if(r5==3){r2=0;r1=0}if((HEAP8[HEAP32[r7+16>>2]+18|0]&1|0)!=0){HEAP32[r7+20>>2]=HEAP32[HEAP32[r7+16>>2]+28>>2]}HEAP32[r7+52>>2]=r1;HEAP32[r7+44>>2]=r3;HEAP32[r7+48>>2]=HEAP32[r7+44>>2];HEAP8[r7+40|0]=r2;STACKTOP=r6;return 1}function _lua_gethook(r1){STACKTOP=STACKTOP;return HEAP32[r1+52>>2]}function _lua_gethookmask(r1){STACKTOP=STACKTOP;return HEAPU8[r1+40|0]}function _lua_gethookcount(r1){STACKTOP=STACKTOP;return HEAP32[r1+44>>2]}function _lua_getstack(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;if((r1|0)<0){r7=0;r8=r7;STACKTOP=r5;return r8}r3=HEAP32[r6+16>>2];while(1){if((r1|0)>0){r9=(r3|0)!=(r6+72|0)}else{r9=0}if(!r9){break}r1=r1-1|0;r3=HEAP32[r3+8>>2]}do{if((r1|0)==0){if((r3|0)==(r6+72|0)){r4=12;break}r10=1;HEAP32[r2+96>>2]=r3}else{r4=12}}while(0);if(r4==12){r10=0}r7=r10;r8=r7;STACKTOP=r5;return r8}function _lua_getlocal(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r1;r1=r2;r2=r3;if((r1|0)!=0){HEAP32[r5>>2]=0;r7=_findlocal(r6,HEAP32[r1+96>>2],r2,r5);if((r7|0)!=0){r1=HEAP32[r5>>2];r5=HEAP32[r6+8>>2];r3=r5|0;r8=r1|0;HEAP32[r3>>2]=HEAP32[r8>>2];HEAP32[r3+4>>2]=HEAP32[r8+4>>2];HEAP32[r5+8>>2]=HEAP32[r1+8>>2];r1=r6+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16}r9=r7;STACKTOP=r4;return r9}if((HEAP32[HEAP32[r6+8>>2]-16+8>>2]|0)==70){r7=_luaF_getlocalname(HEAP32[HEAP32[HEAP32[r6+8>>2]-16>>2]+12>>2],r2,0)}else{r7=0}r9=r7;STACKTOP=r4;return r9}function _findlocal(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=r4;r4=0;do{if((HEAP8[r1+18|0]&1|0)!=0){if((r2|0)<0){r7=_findvararg(r1,-r2|0,r3);r8=r7;STACKTOP=r5;return r8}else{r9=HEAP32[r1+24>>2];r10=HEAP32[HEAP32[HEAP32[r1>>2]>>2]+12>>2];r4=_luaF_getlocalname(r10,r2,_currentpc(r1));break}}else{r9=HEAP32[r1>>2]+16|0}}while(0);L10:do{if((r4|0)==0){if((r1|0)==(HEAP32[r6+16>>2]|0)){r11=HEAP32[r6+8>>2]}else{r11=HEAP32[HEAP32[r1+12>>2]>>2]}do{if(((r11-r9|0)/16&-1|0)>=(r2|0)){if((r2|0)<=0){break}r4=8752;break L10}}while(0);r7=0;r8=r7;STACKTOP=r5;return r8}}while(0);HEAP32[r3>>2]=r9+(r2-1<<4);r7=r4;r8=r7;STACKTOP=r5;return r8}function _lua_setlocal(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r1;HEAP32[r5>>2]=0;r1=_findlocal(r6,HEAP32[r2+96>>2],r3,r5);if((r1|0)==0){r7=r6;r8=r7+8|0;r9=HEAP32[r8>>2];r10=r9-16|0;HEAP32[r8>>2]=r10;r11=r1;STACKTOP=r4;return r11}r3=HEAP32[r6+8>>2]-16|0;r2=HEAP32[r5>>2];r5=r2|0;r12=r3|0;HEAP32[r5>>2]=HEAP32[r12>>2];HEAP32[r5+4>>2]=HEAP32[r12+4>>2];HEAP32[r2+8>>2]=HEAP32[r3+8>>2];r7=r6;r8=r7+8|0;r9=HEAP32[r8>>2];r10=r9-16|0;HEAP32[r8>>2]=r10;r11=r1;STACKTOP=r4;return r11}function _lua_getinfo(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=STACKTOP;r5=r1;r1=r2;r2=r3;if((HEAP8[r1]|0)==62){r6=0;r7=HEAP32[r5+8>>2]-16|0;r1=r1+1|0;r3=r5+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]-16}else{r6=HEAP32[r2+96>>2];r7=HEAP32[r6>>2]}if((HEAP32[r7+8>>2]&31|0)==6){r8=HEAP32[r7>>2]}else{r8=0}r3=r8;r8=_auxgetinfo(r5,r1,r2,r3,r6);if((_strchr(r1,102)|0)!=0){r6=r7;r7=HEAP32[r5+8>>2];r2=r7|0;r9=r6|0;HEAP32[r2>>2]=HEAP32[r9>>2];HEAP32[r2+4>>2]=HEAP32[r9+4>>2];HEAP32[r7+8>>2]=HEAP32[r6+8>>2];r6=r5+8|0;HEAP32[r6>>2]=HEAP32[r6>>2]+16;if(((HEAP32[r5+24>>2]-HEAP32[r5+8>>2]|0)/16&-1|0)<=0){_luaD_growstack(r5,0)}}if((_strchr(r1,76)|0)==0){r10=r8;STACKTOP=r4;return r10}_collectvalidlines(r5,r3);r10=r8;STACKTOP=r4;return r10}function _auxgetinfo(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122;r6=0;r7=STACKTOP;r8=r1;r9=r2;r10=r3;r11=r4;r12=r5;r13=1;while(1){r14=r9;r15=HEAP8[r14];r16=r15<<24>>24!=0;if(!r16){break}r17=r9;r18=HEAP8[r17];r19=r18<<24>>24;switch(r19|0){case 83:{r20=r10;r21=r11;_funcinfo(r20,r21);break};case 108:{r22=r12;r23=(r22|0)!=0;do{if(r23){r24=r12;r25=r24+18|0;r26=HEAP8[r25];r27=r26&255;r28=r27&1;r29=(r28|0)!=0;if(!r29){r6=8;break}r30=r12;r31=_currentline(r30);r32=r31}else{r6=8}}while(0);if(r6==8){r6=0;r32=-1}r33=r10;r34=r33+20|0;HEAP32[r34>>2]=r32;break};case 110:{r35=r12;r36=(r35|0)!=0;do{if(r36){r37=r12;r38=r37+18|0;r39=HEAP8[r38];r40=r39&255;r41=r40&64;r42=(r41|0)!=0;if(r42){r6=26;break}r43=r12;r44=r43+8|0;r45=HEAP32[r44>>2];r46=r45+18|0;r47=HEAP8[r46];r48=r47&255;r49=r48&1;r50=(r49|0)!=0;if(!r50){r6=26;break}r51=r8;r52=r12;r53=r52+8|0;r54=HEAP32[r53>>2];r55=r10;r56=r55+4|0;r57=_getfuncname(r51,r54,r56);r58=r10;r59=r58+8|0;HEAP32[r59>>2]=r57}else{r6=26}}while(0);if(r6==26){r6=0;r60=r10;r61=r60+8|0;HEAP32[r61>>2]=0}r62=r10;r63=r62+8|0;r64=HEAP32[r63>>2];r65=(r64|0)==0;if(r65){r66=r10;r67=r66+8|0;HEAP32[r67>>2]=12104;r68=r10;r69=r68+4|0;HEAP32[r69>>2]=0}break};case 116:{r70=r12;r71=(r70|0)!=0;if(r71){r72=r12;r73=r72+18|0;r74=HEAP8[r73];r75=r74&255;r76=r75&64;r77=r76}else{r77=0}r78=r77&255;r79=r10;r80=r79+35|0;HEAP8[r80]=r78;break};case 117:{r81=r11;r82=(r81|0)==0;if(r82){r83=0}else{r84=r11;r85=r84;r86=r85+6|0;r87=HEAP8[r86];r88=r87&255;r83=r88}r89=r83&255;r90=r10;r91=r90+32|0;HEAP8[r91]=r89;r92=r11;r93=(r92|0)==0;do{if(r93){r6=15}else{r94=r11;r95=r94;r96=r95+4|0;r97=HEAP8[r96];r98=r97&255;r99=(r98|0)==38;if(r99){r6=15;break}r100=r11;r101=r100;r102=r101+12|0;r103=HEAP32[r102>>2];r104=r103+77|0;r105=HEAP8[r104];r106=r10;r107=r106+34|0;HEAP8[r107]=r105;r108=r11;r109=r108;r110=r109+12|0;r111=HEAP32[r110>>2];r112=r111+76|0;r113=HEAP8[r112];r114=r10;r115=r114+33|0;HEAP8[r115]=r113}}while(0);if(r6==15){r6=0;r116=r10;r117=r116+34|0;HEAP8[r117]=1;r118=r10;r119=r118+33|0;HEAP8[r119]=0}break};case 76:case 102:{break};default:{r13=0}}r120=r9;r121=r120+1|0;r9=r121}r122=r13;STACKTOP=r7;return r122}function _collectvalidlines(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=r1;r1=r2;do{if((r1|0)!=0){if((HEAPU8[r1+4|0]|0)==38){break}r2=HEAP32[HEAP32[r1+12>>2]+20>>2];r6=_luaH_new(r5);r7=HEAP32[r5+8>>2];HEAP32[r7>>2]=r6;HEAP32[r7+8>>2]=69;r7=r5+8|0;HEAP32[r7>>2]=HEAP32[r7>>2]+16;if(((HEAP32[r5+24>>2]-HEAP32[r5+8>>2]|0)/16&-1|0)<=0){_luaD_growstack(r5,0)}r7=r4;HEAP32[r7>>2]=1;HEAP32[r7+8>>2]=1;r7=0;while(1){if((r7|0)>=(HEAP32[HEAP32[r1+12>>2]+52>>2]|0)){break}_luaH_setint(r5,r6,HEAP32[r2+(r7<<2)>>2],r4);r7=r7+1|0}STACKTOP=r3;return}}while(0);HEAP32[HEAP32[r5+8>>2]+8>>2]=0;r4=r5+8|0;HEAP32[r4>>2]=HEAP32[r4>>2]+16;if(((HEAP32[r5+24>>2]-HEAP32[r5+8>>2]|0)/16&-1|0)<=0){_luaD_growstack(r5,0)}STACKTOP=r3;return}function _luaG_typeerror(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;r7=r1;r1=r2;r2=r3;r3=HEAP32[r7+16>>2];HEAP32[r6>>2]=0;r8=HEAP32[1048+((HEAP32[r1+8>>2]&15)+1<<2)>>2];r9=0;if((HEAP8[r3+18|0]&1|0)!=0){r9=_getupvalname(r3,r1,r6);do{if((r9|0)==0){if((_isinstack(r3,r1)|0)==0){break}r10=HEAP32[HEAP32[HEAP32[r3>>2]>>2]+12>>2];r11=_currentpc(r3);r9=_getobjname(r10,r11,(r1-HEAP32[r3+24>>2]|0)/16&-1,r6)}}while(0)}if((r9|0)!=0){r3=HEAP32[r6>>2];_luaG_runerror(r7,4496,(r4=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r9,HEAP32[r4+16>>2]=r3,HEAP32[r4+24>>2]=r8,r4));STACKTOP=r4}else{_luaG_runerror(r7,10384,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r8,r4));STACKTOP=r4;STACKTOP=r5;return}}function _getupvalname(r1,r2,r3){var r4,r5,r6,r7,r8;r4=0;r5=STACKTOP;r6=r2;r2=r3;r3=HEAP32[HEAP32[r1>>2]>>2];r1=0;while(1){if((r1|0)>=(HEAPU8[r3+6|0]|0)){r4=7;break}if((HEAP32[HEAP32[r3+16+(r1<<2)>>2]+8>>2]|0)==(r6|0)){r4=4;break}r1=r1+1|0}if(r4==4){r6=_upvalname(HEAP32[r3+12>>2],r1);HEAP32[r2>>2]=r6;r7=11696;r8=r7;STACKTOP=r5;return r8}else if(r4==7){r7=0;r8=r7;STACKTOP=r5;return r8}}function _isinstack(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=HEAP32[r5+24>>2];while(1){if(r2>>>0>=HEAP32[r5+4>>2]>>>0){r3=7;break}if((r1|0)==(r2|0)){r3=4;break}r2=r2+16|0}if(r3==4){r6=1;r7=r6;STACKTOP=r4;return r7}else if(r3==7){r6=0;r7=r6;STACKTOP=r4;return r7}}function _getobjname(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136;r5=0;r6=STACKTOP;r7=r1;r8=r2;r9=r3;r10=r4;r11=r7;r12=r9;r13=r12+1|0;r14=r8;r15=_luaF_getlocalname(r11,r13,r14);r16=r10;HEAP32[r16>>2]=r15;r17=r10;r18=HEAP32[r17>>2];r19=(r18|0)!=0;if(r19){r20=3472;r21=r20;STACKTOP=r6;return r21}r22=r7;r23=r8;r24=r9;r25=_findsetreg(r22,r23,r24);r26=r25;r27=r26;r28=(r27|0)!=-1;if(r28){r29=r26;r30=r7;r31=r30+12|0;r32=HEAP32[r31>>2];r33=r32+(r29<<2)|0;r34=HEAP32[r33>>2];r35=r34;r36=r35;r37=r36>>>0;r38=r37&63;r39=r38;r40=r39;L7:do{switch(r40|0){case 0:{r41=r35;r42=r41>>>23;r43=r42&511;r44=r43;r45=r44;r46=r35;r47=r46>>>6;r48=r47&255;r49=(r45|0)<(r48|0);if(!r49){break L7}r50=r7;r51=r26;r52=r44;r53=r10;r54=_getobjname(r50,r51,r52,r53);r20=r54;r21=r20;STACKTOP=r6;return r21;break};case 6:case 7:{r55=r35;r56=r55>>>14;r57=r56&511;r58=r57;r59=r35;r60=r59>>>23;r61=r60&511;r62=r61;r63=r39;r64=(r63|0)==7;if(r64){r65=r7;r66=r62;r67=r66+1|0;r68=r26;r69=_luaF_getlocalname(r65,r67,r68);r70=r69}else{r71=r7;r72=r62;r73=_upvalname(r71,r72);r70=r73}r74=r70;r75=r7;r76=r26;r77=r58;r78=r10;_kname(r75,r76,r77,r78);r79=r74;r80=(r79|0)!=0;if(r80){r81=r74;r82=_strcmp(r81,3104);r83=(r82|0)==0;r84=r83}else{r84=0}r85=r84?2776:12024;r20=r85;r21=r20;STACKTOP=r6;return r21;break};case 5:{r86=r7;r87=r35;r88=r87>>>23;r89=r88&511;r90=_upvalname(r86,r89);r91=r10;HEAP32[r91>>2]=r90;r20=11696;r21=r20;STACKTOP=r6;return r21;break};case 1:case 2:{r92=r39;r93=(r92|0)==1;if(r93){r94=r35;r95=r94>>>14;r96=r95&262143;r97=r96}else{r98=r26;r99=r98+1|0;r100=r7;r101=r100+12|0;r102=HEAP32[r101>>2];r103=r102+(r99<<2)|0;r104=HEAP32[r103>>2];r105=r104>>>6;r106=r105&67108863;r97=r106}r107=r97;r108=r107;r109=r7;r110=r109+8|0;r111=HEAP32[r110>>2];r112=r111+(r108<<4)|0;r113=r112+8|0;r114=HEAP32[r113>>2];r115=r114&15;r116=(r115|0)==4;if(!r116){break L7}r117=r107;r118=r7;r119=r118+8|0;r120=HEAP32[r119>>2];r121=r120+(r117<<4)|0;r122=r121|0;r123=r122;r124=HEAP32[r123>>2];r125=r124;r126=r125+16|0;r127=r126;r128=r10;HEAP32[r128>>2]=r127;r20=11280;r21=r20;STACKTOP=r6;return r21;break};case 12:{r129=r35;r130=r129>>>14;r131=r130&511;r132=r131;r133=r7;r134=r26;r135=r132;r136=r10;_kname(r133,r134,r135,r136);r20=11e3;r21=r20;STACKTOP=r6;return r21;break};default:{}}}while(0)}r20=0;r21=r20;STACKTOP=r6;return r21}function _currentpc(r1){var r2;r2=r1;STACKTOP=STACKTOP;return((HEAP32[r2+28>>2]-HEAP32[HEAP32[HEAP32[HEAP32[r2>>2]>>2]+12>>2]+12>>2]|0)/4&-1)-1|0}function _luaG_runerror(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r1;r1=r5|0;HEAP32[r1>>2]=r3;HEAP32[r1+4>>2]=0;_addinfo(r6,_luaO_pushvfstring(r6,r2,r5|0));_luaG_errormsg(r6);STACKTOP=r4;return}function _luaG_concaterror(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;do{if((HEAP32[r1+8>>2]&15|0)!=4){if((HEAP32[r1+8>>2]|0)==3){break}r6=r5;r7=r1;_luaG_typeerror(r6,r7,7864);STACKTOP=r4;return}}while(0);r1=r2;r6=r5;r7=r1;_luaG_typeerror(r6,r7,7864);STACKTOP=r4;return}function _luaG_aritherror(r1,r2,r3){var r4,r5;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r2;r2=r3;if((_luaV_tonumber(r5,r4)|0)==0){r2=r5}_luaG_typeerror(r1,r2,6024);STACKTOP=r4;return}function _luaG_ordererror(r1,r2,r3){var r4,r5,r6;r4=0;r5=STACKTOP;r6=r1;r1=HEAP32[1048+((HEAP32[r2+8>>2]&15)+1<<2)>>2];r2=HEAP32[1048+((HEAP32[r3+8>>2]&15)+1<<2)>>2];if((r1|0)==(r2|0)){_luaG_runerror(r6,4624,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r1,r4));STACKTOP=r4}else{_luaG_runerror(r6,4392,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r1,HEAP32[r4+8>>2]=r2,r4));STACKTOP=r4;STACKTOP=r5;return}}function _luaG_errormsg(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;r3=r1;if((HEAP32[r3+68>>2]|0)==0){r4=r3;_luaD_throw(r4,2);STACKTOP=r2;return}r1=HEAP32[r3+28>>2]+HEAP32[r3+68>>2]|0;if((HEAP32[r1+8>>2]&15|0)!=6){_luaD_throw(r3,6)}r5=HEAP32[r3+8>>2]-16|0;r6=HEAP32[r3+8>>2];r7=r6|0;r8=r5|0;HEAP32[r7>>2]=HEAP32[r8>>2];HEAP32[r7+4>>2]=HEAP32[r8+4>>2];HEAP32[r6+8>>2]=HEAP32[r5+8>>2];r5=r1;r1=HEAP32[r3+8>>2]-16|0;r6=r1|0;r8=r5|0;HEAP32[r6>>2]=HEAP32[r8>>2];HEAP32[r6+4>>2]=HEAP32[r8+4>>2];HEAP32[r1+8>>2]=HEAP32[r5+8>>2];r5=r3+8|0;HEAP32[r5>>2]=HEAP32[r5>>2]+16;if(((HEAP32[r3+24>>2]-HEAP32[r3+8>>2]|0)/16&-1|0)<=0){_luaD_growstack(r3,0)}_luaD_call(r3,HEAP32[r3+8>>2]-32|0,1,0);r4=r3;_luaD_throw(r4,2);STACKTOP=r2;return}function _addinfo(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=r1;r1=HEAP32[r6+16>>2];if((HEAP8[r1+18|0]&1|0)==0){STACKTOP=r4;return}r7=_currentline(r1);r8=HEAP32[HEAP32[HEAP32[HEAP32[r1>>2]>>2]+12>>2]+36>>2];if((r8|0)!=0){_luaO_chunkid(r5|0,r8+16|0,60)}else{HEAP8[r5|0]=63;HEAP8[r5+1|0]=0}_luaO_pushfstring(r6,3920,(r3=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r3>>2]=r5,HEAP32[r3+8>>2]=r7,HEAP32[r3+16>>2]=r2,r3));STACKTOP=r3;STACKTOP=r4;return}function _currentline(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;if((HEAP32[HEAP32[HEAP32[HEAP32[r3>>2]>>2]+12>>2]+20>>2]|0)!=0){r1=_currentpc(r3);r4=HEAP32[HEAP32[HEAP32[HEAP32[HEAP32[r3>>2]>>2]+12>>2]+20>>2]+(r1<<2)>>2];STACKTOP=r2;return r4}else{r4=0;STACKTOP=r2;return r4}}function _findsetreg(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87;r4=0;r5=STACKTOP;r6=r1;r7=r2;r8=r3;r9=-1;r10=0;while(1){r11=r10;r12=r7;r13=(r11|0)<(r12|0);if(!r13){break}r14=r10;r15=r6;r16=r15+12|0;r17=HEAP32[r16>>2];r18=r17+(r14<<2)|0;r19=HEAP32[r18>>2];r20=r19;r21=r20;r22=r21>>>0;r23=r22&63;r24=r23;r25=r20;r26=r25>>>6;r27=r26&255;r28=r27;r29=r24;switch(r29|0){case 29:case 30:{r30=r8;r31=r28;r32=(r30|0)>=(r31|0);if(r32){r33=r10;r9=r33}break};case 34:{r34=r8;r35=r28;r36=r35+2|0;r37=(r34|0)>=(r36|0);if(r37){r38=r10;r9=r38}break};case 4:{r39=r20;r40=r39>>>23;r41=r40&511;r42=r41;r43=r28;r44=r8;r45=(r43|0)<=(r44|0);do{if(r45){r46=r8;r47=r28;r48=r42;r49=r47+r48|0;r50=(r46|0)<=(r49|0);if(!r50){break}r51=r10;r9=r51}}while(0);break};case 23:{r52=r20;r53=r52>>>14;r54=r53&262143;r55=r54-131071|0;r56=r55;r57=r10;r58=r57+1|0;r59=r56;r60=r58+r59|0;r61=r60;r62=r10;r63=r61;r64=(r62|0)<(r63|0);do{if(r64){r65=r61;r66=r7;r67=(r65|0)<=(r66|0);if(!r67){break}r68=r56;r69=r10;r70=r69+r68|0;r10=r70}}while(0);break};case 27:{r71=r8;r72=r28;r73=(r71|0)==(r72|0);if(r73){r74=r10;r9=r74}break};default:{r75=r24;r76=r75+1168|0;r77=HEAP8[r76];r78=r77&255;r79=r78&64;r80=(r79|0)!=0;do{if(r80){r81=r8;r82=r28;r83=(r81|0)==(r82|0);if(!r83){break}r84=r10;r9=r84}}while(0)}}r85=r10;r86=r85+1|0;r10=r86}r87=r9;STACKTOP=r5;return r87}function _upvalname(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=HEAP32[HEAP32[r1+28>>2]+(r2<<3)>>2];if((r4|0)==0){r5=10792;r6=r5;STACKTOP=r3;return r6}else{r5=r4+16|0;r6=r5;STACKTOP=r3;return r6}}function _kname(r1,r2,r3,r4){var r5,r6;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=r4;do{if((r2&256|0)!=0){r4=HEAP32[r6+8>>2]+((r2&-257)<<4)|0;if((HEAP32[r4+8>>2]&15|0)!=4){break}HEAP32[r3>>2]=HEAP32[r4>>2]+16;STACKTOP=r5;return}else{r4=_getobjname(r6,r1,r2,r3);do{if((r4|0)!=0){if((HEAP8[r4]|0)!=99){break}STACKTOP=r5;return}}while(0)}}while(0);HEAP32[r3>>2]=10792;STACKTOP=r5;return}function _funcinfo(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=STACKTOP;r4=r1;r1=r2;do{if((r1|0)!=0){if((HEAPU8[r1+4|0]|0)==38){break}r2=HEAP32[r1+12>>2];if((HEAP32[r2+36>>2]|0)!=0){r5=HEAP32[r2+36>>2]+16|0}else{r5=9440}HEAP32[r4+16>>2]=r5;HEAP32[r4+24>>2]=HEAP32[r2+64>>2];HEAP32[r4+28>>2]=HEAP32[r2+68>>2];HEAP32[r4+12>>2]=(HEAP32[r4+24>>2]|0)==0?9240:9e3;r6=r4;r7=r6+36|0;r8=r7|0;r9=r4;r10=r9+16|0;r11=HEAP32[r10>>2];_luaO_chunkid(r8,r11,60);STACKTOP=r3;return}}while(0);HEAP32[r4+16>>2]=9936;HEAP32[r4+24>>2]=-1;HEAP32[r4+28>>2]=-1;HEAP32[r4+12>>2]=9688;r6=r4;r7=r6+36|0;r8=r7|0;r9=r4;r10=r9+16|0;r11=HEAP32[r10>>2];_luaO_chunkid(r8,r11,60);STACKTOP=r3;return}function _getfuncname(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53;r4=0;r5=STACKTOP;r6=r1;r7=r2;r8=r3;r9=r7;r10=r9|0;r11=HEAP32[r10>>2];r12=r11|0;r13=r12;r14=HEAP32[r13>>2];r15=r14;r16=r15;r17=r16+12|0;r18=HEAP32[r17>>2];r19=r18;r20=r7;r21=_currentpc(r20);r22=r21;r23=r22;r24=r19;r25=r24+12|0;r26=HEAP32[r25>>2];r27=r26+(r23<<2)|0;r28=HEAP32[r27>>2];r29=r28;r30=r29;r31=r30>>>0;r32=r31&63;switch(r32|0){case 24:{r33=5;break};case 12:case 6:case 7:{r33=0;break};case 13:{r33=6;break};case 8:case 10:{r33=1;break};case 17:{r33=10;break};case 18:{r33=11;break};case 19:{r33=12;break};case 21:{r33=4;break};case 25:{r33=13;break};case 26:{r33=14;break};case 22:{r33=15;break};case 16:{r33=9;break};case 14:{r33=7;break};case 15:{r33=8;break};case 29:case 30:{r34=r19;r35=r22;r36=r29;r37=r36>>>6;r38=r37&255;r39=r8;r40=_getobjname(r34,r35,r38,r39);r41=r40;r42=r41;STACKTOP=r5;return r42;break};case 34:{r43=r8;HEAP32[r43>>2]=10336;r41=10336;r42=r41;STACKTOP=r5;return r42;break};default:{r41=0;r42=r41;STACKTOP=r5;return r42}}r44=r33;r45=r6;r46=r45+12|0;r47=HEAP32[r46>>2];r48=r47+184|0;r49=r48+(r44<<2)|0;r50=HEAP32[r49>>2];r51=r50+16|0;r52=r51;r53=r8;HEAP32[r53>>2]=r52;r41=10128;r42=r41;STACKTOP=r5;return r42}function _findvararg(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=HEAPU8[HEAP32[HEAP32[HEAP32[r5>>2]>>2]+12>>2]+76|0];if((r1|0)>=(((HEAP32[r5+24>>2]-HEAP32[r5>>2]|0)/16&-1)-r2|0)){r6=0;r7=r6;STACKTOP=r4;return r7}else{HEAP32[r3>>2]=HEAP32[r5>>2]+(r2<<4)+(r1<<4);r6=8488;r7=r6;STACKTOP=r4;return r7}}function _luaD_throw(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;r4=r1;r1=r2;if((HEAP32[r4+64>>2]|0)!=0){HEAP32[HEAP32[r4+64>>2]+160>>2]=r1;_longjmp(HEAP32[r4+64>>2]+4|0,1)}HEAP8[r4+6|0]=r1;if((HEAP32[HEAP32[HEAP32[r4+12>>2]+172>>2]+64>>2]|0)!=0){r2=HEAP32[r4+8>>2]-16|0;r5=HEAP32[HEAP32[r4+12>>2]+172>>2]+8|0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6+16;r5=r6;r6=r5|0;r7=r2|0;HEAP32[r6>>2]=HEAP32[r7>>2];HEAP32[r6+4>>2]=HEAP32[r7+4>>2];HEAP32[r5+8>>2]=HEAP32[r2+8>>2];_luaD_throw(HEAP32[HEAP32[r4+12>>2]+172>>2],r1)}if((HEAP32[HEAP32[r4+12>>2]+168>>2]|0)==0){_abort();STACKTOP=r3;return}FUNCTION_TABLE[HEAP32[HEAP32[r4+12>>2]+168>>2]](r4);_abort();STACKTOP=r3;return}function _luaD_rawrunprotected($L,$f,$ud){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+168|0;label=1;var mySetjmpIds={};var setjmpTable={"1":(function(value){label=4;$16=value}),dummy:0};while(1)try{switch(label){case 1:var $1;var $2;var $3;var $oldnCcalls;var $lj=sp;$1=$L;$2=$f;$3=$ud;var $4=$1;var $5=$4+38|0;var $6=HEAP16[$5>>1];$oldnCcalls=$6;var $7=$lj+160|0;HEAP32[$7>>2]=0;var $8=$1;var $9=$8+64|0;var $10=HEAP32[$9>>2];var $11=$lj|0;HEAP32[$11>>2]=$10;var $12=$1;var $13=$12+64|0;HEAP32[$13>>2]=$lj;var $14=$lj+4|0;var $15=$14|0;var $16=(tempInt=setjmpId++,mySetjmpIds[tempInt]=1,setjmpLabels[tempInt]=label,HEAP32[$15>>2]=tempInt,0);label=4;break;case 4:var $17=($16|0)==0;if($17){label=2;break}else{label=3;break};case 2:var $19=$2;var $20=$1;var $21=$3;FUNCTION_TABLE[$19]($20,$21);label=3;break;case 3:var $23=$lj|0;var $24=HEAP32[$23>>2];var $25=$1;var $26=$25+64|0;HEAP32[$26>>2]=$24;var $27=$oldnCcalls;var $28=$1;var $29=$28+38|0;HEAP16[$29>>1]=$27;var $30=$lj+160|0;var $31=HEAP32[$30>>2];STACKTOP=sp;return $31}}catch(e){if(!e.longjmp||!(e.id in mySetjmpIds))throw e;setjmpTable[setjmpLabels[e.id]](e.value)}}function _luaD_reallocstack(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+28>>2];r5=HEAP32[r4+32>>2];if((r1+1|0)>>>0>268435455){_luaM_toobig(r4)}else{r6=_luaM_realloc_(r4,HEAP32[r4+28>>2],HEAP32[r4+32>>2]<<4,r1<<4)}HEAP32[r4+28>>2]=r6;while(1){if((r5|0)>=(r1|0)){break}HEAP32[HEAP32[r4+28>>2]+(r5<<4)+8>>2]=0;r5=r5+1|0}HEAP32[r4+32>>2]=r1;HEAP32[r4+24>>2]=HEAP32[r4+28>>2]+(r1<<4)-80;_correctstack(r4,r2);STACKTOP=r3;return}function _correctstack(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;HEAP32[r4+8>>2]=HEAP32[r4+28>>2]+(((HEAP32[r4+8>>2]-r1|0)/16&-1)<<4);r2=HEAP32[r4+56>>2];while(1){if((r2|0)==0){break}HEAP32[r2+8>>2]=HEAP32[r4+28>>2]+(((HEAP32[r2+8>>2]-r1|0)/16&-1)<<4);r2=HEAP32[r2>>2]}r2=HEAP32[r4+16>>2];while(1){if((r2|0)==0){break}HEAP32[r2+4>>2]=HEAP32[r4+28>>2]+(((HEAP32[r2+4>>2]-r1|0)/16&-1)<<4);HEAP32[r2>>2]=HEAP32[r4+28>>2]+(((HEAP32[r2>>2]-r1|0)/16&-1)<<4);if((HEAP8[r2+18|0]&1|0)!=0){HEAP32[r2+24>>2]=HEAP32[r4+28>>2]+(((HEAP32[r2+24>>2]-r1|0)/16&-1)<<4)}r2=HEAP32[r2+8>>2]}STACKTOP=r3;return}function _luaD_growstack(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1;r1=HEAP32[r5+32>>2];if((r1|0)>1e6){_luaD_throw(r5,6)}r6=((HEAP32[r5+8>>2]-HEAP32[r5+28>>2]|0)/16&-1)+r2+5|0;r2=r1<<1;if((r2|0)>1e6){r2=1e6}if((r2|0)<(r6|0)){r2=r6}if((r2|0)>1e6){_luaD_reallocstack(r5,1000200);_luaG_runerror(r5,8304,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3}_luaD_reallocstack(r5,r2);STACKTOP=r4;return}function _luaD_shrinkstack(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=_stackinuse(r3);r4=r1+((r1|0)/8&-1)+10|0;if((r4|0)>1e6){r4=1e6}do{if((r1|0)<=1e6){if((r4|0)>=(HEAP32[r3+32>>2]|0)){break}_luaD_reallocstack(r3,r4);STACKTOP=r2;return}}while(0);STACKTOP=r2;return}function _stackinuse(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=HEAP32[r3+8>>2];r4=HEAP32[r3+16>>2];while(1){if((r4|0)==0){break}if(r1>>>0<HEAP32[r4+4>>2]>>>0){r1=HEAP32[r4+4>>2]}r4=HEAP32[r4+8>>2]}STACKTOP=r2;return((r1-HEAP32[r3+28>>2]|0)/16&-1)+1|0}function _luaD_hook(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=STACKTOP;STACKTOP=STACKTOP+104|0;r5=r4;r6=r1;r1=HEAP32[r6+52>>2];if((r1|0)==0){STACKTOP=r4;return}if((HEAPU8[r6+41|0]|0)==0){STACKTOP=r4;return}r7=HEAP32[r6+16>>2];r8=HEAP32[r6+8>>2]-HEAP32[r6+28>>2]|0;r9=HEAP32[r7+4>>2]-HEAP32[r6+28>>2]|0;HEAP32[r5>>2]=r2;HEAP32[r5+20>>2]=r3;HEAP32[r5+96>>2]=r7;if(((HEAP32[r6+24>>2]-HEAP32[r6+8>>2]|0)/16&-1|0)<=20){_luaD_growstack(r6,20)}HEAP32[r7+4>>2]=HEAP32[r6+8>>2]+320;HEAP8[r6+41|0]=0;r3=r7+18|0;HEAP8[r3]=HEAPU8[r3]|2;FUNCTION_TABLE[r1](r6,r5);HEAP8[r6+41|0]=1;HEAP32[r7+4>>2]=HEAP32[r6+28>>2]+r9;HEAP32[r6+8>>2]=HEAP32[r6+28>>2]+r8;r8=r7+18|0;HEAP8[r8]=HEAPU8[r8]&-3;STACKTOP=r4;return}function _luaD_precall(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=r1-HEAP32[r5+28>>2]|0;r6=HEAP32[r1+8>>2]&63;if((r6|0)==38){r7=HEAP32[HEAP32[r1>>2]+12>>2]}else if((r6|0)==22){r7=HEAP32[r1>>2]}else if((r6|0)==6){r6=HEAP32[HEAP32[r1>>2]+12>>2];if(((HEAP32[r5+24>>2]-HEAP32[r5+8>>2]|0)/16&-1|0)<=(HEAPU8[r6+78|0]|0)){_luaD_growstack(r5,HEAPU8[r6+78|0])}r1=HEAP32[r5+28>>2]+r3|0;r8=((HEAP32[r5+8>>2]-r1|0)/16&-1)-1|0;while(1){if((r8|0)>=(HEAPU8[r6+76|0]|0)){break}r9=r5+8|0;r10=HEAP32[r9>>2];HEAP32[r9>>2]=r10+16;HEAP32[r10+8>>2]=0;r8=r8+1|0}if((HEAP8[r6+77|0]|0)!=0){r11=_adjust_varargs(r5,r6,r8)}else{r11=r1+16|0}r10=r11;if((HEAP32[HEAP32[r5+16>>2]+12>>2]|0)!=0){r12=HEAP32[HEAP32[r5+16>>2]+12>>2]}else{r12=_luaE_extendCI(r5)}HEAP32[r5+16>>2]=r12;r13=r12;HEAP16[r13+16>>1]=r2;HEAP32[r13>>2]=r1;HEAP32[r13+24>>2]=r10;HEAP32[r13+4>>2]=r10+(HEAPU8[r6+78|0]<<4);HEAP32[r13+28>>2]=HEAP32[r6+12>>2];HEAP8[r13+18|0]=1;HEAP32[r5+8>>2]=HEAP32[r13+4>>2];if((HEAP8[r5+40|0]&1|0)!=0){_callhook(r5,r13)}r14=0;r15=r14;STACKTOP=r4;return r15}else{r1=_tryfuncTM(r5,r1);r14=_luaD_precall(r5,r1,r2);r15=r14;STACKTOP=r4;return r15}if(((HEAP32[r5+24>>2]-HEAP32[r5+8>>2]|0)/16&-1|0)<=20){_luaD_growstack(r5,20)}if((HEAP32[HEAP32[r5+16>>2]+12>>2]|0)!=0){r16=HEAP32[HEAP32[r5+16>>2]+12>>2]}else{r16=_luaE_extendCI(r5)}HEAP32[r5+16>>2]=r16;r13=r16;HEAP16[r13+16>>1]=r2;HEAP32[r13>>2]=HEAP32[r5+28>>2]+r3;HEAP32[r13+4>>2]=HEAP32[r5+8>>2]+320;HEAP8[r13+18|0]=0;if((HEAP8[r5+40|0]&1|0)!=0){_luaD_hook(r5,0,-1)}r8=FUNCTION_TABLE[r7](r5);_luaD_poscall(r5,HEAP32[r5+8>>2]+(-r8<<4)|0);r14=1;r15=r14;STACKTOP=r4;return r15}function _luaD_poscall(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+16>>2];if((HEAP8[r4+40|0]&6|0)!=0){if((HEAP8[r4+40|0]&2|0)!=0){r5=r1-HEAP32[r4+28>>2]|0;_luaD_hook(r4,1,-1);r1=HEAP32[r4+28>>2]+r5|0}HEAP32[r4+20>>2]=HEAP32[HEAP32[r2+8>>2]+28>>2]}r5=HEAP32[r2>>2];r6=HEAP16[r2+16>>1]|0;r7=HEAP32[r2+8>>2];r2=r7;HEAP32[r4+16>>2]=r7;r7=r6;while(1){if((r7|0)!=0){r8=r1>>>0<HEAP32[r4+8>>2]>>>0}else{r8=0}if(!r8){break}r2=r1;r1=r2+16|0;r9=r2;r2=r5;r5=r2+16|0;r10=r2;r2=r10|0;r11=r9|0;HEAP32[r2>>2]=HEAP32[r11>>2];HEAP32[r2+4>>2]=HEAP32[r11+4>>2];HEAP32[r10+8>>2]=HEAP32[r9+8>>2];r7=r7-1|0}while(1){r1=r7;r7=r1-1|0;if((r1|0)<=0){break}r1=r5;r5=r1+16|0;HEAP32[r1+8>>2]=0}HEAP32[r4+8>>2]=r5;STACKTOP=r3;return r6+1|0}function _adjust_varargs(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=STACKTOP;r5=r1;r1=HEAPU8[r2+76|0];r2=HEAP32[r5+8>>2]+(-r3<<4)|0;r3=HEAP32[r5+8>>2];r6=0;while(1){if((r6|0)>=(r1|0)){break}r7=r2+(r6<<4)|0;r8=r5+8|0;r9=HEAP32[r8>>2];HEAP32[r8>>2]=r9+16;r8=r9;r9=r8|0;r10=r7|0;HEAP32[r9>>2]=HEAP32[r10>>2];HEAP32[r9+4>>2]=HEAP32[r10+4>>2];HEAP32[r8+8>>2]=HEAP32[r7+8>>2];HEAP32[r2+(r6<<4)+8>>2]=0;r6=r6+1|0}STACKTOP=r4;return r3}function _callhook(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=r2;r2=0;r5=r1+28|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;do{if((HEAP8[HEAP32[r1+8>>2]+18|0]&1|0)!=0){if((HEAP32[HEAP32[HEAP32[r1+8>>2]+28>>2]-4>>2]>>>0&63|0)!=30){break}r5=r1+18|0;HEAP8[r5]=HEAPU8[r5]|64;r2=4}}while(0);_luaD_hook(r4,r2,-1);r2=r1+28|0;HEAP32[r2>>2]=HEAP32[r2>>2]-4;STACKTOP=r3;return}function _tryfuncTM(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=STACKTOP;r4=r1;r1=r2;r2=_luaT_gettmbyobj(r4,r1,16);r5=r1-HEAP32[r4+28>>2]|0;if((HEAP32[r2+8>>2]&15|0)!=6){_luaG_typeerror(r4,r1,11544)}r6=HEAP32[r4+8>>2];while(1){if(r6>>>0<=r1>>>0){break}r7=r6-16|0;r8=r6;r9=r8|0;r10=r7|0;HEAP32[r9>>2]=HEAP32[r10>>2];HEAP32[r9+4>>2]=HEAP32[r10+4>>2];HEAP32[r8+8>>2]=HEAP32[r7+8>>2];r6=r6-16|0}r6=r4+8|0;HEAP32[r6>>2]=HEAP32[r6>>2]+16;if(((HEAP32[r4+24>>2]-HEAP32[r4+8>>2]|0)/16&-1|0)<=0){_luaD_growstack(r4,0)}r1=HEAP32[r4+28>>2]+r5|0;r5=r2;r2=r1;r4=r2|0;r6=r5|0;HEAP32[r4>>2]=HEAP32[r6>>2];HEAP32[r4+4>>2]=HEAP32[r6+4>>2];HEAP32[r2+8>>2]=HEAP32[r5+8>>2];STACKTOP=r3;return r1}function _luaD_call(r1,r2,r3,r4){var r5,r6,r7,r8;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=r4;r4=r7+38|0;r8=HEAP16[r4>>1]+1&65535;HEAP16[r4>>1]=r8;if((r8&65535|0)>=200){if((HEAPU16[r7+38>>1]|0)==200){_luaG_runerror(r7,11112,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}if((HEAPU16[r7+38>>1]|0)>=225){_luaD_throw(r7,6)}}if((r3|0)==0){r5=r7+36|0;HEAP16[r5>>1]=HEAP16[r5>>1]+1}if((_luaD_precall(r7,r1,r2)|0)==0){_luaV_execute(r7)}if((r3|0)==0){r3=r7+36|0;HEAP16[r3>>1]=HEAP16[r3>>1]-1}r3=r7+38|0;HEAP16[r3>>1]=HEAP16[r3>>1]-1;if((HEAP32[HEAP32[r7+12>>2]+12>>2]|0)<=0){STACKTOP=r6;return}_luaC_step(r7);STACKTOP=r6;return}function _lua_resume(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;r5=STACKTOP;r6=r1;r1=r2;if((r1|0)!=0){r7=HEAPU16[r1+38>>1]+1|0}else{r7=1}HEAP16[r6+38>>1]=r7;HEAP16[r6+36>>1]=0;r7=_luaD_rawrunprotected(r6,152,HEAP32[r6+8>>2]+(-r3<<4)|0);if((r7|0)==-1){r7=2;r8=r6;r9=r8+36|0;HEAP16[r9>>1]=1;r10=r6;r11=r10+38|0;r12=HEAP16[r11>>1];r13=r12-1&65535;HEAP16[r11>>1]=r13;r14=r7;STACKTOP=r5;return r14}while(1){if((r7|0)!=0){r15=(r7|0)!=1}else{r15=0}if(!r15){break}if((_recover(r6,r7)|0)==0){r4=12;break}r7=_luaD_rawrunprotected(r6,236,0)}if(r4==12){HEAP8[r6+6|0]=r7;_seterrorobj(r6,r7,HEAP32[r6+8>>2]);HEAP32[HEAP32[r6+16>>2]+4>>2]=HEAP32[r6+8>>2]}r8=r6;r9=r8+36|0;HEAP16[r9>>1]=1;r10=r6;r11=r10+38|0;r12=HEAP16[r11>>1];r13=r12-1&65535;HEAP16[r11>>1]=r13;r14=r7;STACKTOP=r5;return r14}function _resume(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+16>>2];if((HEAPU16[r4+38>>1]|0)>=200){_resume_error(r4,11112,r1)}if((HEAPU8[r4+6|0]|0)==0){if((r2|0)!=(r4+72|0)){_resume_error(r4,2696,r1)}if((_luaD_precall(r4,r1-16|0,-1)|0)==0){_luaV_execute(r4)}STACKTOP=r3;return}if((HEAPU8[r4+6|0]|0)!=1){_resume_error(r4,11936,r1)}HEAP8[r4+6|0]=0;HEAP32[r2>>2]=HEAP32[r4+28>>2]+HEAP32[r2+20>>2];if((HEAP8[r2+18|0]&1|0)!=0){_luaV_execute(r4)}else{if((HEAP32[r2+28>>2]|0)!=0){HEAP8[r2+37|0]=1;r5=r2+18|0;HEAP8[r5]=HEAPU8[r5]|8;r5=FUNCTION_TABLE[HEAP32[r2+28>>2]](r4);r1=HEAP32[r4+8>>2]+(-r5<<4)|0}_luaD_poscall(r4,r1)}_unroll(r4,0);STACKTOP=r3;return}function _recover(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;r4=r1;r1=r2;r2=_findpcall(r4);if((r2|0)==0){r5=0;r6=r5;STACKTOP=r3;return r6}else{r7=HEAP32[r4+28>>2]+HEAP32[r2+20>>2]|0;_luaF_close(r4,r7);_seterrorobj(r4,r1,r7);HEAP32[r4+16>>2]=r2;HEAP8[r4+41|0]=HEAP8[r2+36|0];HEAP16[r4+36>>1]=0;_luaD_shrinkstack(r4);HEAP32[r4+68>>2]=HEAP32[r2+32>>2];r4=r2+18|0;HEAP8[r4]=HEAPU8[r4]|32;HEAP8[r2+37|0]=r1;r5=1;r6=r5;STACKTOP=r3;return r6}}function _unroll(r1,r2){var r3;r2=STACKTOP;r3=r1;while(1){if((HEAP32[r3+16>>2]|0)==(r3+72|0)){break}if((HEAP8[HEAP32[r3+16>>2]+18|0]&1|0)!=0){_luaV_finishOp(r3);_luaV_execute(r3)}else{_finishCcall(r3)}}STACKTOP=r2;return}function _seterrorobj(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=STACKTOP;r5=r1;r1=r3;r3=r2;if((r3|0)==6){r2=r1;r6=_luaS_newlstr(r5,2976,23);HEAP32[r2>>2]=r6;HEAP32[r2+8>>2]=HEAPU8[r6+4|0]|64;r7=r1;r8=r7+16|0;r9=r5;r10=r9+8|0;HEAP32[r10>>2]=r8;STACKTOP=r4;return}else if((r3|0)==4){r3=r1;r6=HEAP32[HEAP32[r5+12>>2]+180>>2];HEAP32[r3>>2]=r6;HEAP32[r3+8>>2]=HEAPU8[r6+4|0]|64;r7=r1;r8=r7+16|0;r9=r5;r10=r9+8|0;HEAP32[r10>>2]=r8;STACKTOP=r4;return}else{r6=HEAP32[r5+8>>2]-16|0;r3=r1;r2=r3|0;r11=r6|0;HEAP32[r2>>2]=HEAP32[r11>>2];HEAP32[r2+4>>2]=HEAP32[r11+4>>2];HEAP32[r3+8>>2]=HEAP32[r6+8>>2];r7=r1;r8=r7+16|0;r9=r5;r10=r9+8|0;HEAP32[r10>>2]=r8;STACKTOP=r4;return}}function _lua_yieldk(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r5=0;r6=STACKTOP;r7=r1;r1=r2;r2=r3;r3=r4;r4=HEAP32[r7+16>>2];if((HEAPU16[r7+36>>1]|0)>0){if((r7|0)!=(HEAP32[HEAP32[r7+12>>2]+172>>2]|0)){_luaG_runerror(r7,8784,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}else{_luaG_runerror(r7,6728,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5}}HEAP8[r7+6|0]=1;HEAP32[r4+20>>2]=HEAP32[r4>>2]-HEAP32[r7+28>>2];if((HEAP8[r4+18|0]&1|0)!=0){STACKTOP=r6;return 0}r6=r3;HEAP32[r4+28>>2]=r6;if((r6|0)==0){r8=r7;r9=r8+8|0;r10=HEAP32[r9>>2];r11=r1;r12=-r11|0;r13=r10+(r12<<4)|0;r14=r13-16|0;r15=r4;r16=r15|0;HEAP32[r16>>2]=r14;r17=r7;_luaD_throw(r17,1)}HEAP32[r4+24>>2]=r2;r8=r7;r9=r8+8|0;r10=HEAP32[r9>>2];r11=r1;r12=-r11|0;r13=r10+(r12<<4)|0;r14=r13-16|0;r15=r4;r16=r15|0;HEAP32[r16>>2]=r14;r17=r7;_luaD_throw(r17,1)}function _luaD_pcall(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14;r6=STACKTOP;r7=r1;r1=HEAP32[r7+16>>2];r8=HEAP8[r7+41|0];r9=HEAP16[r7+36>>1];r10=HEAP32[r7+68>>2];HEAP32[r7+68>>2]=r5;r5=_luaD_rawrunprotected(r7,r2,r3);if((r5|0)==0){r11=r10;r12=r7;r13=r12+68|0;HEAP32[r13>>2]=r11;r14=r5;STACKTOP=r6;return r14}r3=HEAP32[r7+28>>2]+r4|0;_luaF_close(r7,r3);_seterrorobj(r7,r5,r3);HEAP32[r7+16>>2]=r1;HEAP8[r7+41|0]=r8;HEAP16[r7+36>>1]=r9;_luaD_shrinkstack(r7);r11=r10;r12=r7;r13=r12+68|0;HEAP32[r13>>2]=r11;r14=r5;STACKTOP=r6;return r14}function _luaD_protectedparser(r1,r2,r3,r4){var r5,r6,r7;r5=STACKTOP;STACKTOP=STACKTOP+64|0;r6=r5;r7=r1;r1=r7+36|0;HEAP16[r1>>1]=HEAP16[r1>>1]+1;HEAP32[r6>>2]=r2;HEAP32[r6+56>>2]=r3;HEAP32[r6+52>>2]=r4;HEAP32[r6+16>>2]=0;HEAP32[r6+24>>2]=0;HEAP32[r6+28>>2]=0;HEAP32[r6+36>>2]=0;HEAP32[r6+40>>2]=0;HEAP32[r6+48>>2]=0;HEAP32[r6+4>>2]=0;HEAP32[r6+12>>2]=0;r4=_luaD_pcall(r7,120,r6,HEAP32[r7+8>>2]-HEAP32[r7+28>>2]|0,HEAP32[r7+68>>2]);r3=_luaM_realloc_(r7,HEAP32[r6+4>>2],HEAP32[r6+12>>2],0);HEAP32[r6+4>>2]=r3;HEAP32[r6+12>>2]=0;_luaM_realloc_(r7,HEAP32[r6+16>>2],HEAP32[r6+24>>2]<<1,0);_luaM_realloc_(r7,HEAP32[r6+28>>2],HEAP32[r6+36>>2]<<4,0);_luaM_realloc_(r7,HEAP32[r6+40>>2],HEAP32[r6+48>>2]<<4,0);r6=r7+36|0;HEAP16[r6>>1]=HEAP16[r6>>1]-1;STACKTOP=r5;return r4}function _f_parser(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r1>>2]|0;r5=HEAP32[r2>>2];HEAP32[r2>>2]=r5-1;if(r5>>>0>0){r5=HEAP32[r1>>2]+4|0;r2=HEAP32[r5>>2];HEAP32[r5>>2]=r2+1;r6=HEAPU8[r2]}else{r6=_luaZ_fill(HEAP32[r1>>2])}r2=r6;if((r2|0)==(HEAP8[5336]|0)){_checkmode(r4,HEAP32[r1+52>>2],4168);r7=_luaU_undump(r4,HEAP32[r1>>2],r1+4|0,HEAP32[r1+56>>2])}else{_checkmode(r4,HEAP32[r1+52>>2],3832);r7=_luaY_parser(r4,HEAP32[r1>>2],r1+4|0,r1+16|0,HEAP32[r1+56>>2],r2)}r2=0;while(1){if((r2|0)>=(HEAPU8[r7+6|0]|0)){break}r1=_luaF_newupval(r4);HEAP32[r7+16+(r2<<2)>>2]=r1;do{if((HEAP8[r1+5|0]&3|0)!=0){if((HEAP8[r7+5|0]&4|0)==0){break}_luaC_barrier_(r4,r7,r1)}}while(0);r2=r2+1|0}STACKTOP=r3;return}function _checkmode(r1,r2,r3){var r4,r5,r6;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;if((r1|0)==0){STACKTOP=r5;return}if((_strchr(r1,HEAP8[r2|0]|0)|0)==0){_luaO_pushfstring(r6,3328,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r1,r4));STACKTOP=r4;_luaD_throw(r6,3)}else{STACKTOP=r5;return}}function _finishCcall(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=HEAP32[r3+16>>2];do{if((HEAP16[r1+16>>1]|0)==-1){if(HEAP32[HEAP32[r3+16>>2]+4>>2]>>>0>=HEAP32[r3+8>>2]>>>0){break}HEAP32[HEAP32[r3+16>>2]+4>>2]=HEAP32[r3+8>>2]}}while(0);if((HEAP8[r1+18|0]&32|0)==0){HEAP8[r1+37|0]=1}HEAP8[r1+18|0]=HEAPU8[r1+18|0]&-49|8;r4=FUNCTION_TABLE[HEAP32[r1+28>>2]](r3);_luaD_poscall(r3,HEAP32[r3+8>>2]+(-r4<<4)|0);STACKTOP=r2;return}function _findpcall(r1){var r2,r3,r4,r5,r6;r2=0;r3=STACKTOP;r4=HEAP32[r1+16>>2];while(1){if((r4|0)==0){r2=7;break}if((HEAP8[r4+18|0]&16|0)!=0){r2=4;break}r4=HEAP32[r4+8>>2]}if(r2==4){r5=r4;r6=r5;STACKTOP=r3;return r6}else if(r2==7){r5=0;r6=r5;STACKTOP=r3;return r6}}function _resume_error(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;HEAP32[r5+8>>2]=r3;r3=HEAP32[r5+8>>2];r1=_luaS_new(r5,r2);HEAP32[r3>>2]=r1;HEAP32[r3+8>>2]=HEAPU8[r1+4|0]|64;r1=r5+8|0;HEAP32[r1>>2]=HEAP32[r1>>2]+16;if(((HEAP32[r5+24>>2]-HEAP32[r5+8>>2]|0)/16&-1|0)<=0){_luaD_growstack(r5,0);r6=r5;_luaD_throw(r6,-1);STACKTOP=r4;return}else{r6=r5;_luaD_throw(r6,-1);STACKTOP=r4;return}}function _luaU_dump(r1,r2,r3,r4,r5){var r6,r7;r6=STACKTOP;STACKTOP=STACKTOP+24|0;r7=r6;HEAP32[r7>>2]=r1;HEAP32[r7+4>>2]=r3;HEAP32[r7+8>>2]=r4;HEAP32[r7+12>>2]=r5;HEAP32[r7+16>>2]=0;_DumpHeader(r7);_DumpFunction(r2,r7);STACKTOP=r6;return HEAP32[r7+16>>2]}function _DumpHeader(r1){var r2,r3;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;_luaU_header(r3|0);_DumpBlock(r3|0,18,r1);STACKTOP=r2;return}function _DumpFunction(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;_DumpInt(HEAP32[r4+64>>2],r1);_DumpInt(HEAP32[r4+68>>2],r1);_DumpChar(HEAPU8[r4+76|0],r1);_DumpChar(HEAPU8[r4+77|0],r1);_DumpChar(HEAPU8[r4+78|0],r1);_DumpVector(HEAP32[r4+12>>2],HEAP32[r4+48>>2],4,r1);_DumpConstants(r4,r1);_DumpUpvalues(r4,r1);_DumpDebug(r4,r1);STACKTOP=r3;return}function _DumpInt(r1,r2){var r3,r4;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;HEAP32[r4>>2]=r1;_DumpBlock(r4,4,r2);STACKTOP=r3;return}function _DumpChar(r1,r2){var r3,r4;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;HEAP8[r4]=r1;_DumpBlock(r4,1,r2);STACKTOP=r3;return}function _DumpVector(r1,r2,r3,r4){var r5,r6;r5=STACKTOP;r6=r2;r2=r4;_DumpInt(r6,r2);_DumpBlock(r1,Math_imul(r6,r3)|0,r2);STACKTOP=r5;return}function _DumpConstants(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+44>>2];_DumpInt(r2,r1);r5=0;while(1){if((r5|0)>=(r2|0)){break}r6=HEAP32[r4+8>>2]+(r5<<4)|0;_DumpChar(HEAP32[r6+8>>2]&15,r1);r7=HEAP32[r6+8>>2]&15;if((r7|0)==1){_DumpChar(HEAP32[r6>>2],r1)}else if((r7|0)!=0)if((r7|0)==3){_DumpNumber(HEAPF64[r6>>3],r1)}else if((r7|0)==4){_DumpString(HEAP32[r6>>2],r1)}r5=r5+1|0}r2=HEAP32[r4+56>>2];_DumpInt(r2,r1);r5=0;while(1){if((r5|0)>=(r2|0)){break}_DumpFunction(HEAP32[HEAP32[r4+16>>2]+(r5<<2)>>2],r1);r5=r5+1|0}STACKTOP=r3;return}function _DumpUpvalues(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+40>>2];_DumpInt(r2,r1);r5=0;while(1){if((r5|0)>=(r2|0)){break}_DumpChar(HEAPU8[HEAP32[r4+28>>2]+(r5<<3)+4|0],r1);_DumpChar(HEAPU8[HEAP32[r4+28>>2]+(r5<<3)+5|0],r1);r5=r5+1|0}STACKTOP=r3;return}function _DumpDebug(r1,r2){var r3,r4,r5,r6,r7,r8;r3=STACKTOP;r4=r1;r1=r2;if((HEAP32[r1+12>>2]|0)!=0){r5=0}else{r5=HEAP32[r4+36>>2]}_DumpString(r5,r1);if((HEAP32[r1+12>>2]|0)!=0){r6=0}else{r6=HEAP32[r4+52>>2]}r5=r6;_DumpVector(HEAP32[r4+20>>2],r5,4,r1);if((HEAP32[r1+12>>2]|0)!=0){r7=0}else{r7=HEAP32[r4+60>>2]}r5=r7;_DumpInt(r5,r1);r7=0;while(1){if((r7|0)>=(r5|0)){break}_DumpString(HEAP32[HEAP32[r4+24>>2]+(r7*12&-1)>>2],r1);_DumpInt(HEAP32[HEAP32[r4+24>>2]+(r7*12&-1)+4>>2],r1);_DumpInt(HEAP32[HEAP32[r4+24>>2]+(r7*12&-1)+8>>2],r1);r7=r7+1|0}if((HEAP32[r1+12>>2]|0)!=0){r8=0}else{r8=HEAP32[r4+40>>2]}r5=r8;_DumpInt(r5,r1);r7=0;while(1){if((r7|0)>=(r5|0)){break}_DumpString(HEAP32[HEAP32[r4+28>>2]+(r7<<3)>>2],r1);r7=r7+1|0}STACKTOP=r3;return}function _DumpString(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=r3+8;r6=r1;r1=r2;if((r6|0)==0){HEAP32[r4>>2]=0;_DumpBlock(r4,4,r1);STACKTOP=r3;return}else{HEAP32[r5>>2]=HEAP32[r6+12>>2]+1;_DumpBlock(r5,4,r1);_DumpBlock(r6+16|0,HEAP32[r5>>2],r1);STACKTOP=r3;return}}function _DumpBlock(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r3;if((HEAP32[r5+16>>2]|0)!=0){STACKTOP=r4;return}r3=FUNCTION_TABLE[HEAP32[r5+4>>2]](HEAP32[r5>>2],r1,r2,HEAP32[r5+8>>2]);HEAP32[r5+16>>2]=r3;STACKTOP=r4;return}function _DumpNumber(r1,r2){var r3,r4;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;HEAPF64[r4>>3]=r1;_DumpBlock(r4,8,r2);STACKTOP=r3;return}function _luaF_newCclosure(r1,r2){var r3,r4;r3=STACKTOP;r4=r2;r2=_luaC_newobj(r1,38,(r4-1<<4)+32|0,0,0);HEAP8[r2+6|0]=r4;STACKTOP=r3;return r2}function _luaF_newLclosure(r1,r2){var r3,r4;r3=STACKTOP;r4=r2;r2=_luaC_newobj(r1,6,(r4-1<<2)+20|0,0,0);HEAP32[r2+12>>2]=0;HEAP8[r2+6|0]=r4;while(1){r1=r4;r4=r1-1|0;if((r1|0)==0){break}HEAP32[r2+16+(r4<<2)>>2]=0}STACKTOP=r3;return r2}function _luaF_newupval(r1){var r2,r3;r2=STACKTOP;r3=_luaC_newobj(r1,10,32,0,0);HEAP32[r3+8>>2]=r3+16;HEAP32[HEAP32[r3+8>>2]+8>>2]=0;STACKTOP=r2;return r3}function _luaF_findupval(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=HEAP32[r5+12>>2];r6=r5+56|0;while(1){if((HEAP32[r6>>2]|0)!=0){r7=HEAP32[r6>>2];r8=r7;r9=HEAP32[r7+8>>2]>>>0>=r1>>>0}else{r9=0}if(!r9){r3=10;break}r10=r8;if((HEAP32[r8+8>>2]|0)==(r1|0)){break}r7=r10+5|0;HEAP8[r7]=HEAP8[r7]&191;r6=r8|0}if(r3==10){r3=_luaC_newobj(r5,10,32,r6,0);HEAP32[r3+8>>2]=r1;HEAP32[r3+16>>2]=r2+112;HEAP32[r3+20>>2]=HEAP32[r2+132>>2];HEAP32[HEAP32[r3+20>>2]+16>>2]=r3;HEAP32[r2+132>>2]=r3;r11=r3;r12=r11;STACKTOP=r4;return r12}if(((HEAPU8[r10+5|0]^3)&(HEAPU8[r2+60|0]^3)|0)==0){r2=r10+5|0;HEAP8[r2]=HEAPU8[r2]^3}r11=r8;r12=r11;STACKTOP=r4;return r12}function _luaF_freeupval(r1,r2){var r3,r4;r3=STACKTOP;r4=r2;if((HEAP32[r4+8>>2]|0)!=(r4+16|0)){_unlinkupval(r4)}_luaM_realloc_(r1,r4,32,0);STACKTOP=r3;return}function _unlinkupval(r1){var r2;r2=r1;HEAP32[HEAP32[r2+20>>2]+16>>2]=HEAP32[r2+16>>2];HEAP32[HEAP32[r2+16>>2]+20>>2]=HEAP32[r2+20>>2];STACKTOP=STACKTOP;return}function _luaF_close(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+12>>2];while(1){if((HEAP32[r4+56>>2]|0)!=0){r5=HEAP32[r4+56>>2];r6=r5;r7=HEAP32[r5+8>>2]>>>0>=r1>>>0}else{r7=0}if(!r7){break}r5=r6;HEAP32[r4+56>>2]=HEAP32[r6>>2];if(((HEAPU8[r5+5|0]^3)&(HEAPU8[r2+60|0]^3)|0)!=0){_unlinkupval(r6);r8=HEAP32[r6+8>>2];r9=r6+16|0;r10=r9|0;r11=r8|0;HEAP32[r10>>2]=HEAP32[r11>>2];HEAP32[r10+4>>2]=HEAP32[r11+4>>2];HEAP32[r9+8>>2]=HEAP32[r8+8>>2];HEAP32[r6+8>>2]=r6+16;HEAP32[r5>>2]=HEAP32[r2+68>>2];HEAP32[r2+68>>2]=r5;_luaC_checkupvalcolor(r2,r6)}else{_luaF_freeupval(r4,r6)}}STACKTOP=r3;return}function _luaF_newproto(r1){var r2,r3;r2=STACKTOP;r3=_luaC_newobj(r1,9,80,0,0);HEAP32[r3+8>>2]=0;HEAP32[r3+44>>2]=0;HEAP32[r3+16>>2]=0;HEAP32[r3+56>>2]=0;HEAP32[r3+12>>2]=0;HEAP32[r3+32>>2]=0;HEAP32[r3+48>>2]=0;HEAP32[r3+20>>2]=0;HEAP32[r3+52>>2]=0;HEAP32[r3+28>>2]=0;HEAP32[r3+40>>2]=0;HEAP8[r3+76|0]=0;HEAP8[r3+77|0]=0;HEAP8[r3+78|0]=0;HEAP32[r3+24>>2]=0;HEAP32[r3+60>>2]=0;HEAP32[r3+64>>2]=0;HEAP32[r3+68>>2]=0;HEAP32[r3+36>>2]=0;STACKTOP=r2;return r3}function _luaF_freeproto(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;_luaM_realloc_(r4,HEAP32[r1+12>>2],HEAP32[r1+48>>2]<<2,0);_luaM_realloc_(r4,HEAP32[r1+16>>2],HEAP32[r1+56>>2]<<2,0);_luaM_realloc_(r4,HEAP32[r1+8>>2],HEAP32[r1+44>>2]<<4,0);_luaM_realloc_(r4,HEAP32[r1+20>>2],HEAP32[r1+52>>2]<<2,0);_luaM_realloc_(r4,HEAP32[r1+24>>2],HEAP32[r1+60>>2]*12&-1,0);_luaM_realloc_(r4,HEAP32[r1+28>>2],HEAP32[r1+40>>2]<<3,0);_luaM_realloc_(r4,r1,80,0);STACKTOP=r3;return}function _luaF_getlocalname(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=0;while(1){if((r3|0)<(HEAP32[r6+60>>2]|0)){r7=(HEAP32[HEAP32[r6+24>>2]+(r3*12&-1)+4>>2]|0)<=(r2|0)}else{r7=0}if(!r7){r4=11;break}if((r2|0)<(HEAP32[HEAP32[r6+24>>2]+(r3*12&-1)+8>>2]|0)){r1=r1-1|0;if((r1|0)==0){r4=7;break}}r3=r3+1|0}if(r4==7){r8=HEAP32[HEAP32[r6+24>>2]+(r3*12&-1)>>2]+16|0;r9=r8;STACKTOP=r5;return r9}else if(r4==11){r8=0;r9=r8;STACKTOP=r5;return r9}}function _luaC_barrier_(r1,r2,r3){var r4,r5;r4=STACKTOP;r5=r2;r2=r3;r3=HEAP32[r1+12>>2];do{if((HEAPU8[r3+62|0]|0)!=2){if((HEAPU8[r3+61|0]|0)<=1){break}HEAP8[r5+5|0]=HEAPU8[r5+5|0]&-72|HEAP8[r3+60|0]&3&255;STACKTOP=r4;return}}while(0);_reallymarkobject(r3,r2);STACKTOP=r4;return}function _reallymarkobject(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174;r3=0;r4=STACKTOP;r5=r1;r6=r2;r7=r6;r8=r7;r9=r8+5|0;r10=HEAP8[r9];r11=r10&255;r12=r11&252;r13=r12&255;HEAP8[r9]=r13;r14=r6;r15=r14;r16=r15+4|0;r17=HEAP8[r16];r18=r17&255;L1:do{switch(r18|0){case 7:{r19=r6;r20=r19;r21=r20;r22=r21+8|0;r23=HEAP32[r22>>2];r24=r23;r25=r24;r26=(r25|0)!=0;do{if(r26){r27=r24;r28=r27;r29=r28;r30=r29+5|0;r31=HEAP8[r30];r32=r31&255;r33=r32&3;r34=(r33|0)!=0;if(!r34){break}r35=r5;r36=r24;r37=r36;_reallymarkobject(r35,r37)}}while(0);r38=r6;r39=r38;r40=r39;r41=r40+12|0;r42=HEAP32[r41>>2];r43=(r42|0)!=0;do{if(r43){r44=r6;r45=r44;r46=r45;r47=r46+12|0;r48=HEAP32[r47>>2];r49=r48;r50=r49;r51=r50+5|0;r52=HEAP8[r51];r53=r52&255;r54=r53&3;r55=(r54|0)!=0;if(!r55){break}r56=r5;r57=r6;r58=r57;r59=r58;r60=r59+12|0;r61=HEAP32[r60>>2];r62=r61;_reallymarkobject(r56,r62)}}while(0);r63=r6;r64=r63;r65=r64;r66=r65+16|0;r67=HEAP32[r66>>2];r68=r67+24|0;r69=r68;break};case 4:case 20:{r70=r6;r71=r70;r72=r71;r73=r72+12|0;r74=HEAP32[r73>>2];r75=r74+1|0;r76=r75;r77=r76+16|0;r69=r77;break};case 10:{r78=r6;r79=r78;r80=r79;r81=r80;r82=r81+8|0;r83=HEAP32[r82>>2];r84=r83+8|0;r85=HEAP32[r84>>2];r86=r85&64;r87=(r86|0)!=0;do{if(r87){r88=r80;r89=r88+8|0;r90=HEAP32[r89>>2];r91=r90|0;r92=r91;r93=HEAP32[r92>>2];r94=r93;r95=r94+5|0;r96=HEAP8[r95];r97=r96&255;r98=r97&3;r99=(r98|0)!=0;if(!r99){break}r100=r5;r101=r80;r102=r101+8|0;r103=HEAP32[r102>>2];r104=r103|0;r105=r104;r106=HEAP32[r105>>2];_reallymarkobject(r100,r106)}}while(0);r107=r80;r108=r107+8|0;r109=HEAP32[r108>>2];r110=r80;r111=r110+16|0;r112=r111;r113=(r109|0)!=(r112|0);if(!r113){r69=32;break L1}STACKTOP=r4;return;break};case 6:{r114=r5;r115=r114+84|0;r116=HEAP32[r115>>2];r117=r6;r118=r117;r119=r118;r120=r119+8|0;HEAP32[r120>>2]=r116;r121=r6;r122=r5;r123=r122+84|0;HEAP32[r123>>2]=r121;STACKTOP=r4;return;break};case 38:{r124=r5;r125=r124+84|0;r126=HEAP32[r125>>2];r127=r6;r128=r127;r129=r128;r130=r129+8|0;HEAP32[r130>>2]=r126;r131=r6;r132=r5;r133=r132+84|0;HEAP32[r133>>2]=r131;STACKTOP=r4;return;break};case 5:{r134=r5;r135=r134+84|0;r136=HEAP32[r135>>2];r137=r6;r138=r137;r139=r138+24|0;HEAP32[r139>>2]=r136;r140=r6;r141=r140;r142=r141;r143=r5;r144=r143+84|0;HEAP32[r144>>2]=r142;STACKTOP=r4;return;break};case 9:{r145=r5;r146=r145+84|0;r147=HEAP32[r146>>2];r148=r6;r149=r148;r150=r149+72|0;HEAP32[r150>>2]=r147;r151=r6;r152=r5;r153=r152+84|0;HEAP32[r153>>2]=r151;STACKTOP=r4;return;break};case 8:{r154=r5;r155=r154+84|0;r156=HEAP32[r155>>2];r157=r6;r158=r157;r159=r158+60|0;HEAP32[r159>>2]=r156;r160=r6;r161=r5;r162=r161+84|0;HEAP32[r162>>2]=r160;STACKTOP=r4;return;break};default:{STACKTOP=r4;return}}}while(0);r163=r6;r164=r163;r165=r164+5|0;r166=HEAP8[r165];r167=r166&255;r168=r167|4;r169=r168&255;HEAP8[r165]=r169;r170=r69;r171=r5;r172=r171+16|0;r173=HEAP32[r172>>2];r174=r173+r170|0;HEAP32[r172>>2]=r174;STACKTOP=r4;return}function _luaC_barrierback_(r1,r2){var r3;r3=r2;r2=HEAP32[r1+12>>2];r1=r3+5|0;HEAP8[r1]=HEAP8[r1]&251;HEAP32[r3+24>>2]=HEAP32[r2+88>>2];HEAP32[r2+88>>2]=r3;STACKTOP=STACKTOP;return}function _luaC_barrierproto_(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=HEAP32[r5+12>>2];if((HEAP32[r1+32>>2]|0)!=0){r6=r1+5|0;HEAP8[r6]=HEAP8[r6]&251;HEAP32[r1+72>>2]=HEAP32[r3+88>>2];HEAP32[r3+88>>2]=r1;STACKTOP=r4;return}do{if((HEAP8[r2+5|0]&3|0)!=0){if((HEAP8[r1+5|0]&4|0)==0){break}_luaC_barrier_(r5,r1,r2)}}while(0);STACKTOP=r4;return}function _luaC_checkupvalcolor(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1;r1=r2;r2=r1;if((HEAP8[r2+5|0]&7|0)!=0){STACKTOP=r4;return}do{if((HEAPU8[r5+62|0]|0)==2){r3=4}else{if((HEAPU8[r5+61|0]|0)<=1){r3=4;break}HEAP8[r2+5|0]=HEAPU8[r2+5|0]&-72|HEAP8[r5+60|0]&3&255}}while(0);if(r3==4){r3=r2+5|0;HEAP8[r3]=HEAP8[r3]&191;r3=r2+5|0;HEAP8[r3]=HEAPU8[r3]|4;do{if((HEAP32[HEAP32[r1+8>>2]+8>>2]&64|0)!=0){if((HEAP8[HEAP32[HEAP32[r1+8>>2]>>2]+5|0]&3|0)==0){break}_reallymarkobject(r5,HEAP32[HEAP32[r1+8>>2]>>2])}}while(0)}STACKTOP=r4;return}function _luaC_newobj(r1,r2,r3,r4,r5){var r6,r7,r8;r6=STACKTOP;r7=r1;r1=r2;r2=r4;r4=HEAP32[r7+12>>2];r8=_luaM_realloc_(r7,0,r1&15,r3)+r5|0;if((r2|0)==0){r2=r4+68|0}HEAP8[r8+5|0]=HEAP8[r4+60|0]&3;HEAP8[r8+4|0]=r1;HEAP32[r8>>2]=HEAP32[r2>>2];HEAP32[r2>>2]=r8;STACKTOP=r6;return r8}function _luaC_checkfinalizer(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=HEAP32[r6+12>>2];do{if((HEAP8[r1+5|0]&16|0)==0){if((HEAP8[r1+5|0]&8|0)!=0){break}if((r2|0)==0){r7=0}else{if((HEAP8[r2+6|0]&4|0)!=0){r8=0}else{r8=_luaT_gettm(r2,2,HEAP32[r3+192>>2])}r7=r8}if((r7|0)==0){break}r9=r1;if((HEAP32[r3+76>>2]|0)==(r9|0)){r10=_sweeptolive(r6,HEAP32[r3+76>>2],0);HEAP32[r3+76>>2]=r10}r10=r3+68|0;while(1){if((HEAP32[r10>>2]|0)==(r1|0)){break}r10=HEAP32[r10>>2]|0}HEAP32[r10>>2]=HEAP32[r9>>2];HEAP32[r9>>2]=HEAP32[r3+72>>2];HEAP32[r3+72>>2]=r1;r11=r9+5|0;HEAP8[r11]=HEAPU8[r11]|16;do{if((HEAPU8[r3+62|0]|0)==2){r4=20}else{if((HEAPU8[r3+61|0]|0)<=1){r4=20;break}HEAP8[r1+5|0]=HEAPU8[r1+5|0]&-72|HEAP8[r3+60|0]&3&255}}while(0);if(r4==20){r9=r1+5|0;HEAP8[r9]=HEAP8[r9]&191}STACKTOP=r5;return}}while(0);STACKTOP=r5;return}function _sweeptolive(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;r5=r1;r1=r2;r2=r3;r3=r1;r6=0;while(1){r6=r6+1|0;r1=_sweeplist(r5,r1,1);if((r1|0)!=(r3|0)){break}}if((r2|0)==0){r7=r1;STACKTOP=r4;return r7}r3=r2;HEAP32[r3>>2]=HEAP32[r3>>2]+r6;r7=r1;STACKTOP=r4;return r7}function _luaC_changemode(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+12>>2];if((r1|0)==(HEAPU8[r2+62|0]|0)){STACKTOP=r3;return}if((r1|0)==2){_luaC_runtilstate(r4,1);HEAP32[r2+20>>2]=HEAP32[r2+8>>2]+HEAP32[r2+12>>2];HEAP8[r2+62|0]=2;STACKTOP=r3;return}else{HEAP8[r2+62|0]=0;_entersweep(r4);_luaC_runtilstate(r4,-29);STACKTOP=r3;return}}function _luaC_runtilstate(r1,r2){var r3,r4;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+12>>2];while(1){if(!((r1&1<<HEAPU8[r2+61|0]|0)!=0^1)){break}_singlestep(r4)}STACKTOP=r3;return}function _entersweep(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r1=HEAP32[r4+12>>2];HEAP32[r3>>2]=0;HEAP8[r1+61|0]=2;HEAP32[r1+64>>2]=0;r5=_sweeptolive(r4,r1+72|0,r3);HEAP32[r1+80>>2]=r5;r5=_sweeptolive(r4,r1+68|0,r3);HEAP32[r1+76>>2]=r5;STACKTOP=r2;return HEAP32[r3>>2]}function _luaC_freeallobjects(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=HEAP32[r3+12>>2];_separatetobefnz(r3,1);_callallpendingfinalizers(r3,0);HEAP8[r1+60|0]=3;HEAP8[r1+62|0]=0;_sweeplist(r3,r1+72|0,-3);_sweeplist(r3,r1+68|0,-3);r4=0;while(1){if((r4|0)>=(HEAP32[r1+32>>2]|0)){break}_sweeplist(r3,HEAP32[r1+24>>2]+(r4<<2)|0,-3);r4=r4+1|0}STACKTOP=r2;return}function _separatetobefnz(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r2;r2=HEAP32[r1+12>>2];r1=r2+72|0;r6=r2+104|0;while(1){if((HEAP32[r6>>2]|0)==0){break}r6=HEAP32[r6>>2]|0}while(1){r2=HEAP32[r1>>2];r7=r2;if((r2|0)==0){break}do{if((r5|0)!=0){r3=9}else{if((HEAP8[r7+5|0]&3|0)!=0){r3=9;break}r1=r7|0}}while(0);if(r3==9){r3=0;r2=r7+5|0;HEAP8[r2]=HEAPU8[r2]|8;HEAP32[r1>>2]=HEAP32[r7>>2];HEAP32[r7>>2]=HEAP32[r6>>2];HEAP32[r6>>2]=r7;r6=r7|0}}STACKTOP=r4;return}function _callallpendingfinalizers(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=r1;r1=r2;r2=HEAP32[r4+12>>2];while(1){if((HEAP32[r2+104>>2]|0)==0){break}r5=HEAP32[r2+104>>2]+5|0;HEAP8[r5]=HEAP8[r5]&191;_GCTM(r4,r1)}STACKTOP=r3;return}function _sweeplist(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;r5=STACKTOP;r6=r1;r1=r2;r2=r3;r3=HEAP32[r6+12>>2];r7=HEAPU8[r3+60|0]^3;if((HEAPU8[r3+62|0]|0)==2){r8=-1;r9=64;r10=64}else{r8=-72;r9=HEAP8[r3+60|0]&3&255;r10=0}while(1){if((HEAP32[r1>>2]|0)!=0){r3=r2;r2=r3-1|0;r11=r3>>>0>0}else{r11=0}if(!r11){break}r3=HEAP32[r1>>2];r12=HEAPU8[r3+5|0];if(((r12^3)&r7|0)!=0){if((r12&r10|0)!=0){r4=11;break}if((HEAPU8[r3+4|0]|0)==8){_sweepthread(r6,r3)}HEAP8[r3+5|0]=r12&r8|r9;r1=r3|0}else{HEAP32[r1>>2]=HEAP32[r3>>2];_freeobj(r6,r3)}}if(r4==11){r13=0;r14=r13;STACKTOP=r5;return r14}if((HEAP32[r1>>2]|0)==0){r15=0}else{r15=r1}r13=r15;r14=r13;STACKTOP=r5;return r14}function _singlestep(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r1;r6=r5;r7=r6+12|0;r8=HEAP32[r7>>2];r9=r8;r10=r9;r11=r10+61|0;r12=HEAP8[r11];r13=r12&255;switch(r13|0){case 2:{r14=0;while(1){r15=r14;r16=(r15|0)<80;if(r16){r17=r9;r18=r17+64|0;r19=HEAP32[r18>>2];r20=r14;r21=r19+r20|0;r22=r9;r23=r22+24|0;r24=r23+8|0;r25=HEAP32[r24>>2];r26=(r21|0)<(r25|0);r27=r26}else{r27=0}if(!r27){break}r28=r5;r29=r9;r30=r29+64|0;r31=HEAP32[r30>>2];r32=r14;r33=r31+r32|0;r34=r9;r35=r34+24|0;r36=r35|0;r37=HEAP32[r36>>2];r38=r37+(r33<<2)|0;r39=_sweeplist(r28,r38,-3);r40=r14;r41=r40+1|0;r14=r41}r42=r14;r43=r9;r44=r43+64|0;r45=HEAP32[r44>>2];r46=r45+r42|0;HEAP32[r44>>2]=r46;r47=r9;r48=r47+64|0;r49=HEAP32[r48>>2];r50=r9;r51=r50+24|0;r52=r51+8|0;r53=HEAP32[r52>>2];r54=(r49|0)>=(r53|0);if(r54){r55=r9;r56=r55+61|0;HEAP8[r56]=3}r57=r14;r58=r57*5&-1;r59=r58;r60=r59;STACKTOP=r3;return r60;break};case 5:{r61=r9;r62=r61+16|0;HEAP32[r62>>2]=0;r63=r9;r64=r63+62|0;r65=HEAP8[r64];r66=r65&255;r67=(r66|0)==2;if(!r67){r68=r9;_markroot(r68)}r69=r9;r70=r69+61|0;HEAP8[r70]=0;r71=r9;r72=r71+16|0;r73=HEAP32[r72>>2];r59=r73;r60=r59;STACKTOP=r3;return r60;break};case 0:{r74=r9;r75=r74+84|0;r76=HEAP32[r75>>2];r77=(r76|0)!=0;if(r77){r78=r9;r79=r78+16|0;r80=HEAP32[r79>>2];r81=r80;r82=r9;_propagatemark(r82);r83=r9;r84=r83+16|0;r85=HEAP32[r84>>2];r86=r81;r87=r85-r86|0;r59=r87;r60=r59;STACKTOP=r3;return r60}else{r88=r9;r89=r88+61|0;HEAP8[r89]=1;r90=r9;r91=r90+16|0;r92=HEAP32[r91>>2];r93=r9;r94=r93+20|0;HEAP32[r94>>2]=r92;r95=r5;r96=_atomic(r95);r97=r96;r98=r97;r99=r9;r100=r99+20|0;r101=HEAP32[r100>>2];r102=r101+r98|0;HEAP32[r100>>2]=r102;r103=r5;r104=_entersweep(r103);r105=r104;r106=r97;r107=r105;r108=r107*5&-1;r109=r106+r108|0;r59=r109;r60=r59;STACKTOP=r3;return r60}break};case 3:{r110=r9;r111=r110+80|0;r112=HEAP32[r111>>2];r113=(r112|0)!=0;if(r113){r114=r5;r115=r9;r116=r115+80|0;r117=HEAP32[r116>>2];r118=_sweeplist(r114,r117,80);r119=r9;r120=r119+80|0;HEAP32[r120>>2]=r118;r59=400;r60=r59;STACKTOP=r3;return r60}else{r121=r9;r122=r121+61|0;HEAP8[r122]=4;r59=0;r60=r59;STACKTOP=r3;return r60}break};case 4:{r123=r9;r124=r123+76|0;r125=HEAP32[r124>>2];r126=(r125|0)!=0;if(r126){r127=r5;r128=r9;r129=r128+76|0;r130=HEAP32[r129>>2];r131=_sweeplist(r127,r130,80);r132=r9;r133=r132+76|0;HEAP32[r133>>2]=r131;r59=400;r60=r59;STACKTOP=r3;return r60}else{r134=r9;r135=r134+172|0;r136=HEAP32[r135>>2];r137=r136;HEAP32[r4>>2]=r137;r138=r5;r139=_sweeplist(r138,r4,1);r140=r5;_checkSizes(r140);r141=r9;r142=r141+61|0;HEAP8[r142]=5;r59=5;r60=r59;STACKTOP=r3;return r60}break};default:{r59=0;r60=r59;STACKTOP=r3;return r60}}}function _luaC_forcestep(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;r3=r1;r1=HEAP32[r3+12>>2];if((HEAPU8[r1+62|0]|0)==2){_generationalcollection(r3)}else{_incstep(r3)}r4=0;while(1){if((HEAP32[r1+104>>2]|0)!=0){if((r4|0)<4){r5=1}else{r5=(HEAPU8[r1+61|0]|0)==5}r6=r5}else{r6=0}if(!r6){break}_GCTM(r3,1);r4=r4+1|0}STACKTOP=r2;return}function _generationalcollection(r1){var r2,r3,r4;r2=STACKTOP;r3=r1;r1=HEAP32[r3+12>>2];if((HEAP32[r1+20>>2]|0)==0){_luaC_fullgc(r3,0);HEAP32[r1+20>>2]=HEAP32[r1+8>>2]+HEAP32[r1+12>>2]}else{r4=HEAP32[r1+20>>2];_luaC_runtilstate(r3,-33);_luaC_runtilstate(r3,32);if((HEAP32[r1+8>>2]+HEAP32[r1+12>>2]|0)>>>0>(Math_imul((r4>>>0)/100&-1,HEAP32[r1+160>>2])|0)>>>0){HEAP32[r1+20>>2]=0}}_luaE_setdebt(r1,Math_imul(-(((HEAP32[r1+8>>2]+HEAP32[r1+12>>2]|0)>>>0)/200&-1)|0,HEAP32[r1+156>>2])|0);STACKTOP=r2;return}




// EMSCRIPTEN_END_FUNCS
Module["_lua_gettop"] = _lua_gettop;
Module["_lua_settop"] = _lua_settop;
Module["_lua_pushvalue"] = _lua_pushvalue;
Module["_lua_type"] = _lua_type;
Module["_lua_typename"] = _lua_typename;
Module["_lua_iscfunction"] = _lua_iscfunction;
Module["_lua_tonumberx"] = _lua_tonumberx;
Module["_lua_toboolean"] = _lua_toboolean;
Module["_lua_tolstring"] = _lua_tolstring;
Module["_lua_rawlen"] = _lua_rawlen;
Module["_lua_topointer"] = _lua_topointer;
Module["_lua_pushnil"] = _lua_pushnil;
Module["_lua_pushnumber"] = _lua_pushnumber;
Module["_lua_pushstring"] = _lua_pushstring;
Module["_lua_pushcclosure"] = _lua_pushcclosure;
Module["_lua_pushboolean"] = _lua_pushboolean;
Module["_lua_getglobal"] = _lua_getglobal;
Module["_lua_rawget"] = _lua_rawget;
Module["_lua_createtable"] = _lua_createtable;
Module["_lua_setglobal"] = _lua_setglobal;
Module["_lua_rawset"] = _lua_rawset;
Module["_lua_setmetatable"] = _lua_setmetatable;
Module["_lua_pcallk"] = _lua_pcallk;
Module["_lua_next"] = _lua_next;
Module["_luaL_loadbufferx"] = _luaL_loadbufferx;
Module["_luaL_getmetafield"] = _luaL_getmetafield;
Module["_luaL_newstate"] = _luaL_newstate;
Module["_luaL_openlibs"] = _luaL_openlibs;
Module["_malloc"] = _malloc;
Module["_free"] = _free;
Module["_realloc"] = _realloc;

// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = false;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}






// This file is appended to the end of build/liblua.js

// WEBLUA API =================================================================
// 
// Written by Philip Horger
// Based on https://github.com/replit/jsrepl/blob/master/extern/lua/entry_point.js
// 
// ============================================================================

this['Lua'] = {
    isInitialized: false,
    state: null,
    tmp_id: 0,
    default_source_name: 'stdin',
    preallocated_strings: {
        '__handle': null,
        '__index': null,
    },
    initialize: function (source_name, stdout, stderr) {
        if (this.isInitialized) throw new Error('Lua already initialized');
        this.default_source_name = source_name || this.default_source_name;
        this.stdout = stdout || this.stdout;
        this.stderr = stderr || this.stderr;
        run();
        this.state = _luaL_newstate();
        _luaL_openlibs(this.state);
        for (var key in this.preallocated_strings) {
            this.preallocated_strings[key] = this.allocate_string(key);
        }
        this.isInitialized = true;
    },
    require_initialization: function(){
        if (!this.isInitialized) throw new Error('Lua not yet initialized');
    },
    parse: function (command, source_name) {
        // Put new function, from buffer, at the top of the stack
        this.require_initialization();
        var commandPtr = this.allocate_string(command);
        var namePtr    = this.allocate_string(source_name);
        var parseFailed = _luaL_loadbufferx(
            this.state, commandPtr, command.length, namePtr
        );
        if (parseFailed) {
            this.report_error("Parsing failure");
        }
        _free(commandPtr);
        _free(namePtr);
        return !parseFailed;
    },
    eval: function (command, source_name, source) {
        source_name = source_name || this.default_source_name;
        source      = source      || command;
        return this.exec("return "+command, source_name, source);
    },
    exec: function (command, source_name, source) {
        this.require_initialization();
        source_name = source_name || this.default_source_name;
        source      = source      || command;

        if (this.parse(command, source_name)) {
            // Parse success, now try calling func at top of stack
            var callFailed = _lua_pcallk(this.state, 0, -1, 0);
            if (callFailed) {
                this.report_error("Evaluation failure");
            } else {
                return this.get_stack_args();
            }
        } else {
            this.report_error("Parsing failure");
        }
    },
    inject: function (object, name, final_location, metatable) {
        name = name || this.get_tmp_name();
        this.pushStack(object);
        if (metatable) {
            this.pushStack(metatable);
            _lua_setmetatable(this.state, -2);
        }
        var strptr = this.allocate_string(name);
        _lua_setglobal(this.state, strptr);
        _free(strptr);
        if (final_location) {
            this.exec(final_location + " = " + name + "\n" + name + " = nil");
        }
        return (final_location || name);
    },
    cache: function (evalstring) {
        if (!(evalstring in this.cache['items'])) {
            this.cache['items'][evalstring] = this.eval(evalstring)
        }
        return this.cache['items'][evalstring];
    },
    call: function (evalstring, args) {
        var func = this.cache(evalstring)[0];
        return func.apply(null, args);
    },
    allocate_string: function(str) {
        var arr = intArrayFromString(str);
        return allocate(arr, 'i8', 0);  // ALLOC_NORMAL
    },
    inspect: function(index) {
        var type = _lua_type(this.state, index);
        var ptr = _lua_typename(this.state, type);
        var typename = Pointer_stringify(ptr)
        var address = _lua_topointer(this.state, index);
        return {
            'type': type,
            'typename': typename,
            'address': address,
            'addrstr': address.toString(16),
        }
    },
    peekStack: function(index, source) {
        this.require_initialization();
        var ret;
        var type = _lua_type(this.state, index);
        switch (type) {
            case -1: // LUA_TNONE
            case 0:  // LUA_TNIL
                ret = null;
                break;
            case 1:  // LUA_TBOOLEAN
                var result = _lua_toboolean(this.state, index);
                ret = result ? true : false;
                break;
            case 3:  // LUA_TNUMBER
                ret = _lua_tonumberx(this.state, index);
                break;
            case 4:  // LUA_TSTRING
                var ptr = _lua_tolstring(this.state, index, 0);
                var len = _lua_rawlen(this.state, index);
                var buffer = [];
                for (var i = 0; i < len; i++)
                    buffer.push(String.fromCharCode(HEAP8[ptr+i]));
                ret = buffer.join('');
                break;
            case 5:  // LUA_TTABLE
                var is_array = true;
                var max_key = 0;

                // Check for handle
                _lua_pushstring(this.state, this.preallocated_strings['__handle']);
                _lua_rawget(this.state, index-1);
                var handle = this.popStack();
                if (handle) {
                    // Return original value
                    var ptr = this.preallocated_strings["__index"];
                    var success = _luaL_getmetafield(
                        this.state,
                        index,
                        ptr
                    );
                    var __indexfunc = this.popStack();
                    var source = __indexfunc.source;
                    return source;
                }

                ret = {};
                // Populate with values
                _lua_pushnil(this.state);
                _lua_pushnil(this.state);
                while (_lua_next(this.state, index-2)) {
                    var value = this.popStack();
                    var key = this.peekStack(-1);
                    ret[key] = value;

                    if (is_array && typeof key === "number") {
                        if (key > max_key)
                            max_key = key;
                    } else {
                        is_array = false;
                    }
                }
                this.popStack(); // Clear out leftover key
                if (is_array) {
                    newret = [];
                    for (var i = 1; i <= max_key; i++) {
                        if (ret[i] === undefined) {
                            // Abort
                            is_array = false;
                            break;
                        }
                        newret.push(ret[i]);
                    }
                    if (is_array) // not aborted
                        ret = newret;
                }
                break;
            case 6:  // LUA_TFUNCTION
                var self = this;
                var address = _lua_topointer(this.state, index);

                if (_lua_iscfunction(this.state, index)) {
                    var func = FUNCTION_TABLE[address];
                    if (func.unwrapped) {
                        return func.unwrapped;
                    }
                }

                // Don't allocate this stuff for wrapped funcs
                var name = this.get_tmp_name();
                var aname = this.allocate_string(name);

                _lua_pushvalue(this.state, index); // For non-destructive pop
                _lua_setglobal(this.state, aname);
                _free(aname);
                ret = function () {
                    var orig_top = _lua_gettop(self.state);

                    // Push function to stack
                    var aname = self.allocate_string(name);
                    _lua_getglobal(self.state, aname);
                    _free(aname);

                    // Convert arguments to Lua
                    for (var i = 0; i < arguments.length; i++) {
                        self.pushStack(arguments[i])
                    }

                    // Call
                    var failure = _lua_pcallk(self.state, arguments.length, -1, 0) // LUA_MULTRET
                    if (failure) {
                        self.report_error("Failure calling Lua function");
                    }
                    var num_args = _lua_gettop(self.state) - orig_top ;
                    return self.get_stack_args(num_args);
                }
                source = source || "";
                ret.toString = function() { 
                    return "Lua function " + source + ": " + name + " at " + address;
                };
                ret.source = source;
                ret.name = name;
                ret.address = address;
                break;
            default: // Other Lua type
                var inspection = this.inspect(index);
                ret = inspection.typename + " (typecode "+type+"): 0x" + inspection.addrstr;
        }
        return ret;
    },
    popStack: function(source) {
        var ret = this.peekStack(-1, source);
        _lua_settop(this.state, -2);
        return ret;
    },
    pushStack: function(object) {
        if (object === null) {
            object = undefined;
        }
        switch(typeof object) {
            case "undefined" :
                _lua_pushnil(this.state);
                return 1;
            case "boolean" :
                _lua_pushboolean(this.state, object);
                return 1;
            case "number" :
                _lua_pushnumber(this.state, object);
                return 1;
            case "string" :
                var strptr = this.allocate_string(object);
                _lua_pushstring(this.state, strptr);
                _free(strptr);
                return 1;
            case "function" :
                var self = this;
                var wrapper = function (state) {
                    var result = object.apply(self, self.get_stack_args());
                    if (result == undefined || result == null) {
                        result = [];
                    }
                    if (!( typeof result == 'object' && typeof result.length == "number")) {
                        throw new Error("Expected array return type from JS function");
                    }
                    for (var i = 0; i < result.length; i++) {
                        self.pushStack(result[i]);
                    }
                    return result.length;
                }
                wrapper.unwrapped = object;
                var pointer = Runtime.addFunction(wrapper);
                _lua_pushcclosure(this.state, pointer, 0);
                return 1;
            case "object" :
                if (object.length === undefined) {
                    // Object
                    _lua_createtable(this.state, 0, 0);
                    if (object['__handle']) {
                        // Handled object
                        var source = object;
                        var metatable = {
                            '__index': function (table, key) {
                                return [source[key]];
                            },
                            '__newindex': function (table, key, value) {
                                source[key] = value;
                                return [];
                            },
                        }
                        metatable['__index'].source = source;

                        this.pushStack(metatable);
                        _lua_setmetatable(this.state, -2);

                        object = {'__handle': object.toString()};
                    }
                    for (var k in object) {
                        this.pushStack(k);
                        this.pushStack(object[k]);
                        _lua_rawset(this.state, -3);
                    }
                } else {
                    // Array
                    _lua_createtable(this.state, object.length, 0);
                    for (var k in object) {
                        k = 1*k;
                        this.pushStack(k+1)
                        this.pushStack(object[k]);
                        _lua_rawset(this.state, -3);
                    }
                }
                return 1;
            default:
                throw new Error("Cannot push object to stack: " + object);
        }
    },
    get_stack_args: function(num_args) {
        num_args = (num_args === undefined) ? _lua_gettop(this.state) : num_args;
        var args = [];
        for (var i = 0; i < num_args; i++) {
            args.push(this.popStack());
        }
        return args.reverse();
    },
    anon_lua_object: function (object) {
        // Create anonymous Lua object or literal from JS object
        if (object == undefined || object == null) {
            return "nil";
        }
        switch (typeof object) {
            case "string":
                return '"' + object.replace('"','\\"') + '"';
            case "function":
            case "object":
                return this.inject(object);
            default:
                return object.toString();
        }
    },
    get_tmp_name: function() {
        return "_weblua_tmp_" + this.tmp_id++;
    },
    cleanup_tmp: function(name) {
        if (name == "_weblua_tmp_" + (this.tmp_id-1)) {
            // Latest tmp_id, can safely decrement
            tmp_id--;
        }
        // Set global to nil
        _lua_pushnil(this.state);
        var strptr = this.allocate_string(name);
        _lua_setglobal(this.state, strptr);
        _free(strptr);
    },
    stdout: function (str) {console.log("stdout: " +str)},
    stderr: function (str) {console.log("stderr: " +str)},
    report_error: function(defaultMessage) {
        if (this.isInitialized) {
            var errorMessage = this.popStack();
            if (!(errorMessage && errorMessage.length)) errorMessage = defaultMessage;
            this.stderr(errorMessage);
        } else {
            this.stderr(defaultMessage);
        }
        _lua_settop(this.state, 0);
    }
}
// Public functions
this['Lua']['initialize'] = this['Lua'].initialize;
this['Lua']['stdout'] = this['Lua'].stdout;
this['Lua']['stderr'] = this['Lua'].stderr;
this['Lua']['eval'] = this['Lua'].eval;
this['Lua']['exec'] = this['Lua'].exec;
this['Lua']['anon_lua_object'] = this['Lua'].anon_lua_object;
this['Lua']['inject'] = this['Lua'].inject;
this['Lua']['cache'] = this['Lua'].cache;

Lua.cache['items'] = {};
Lua.cache['clear'] = function (evalstring) { delete Lua.cache['items'][evalstring] }
