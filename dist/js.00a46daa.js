// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../node_modules/piexifjs/piexif.js":[function(require,module,exports) {
/* piexifjs

The MIT License (MIT)

Copyright (c) 2014, 2015 hMatoba(https://github.com/hMatoba)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

(function () {
    "use strict";
    var that = {};
    that.version = "1.0.4";

    that.remove = function (jpeg) {
        var b64 = false;
        if (jpeg.slice(0, 2) == "\xff\xd8") {
        } else if (jpeg.slice(0, 23) == "data:image/jpeg;base64," || jpeg.slice(0, 22) == "data:image/jpg;base64,") {
            jpeg = atob(jpeg.split(",")[1]);
            b64 = true;
        } else {
            throw ("Given data is not jpeg.");
        }
        
        var segments = splitIntoSegments(jpeg);
        var newSegments = segments.filter(function(seg){
          return  !(seg.slice(0, 2) == "\xff\xe1" &&
                   seg.slice(4, 10) == "Exif\x00\x00"); 
        });
        
        var new_data = newSegments.join("");
        if (b64) {
            new_data = "data:image/jpeg;base64," + btoa(new_data);
        }

        return new_data;
    };


    that.insert = function (exif, jpeg) {
        var b64 = false;
        if (exif.slice(0, 6) != "\x45\x78\x69\x66\x00\x00") {
            throw ("Given data is not exif.");
        }
        if (jpeg.slice(0, 2) == "\xff\xd8") {
        } else if (jpeg.slice(0, 23) == "data:image/jpeg;base64," || jpeg.slice(0, 22) == "data:image/jpg;base64,") {
            jpeg = atob(jpeg.split(",")[1]);
            b64 = true;
        } else {
            throw ("Given data is not jpeg.");
        }

        var exifStr = "\xff\xe1" + pack(">H", [exif.length + 2]) + exif;
        var segments = splitIntoSegments(jpeg);
        var new_data = mergeSegments(segments, exifStr);
        if (b64) {
            new_data = "data:image/jpeg;base64," + btoa(new_data);
        }

        return new_data;
    };


    that.load = function (data) {
        var input_data;
        if (typeof (data) == "string") {
            if (data.slice(0, 2) == "\xff\xd8") {
                input_data = data;
            } else if (data.slice(0, 23) == "data:image/jpeg;base64," || data.slice(0, 22) == "data:image/jpg;base64,") {
                input_data = atob(data.split(",")[1]);
            } else if (data.slice(0, 4) == "Exif") {
                input_data = data.slice(6);
            } else {
                throw ("'load' gots invalid file data.");
            }
        } else {
            throw ("'load' gots invalid type argument.");
        }

        var exifDict = {};
        var exif_dict = {
            "0th": {},
            "Exif": {},
            "GPS": {},
            "Interop": {},
            "1st": {},
            "thumbnail": null
        };
        var exifReader = new ExifReader(input_data);
        if (exifReader.tiftag === null) {
            return exif_dict;
        }

        if (exifReader.tiftag.slice(0, 2) == "\x49\x49") {
            exifReader.endian_mark = "<";
        } else {
            exifReader.endian_mark = ">";
        }

        var pointer = unpack(exifReader.endian_mark + "L",
            exifReader.tiftag.slice(4, 8))[0];
        exif_dict["0th"] = exifReader.get_ifd(pointer, "0th");

        var first_ifd_pointer = exif_dict["0th"]["first_ifd_pointer"];
        delete exif_dict["0th"]["first_ifd_pointer"];

        if (34665 in exif_dict["0th"]) {
            pointer = exif_dict["0th"][34665];
            exif_dict["Exif"] = exifReader.get_ifd(pointer, "Exif");
        }
        if (34853 in exif_dict["0th"]) {
            pointer = exif_dict["0th"][34853];
            exif_dict["GPS"] = exifReader.get_ifd(pointer, "GPS");
        }
        if (40965 in exif_dict["Exif"]) {
            pointer = exif_dict["Exif"][40965];
            exif_dict["Interop"] = exifReader.get_ifd(pointer, "Interop");
        }
        if (first_ifd_pointer != "\x00\x00\x00\x00") {
            pointer = unpack(exifReader.endian_mark + "L",
                first_ifd_pointer)[0];
            exif_dict["1st"] = exifReader.get_ifd(pointer, "1st");
            if ((513 in exif_dict["1st"]) && (514 in exif_dict["1st"])) {
                var end = exif_dict["1st"][513] + exif_dict["1st"][514];
                var thumb = exifReader.tiftag.slice(exif_dict["1st"][513], end);
                exif_dict["thumbnail"] = thumb;
            }
        }

        return exif_dict;
    };


    that.dump = function (exif_dict_original) {
        var TIFF_HEADER_LENGTH = 8;

        var exif_dict = copy(exif_dict_original);
        var header = "Exif\x00\x00\x4d\x4d\x00\x2a\x00\x00\x00\x08";
        var exif_is = false;
        var gps_is = false;
        var interop_is = false;
        var first_is = false;

        var zeroth_ifd,
            exif_ifd,
            interop_ifd,
            gps_ifd,
            first_ifd;
        
        if ("0th" in exif_dict) {
            zeroth_ifd = exif_dict["0th"];
        } else {
            zeroth_ifd = {};
        }
        
        if ((("Exif" in exif_dict) && (Object.keys(exif_dict["Exif"]).length)) ||
            (("Interop" in exif_dict) && (Object.keys(exif_dict["Interop"]).length))) {
            zeroth_ifd[34665] = 1;
            exif_is = true;
            exif_ifd = exif_dict["Exif"];
            if (("Interop" in exif_dict) && Object.keys(exif_dict["Interop"]).length) {
                exif_ifd[40965] = 1;
                interop_is = true;
                interop_ifd = exif_dict["Interop"];
            } else if (Object.keys(exif_ifd).indexOf(that.ExifIFD.InteroperabilityTag.toString()) > -1) {
                delete exif_ifd[40965];
            }
        } else if (Object.keys(zeroth_ifd).indexOf(that.ImageIFD.ExifTag.toString()) > -1) {
            delete zeroth_ifd[34665];
        }

        if (("GPS" in exif_dict) && (Object.keys(exif_dict["GPS"]).length)) {
            zeroth_ifd[that.ImageIFD.GPSTag] = 1;
            gps_is = true;
            gps_ifd = exif_dict["GPS"];
        } else if (Object.keys(zeroth_ifd).indexOf(that.ImageIFD.GPSTag.toString()) > -1) {
            delete zeroth_ifd[that.ImageIFD.GPSTag];
        }
        
        if (("1st" in exif_dict) &&
            ("thumbnail" in exif_dict) &&
            (exif_dict["thumbnail"] != null)) {
            first_is = true;
            exif_dict["1st"][513] = 1;
            exif_dict["1st"][514] = 1;
            first_ifd = exif_dict["1st"];
        }
        
        var zeroth_set = _dict_to_bytes(zeroth_ifd, "0th", 0);
        var zeroth_length = (zeroth_set[0].length + exif_is * 12 + gps_is * 12 + 4 +
            zeroth_set[1].length);

        var exif_set,
            exif_bytes = "",
            exif_length = 0,
            gps_set,
            gps_bytes = "",
            gps_length = 0,
            interop_set,
            interop_bytes = "",
            interop_length = 0,
            first_set,
            first_bytes = "",
            thumbnail;
        if (exif_is) {
            exif_set = _dict_to_bytes(exif_ifd, "Exif", zeroth_length);
            exif_length = exif_set[0].length + interop_is * 12 + exif_set[1].length;
        }
        if (gps_is) {
            gps_set = _dict_to_bytes(gps_ifd, "GPS", zeroth_length + exif_length);
            gps_bytes = gps_set.join("");
            gps_length = gps_bytes.length;
        }
        if (interop_is) {
            var offset = zeroth_length + exif_length + gps_length;
            interop_set = _dict_to_bytes(interop_ifd, "Interop", offset);
            interop_bytes = interop_set.join("");
            interop_length = interop_bytes.length;
        }
        if (first_is) {
            var offset = zeroth_length + exif_length + gps_length + interop_length;
            first_set = _dict_to_bytes(first_ifd, "1st", offset);
            thumbnail = _get_thumbnail(exif_dict["thumbnail"]);
            if (thumbnail.length > 64000) {
                throw ("Given thumbnail is too large. max 64kB");
            }
        }

        var exif_pointer = "",
            gps_pointer = "",
            interop_pointer = "",
            first_ifd_pointer = "\x00\x00\x00\x00";
        if (exif_is) {
            var pointer_value = TIFF_HEADER_LENGTH + zeroth_length;
            var pointer_str = pack(">L", [pointer_value]);
            var key = 34665;
            var key_str = pack(">H", [key]);
            var type_str = pack(">H", [TYPES["Long"]]);
            var length_str = pack(">L", [1]);
            exif_pointer = key_str + type_str + length_str + pointer_str;
        }
        if (gps_is) {
            var pointer_value = TIFF_HEADER_LENGTH + zeroth_length + exif_length;
            var pointer_str = pack(">L", [pointer_value]);
            var key = 34853;
            var key_str = pack(">H", [key]);
            var type_str = pack(">H", [TYPES["Long"]]);
            var length_str = pack(">L", [1]);
            gps_pointer = key_str + type_str + length_str + pointer_str;
        }
        if (interop_is) {
            var pointer_value = (TIFF_HEADER_LENGTH +
                zeroth_length + exif_length + gps_length);
            var pointer_str = pack(">L", [pointer_value]);
            var key = 40965;
            var key_str = pack(">H", [key]);
            var type_str = pack(">H", [TYPES["Long"]]);
            var length_str = pack(">L", [1]);
            interop_pointer = key_str + type_str + length_str + pointer_str;
        }
        if (first_is) {
            var pointer_value = (TIFF_HEADER_LENGTH + zeroth_length +
                exif_length + gps_length + interop_length);
            first_ifd_pointer = pack(">L", [pointer_value]);
            var thumbnail_pointer = (pointer_value + first_set[0].length + 24 +
                4 + first_set[1].length);
            var thumbnail_p_bytes = ("\x02\x01\x00\x04\x00\x00\x00\x01" +
                pack(">L", [thumbnail_pointer]));
            var thumbnail_length_bytes = ("\x02\x02\x00\x04\x00\x00\x00\x01" +
                pack(">L", [thumbnail.length]));
            first_bytes = (first_set[0] + thumbnail_p_bytes +
                thumbnail_length_bytes + "\x00\x00\x00\x00" +
                first_set[1] + thumbnail);
        }

        var zeroth_bytes = (zeroth_set[0] + exif_pointer + gps_pointer +
            first_ifd_pointer + zeroth_set[1]);
        if (exif_is) {
            exif_bytes = exif_set[0] + interop_pointer + exif_set[1];
        }

        return (header + zeroth_bytes + exif_bytes + gps_bytes +
            interop_bytes + first_bytes);
    };


    function copy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }


    function _get_thumbnail(jpeg) {
        var segments = splitIntoSegments(jpeg);
        while (("\xff\xe0" <= segments[1].slice(0, 2)) && (segments[1].slice(0, 2) <= "\xff\xef")) {
            segments = [segments[0]].concat(segments.slice(2));
        }
        return segments.join("");
    }


    function _pack_byte(array) {
        return pack(">" + nStr("B", array.length), array);
    }


    function _pack_short(array) {
        return pack(">" + nStr("H", array.length), array);
    }


    function _pack_long(array) {
        return pack(">" + nStr("L", array.length), array);
    }


    function _value_to_bytes(raw_value, value_type, offset) {
        var four_bytes_over = "";
        var value_str = "";
        var length,
            new_value,
            num,
            den;

        if (value_type == "Byte") {
            length = raw_value.length;
            if (length <= 4) {
                value_str = (_pack_byte(raw_value) +
                    nStr("\x00", 4 - length));
            } else {
                value_str = pack(">L", [offset]);
                four_bytes_over = _pack_byte(raw_value);
            }
        } else if (value_type == "Short") {
            length = raw_value.length;
            if (length <= 2) {
                value_str = (_pack_short(raw_value) +
                    nStr("\x00\x00", 2 - length));
            } else {
                value_str = pack(">L", [offset]);
                four_bytes_over = _pack_short(raw_value);
            }
        } else if (value_type == "Long") {
            length = raw_value.length;
            if (length <= 1) {
                value_str = _pack_long(raw_value);
            } else {
                value_str = pack(">L", [offset]);
                four_bytes_over = _pack_long(raw_value);
            }
        } else if (value_type == "Ascii") {
            new_value = raw_value + "\x00";
            length = new_value.length;
            if (length > 4) {
                value_str = pack(">L", [offset]);
                four_bytes_over = new_value;
            } else {
                value_str = new_value + nStr("\x00", 4 - length);
            }
        } else if (value_type == "Rational") {
            if (typeof (raw_value[0]) == "number") {
                length = 1;
                num = raw_value[0];
                den = raw_value[1];
                new_value = pack(">L", [num]) + pack(">L", [den]);
            } else {
                length = raw_value.length;
                new_value = "";
                for (var n = 0; n < length; n++) {
                    num = raw_value[n][0];
                    den = raw_value[n][1];
                    new_value += (pack(">L", [num]) +
                        pack(">L", [den]));
                }
            }
            value_str = pack(">L", [offset]);
            four_bytes_over = new_value;
        } else if (value_type == "SRational") {
            if (typeof (raw_value[0]) == "number") {
                length = 1;
                num = raw_value[0];
                den = raw_value[1];
                new_value = pack(">l", [num]) + pack(">l", [den]);
            } else {
                length = raw_value.length;
                new_value = "";
                for (var n = 0; n < length; n++) {
                    num = raw_value[n][0];
                    den = raw_value[n][1];
                    new_value += (pack(">l", [num]) +
                        pack(">l", [den]));
                }
            }
            value_str = pack(">L", [offset]);
            four_bytes_over = new_value;
        } else if (value_type == "Undefined") {
            length = raw_value.length;
            if (length > 4) {
                value_str = pack(">L", [offset]);
                four_bytes_over = raw_value;
            } else {
                value_str = raw_value + nStr("\x00", 4 - length);
            }
        }

        var length_str = pack(">L", [length]);

        return [length_str, value_str, four_bytes_over];
    }

    function _dict_to_bytes(ifd_dict, ifd, ifd_offset) {
        var TIFF_HEADER_LENGTH = 8;
        var tag_count = Object.keys(ifd_dict).length;
        var entry_header = pack(">H", [tag_count]);
        var entries_length;
        if (["0th", "1st"].indexOf(ifd) > -1) {
            entries_length = 2 + tag_count * 12 + 4;
        } else {
            entries_length = 2 + tag_count * 12;
        }
        var entries = "";
        var values = "";
        var key;

        for (var key in ifd_dict) {
            if (typeof (key) == "string") {
                key = parseInt(key);
            }
            if ((ifd == "0th") && ([34665, 34853].indexOf(key) > -1)) {
                continue;
            } else if ((ifd == "Exif") && (key == 40965)) {
                continue;
            } else if ((ifd == "1st") && ([513, 514].indexOf(key) > -1)) {
                continue;
            }

            var raw_value = ifd_dict[key];
            var key_str = pack(">H", [key]);
            var value_type = TAGS[ifd][key]["type"];
            var type_str = pack(">H", [TYPES[value_type]]);

            if (typeof (raw_value) == "number") {
                raw_value = [raw_value];
            }
            var offset = TIFF_HEADER_LENGTH + entries_length + ifd_offset + values.length;
            var b = _value_to_bytes(raw_value, value_type, offset);
            var length_str = b[0];
            var value_str = b[1];
            var four_bytes_over = b[2];

            entries += key_str + type_str + length_str + value_str;
            values += four_bytes_over;
        }

        return [entry_header + entries, values];
    }



    function ExifReader(data) {
        var segments,
            app1;
        if (data.slice(0, 2) == "\xff\xd8") { // JPEG
            segments = splitIntoSegments(data);
            app1 = getExifSeg(segments);
            if (app1) {
                this.tiftag = app1.slice(10);
            } else {
                this.tiftag = null;
            }
        } else if (["\x49\x49", "\x4d\x4d"].indexOf(data.slice(0, 2)) > -1) { // TIFF
            this.tiftag = data;
        } else if (data.slice(0, 4) == "Exif") { // Exif
            this.tiftag = data.slice(6);
        } else {
            throw ("Given file is neither JPEG nor TIFF.");
        }
    }

    ExifReader.prototype = {
        get_ifd: function (pointer, ifd_name) {
            var ifd_dict = {};
            var tag_count = unpack(this.endian_mark + "H",
                this.tiftag.slice(pointer, pointer + 2))[0];
            var offset = pointer + 2;
            var t;
            if (["0th", "1st"].indexOf(ifd_name) > -1) {
                t = "Image";
            } else {
                t = ifd_name;
            }

            for (var x = 0; x < tag_count; x++) {
                pointer = offset + 12 * x;
                var tag = unpack(this.endian_mark + "H",
                    this.tiftag.slice(pointer, pointer + 2))[0];
                var value_type = unpack(this.endian_mark + "H",
                    this.tiftag.slice(pointer + 2, pointer + 4))[0];
                var value_num = unpack(this.endian_mark + "L",
                    this.tiftag.slice(pointer + 4, pointer + 8))[0];
                var value = this.tiftag.slice(pointer + 8, pointer + 12);

                var v_set = [value_type, value_num, value];
                if (tag in TAGS[t]) {
                    ifd_dict[tag] = this.convert_value(v_set);
                }
            }

            if (ifd_name == "0th") {
                pointer = offset + 12 * tag_count;
                ifd_dict["first_ifd_pointer"] = this.tiftag.slice(pointer, pointer + 4);
            }

            return ifd_dict;
        },

        convert_value: function (val) {
            var data = null;
            var t = val[0];
            var length = val[1];
            var value = val[2];
            var pointer;

            if (t == 1) { // BYTE
                if (length > 4) {
                    pointer = unpack(this.endian_mark + "L", value)[0];
                    data = unpack(this.endian_mark + nStr("B", length),
                        this.tiftag.slice(pointer, pointer + length));
                } else {
                    data = unpack(this.endian_mark + nStr("B", length), value.slice(0, length));
                }
            } else if (t == 2) { // ASCII
                if (length > 4) {
                    pointer = unpack(this.endian_mark + "L", value)[0];
                    data = this.tiftag.slice(pointer, pointer + length - 1);
                } else {
                    data = value.slice(0, length - 1);
                }
            } else if (t == 3) { // SHORT
                if (length > 2) {
                    pointer = unpack(this.endian_mark + "L", value)[0];
                    data = unpack(this.endian_mark + nStr("H", length),
                        this.tiftag.slice(pointer, pointer + length * 2));
                } else {
                    data = unpack(this.endian_mark + nStr("H", length),
                        value.slice(0, length * 2));
                }
            } else if (t == 4) { // LONG
                if (length > 1) {
                    pointer = unpack(this.endian_mark + "L", value)[0];
                    data = unpack(this.endian_mark + nStr("L", length),
                        this.tiftag.slice(pointer, pointer + length * 4));
                } else {
                    data = unpack(this.endian_mark + nStr("L", length),
                        value);
                }
            } else if (t == 5) { // RATIONAL
                pointer = unpack(this.endian_mark + "L", value)[0];
                if (length > 1) {
                    data = [];
                    for (var x = 0; x < length; x++) {
                        data.push([unpack(this.endian_mark + "L",
                                this.tiftag.slice(pointer + x * 8, pointer + 4 + x * 8))[0],
                                   unpack(this.endian_mark + "L",
                                this.tiftag.slice(pointer + 4 + x * 8, pointer + 8 + x * 8))[0]
                                   ]);
                    }
                } else {
                    data = [unpack(this.endian_mark + "L",
                            this.tiftag.slice(pointer, pointer + 4))[0],
                            unpack(this.endian_mark + "L",
                            this.tiftag.slice(pointer + 4, pointer + 8))[0]
                            ];
                }
            } else if (t == 7) { // UNDEFINED BYTES
                if (length > 4) {
                    pointer = unpack(this.endian_mark + "L", value)[0];
                    data = this.tiftag.slice(pointer, pointer + length);
                } else {
                    data = value.slice(0, length);
                }
            } else if (t == 10) { // SRATIONAL
                pointer = unpack(this.endian_mark + "L", value)[0];
                if (length > 1) {
                    data = [];
                    for (var x = 0; x < length; x++) {
                        data.push([unpack(this.endian_mark + "l",
                                this.tiftag.slice(pointer + x * 8, pointer + 4 + x * 8))[0],
                                   unpack(this.endian_mark + "l",
                                this.tiftag.slice(pointer + 4 + x * 8, pointer + 8 + x * 8))[0]
                                  ]);
                    }
                } else {
                    data = [unpack(this.endian_mark + "l",
                            this.tiftag.slice(pointer, pointer + 4))[0],
                            unpack(this.endian_mark + "l",
                            this.tiftag.slice(pointer + 4, pointer + 8))[0]
                           ];
                }
            } else {
                throw ("Exif might be wrong. Got incorrect value " +
                    "type to decode. type:" + t);
            }

            if ((data instanceof Array) && (data.length == 1)) {
                return data[0];
            } else {
                return data;
            }
        },
    };


    if (typeof window !== "undefined" && typeof window.btoa === "function") {
        var btoa = window.btoa;
    }
    if (typeof btoa === "undefined") {
        var btoa = function (input) {        var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

            while (i < input.length) {

                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                keyStr.charAt(enc3) + keyStr.charAt(enc4);

            }

            return output;
        };
    }
    
    
    if (typeof window !== "undefined" && typeof window.atob === "function") {
        var atob = window.atob;
    }
    if (typeof atob === "undefined") {
        var atob = function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
            var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            while (i < input.length) {

                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

            }

            return output;
        };
    }


    function getImageSize(imageArray) {
        var segments = slice2Segments(imageArray);
        var seg,
            width,
            height,
            SOF = [192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207];

        for (var x = 0; x < segments.length; x++) {
            seg = segments[x];
            if (SOF.indexOf(seg[1]) >= 0) {
                height = seg[5] * 256 + seg[6];
                width = seg[7] * 256 + seg[8];
                break;
            }
        }
        return [width, height];
    }


    function pack(mark, array) {
        if (!(array instanceof Array)) {
            throw ("'pack' error. Got invalid type argument.");
        }
        if ((mark.length - 1) != array.length) {
            throw ("'pack' error. " + (mark.length - 1) + " marks, " + array.length + " elements.");
        }

        var littleEndian;
        if (mark[0] == "<") {
            littleEndian = true;
        } else if (mark[0] == ">") {
            littleEndian = false;
        } else {
            throw ("");
        }
        var packed = "";
        var p = 1;
        var val = null;
        var c = null;
        var valStr = null;

        while (c = mark[p]) {
            if (c.toLowerCase() == "b") {
                val = array[p - 1];
                if ((c == "b") && (val < 0)) {
                    val += 0x100;
                }
                if ((val > 0xff) || (val < 0)) {
                    throw ("'pack' error.");
                } else {
                    valStr = String.fromCharCode(val);
                }
            } else if (c == "H") {
                val = array[p - 1];
                if ((val > 0xffff) || (val < 0)) {
                    throw ("'pack' error.");
                } else {
                    valStr = String.fromCharCode(Math.floor((val % 0x10000) / 0x100)) +
                        String.fromCharCode(val % 0x100);
                    if (littleEndian) {
                        valStr = valStr.split("").reverse().join("");
                    }
                }
            } else if (c.toLowerCase() == "l") {
                val = array[p - 1];
                if ((c == "l") && (val < 0)) {
                    val += 0x100000000;
                }
                if ((val > 0xffffffff) || (val < 0)) {
                    throw ("'pack' error.");
                } else {
                    valStr = String.fromCharCode(Math.floor(val / 0x1000000)) +
                        String.fromCharCode(Math.floor((val % 0x1000000) / 0x10000)) +
                        String.fromCharCode(Math.floor((val % 0x10000) / 0x100)) +
                        String.fromCharCode(val % 0x100);
                    if (littleEndian) {
                        valStr = valStr.split("").reverse().join("");
                    }
                }
            } else {
                throw ("'pack' error.");
            }

            packed += valStr;
            p += 1;
        }

        return packed;
    }

    function unpack(mark, str) {
        if (typeof (str) != "string") {
            throw ("'unpack' error. Got invalid type argument.");
        }
        var l = 0;
        for (var markPointer = 1; markPointer < mark.length; markPointer++) {
            if (mark[markPointer].toLowerCase() == "b") {
                l += 1;
            } else if (mark[markPointer].toLowerCase() == "h") {
                l += 2;
            } else if (mark[markPointer].toLowerCase() == "l") {
                l += 4;
            } else {
                throw ("'unpack' error. Got invalid mark.");
            }
        }

        if (l != str.length) {
            throw ("'unpack' error. Mismatch between symbol and string length. " + l + ":" + str.length);
        }

        var littleEndian;
        if (mark[0] == "<") {
            littleEndian = true;
        } else if (mark[0] == ">") {
            littleEndian = false;
        } else {
            throw ("'unpack' error.");
        }
        var unpacked = [];
        var strPointer = 0;
        var p = 1;
        var val = null;
        var c = null;
        var length = null;
        var sliced = "";

        while (c = mark[p]) {
            if (c.toLowerCase() == "b") {
                length = 1;
                sliced = str.slice(strPointer, strPointer + length);
                val = sliced.charCodeAt(0);
                if ((c == "b") && (val >= 0x80)) {
                    val -= 0x100;
                }
            } else if (c == "H") {
                length = 2;
                sliced = str.slice(strPointer, strPointer + length);
                if (littleEndian) {
                    sliced = sliced.split("").reverse().join("");
                }
                val = sliced.charCodeAt(0) * 0x100 +
                    sliced.charCodeAt(1);
            } else if (c.toLowerCase() == "l") {
                length = 4;
                sliced = str.slice(strPointer, strPointer + length);
                if (littleEndian) {
                    sliced = sliced.split("").reverse().join("");
                }
                val = sliced.charCodeAt(0) * 0x1000000 +
                    sliced.charCodeAt(1) * 0x10000 +
                    sliced.charCodeAt(2) * 0x100 +
                    sliced.charCodeAt(3);
                if ((c == "l") && (val >= 0x80000000)) {
                    val -= 0x100000000;
                }
            } else {
                throw ("'unpack' error. " + c);
            }

            unpacked.push(val);
            strPointer += length;
            p += 1;
        }

        return unpacked;
    }

    function nStr(ch, num) {
        var str = "";
        for (var i = 0; i < num; i++) {
            str += ch;
        }
        return str;
    }

    function splitIntoSegments(data) {
        if (data.slice(0, 2) != "\xff\xd8") {
            throw ("Given data isn't JPEG.");
        }

        var head = 2;
        var segments = ["\xff\xd8"];
        while (true) {
            if (data.slice(head, head + 2) == "\xff\xda") {
                segments.push(data.slice(head));
                break;
            } else {
                var length = unpack(">H", data.slice(head + 2, head + 4))[0];
                var endPoint = head + length + 2;
                segments.push(data.slice(head, endPoint));
                head = endPoint;
            }

            if (head >= data.length) {
                throw ("Wrong JPEG data.");
            }
        }
        return segments;
    }


    function getExifSeg(segments) {
        var seg;
        for (var i = 0; i < segments.length; i++) {
            seg = segments[i];
            if (seg.slice(0, 2) == "\xff\xe1" &&
                   seg.slice(4, 10) == "Exif\x00\x00") {
                return seg;
            }
        }
        return null;
    }


    function mergeSegments(segments, exif) {
        
        if (segments[1].slice(0, 2) == "\xff\xe0" &&
            (segments[2].slice(0, 2) == "\xff\xe1" &&
             segments[2].slice(4, 10) == "Exif\x00\x00")) {
            if (exif) {
                segments[2] = exif;
                segments = ["\xff\xd8"].concat(segments.slice(2));
            } else if (exif == null) {
                segments = segments.slice(0, 2).concat(segments.slice(3));
            } else {
                segments = segments.slice(0).concat(segments.slice(2));
            }
        } else if (segments[1].slice(0, 2) == "\xff\xe0") {
            if (exif) {
                segments[1] = exif;
            }
        } else if (segments[1].slice(0, 2) == "\xff\xe1" &&
                   segments[1].slice(4, 10) == "Exif\x00\x00") {
            if (exif) {
                segments[1] = exif;
            } else if (exif == null) {
                segments = segments.slice(0).concat(segments.slice(2));
            }
        } else {
            if (exif) {
                segments = [segments[0], exif].concat(segments.slice(1));
            }
        }
        
        return segments.join("");
    }


    function toHex(str) {
        var hexStr = "";
        for (var i = 0; i < str.length; i++) {
            var h = str.charCodeAt(i);
            var hex = ((h < 10) ? "0" : "") + h.toString(16);
            hexStr += hex + " ";
        }
        return hexStr;
    }


    var TYPES = {
        "Byte": 1,
        "Ascii": 2,
        "Short": 3,
        "Long": 4,
        "Rational": 5,
        "Undefined": 7,
        "SLong": 9,
        "SRational": 10
    };


    var TAGS = {
        'Image': {
            11: {
                'name': 'ProcessingSoftware',
                'type': 'Ascii'
            },
            254: {
                'name': 'NewSubfileType',
                'type': 'Long'
            },
            255: {
                'name': 'SubfileType',
                'type': 'Short'
            },
            256: {
                'name': 'ImageWidth',
                'type': 'Long'
            },
            257: {
                'name': 'ImageLength',
                'type': 'Long'
            },
            258: {
                'name': 'BitsPerSample',
                'type': 'Short'
            },
            259: {
                'name': 'Compression',
                'type': 'Short'
            },
            262: {
                'name': 'PhotometricInterpretation',
                'type': 'Short'
            },
            263: {
                'name': 'Threshholding',
                'type': 'Short'
            },
            264: {
                'name': 'CellWidth',
                'type': 'Short'
            },
            265: {
                'name': 'CellLength',
                'type': 'Short'
            },
            266: {
                'name': 'FillOrder',
                'type': 'Short'
            },
            269: {
                'name': 'DocumentName',
                'type': 'Ascii'
            },
            270: {
                'name': 'ImageDescription',
                'type': 'Ascii'
            },
            271: {
                'name': 'Make',
                'type': 'Ascii'
            },
            272: {
                'name': 'Model',
                'type': 'Ascii'
            },
            273: {
                'name': 'StripOffsets',
                'type': 'Long'
            },
            274: {
                'name': 'Orientation',
                'type': 'Short'
            },
            277: {
                'name': 'SamplesPerPixel',
                'type': 'Short'
            },
            278: {
                'name': 'RowsPerStrip',
                'type': 'Long'
            },
            279: {
                'name': 'StripByteCounts',
                'type': 'Long'
            },
            282: {
                'name': 'XResolution',
                'type': 'Rational'
            },
            283: {
                'name': 'YResolution',
                'type': 'Rational'
            },
            284: {
                'name': 'PlanarConfiguration',
                'type': 'Short'
            },
            290: {
                'name': 'GrayResponseUnit',
                'type': 'Short'
            },
            291: {
                'name': 'GrayResponseCurve',
                'type': 'Short'
            },
            292: {
                'name': 'T4Options',
                'type': 'Long'
            },
            293: {
                'name': 'T6Options',
                'type': 'Long'
            },
            296: {
                'name': 'ResolutionUnit',
                'type': 'Short'
            },
            301: {
                'name': 'TransferFunction',
                'type': 'Short'
            },
            305: {
                'name': 'Software',
                'type': 'Ascii'
            },
            306: {
                'name': 'DateTime',
                'type': 'Ascii'
            },
            315: {
                'name': 'Artist',
                'type': 'Ascii'
            },
            316: {
                'name': 'HostComputer',
                'type': 'Ascii'
            },
            317: {
                'name': 'Predictor',
                'type': 'Short'
            },
            318: {
                'name': 'WhitePoint',
                'type': 'Rational'
            },
            319: {
                'name': 'PrimaryChromaticities',
                'type': 'Rational'
            },
            320: {
                'name': 'ColorMap',
                'type': 'Short'
            },
            321: {
                'name': 'HalftoneHints',
                'type': 'Short'
            },
            322: {
                'name': 'TileWidth',
                'type': 'Short'
            },
            323: {
                'name': 'TileLength',
                'type': 'Short'
            },
            324: {
                'name': 'TileOffsets',
                'type': 'Short'
            },
            325: {
                'name': 'TileByteCounts',
                'type': 'Short'
            },
            330: {
                'name': 'SubIFDs',
                'type': 'Long'
            },
            332: {
                'name': 'InkSet',
                'type': 'Short'
            },
            333: {
                'name': 'InkNames',
                'type': 'Ascii'
            },
            334: {
                'name': 'NumberOfInks',
                'type': 'Short'
            },
            336: {
                'name': 'DotRange',
                'type': 'Byte'
            },
            337: {
                'name': 'TargetPrinter',
                'type': 'Ascii'
            },
            338: {
                'name': 'ExtraSamples',
                'type': 'Short'
            },
            339: {
                'name': 'SampleFormat',
                'type': 'Short'
            },
            340: {
                'name': 'SMinSampleValue',
                'type': 'Short'
            },
            341: {
                'name': 'SMaxSampleValue',
                'type': 'Short'
            },
            342: {
                'name': 'TransferRange',
                'type': 'Short'
            },
            343: {
                'name': 'ClipPath',
                'type': 'Byte'
            },
            344: {
                'name': 'XClipPathUnits',
                'type': 'Long'
            },
            345: {
                'name': 'YClipPathUnits',
                'type': 'Long'
            },
            346: {
                'name': 'Indexed',
                'type': 'Short'
            },
            347: {
                'name': 'JPEGTables',
                'type': 'Undefined'
            },
            351: {
                'name': 'OPIProxy',
                'type': 'Short'
            },
            512: {
                'name': 'JPEGProc',
                'type': 'Long'
            },
            513: {
                'name': 'JPEGInterchangeFormat',
                'type': 'Long'
            },
            514: {
                'name': 'JPEGInterchangeFormatLength',
                'type': 'Long'
            },
            515: {
                'name': 'JPEGRestartInterval',
                'type': 'Short'
            },
            517: {
                'name': 'JPEGLosslessPredictors',
                'type': 'Short'
            },
            518: {
                'name': 'JPEGPointTransforms',
                'type': 'Short'
            },
            519: {
                'name': 'JPEGQTables',
                'type': 'Long'
            },
            520: {
                'name': 'JPEGDCTables',
                'type': 'Long'
            },
            521: {
                'name': 'JPEGACTables',
                'type': 'Long'
            },
            529: {
                'name': 'YCbCrCoefficients',
                'type': 'Rational'
            },
            530: {
                'name': 'YCbCrSubSampling',
                'type': 'Short'
            },
            531: {
                'name': 'YCbCrPositioning',
                'type': 'Short'
            },
            532: {
                'name': 'ReferenceBlackWhite',
                'type': 'Rational'
            },
            700: {
                'name': 'XMLPacket',
                'type': 'Byte'
            },
            18246: {
                'name': 'Rating',
                'type': 'Short'
            },
            18249: {
                'name': 'RatingPercent',
                'type': 'Short'
            },
            32781: {
                'name': 'ImageID',
                'type': 'Ascii'
            },
            33421: {
                'name': 'CFARepeatPatternDim',
                'type': 'Short'
            },
            33422: {
                'name': 'CFAPattern',
                'type': 'Byte'
            },
            33423: {
                'name': 'BatteryLevel',
                'type': 'Rational'
            },
            33432: {
                'name': 'Copyright',
                'type': 'Ascii'
            },
            33434: {
                'name': 'ExposureTime',
                'type': 'Rational'
            },
            34377: {
                'name': 'ImageResources',
                'type': 'Byte'
            },
            34665: {
                'name': 'ExifTag',
                'type': 'Long'
            },
            34675: {
                'name': 'InterColorProfile',
                'type': 'Undefined'
            },
            34853: {
                'name': 'GPSTag',
                'type': 'Long'
            },
            34857: {
                'name': 'Interlace',
                'type': 'Short'
            },
            34858: {
                'name': 'TimeZoneOffset',
                'type': 'Long'
            },
            34859: {
                'name': 'SelfTimerMode',
                'type': 'Short'
            },
            37387: {
                'name': 'FlashEnergy',
                'type': 'Rational'
            },
            37388: {
                'name': 'SpatialFrequencyResponse',
                'type': 'Undefined'
            },
            37389: {
                'name': 'Noise',
                'type': 'Undefined'
            },
            37390: {
                'name': 'FocalPlaneXResolution',
                'type': 'Rational'
            },
            37391: {
                'name': 'FocalPlaneYResolution',
                'type': 'Rational'
            },
            37392: {
                'name': 'FocalPlaneResolutionUnit',
                'type': 'Short'
            },
            37393: {
                'name': 'ImageNumber',
                'type': 'Long'
            },
            37394: {
                'name': 'SecurityClassification',
                'type': 'Ascii'
            },
            37395: {
                'name': 'ImageHistory',
                'type': 'Ascii'
            },
            37397: {
                'name': 'ExposureIndex',
                'type': 'Rational'
            },
            37398: {
                'name': 'TIFFEPStandardID',
                'type': 'Byte'
            },
            37399: {
                'name': 'SensingMethod',
                'type': 'Short'
            },
            40091: {
                'name': 'XPTitle',
                'type': 'Byte'
            },
            40092: {
                'name': 'XPComment',
                'type': 'Byte'
            },
            40093: {
                'name': 'XPAuthor',
                'type': 'Byte'
            },
            40094: {
                'name': 'XPKeywords',
                'type': 'Byte'
            },
            40095: {
                'name': 'XPSubject',
                'type': 'Byte'
            },
            50341: {
                'name': 'PrintImageMatching',
                'type': 'Undefined'
            },
            50706: {
                'name': 'DNGVersion',
                'type': 'Byte'
            },
            50707: {
                'name': 'DNGBackwardVersion',
                'type': 'Byte'
            },
            50708: {
                'name': 'UniqueCameraModel',
                'type': 'Ascii'
            },
            50709: {
                'name': 'LocalizedCameraModel',
                'type': 'Byte'
            },
            50710: {
                'name': 'CFAPlaneColor',
                'type': 'Byte'
            },
            50711: {
                'name': 'CFALayout',
                'type': 'Short'
            },
            50712: {
                'name': 'LinearizationTable',
                'type': 'Short'
            },
            50713: {
                'name': 'BlackLevelRepeatDim',
                'type': 'Short'
            },
            50714: {
                'name': 'BlackLevel',
                'type': 'Rational'
            },
            50715: {
                'name': 'BlackLevelDeltaH',
                'type': 'SRational'
            },
            50716: {
                'name': 'BlackLevelDeltaV',
                'type': 'SRational'
            },
            50717: {
                'name': 'WhiteLevel',
                'type': 'Short'
            },
            50718: {
                'name': 'DefaultScale',
                'type': 'Rational'
            },
            50719: {
                'name': 'DefaultCropOrigin',
                'type': 'Short'
            },
            50720: {
                'name': 'DefaultCropSize',
                'type': 'Short'
            },
            50721: {
                'name': 'ColorMatrix1',
                'type': 'SRational'
            },
            50722: {
                'name': 'ColorMatrix2',
                'type': 'SRational'
            },
            50723: {
                'name': 'CameraCalibration1',
                'type': 'SRational'
            },
            50724: {
                'name': 'CameraCalibration2',
                'type': 'SRational'
            },
            50725: {
                'name': 'ReductionMatrix1',
                'type': 'SRational'
            },
            50726: {
                'name': 'ReductionMatrix2',
                'type': 'SRational'
            },
            50727: {
                'name': 'AnalogBalance',
                'type': 'Rational'
            },
            50728: {
                'name': 'AsShotNeutral',
                'type': 'Short'
            },
            50729: {
                'name': 'AsShotWhiteXY',
                'type': 'Rational'
            },
            50730: {
                'name': 'BaselineExposure',
                'type': 'SRational'
            },
            50731: {
                'name': 'BaselineNoise',
                'type': 'Rational'
            },
            50732: {
                'name': 'BaselineSharpness',
                'type': 'Rational'
            },
            50733: {
                'name': 'BayerGreenSplit',
                'type': 'Long'
            },
            50734: {
                'name': 'LinearResponseLimit',
                'type': 'Rational'
            },
            50735: {
                'name': 'CameraSerialNumber',
                'type': 'Ascii'
            },
            50736: {
                'name': 'LensInfo',
                'type': 'Rational'
            },
            50737: {
                'name': 'ChromaBlurRadius',
                'type': 'Rational'
            },
            50738: {
                'name': 'AntiAliasStrength',
                'type': 'Rational'
            },
            50739: {
                'name': 'ShadowScale',
                'type': 'SRational'
            },
            50740: {
                'name': 'DNGPrivateData',
                'type': 'Byte'
            },
            50741: {
                'name': 'MakerNoteSafety',
                'type': 'Short'
            },
            50778: {
                'name': 'CalibrationIlluminant1',
                'type': 'Short'
            },
            50779: {
                'name': 'CalibrationIlluminant2',
                'type': 'Short'
            },
            50780: {
                'name': 'BestQualityScale',
                'type': 'Rational'
            },
            50781: {
                'name': 'RawDataUniqueID',
                'type': 'Byte'
            },
            50827: {
                'name': 'OriginalRawFileName',
                'type': 'Byte'
            },
            50828: {
                'name': 'OriginalRawFileData',
                'type': 'Undefined'
            },
            50829: {
                'name': 'ActiveArea',
                'type': 'Short'
            },
            50830: {
                'name': 'MaskedAreas',
                'type': 'Short'
            },
            50831: {
                'name': 'AsShotICCProfile',
                'type': 'Undefined'
            },
            50832: {
                'name': 'AsShotPreProfileMatrix',
                'type': 'SRational'
            },
            50833: {
                'name': 'CurrentICCProfile',
                'type': 'Undefined'
            },
            50834: {
                'name': 'CurrentPreProfileMatrix',
                'type': 'SRational'
            },
            50879: {
                'name': 'ColorimetricReference',
                'type': 'Short'
            },
            50931: {
                'name': 'CameraCalibrationSignature',
                'type': 'Byte'
            },
            50932: {
                'name': 'ProfileCalibrationSignature',
                'type': 'Byte'
            },
            50934: {
                'name': 'AsShotProfileName',
                'type': 'Byte'
            },
            50935: {
                'name': 'NoiseReductionApplied',
                'type': 'Rational'
            },
            50936: {
                'name': 'ProfileName',
                'type': 'Byte'
            },
            50937: {
                'name': 'ProfileHueSatMapDims',
                'type': 'Long'
            },
            50938: {
                'name': 'ProfileHueSatMapData1',
                'type': 'Float'
            },
            50939: {
                'name': 'ProfileHueSatMapData2',
                'type': 'Float'
            },
            50940: {
                'name': 'ProfileToneCurve',
                'type': 'Float'
            },
            50941: {
                'name': 'ProfileEmbedPolicy',
                'type': 'Long'
            },
            50942: {
                'name': 'ProfileCopyright',
                'type': 'Byte'
            },
            50964: {
                'name': 'ForwardMatrix1',
                'type': 'SRational'
            },
            50965: {
                'name': 'ForwardMatrix2',
                'type': 'SRational'
            },
            50966: {
                'name': 'PreviewApplicationName',
                'type': 'Byte'
            },
            50967: {
                'name': 'PreviewApplicationVersion',
                'type': 'Byte'
            },
            50968: {
                'name': 'PreviewSettingsName',
                'type': 'Byte'
            },
            50969: {
                'name': 'PreviewSettingsDigest',
                'type': 'Byte'
            },
            50970: {
                'name': 'PreviewColorSpace',
                'type': 'Long'
            },
            50971: {
                'name': 'PreviewDateTime',
                'type': 'Ascii'
            },
            50972: {
                'name': 'RawImageDigest',
                'type': 'Undefined'
            },
            50973: {
                'name': 'OriginalRawFileDigest',
                'type': 'Undefined'
            },
            50974: {
                'name': 'SubTileBlockSize',
                'type': 'Long'
            },
            50975: {
                'name': 'RowInterleaveFactor',
                'type': 'Long'
            },
            50981: {
                'name': 'ProfileLookTableDims',
                'type': 'Long'
            },
            50982: {
                'name': 'ProfileLookTableData',
                'type': 'Float'
            },
            51008: {
                'name': 'OpcodeList1',
                'type': 'Undefined'
            },
            51009: {
                'name': 'OpcodeList2',
                'type': 'Undefined'
            },
            51022: {
                'name': 'OpcodeList3',
                'type': 'Undefined'
            }
        },
        'Exif': {
            33434: {
                'name': 'ExposureTime',
                'type': 'Rational'
            },
            33437: {
                'name': 'FNumber',
                'type': 'Rational'
            },
            34850: {
                'name': 'ExposureProgram',
                'type': 'Short'
            },
            34852: {
                'name': 'SpectralSensitivity',
                'type': 'Ascii'
            },
            34855: {
                'name': 'ISOSpeedRatings',
                'type': 'Short'
            },
            34856: {
                'name': 'OECF',
                'type': 'Undefined'
            },
            34864: {
                'name': 'SensitivityType',
                'type': 'Short'
            },
            34865: {
                'name': 'StandardOutputSensitivity',
                'type': 'Long'
            },
            34866: {
                'name': 'RecommendedExposureIndex',
                'type': 'Long'
            },
            34867: {
                'name': 'ISOSpeed',
                'type': 'Long'
            },
            34868: {
                'name': 'ISOSpeedLatitudeyyy',
                'type': 'Long'
            },
            34869: {
                'name': 'ISOSpeedLatitudezzz',
                'type': 'Long'
            },
            36864: {
                'name': 'ExifVersion',
                'type': 'Undefined'
            },
            36867: {
                'name': 'DateTimeOriginal',
                'type': 'Ascii'
            },
            36868: {
                'name': 'DateTimeDigitized',
                'type': 'Ascii'
            },
            37121: {
                'name': 'ComponentsConfiguration',
                'type': 'Undefined'
            },
            37122: {
                'name': 'CompressedBitsPerPixel',
                'type': 'Rational'
            },
            37377: {
                'name': 'ShutterSpeedValue',
                'type': 'SRational'
            },
            37378: {
                'name': 'ApertureValue',
                'type': 'Rational'
            },
            37379: {
                'name': 'BrightnessValue',
                'type': 'SRational'
            },
            37380: {
                'name': 'ExposureBiasValue',
                'type': 'SRational'
            },
            37381: {
                'name': 'MaxApertureValue',
                'type': 'Rational'
            },
            37382: {
                'name': 'SubjectDistance',
                'type': 'Rational'
            },
            37383: {
                'name': 'MeteringMode',
                'type': 'Short'
            },
            37384: {
                'name': 'LightSource',
                'type': 'Short'
            },
            37385: {
                'name': 'Flash',
                'type': 'Short'
            },
            37386: {
                'name': 'FocalLength',
                'type': 'Rational'
            },
            37396: {
                'name': 'SubjectArea',
                'type': 'Short'
            },
            37500: {
                'name': 'MakerNote',
                'type': 'Undefined'
            },
            37510: {
                'name': 'UserComment',
                'type': 'Ascii'
            },
            37520: {
                'name': 'SubSecTime',
                'type': 'Ascii'
            },
            37521: {
                'name': 'SubSecTimeOriginal',
                'type': 'Ascii'
            },
            37522: {
                'name': 'SubSecTimeDigitized',
                'type': 'Ascii'
            },
            40960: {
                'name': 'FlashpixVersion',
                'type': 'Undefined'
            },
            40961: {
                'name': 'ColorSpace',
                'type': 'Short'
            },
            40962: {
                'name': 'PixelXDimension',
                'type': 'Long'
            },
            40963: {
                'name': 'PixelYDimension',
                'type': 'Long'
            },
            40964: {
                'name': 'RelatedSoundFile',
                'type': 'Ascii'
            },
            40965: {
                'name': 'InteroperabilityTag',
                'type': 'Long'
            },
            41483: {
                'name': 'FlashEnergy',
                'type': 'Rational'
            },
            41484: {
                'name': 'SpatialFrequencyResponse',
                'type': 'Undefined'
            },
            41486: {
                'name': 'FocalPlaneXResolution',
                'type': 'Rational'
            },
            41487: {
                'name': 'FocalPlaneYResolution',
                'type': 'Rational'
            },
            41488: {
                'name': 'FocalPlaneResolutionUnit',
                'type': 'Short'
            },
            41492: {
                'name': 'SubjectLocation',
                'type': 'Short'
            },
            41493: {
                'name': 'ExposureIndex',
                'type': 'Rational'
            },
            41495: {
                'name': 'SensingMethod',
                'type': 'Short'
            },
            41728: {
                'name': 'FileSource',
                'type': 'Undefined'
            },
            41729: {
                'name': 'SceneType',
                'type': 'Undefined'
            },
            41730: {
                'name': 'CFAPattern',
                'type': 'Undefined'
            },
            41985: {
                'name': 'CustomRendered',
                'type': 'Short'
            },
            41986: {
                'name': 'ExposureMode',
                'type': 'Short'
            },
            41987: {
                'name': 'WhiteBalance',
                'type': 'Short'
            },
            41988: {
                'name': 'DigitalZoomRatio',
                'type': 'Rational'
            },
            41989: {
                'name': 'FocalLengthIn35mmFilm',
                'type': 'Short'
            },
            41990: {
                'name': 'SceneCaptureType',
                'type': 'Short'
            },
            41991: {
                'name': 'GainControl',
                'type': 'Short'
            },
            41992: {
                'name': 'Contrast',
                'type': 'Short'
            },
            41993: {
                'name': 'Saturation',
                'type': 'Short'
            },
            41994: {
                'name': 'Sharpness',
                'type': 'Short'
            },
            41995: {
                'name': 'DeviceSettingDescription',
                'type': 'Undefined'
            },
            41996: {
                'name': 'SubjectDistanceRange',
                'type': 'Short'
            },
            42016: {
                'name': 'ImageUniqueID',
                'type': 'Ascii'
            },
            42032: {
                'name': 'CameraOwnerName',
                'type': 'Ascii'
            },
            42033: {
                'name': 'BodySerialNumber',
                'type': 'Ascii'
            },
            42034: {
                'name': 'LensSpecification',
                'type': 'Rational'
            },
            42035: {
                'name': 'LensMake',
                'type': 'Ascii'
            },
            42036: {
                'name': 'LensModel',
                'type': 'Ascii'
            },
            42037: {
                'name': 'LensSerialNumber',
                'type': 'Ascii'
            },
            42240: {
                'name': 'Gamma',
                'type': 'Rational'
            }
        },
        'GPS': {
            0: {
                'name': 'GPSVersionID',
                'type': 'Byte'
            },
            1: {
                'name': 'GPSLatitudeRef',
                'type': 'Ascii'
            },
            2: {
                'name': 'GPSLatitude',
                'type': 'Rational'
            },
            3: {
                'name': 'GPSLongitudeRef',
                'type': 'Ascii'
            },
            4: {
                'name': 'GPSLongitude',
                'type': 'Rational'
            },
            5: {
                'name': 'GPSAltitudeRef',
                'type': 'Byte'
            },
            6: {
                'name': 'GPSAltitude',
                'type': 'Rational'
            },
            7: {
                'name': 'GPSTimeStamp',
                'type': 'Rational'
            },
            8: {
                'name': 'GPSSatellites',
                'type': 'Ascii'
            },
            9: {
                'name': 'GPSStatus',
                'type': 'Ascii'
            },
            10: {
                'name': 'GPSMeasureMode',
                'type': 'Ascii'
            },
            11: {
                'name': 'GPSDOP',
                'type': 'Rational'
            },
            12: {
                'name': 'GPSSpeedRef',
                'type': 'Ascii'
            },
            13: {
                'name': 'GPSSpeed',
                'type': 'Rational'
            },
            14: {
                'name': 'GPSTrackRef',
                'type': 'Ascii'
            },
            15: {
                'name': 'GPSTrack',
                'type': 'Rational'
            },
            16: {
                'name': 'GPSImgDirectionRef',
                'type': 'Ascii'
            },
            17: {
                'name': 'GPSImgDirection',
                'type': 'Rational'
            },
            18: {
                'name': 'GPSMapDatum',
                'type': 'Ascii'
            },
            19: {
                'name': 'GPSDestLatitudeRef',
                'type': 'Ascii'
            },
            20: {
                'name': 'GPSDestLatitude',
                'type': 'Rational'
            },
            21: {
                'name': 'GPSDestLongitudeRef',
                'type': 'Ascii'
            },
            22: {
                'name': 'GPSDestLongitude',
                'type': 'Rational'
            },
            23: {
                'name': 'GPSDestBearingRef',
                'type': 'Ascii'
            },
            24: {
                'name': 'GPSDestBearing',
                'type': 'Rational'
            },
            25: {
                'name': 'GPSDestDistanceRef',
                'type': 'Ascii'
            },
            26: {
                'name': 'GPSDestDistance',
                'type': 'Rational'
            },
            27: {
                'name': 'GPSProcessingMethod',
                'type': 'Undefined'
            },
            28: {
                'name': 'GPSAreaInformation',
                'type': 'Undefined'
            },
            29: {
                'name': 'GPSDateStamp',
                'type': 'Ascii'
            },
            30: {
                'name': 'GPSDifferential',
                'type': 'Short'
            },
            31: {
                'name': 'GPSHPositioningError',
                'type': 'Rational'
            }
        },
        'Interop': {
            1: {
                'name': 'InteroperabilityIndex',
                'type': 'Ascii'
            }
        },
    };
    TAGS["0th"] = TAGS["Image"];
    TAGS["1st"] = TAGS["Image"];
    that.TAGS = TAGS;

    
    that.ImageIFD = {
        ProcessingSoftware:11,
        NewSubfileType:254,
        SubfileType:255,
        ImageWidth:256,
        ImageLength:257,
        BitsPerSample:258,
        Compression:259,
        PhotometricInterpretation:262,
        Threshholding:263,
        CellWidth:264,
        CellLength:265,
        FillOrder:266,
        DocumentName:269,
        ImageDescription:270,
        Make:271,
        Model:272,
        StripOffsets:273,
        Orientation:274,
        SamplesPerPixel:277,
        RowsPerStrip:278,
        StripByteCounts:279,
        XResolution:282,
        YResolution:283,
        PlanarConfiguration:284,
        GrayResponseUnit:290,
        GrayResponseCurve:291,
        T4Options:292,
        T6Options:293,
        ResolutionUnit:296,
        TransferFunction:301,
        Software:305,
        DateTime:306,
        Artist:315,
        HostComputer:316,
        Predictor:317,
        WhitePoint:318,
        PrimaryChromaticities:319,
        ColorMap:320,
        HalftoneHints:321,
        TileWidth:322,
        TileLength:323,
        TileOffsets:324,
        TileByteCounts:325,
        SubIFDs:330,
        InkSet:332,
        InkNames:333,
        NumberOfInks:334,
        DotRange:336,
        TargetPrinter:337,
        ExtraSamples:338,
        SampleFormat:339,
        SMinSampleValue:340,
        SMaxSampleValue:341,
        TransferRange:342,
        ClipPath:343,
        XClipPathUnits:344,
        YClipPathUnits:345,
        Indexed:346,
        JPEGTables:347,
        OPIProxy:351,
        JPEGProc:512,
        JPEGInterchangeFormat:513,
        JPEGInterchangeFormatLength:514,
        JPEGRestartInterval:515,
        JPEGLosslessPredictors:517,
        JPEGPointTransforms:518,
        JPEGQTables:519,
        JPEGDCTables:520,
        JPEGACTables:521,
        YCbCrCoefficients:529,
        YCbCrSubSampling:530,
        YCbCrPositioning:531,
        ReferenceBlackWhite:532,
        XMLPacket:700,
        Rating:18246,
        RatingPercent:18249,
        ImageID:32781,
        CFARepeatPatternDim:33421,
        CFAPattern:33422,
        BatteryLevel:33423,
        Copyright:33432,
        ExposureTime:33434,
        ImageResources:34377,
        ExifTag:34665,
        InterColorProfile:34675,
        GPSTag:34853,
        Interlace:34857,
        TimeZoneOffset:34858,
        SelfTimerMode:34859,
        FlashEnergy:37387,
        SpatialFrequencyResponse:37388,
        Noise:37389,
        FocalPlaneXResolution:37390,
        FocalPlaneYResolution:37391,
        FocalPlaneResolutionUnit:37392,
        ImageNumber:37393,
        SecurityClassification:37394,
        ImageHistory:37395,
        ExposureIndex:37397,
        TIFFEPStandardID:37398,
        SensingMethod:37399,
        XPTitle:40091,
        XPComment:40092,
        XPAuthor:40093,
        XPKeywords:40094,
        XPSubject:40095,
        PrintImageMatching:50341,
        DNGVersion:50706,
        DNGBackwardVersion:50707,
        UniqueCameraModel:50708,
        LocalizedCameraModel:50709,
        CFAPlaneColor:50710,
        CFALayout:50711,
        LinearizationTable:50712,
        BlackLevelRepeatDim:50713,
        BlackLevel:50714,
        BlackLevelDeltaH:50715,
        BlackLevelDeltaV:50716,
        WhiteLevel:50717,
        DefaultScale:50718,
        DefaultCropOrigin:50719,
        DefaultCropSize:50720,
        ColorMatrix1:50721,
        ColorMatrix2:50722,
        CameraCalibration1:50723,
        CameraCalibration2:50724,
        ReductionMatrix1:50725,
        ReductionMatrix2:50726,
        AnalogBalance:50727,
        AsShotNeutral:50728,
        AsShotWhiteXY:50729,
        BaselineExposure:50730,
        BaselineNoise:50731,
        BaselineSharpness:50732,
        BayerGreenSplit:50733,
        LinearResponseLimit:50734,
        CameraSerialNumber:50735,
        LensInfo:50736,
        ChromaBlurRadius:50737,
        AntiAliasStrength:50738,
        ShadowScale:50739,
        DNGPrivateData:50740,
        MakerNoteSafety:50741,
        CalibrationIlluminant1:50778,
        CalibrationIlluminant2:50779,
        BestQualityScale:50780,
        RawDataUniqueID:50781,
        OriginalRawFileName:50827,
        OriginalRawFileData:50828,
        ActiveArea:50829,
        MaskedAreas:50830,
        AsShotICCProfile:50831,
        AsShotPreProfileMatrix:50832,
        CurrentICCProfile:50833,
        CurrentPreProfileMatrix:50834,
        ColorimetricReference:50879,
        CameraCalibrationSignature:50931,
        ProfileCalibrationSignature:50932,
        AsShotProfileName:50934,
        NoiseReductionApplied:50935,
        ProfileName:50936,
        ProfileHueSatMapDims:50937,
        ProfileHueSatMapData1:50938,
        ProfileHueSatMapData2:50939,
        ProfileToneCurve:50940,
        ProfileEmbedPolicy:50941,
        ProfileCopyright:50942,
        ForwardMatrix1:50964,
        ForwardMatrix2:50965,
        PreviewApplicationName:50966,
        PreviewApplicationVersion:50967,
        PreviewSettingsName:50968,
        PreviewSettingsDigest:50969,
        PreviewColorSpace:50970,
        PreviewDateTime:50971,
        RawImageDigest:50972,
        OriginalRawFileDigest:50973,
        SubTileBlockSize:50974,
        RowInterleaveFactor:50975,
        ProfileLookTableDims:50981,
        ProfileLookTableData:50982,
        OpcodeList1:51008,
        OpcodeList2:51009,
        OpcodeList3:51022,
        NoiseProfile:51041,
    };

    
    that.ExifIFD = {
        ExposureTime:33434,
        FNumber:33437,
        ExposureProgram:34850,
        SpectralSensitivity:34852,
        ISOSpeedRatings:34855,
        OECF:34856,
        SensitivityType:34864,
        StandardOutputSensitivity:34865,
        RecommendedExposureIndex:34866,
        ISOSpeed:34867,
        ISOSpeedLatitudeyyy:34868,
        ISOSpeedLatitudezzz:34869,
        ExifVersion:36864,
        DateTimeOriginal:36867,
        DateTimeDigitized:36868,
        ComponentsConfiguration:37121,
        CompressedBitsPerPixel:37122,
        ShutterSpeedValue:37377,
        ApertureValue:37378,
        BrightnessValue:37379,
        ExposureBiasValue:37380,
        MaxApertureValue:37381,
        SubjectDistance:37382,
        MeteringMode:37383,
        LightSource:37384,
        Flash:37385,
        FocalLength:37386,
        SubjectArea:37396,
        MakerNote:37500,
        UserComment:37510,
        SubSecTime:37520,
        SubSecTimeOriginal:37521,
        SubSecTimeDigitized:37522,
        FlashpixVersion:40960,
        ColorSpace:40961,
        PixelXDimension:40962,
        PixelYDimension:40963,
        RelatedSoundFile:40964,
        InteroperabilityTag:40965,
        FlashEnergy:41483,
        SpatialFrequencyResponse:41484,
        FocalPlaneXResolution:41486,
        FocalPlaneYResolution:41487,
        FocalPlaneResolutionUnit:41488,
        SubjectLocation:41492,
        ExposureIndex:41493,
        SensingMethod:41495,
        FileSource:41728,
        SceneType:41729,
        CFAPattern:41730,
        CustomRendered:41985,
        ExposureMode:41986,
        WhiteBalance:41987,
        DigitalZoomRatio:41988,
        FocalLengthIn35mmFilm:41989,
        SceneCaptureType:41990,
        GainControl:41991,
        Contrast:41992,
        Saturation:41993,
        Sharpness:41994,
        DeviceSettingDescription:41995,
        SubjectDistanceRange:41996,
        ImageUniqueID:42016,
        CameraOwnerName:42032,
        BodySerialNumber:42033,
        LensSpecification:42034,
        LensMake:42035,
        LensModel:42036,
        LensSerialNumber:42037,
        Gamma:42240,
    };


    that.GPSIFD = {
        GPSVersionID:0,
        GPSLatitudeRef:1,
        GPSLatitude:2,
        GPSLongitudeRef:3,
        GPSLongitude:4,
        GPSAltitudeRef:5,
        GPSAltitude:6,
        GPSTimeStamp:7,
        GPSSatellites:8,
        GPSStatus:9,
        GPSMeasureMode:10,
        GPSDOP:11,
        GPSSpeedRef:12,
        GPSSpeed:13,
        GPSTrackRef:14,
        GPSTrack:15,
        GPSImgDirectionRef:16,
        GPSImgDirection:17,
        GPSMapDatum:18,
        GPSDestLatitudeRef:19,
        GPSDestLatitude:20,
        GPSDestLongitudeRef:21,
        GPSDestLongitude:22,
        GPSDestBearingRef:23,
        GPSDestBearing:24,
        GPSDestDistanceRef:25,
        GPSDestDistance:26,
        GPSProcessingMethod:27,
        GPSAreaInformation:28,
        GPSDateStamp:29,
        GPSDifferential:30,
        GPSHPositioningError:31,
    };


    that.InteropIFD = {
        InteroperabilityIndex:1,
    };

    that.GPSHelper = {
        degToDmsRational:function (degFloat) {
            var minFloat = degFloat % 1 * 60;
            var secFloat = minFloat % 1 * 60;
            var deg = Math.floor(degFloat);
            var min = Math.floor(minFloat);
            var sec = Math.round(secFloat * 100);

            return [[deg, 1], [min, 1], [sec, 100]];
        },

        dmsRationalToDeg:function (dmsArray, ref) {
          var sign = (ref === 'S' || ref === 'W') ? -1.0 : 1.0;
          var deg = sign * dmsArray[0][0] / dmsArray[0][1] +
                    dmsArray[1][0] / dmsArray[1][1] / 60.0 +
                    dmsArray[2][0] / dmsArray[2][1] / 3600.0;

          return deg;
        }
    };
    
    
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = that;
        }
        exports.piexif = that;
    } else {
        window.piexif = that;
    }

})();

},{}],"../node_modules/blueimp-load-image/js/load-image.js":[function(require,module,exports) {
var define;
/*
 * JavaScript Load Image
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

/* global define, URL, webkitURL, FileReader */

;(function ($) {
  'use strict'

  // Loads an image for a given File object.
  // Invokes the callback with an img or optional canvas
  // element (if supported by the browser) as parameter:
  function loadImage (file, callback, options) {
    var img = document.createElement('img')
    var url
    img.onerror = function (event) {
      return loadImage.onerror(img, event, file, callback, options)
    }
    img.onload = function (event) {
      return loadImage.onload(img, event, file, callback, options)
    }
    if (typeof file === 'string') {
      loadImage.fetchBlob(
        file,
        function (blob) {
          if (blob) {
            file = blob
            url = loadImage.createObjectURL(file)
          } else {
            url = file
            if (options && options.crossOrigin) {
              img.crossOrigin = options.crossOrigin
            }
          }
          img.src = url
        },
        options
      )
      return img
    } else if (
      loadImage.isInstanceOf('Blob', file) ||
      // Files are also Blob instances, but some browsers
      // (Firefox 3.6) support the File API but not Blobs:
      loadImage.isInstanceOf('File', file)
    ) {
      url = img._objectURL = loadImage.createObjectURL(file)
      if (url) {
        img.src = url
        return img
      }
      return loadImage.readFile(file, function (e) {
        var target = e.target
        if (target && target.result) {
          img.src = target.result
        } else if (callback) {
          callback(e)
        }
      })
    }
  }
  // The check for URL.revokeObjectURL fixes an issue with Opera 12,
  // which provides URL.createObjectURL but doesn't properly implement it:
  var urlAPI =
    ($.createObjectURL && $) ||
    ($.URL && URL.revokeObjectURL && URL) ||
    ($.webkitURL && webkitURL)

  function revokeHelper (img, options) {
    if (img._objectURL && !(options && options.noRevoke)) {
      loadImage.revokeObjectURL(img._objectURL)
      delete img._objectURL
    }
  }

  // If the callback given to this function returns a blob, it is used as image
  // source instead of the original url and overrides the file argument used in
  // the onload and onerror event callbacks:
  loadImage.fetchBlob = function (url, callback, options) {
    callback()
  }

  loadImage.isInstanceOf = function (type, obj) {
    // Cross-frame instanceof check
    return Object.prototype.toString.call(obj) === '[object ' + type + ']'
  }

  loadImage.transform = function (img, options, callback, file, data) {
    callback(img, data)
  }

  loadImage.onerror = function (img, event, file, callback, options) {
    revokeHelper(img, options)
    if (callback) {
      callback.call(img, event)
    }
  }

  loadImage.onload = function (img, event, file, callback, options) {
    revokeHelper(img, options)
    if (callback) {
      loadImage.transform(img, options, callback, file, {
        originalWidth: img.naturalWidth || img.width,
        originalHeight: img.naturalHeight || img.height
      })
    }
  }

  loadImage.createObjectURL = function (file) {
    return urlAPI ? urlAPI.createObjectURL(file) : false
  }

  loadImage.revokeObjectURL = function (url) {
    return urlAPI ? urlAPI.revokeObjectURL(url) : false
  }

  // Loads a given File object via FileReader interface,
  // invokes the callback with the event object (load or error).
  // The result can be read via event.target.result:
  loadImage.readFile = function (file, callback, method) {
    if ($.FileReader) {
      var fileReader = new FileReader()
      fileReader.onload = fileReader.onerror = callback
      method = method || 'readAsDataURL'
      if (fileReader[method]) {
        fileReader[method](file)
        return fileReader
      }
    }
    return false
  }

  if (typeof define === 'function' && define.amd) {
    define(function () {
      return loadImage
    })
  } else if (typeof module === 'object' && module.exports) {
    module.exports = loadImage
  } else {
    $.loadImage = loadImage
  }
})((typeof window !== 'undefined' && window) || this)

},{}],"../node_modules/blueimp-load-image/js/load-image-scale.js":[function(require,module,exports) {
var define;
/*
 * JavaScript Load Image Scaling
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

/* global define */

;(function (factory) {
  'use strict'
  if (typeof define === 'function' && define.amd) {
    // Register as an anonymous AMD module:
    define(['./load-image'], factory)
  } else if (typeof module === 'object' && module.exports) {
    factory(require('./load-image'))
  } else {
    // Browser globals:
    factory(window.loadImage)
  }
})(function (loadImage) {
  'use strict'

  var originalTransform = loadImage.transform

  loadImage.transform = function (img, options, callback, file, data) {
    originalTransform.call(
      loadImage,
      loadImage.scale(img, options, data),
      options,
      callback,
      file,
      data
    )
  }

  // Transform image coordinates, allows to override e.g.
  // the canvas orientation based on the orientation option,
  // gets canvas, options passed as arguments:
  loadImage.transformCoordinates = function () {}

  // Returns transformed options, allows to override e.g.
  // maxWidth, maxHeight and crop options based on the aspectRatio.
  // gets img, options passed as arguments:
  loadImage.getTransformedOptions = function (img, options) {
    var aspectRatio = options.aspectRatio
    var newOptions
    var i
    var width
    var height
    if (!aspectRatio) {
      return options
    }
    newOptions = {}
    for (i in options) {
      if (options.hasOwnProperty(i)) {
        newOptions[i] = options[i]
      }
    }
    newOptions.crop = true
    width = img.naturalWidth || img.width
    height = img.naturalHeight || img.height
    if (width / height > aspectRatio) {
      newOptions.maxWidth = height * aspectRatio
      newOptions.maxHeight = height
    } else {
      newOptions.maxWidth = width
      newOptions.maxHeight = width / aspectRatio
    }
    return newOptions
  }

  // Canvas render method, allows to implement a different rendering algorithm:
  loadImage.renderImageToCanvas = function (
    canvas,
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    destX,
    destY,
    destWidth,
    destHeight
  ) {
    canvas
      .getContext('2d')
      .drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        destX,
        destY,
        destWidth,
        destHeight
      )
    return canvas
  }

  // Determines if the target image should be a canvas element:
  loadImage.hasCanvasOption = function (options) {
    return options.canvas || options.crop || !!options.aspectRatio
  }

  // Scales and/or crops the given image (img or canvas HTML element)
  // using the given options.
  // Returns a canvas object if the browser supports canvas
  // and the hasCanvasOption method returns true or a canvas
  // object is passed as image, else the scaled image:
  loadImage.scale = function (img, options, data) {
    options = options || {}
    var canvas = document.createElement('canvas')
    var useCanvas =
      img.getContext ||
      (loadImage.hasCanvasOption(options) && canvas.getContext)
    var width = img.naturalWidth || img.width
    var height = img.naturalHeight || img.height
    var destWidth = width
    var destHeight = height
    var maxWidth
    var maxHeight
    var minWidth
    var minHeight
    var sourceWidth
    var sourceHeight
    var sourceX
    var sourceY
    var pixelRatio
    var downsamplingRatio
    var tmp
    function scaleUp () {
      var scale = Math.max(
        (minWidth || destWidth) / destWidth,
        (minHeight || destHeight) / destHeight
      )
      if (scale > 1) {
        destWidth *= scale
        destHeight *= scale
      }
    }
    function scaleDown () {
      var scale = Math.min(
        (maxWidth || destWidth) / destWidth,
        (maxHeight || destHeight) / destHeight
      )
      if (scale < 1) {
        destWidth *= scale
        destHeight *= scale
      }
    }
    if (useCanvas) {
      options = loadImage.getTransformedOptions(img, options, data)
      sourceX = options.left || 0
      sourceY = options.top || 0
      if (options.sourceWidth) {
        sourceWidth = options.sourceWidth
        if (options.right !== undefined && options.left === undefined) {
          sourceX = width - sourceWidth - options.right
        }
      } else {
        sourceWidth = width - sourceX - (options.right || 0)
      }
      if (options.sourceHeight) {
        sourceHeight = options.sourceHeight
        if (options.bottom !== undefined && options.top === undefined) {
          sourceY = height - sourceHeight - options.bottom
        }
      } else {
        sourceHeight = height - sourceY - (options.bottom || 0)
      }
      destWidth = sourceWidth
      destHeight = sourceHeight
    }
    maxWidth = options.maxWidth
    maxHeight = options.maxHeight
    minWidth = options.minWidth
    minHeight = options.minHeight
    if (useCanvas && maxWidth && maxHeight && options.crop) {
      destWidth = maxWidth
      destHeight = maxHeight
      tmp = sourceWidth / sourceHeight - maxWidth / maxHeight
      if (tmp < 0) {
        sourceHeight = maxHeight * sourceWidth / maxWidth
        if (options.top === undefined && options.bottom === undefined) {
          sourceY = (height - sourceHeight) / 2
        }
      } else if (tmp > 0) {
        sourceWidth = maxWidth * sourceHeight / maxHeight
        if (options.left === undefined && options.right === undefined) {
          sourceX = (width - sourceWidth) / 2
        }
      }
    } else {
      if (options.contain || options.cover) {
        minWidth = maxWidth = maxWidth || minWidth
        minHeight = maxHeight = maxHeight || minHeight
      }
      if (options.cover) {
        scaleDown()
        scaleUp()
      } else {
        scaleUp()
        scaleDown()
      }
    }
    if (useCanvas) {
      pixelRatio = options.pixelRatio
      if (pixelRatio > 1) {
        canvas.style.width = destWidth + 'px'
        canvas.style.height = destHeight + 'px'
        destWidth *= pixelRatio
        destHeight *= pixelRatio
        canvas.getContext('2d').scale(pixelRatio, pixelRatio)
      }
      downsamplingRatio = options.downsamplingRatio
      if (
        downsamplingRatio > 0 &&
        downsamplingRatio < 1 &&
        destWidth < sourceWidth &&
        destHeight < sourceHeight
      ) {
        while (sourceWidth * downsamplingRatio > destWidth) {
          canvas.width = sourceWidth * downsamplingRatio
          canvas.height = sourceHeight * downsamplingRatio
          loadImage.renderImageToCanvas(
            canvas,
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height
          )
          sourceX = 0
          sourceY = 0
          sourceWidth = canvas.width
          sourceHeight = canvas.height
          img = document.createElement('canvas')
          img.width = sourceWidth
          img.height = sourceHeight
          loadImage.renderImageToCanvas(
            img,
            canvas,
            0,
            0,
            sourceWidth,
            sourceHeight,
            0,
            0,
            sourceWidth,
            sourceHeight
          )
        }
      }
      canvas.width = destWidth
      canvas.height = destHeight
      loadImage.transformCoordinates(canvas, options)
      return loadImage.renderImageToCanvas(
        canvas,
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        destWidth,
        destHeight
      )
    }
    img.width = destWidth
    img.height = destHeight
    return img
  }
})

},{"./load-image":"../node_modules/blueimp-load-image/js/load-image.js"}],"../node_modules/blueimp-load-image/js/load-image-meta.js":[function(require,module,exports) {
var define;
/*
 * JavaScript Load Image Meta
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * Image meta data handling implementation
 * based on the help and contribution of
 * Achim Stöhr.
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

/* global define, Blob */

;(function (factory) {
  'use strict'
  if (typeof define === 'function' && define.amd) {
    // Register as an anonymous AMD module:
    define(['./load-image'], factory)
  } else if (typeof module === 'object' && module.exports) {
    factory(require('./load-image'))
  } else {
    // Browser globals:
    factory(window.loadImage)
  }
})(function (loadImage) {
  'use strict'

  var hasblobSlice =
    typeof Blob !== 'undefined' &&
    (Blob.prototype.slice ||
      Blob.prototype.webkitSlice ||
      Blob.prototype.mozSlice)

  loadImage.blobSlice =
    hasblobSlice &&
    function () {
      var slice = this.slice || this.webkitSlice || this.mozSlice
      return slice.apply(this, arguments)
    }

  loadImage.metaDataParsers = {
    jpeg: {
      0xffe1: [], // APP1 marker
      0xffed: [] // APP13 marker
    }
  }

  // Parses image meta data and calls the callback with an object argument
  // with the following properties:
  // * imageHead: The complete image head as ArrayBuffer (Uint8Array for IE10)
  // The options argument accepts an object and supports the following
  // properties:
  // * maxMetaDataSize: Defines the maximum number of bytes to parse.
  // * disableImageHead: Disables creating the imageHead property.
  loadImage.parseMetaData = function (file, callback, options, data) {
    options = options || {}
    data = data || {}
    var that = this
    // 256 KiB should contain all EXIF/ICC/IPTC segments:
    var maxMetaDataSize = options.maxMetaDataSize || 262144
    var noMetaData = !(
      typeof DataView !== 'undefined' &&
      file &&
      file.size >= 12 &&
      file.type === 'image/jpeg' &&
      loadImage.blobSlice
    )
    if (
      noMetaData ||
      !loadImage.readFile(
        loadImage.blobSlice.call(file, 0, maxMetaDataSize),
        function (e) {
          if (e.target.error) {
            // FileReader error
            console.log(e.target.error)
            callback(data)
            return
          }
          // Note on endianness:
          // Since the marker and length bytes in JPEG files are always
          // stored in big endian order, we can leave the endian parameter
          // of the DataView methods undefined, defaulting to big endian.
          var buffer = e.target.result
          var dataView = new DataView(buffer)
          var offset = 2
          var maxOffset = dataView.byteLength - 4
          var headLength = offset
          var markerBytes
          var markerLength
          var parsers
          var i
          // Check for the JPEG marker (0xffd8):
          if (dataView.getUint16(0) === 0xffd8) {
            while (offset < maxOffset) {
              markerBytes = dataView.getUint16(offset)
              // Search for APPn (0xffeN) and COM (0xfffe) markers,
              // which contain application-specific meta-data like
              // Exif, ICC and IPTC data and text comments:
              if (
                (markerBytes >= 0xffe0 && markerBytes <= 0xffef) ||
                markerBytes === 0xfffe
              ) {
                // The marker bytes (2) are always followed by
                // the length bytes (2), indicating the length of the
                // marker segment, which includes the length bytes,
                // but not the marker bytes, so we add 2:
                markerLength = dataView.getUint16(offset + 2) + 2
                if (offset + markerLength > dataView.byteLength) {
                  console.log('Invalid meta data: Invalid segment size.')
                  break
                }
                parsers = loadImage.metaDataParsers.jpeg[markerBytes]
                if (parsers) {
                  for (i = 0; i < parsers.length; i += 1) {
                    parsers[i].call(
                      that,
                      dataView,
                      offset,
                      markerLength,
                      data,
                      options
                    )
                  }
                }
                offset += markerLength
                headLength = offset
              } else {
                // Not an APPn or COM marker, probably safe to
                // assume that this is the end of the meta data
                break
              }
            }
            // Meta length must be longer than JPEG marker (2)
            // plus APPn marker (2), followed by length bytes (2):
            if (!options.disableImageHead && headLength > 6) {
              if (buffer.slice) {
                data.imageHead = buffer.slice(0, headLength)
              } else {
                // Workaround for IE10, which does not yet
                // support ArrayBuffer.slice:
                data.imageHead = new Uint8Array(buffer).subarray(0, headLength)
              }
            }
          } else {
            console.log('Invalid JPEG file: Missing JPEG marker.')
          }
          callback(data)
        },
        'readAsArrayBuffer'
      )
    ) {
      callback(data)
    }
  }

  // Determines if meta data should be loaded automatically:
  loadImage.hasMetaOption = function (options) {
    return options && options.meta
  }

  var originalTransform = loadImage.transform
  loadImage.transform = function (img, options, callback, file, data) {
    if (loadImage.hasMetaOption(options)) {
      loadImage.parseMetaData(
        file,
        function (data) {
          originalTransform.call(loadImage, img, options, callback, file, data)
        },
        options,
        data
      )
    } else {
      originalTransform.apply(loadImage, arguments)
    }
  }
})

},{"./load-image":"../node_modules/blueimp-load-image/js/load-image.js"}],"../node_modules/blueimp-load-image/js/load-image-fetch.js":[function(require,module,exports) {
var define;
/*
 * JavaScript Load Image Fetch
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2017, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

/* global define, fetch, Request */

;(function (factory) {
  'use strict'
  if (typeof define === 'function' && define.amd) {
    // Register as an anonymous AMD module:
    define(['./load-image', './load-image-meta'], factory)
  } else if (typeof module === 'object' && module.exports) {
    factory(require('./load-image'), require('./load-image-meta'))
  } else {
    // Browser globals:
    factory(window.loadImage)
  }
})(function (loadImage) {
  'use strict'

  if (typeof fetch !== 'undefined' && typeof Request !== 'undefined') {
    loadImage.fetchBlob = function (url, callback, options) {
      if (loadImage.hasMetaOption(options)) {
        return fetch(new Request(url, options))
          .then(function (response) {
            return response.blob()
          })
          .then(callback)
          .catch(function (err) {
            console.log(err)
            callback()
          })
      } else {
        callback()
      }
    }
  }
})

},{"./load-image":"../node_modules/blueimp-load-image/js/load-image.js","./load-image-meta":"../node_modules/blueimp-load-image/js/load-image-meta.js"}],"../node_modules/blueimp-load-image/js/load-image-exif.js":[function(require,module,exports) {
var define;
/*
 * JavaScript Load Image Exif Parser
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

/* global define, Blob */

;(function (factory) {
  'use strict'
  if (typeof define === 'function' && define.amd) {
    // Register as an anonymous AMD module:
    define(['./load-image', './load-image-meta'], factory)
  } else if (typeof module === 'object' && module.exports) {
    factory(require('./load-image'), require('./load-image-meta'))
  } else {
    // Browser globals:
    factory(window.loadImage)
  }
})(function (loadImage) {
  'use strict'

  loadImage.ExifMap = function () {
    return this
  }

  loadImage.ExifMap.prototype.map = {
    Orientation: 0x0112
  }

  loadImage.ExifMap.prototype.get = function (id) {
    return this[id] || this[this.map[id]]
  }

  loadImage.getExifThumbnail = function (dataView, offset, length) {
    if (!length || offset + length > dataView.byteLength) {
      console.log('Invalid Exif data: Invalid thumbnail data.')
      return
    }
    return loadImage.createObjectURL(
      new Blob([dataView.buffer.slice(offset, offset + length)])
    )
  }

  loadImage.exifTagTypes = {
    // byte, 8-bit unsigned int:
    1: {
      getValue: function (dataView, dataOffset) {
        return dataView.getUint8(dataOffset)
      },
      size: 1
    },
    // ascii, 8-bit byte:
    2: {
      getValue: function (dataView, dataOffset) {
        return String.fromCharCode(dataView.getUint8(dataOffset))
      },
      size: 1,
      ascii: true
    },
    // short, 16 bit int:
    3: {
      getValue: function (dataView, dataOffset, littleEndian) {
        return dataView.getUint16(dataOffset, littleEndian)
      },
      size: 2
    },
    // long, 32 bit int:
    4: {
      getValue: function (dataView, dataOffset, littleEndian) {
        return dataView.getUint32(dataOffset, littleEndian)
      },
      size: 4
    },
    // rational = two long values, first is numerator, second is denominator:
    5: {
      getValue: function (dataView, dataOffset, littleEndian) {
        return (
          dataView.getUint32(dataOffset, littleEndian) /
          dataView.getUint32(dataOffset + 4, littleEndian)
        )
      },
      size: 8
    },
    // slong, 32 bit signed int:
    9: {
      getValue: function (dataView, dataOffset, littleEndian) {
        return dataView.getInt32(dataOffset, littleEndian)
      },
      size: 4
    },
    // srational, two slongs, first is numerator, second is denominator:
    10: {
      getValue: function (dataView, dataOffset, littleEndian) {
        return (
          dataView.getInt32(dataOffset, littleEndian) /
          dataView.getInt32(dataOffset + 4, littleEndian)
        )
      },
      size: 8
    }
  }
  // undefined, 8-bit byte, value depending on field:
  loadImage.exifTagTypes[7] = loadImage.exifTagTypes[1]

  loadImage.getExifValue = function (
    dataView,
    tiffOffset,
    offset,
    type,
    length,
    littleEndian
  ) {
    var tagType = loadImage.exifTagTypes[type]
    var tagSize
    var dataOffset
    var values
    var i
    var str
    var c
    if (!tagType) {
      console.log('Invalid Exif data: Invalid tag type.')
      return
    }
    tagSize = tagType.size * length
    // Determine if the value is contained in the dataOffset bytes,
    // or if the value at the dataOffset is a pointer to the actual data:
    dataOffset =
      tagSize > 4
        ? tiffOffset + dataView.getUint32(offset + 8, littleEndian)
        : offset + 8
    if (dataOffset + tagSize > dataView.byteLength) {
      console.log('Invalid Exif data: Invalid data offset.')
      return
    }
    if (length === 1) {
      return tagType.getValue(dataView, dataOffset, littleEndian)
    }
    values = []
    for (i = 0; i < length; i += 1) {
      values[i] = tagType.getValue(
        dataView,
        dataOffset + i * tagType.size,
        littleEndian
      )
    }
    if (tagType.ascii) {
      str = ''
      // Concatenate the chars:
      for (i = 0; i < values.length; i += 1) {
        c = values[i]
        // Ignore the terminating NULL byte(s):
        if (c === '\u0000') {
          break
        }
        str += c
      }
      return str
    }
    return values
  }

  loadImage.parseExifTag = function (
    dataView,
    tiffOffset,
    offset,
    littleEndian,
    data
  ) {
    var tag = dataView.getUint16(offset, littleEndian)
    data.exif[tag] = loadImage.getExifValue(
      dataView,
      tiffOffset,
      offset,
      dataView.getUint16(offset + 2, littleEndian), // tag type
      dataView.getUint32(offset + 4, littleEndian), // tag length
      littleEndian
    )
  }

  loadImage.parseExifTags = function (
    dataView,
    tiffOffset,
    dirOffset,
    littleEndian,
    data
  ) {
    var tagsNumber, dirEndOffset, i
    if (dirOffset + 6 > dataView.byteLength) {
      console.log('Invalid Exif data: Invalid directory offset.')
      return
    }
    tagsNumber = dataView.getUint16(dirOffset, littleEndian)
    dirEndOffset = dirOffset + 2 + 12 * tagsNumber
    if (dirEndOffset + 4 > dataView.byteLength) {
      console.log('Invalid Exif data: Invalid directory size.')
      return
    }
    for (i = 0; i < tagsNumber; i += 1) {
      this.parseExifTag(
        dataView,
        tiffOffset,
        dirOffset + 2 + 12 * i, // tag offset
        littleEndian,
        data
      )
    }
    // Return the offset to the next directory:
    return dataView.getUint32(dirEndOffset, littleEndian)
  }

  loadImage.parseExifData = function (dataView, offset, length, data, options) {
    if (options.disableExif) {
      return
    }
    var tiffOffset = offset + 10
    var littleEndian
    var dirOffset
    var thumbnailData
    // Check for the ASCII code for "Exif" (0x45786966):
    if (dataView.getUint32(offset + 4) !== 0x45786966) {
      // No Exif data, might be XMP data instead
      return
    }
    if (tiffOffset + 8 > dataView.byteLength) {
      console.log('Invalid Exif data: Invalid segment size.')
      return
    }
    // Check for the two null bytes:
    if (dataView.getUint16(offset + 8) !== 0x0000) {
      console.log('Invalid Exif data: Missing byte alignment offset.')
      return
    }
    // Check the byte alignment:
    switch (dataView.getUint16(tiffOffset)) {
      case 0x4949:
        littleEndian = true
        break
      case 0x4d4d:
        littleEndian = false
        break
      default:
        console.log('Invalid Exif data: Invalid byte alignment marker.')
        return
    }
    // Check for the TIFF tag marker (0x002A):
    if (dataView.getUint16(tiffOffset + 2, littleEndian) !== 0x002a) {
      console.log('Invalid Exif data: Missing TIFF marker.')
      return
    }
    // Retrieve the directory offset bytes, usually 0x00000008 or 8 decimal:
    dirOffset = dataView.getUint32(tiffOffset + 4, littleEndian)
    // Create the exif object to store the tags:
    data.exif = new loadImage.ExifMap()
    // Parse the tags of the main image directory and retrieve the
    // offset to the next directory, usually the thumbnail directory:
    dirOffset = loadImage.parseExifTags(
      dataView,
      tiffOffset,
      tiffOffset + dirOffset,
      littleEndian,
      data
    )
    if (dirOffset && !options.disableExifThumbnail) {
      thumbnailData = { exif: {} }
      dirOffset = loadImage.parseExifTags(
        dataView,
        tiffOffset,
        tiffOffset + dirOffset,
        littleEndian,
        thumbnailData
      )
      // Check for JPEG Thumbnail offset:
      if (thumbnailData.exif[0x0201]) {
        data.exif.Thumbnail = loadImage.getExifThumbnail(
          dataView,
          tiffOffset + thumbnailData.exif[0x0201],
          thumbnailData.exif[0x0202] // Thumbnail data length
        )
      }
    }
    // Check for Exif Sub IFD Pointer:
    if (data.exif[0x8769] && !options.disableExifSub) {
      loadImage.parseExifTags(
        dataView,
        tiffOffset,
        tiffOffset + data.exif[0x8769], // directory offset
        littleEndian,
        data
      )
    }
    // Check for GPS Info IFD Pointer:
    if (data.exif[0x8825] && !options.disableExifGps) {
      loadImage.parseExifTags(
        dataView,
        tiffOffset,
        tiffOffset + data.exif[0x8825], // directory offset
        littleEndian,
        data
      )
    }
  }

  // Registers the Exif parser for the APP1 JPEG meta data segment:
  loadImage.metaDataParsers.jpeg[0xffe1].push(loadImage.parseExifData)

  // Adds the following properties to the parseMetaData callback data:
  // * exif: The exif tags, parsed by the parseExifData method

  // Adds the following options to the parseMetaData method:
  // * disableExif: Disables Exif parsing.
  // * disableExifThumbnail: Disables parsing of the Exif Thumbnail.
  // * disableExifSub: Disables parsing of the Exif Sub IFD.
  // * disableExifGps: Disables parsing of the Exif GPS Info IFD.
})

},{"./load-image":"../node_modules/blueimp-load-image/js/load-image.js","./load-image-meta":"../node_modules/blueimp-load-image/js/load-image-meta.js"}],"../node_modules/blueimp-load-image/js/load-image-exif-map.js":[function(require,module,exports) {
var define;
/*
 * JavaScript Load Image Exif Map
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * Exif tags mapping based on
 * https://github.com/jseidelin/exif-js
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

/* global define */

;(function (factory) {
  'use strict'
  if (typeof define === 'function' && define.amd) {
    // Register as an anonymous AMD module:
    define(['./load-image', './load-image-exif'], factory)
  } else if (typeof module === 'object' && module.exports) {
    factory(require('./load-image'), require('./load-image-exif'))
  } else {
    // Browser globals:
    factory(window.loadImage)
  }
})(function (loadImage) {
  'use strict'

  loadImage.ExifMap.prototype.tags = {
    // =================
    // TIFF tags (IFD0):
    // =================
    0x0100: 'ImageWidth',
    0x0101: 'ImageHeight',
    0x8769: 'ExifIFDPointer',
    0x8825: 'GPSInfoIFDPointer',
    0xa005: 'InteroperabilityIFDPointer',
    0x0102: 'BitsPerSample',
    0x0103: 'Compression',
    0x0106: 'PhotometricInterpretation',
    0x0112: 'Orientation',
    0x0115: 'SamplesPerPixel',
    0x011c: 'PlanarConfiguration',
    0x0212: 'YCbCrSubSampling',
    0x0213: 'YCbCrPositioning',
    0x011a: 'XResolution',
    0x011b: 'YResolution',
    0x0128: 'ResolutionUnit',
    0x0111: 'StripOffsets',
    0x0116: 'RowsPerStrip',
    0x0117: 'StripByteCounts',
    0x0201: 'JPEGInterchangeFormat',
    0x0202: 'JPEGInterchangeFormatLength',
    0x012d: 'TransferFunction',
    0x013e: 'WhitePoint',
    0x013f: 'PrimaryChromaticities',
    0x0211: 'YCbCrCoefficients',
    0x0214: 'ReferenceBlackWhite',
    0x0132: 'DateTime',
    0x010e: 'ImageDescription',
    0x010f: 'Make',
    0x0110: 'Model',
    0x0131: 'Software',
    0x013b: 'Artist',
    0x8298: 'Copyright',
    // ==================
    // Exif Sub IFD tags:
    // ==================
    0x9000: 'ExifVersion', // EXIF version
    0xa000: 'FlashpixVersion', // Flashpix format version
    0xa001: 'ColorSpace', // Color space information tag
    0xa002: 'PixelXDimension', // Valid width of meaningful image
    0xa003: 'PixelYDimension', // Valid height of meaningful image
    0xa500: 'Gamma',
    0x9101: 'ComponentsConfiguration', // Information about channels
    0x9102: 'CompressedBitsPerPixel', // Compressed bits per pixel
    0x927c: 'MakerNote', // Any desired information written by the manufacturer
    0x9286: 'UserComment', // Comments by user
    0xa004: 'RelatedSoundFile', // Name of related sound file
    0x9003: 'DateTimeOriginal', // Date and time when the original image was generated
    0x9004: 'DateTimeDigitized', // Date and time when the image was stored digitally
    0x9290: 'SubSecTime', // Fractions of seconds for DateTime
    0x9291: 'SubSecTimeOriginal', // Fractions of seconds for DateTimeOriginal
    0x9292: 'SubSecTimeDigitized', // Fractions of seconds for DateTimeDigitized
    0x829a: 'ExposureTime', // Exposure time (in seconds)
    0x829d: 'FNumber',
    0x8822: 'ExposureProgram', // Exposure program
    0x8824: 'SpectralSensitivity', // Spectral sensitivity
    0x8827: 'PhotographicSensitivity', // EXIF 2.3, ISOSpeedRatings in EXIF 2.2
    0x8828: 'OECF', // Optoelectric conversion factor
    0x8830: 'SensitivityType',
    0x8831: 'StandardOutputSensitivity',
    0x8832: 'RecommendedExposureIndex',
    0x8833: 'ISOSpeed',
    0x8834: 'ISOSpeedLatitudeyyy',
    0x8835: 'ISOSpeedLatitudezzz',
    0x9201: 'ShutterSpeedValue', // Shutter speed
    0x9202: 'ApertureValue', // Lens aperture
    0x9203: 'BrightnessValue', // Value of brightness
    0x9204: 'ExposureBias', // Exposure bias
    0x9205: 'MaxApertureValue', // Smallest F number of lens
    0x9206: 'SubjectDistance', // Distance to subject in meters
    0x9207: 'MeteringMode', // Metering mode
    0x9208: 'LightSource', // Kind of light source
    0x9209: 'Flash', // Flash status
    0x9214: 'SubjectArea', // Location and area of main subject
    0x920a: 'FocalLength', // Focal length of the lens in mm
    0xa20b: 'FlashEnergy', // Strobe energy in BCPS
    0xa20c: 'SpatialFrequencyResponse',
    0xa20e: 'FocalPlaneXResolution', // Number of pixels in width direction per FPRUnit
    0xa20f: 'FocalPlaneYResolution', // Number of pixels in height direction per FPRUnit
    0xa210: 'FocalPlaneResolutionUnit', // Unit for measuring the focal plane resolution
    0xa214: 'SubjectLocation', // Location of subject in image
    0xa215: 'ExposureIndex', // Exposure index selected on camera
    0xa217: 'SensingMethod', // Image sensor type
    0xa300: 'FileSource', // Image source (3 == DSC)
    0xa301: 'SceneType', // Scene type (1 == directly photographed)
    0xa302: 'CFAPattern', // Color filter array geometric pattern
    0xa401: 'CustomRendered', // Special processing
    0xa402: 'ExposureMode', // Exposure mode
    0xa403: 'WhiteBalance', // 1 = auto white balance, 2 = manual
    0xa404: 'DigitalZoomRatio', // Digital zoom ratio
    0xa405: 'FocalLengthIn35mmFilm',
    0xa406: 'SceneCaptureType', // Type of scene
    0xa407: 'GainControl', // Degree of overall image gain adjustment
    0xa408: 'Contrast', // Direction of contrast processing applied by camera
    0xa409: 'Saturation', // Direction of saturation processing applied by camera
    0xa40a: 'Sharpness', // Direction of sharpness processing applied by camera
    0xa40b: 'DeviceSettingDescription',
    0xa40c: 'SubjectDistanceRange', // Distance to subject
    0xa420: 'ImageUniqueID', // Identifier assigned uniquely to each image
    0xa430: 'CameraOwnerName',
    0xa431: 'BodySerialNumber',
    0xa432: 'LensSpecification',
    0xa433: 'LensMake',
    0xa434: 'LensModel',
    0xa435: 'LensSerialNumber',
    // ==============
    // GPS Info tags:
    // ==============
    0x0000: 'GPSVersionID',
    0x0001: 'GPSLatitudeRef',
    0x0002: 'GPSLatitude',
    0x0003: 'GPSLongitudeRef',
    0x0004: 'GPSLongitude',
    0x0005: 'GPSAltitudeRef',
    0x0006: 'GPSAltitude',
    0x0007: 'GPSTimeStamp',
    0x0008: 'GPSSatellites',
    0x0009: 'GPSStatus',
    0x000a: 'GPSMeasureMode',
    0x000b: 'GPSDOP',
    0x000c: 'GPSSpeedRef',
    0x000d: 'GPSSpeed',
    0x000e: 'GPSTrackRef',
    0x000f: 'GPSTrack',
    0x0010: 'GPSImgDirectionRef',
    0x0011: 'GPSImgDirection',
    0x0012: 'GPSMapDatum',
    0x0013: 'GPSDestLatitudeRef',
    0x0014: 'GPSDestLatitude',
    0x0015: 'GPSDestLongitudeRef',
    0x0016: 'GPSDestLongitude',
    0x0017: 'GPSDestBearingRef',
    0x0018: 'GPSDestBearing',
    0x0019: 'GPSDestDistanceRef',
    0x001a: 'GPSDestDistance',
    0x001b: 'GPSProcessingMethod',
    0x001c: 'GPSAreaInformation',
    0x001d: 'GPSDateStamp',
    0x001e: 'GPSDifferential',
    0x001f: 'GPSHPositioningError'
  }

  loadImage.ExifMap.prototype.stringValues = {
    ExposureProgram: {
      0: 'Undefined',
      1: 'Manual',
      2: 'Normal program',
      3: 'Aperture priority',
      4: 'Shutter priority',
      5: 'Creative program',
      6: 'Action program',
      7: 'Portrait mode',
      8: 'Landscape mode'
    },
    MeteringMode: {
      0: 'Unknown',
      1: 'Average',
      2: 'CenterWeightedAverage',
      3: 'Spot',
      4: 'MultiSpot',
      5: 'Pattern',
      6: 'Partial',
      255: 'Other'
    },
    LightSource: {
      0: 'Unknown',
      1: 'Daylight',
      2: 'Fluorescent',
      3: 'Tungsten (incandescent light)',
      4: 'Flash',
      9: 'Fine weather',
      10: 'Cloudy weather',
      11: 'Shade',
      12: 'Daylight fluorescent (D 5700 - 7100K)',
      13: 'Day white fluorescent (N 4600 - 5400K)',
      14: 'Cool white fluorescent (W 3900 - 4500K)',
      15: 'White fluorescent (WW 3200 - 3700K)',
      17: 'Standard light A',
      18: 'Standard light B',
      19: 'Standard light C',
      20: 'D55',
      21: 'D65',
      22: 'D75',
      23: 'D50',
      24: 'ISO studio tungsten',
      255: 'Other'
    },
    Flash: {
      0x0000: 'Flash did not fire',
      0x0001: 'Flash fired',
      0x0005: 'Strobe return light not detected',
      0x0007: 'Strobe return light detected',
      0x0009: 'Flash fired, compulsory flash mode',
      0x000d: 'Flash fired, compulsory flash mode, return light not detected',
      0x000f: 'Flash fired, compulsory flash mode, return light detected',
      0x0010: 'Flash did not fire, compulsory flash mode',
      0x0018: 'Flash did not fire, auto mode',
      0x0019: 'Flash fired, auto mode',
      0x001d: 'Flash fired, auto mode, return light not detected',
      0x001f: 'Flash fired, auto mode, return light detected',
      0x0020: 'No flash function',
      0x0041: 'Flash fired, red-eye reduction mode',
      0x0045: 'Flash fired, red-eye reduction mode, return light not detected',
      0x0047: 'Flash fired, red-eye reduction mode, return light detected',
      0x0049: 'Flash fired, compulsory flash mode, red-eye reduction mode',
      0x004d: 'Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected',
      0x004f: 'Flash fired, compulsory flash mode, red-eye reduction mode, return light detected',
      0x0059: 'Flash fired, auto mode, red-eye reduction mode',
      0x005d: 'Flash fired, auto mode, return light not detected, red-eye reduction mode',
      0x005f: 'Flash fired, auto mode, return light detected, red-eye reduction mode'
    },
    SensingMethod: {
      1: 'Undefined',
      2: 'One-chip color area sensor',
      3: 'Two-chip color area sensor',
      4: 'Three-chip color area sensor',
      5: 'Color sequential area sensor',
      7: 'Trilinear sensor',
      8: 'Color sequential linear sensor'
    },
    SceneCaptureType: {
      0: 'Standard',
      1: 'Landscape',
      2: 'Portrait',
      3: 'Night scene'
    },
    SceneType: {
      1: 'Directly photographed'
    },
    CustomRendered: {
      0: 'Normal process',
      1: 'Custom process'
    },
    WhiteBalance: {
      0: 'Auto white balance',
      1: 'Manual white balance'
    },
    GainControl: {
      0: 'None',
      1: 'Low gain up',
      2: 'High gain up',
      3: 'Low gain down',
      4: 'High gain down'
    },
    Contrast: {
      0: 'Normal',
      1: 'Soft',
      2: 'Hard'
    },
    Saturation: {
      0: 'Normal',
      1: 'Low saturation',
      2: 'High saturation'
    },
    Sharpness: {
      0: 'Normal',
      1: 'Soft',
      2: 'Hard'
    },
    SubjectDistanceRange: {
      0: 'Unknown',
      1: 'Macro',
      2: 'Close view',
      3: 'Distant view'
    },
    FileSource: {
      3: 'DSC'
    },
    ComponentsConfiguration: {
      0: '',
      1: 'Y',
      2: 'Cb',
      3: 'Cr',
      4: 'R',
      5: 'G',
      6: 'B'
    },
    Orientation: {
      1: 'top-left',
      2: 'top-right',
      3: 'bottom-right',
      4: 'bottom-left',
      5: 'left-top',
      6: 'right-top',
      7: 'right-bottom',
      8: 'left-bottom'
    }
  }

  loadImage.ExifMap.prototype.getText = function (id) {
    var value = this.get(id)
    switch (id) {
      case 'LightSource':
      case 'Flash':
      case 'MeteringMode':
      case 'ExposureProgram':
      case 'SensingMethod':
      case 'SceneCaptureType':
      case 'SceneType':
      case 'CustomRendered':
      case 'WhiteBalance':
      case 'GainControl':
      case 'Contrast':
      case 'Saturation':
      case 'Sharpness':
      case 'SubjectDistanceRange':
      case 'FileSource':
      case 'Orientation':
        return this.stringValues[id][value]
      case 'ExifVersion':
      case 'FlashpixVersion':
        if (!value) return
        return String.fromCharCode(value[0], value[1], value[2], value[3])
      case 'ComponentsConfiguration':
        if (!value) return
        return (
          this.stringValues[id][value[0]] +
          this.stringValues[id][value[1]] +
          this.stringValues[id][value[2]] +
          this.stringValues[id][value[3]]
        )
      case 'GPSVersionID':
        if (!value) return
        return value[0] + '.' + value[1] + '.' + value[2] + '.' + value[3]
    }
    return String(value)
  }
  ;(function (exifMapPrototype) {
    var tags = exifMapPrototype.tags
    var map = exifMapPrototype.map
    var prop
    // Map the tag names to tags:
    for (prop in tags) {
      if (tags.hasOwnProperty(prop)) {
        map[tags[prop]] = prop
      }
    }
  })(loadImage.ExifMap.prototype)

  loadImage.ExifMap.prototype.getAll = function () {
    var map = {}
    var prop
    var id
    for (prop in this) {
      if (this.hasOwnProperty(prop)) {
        id = this.tags[prop]
        if (id) {
          map[id] = this.getText(id)
        }
      }
    }
    return map
  }
})

},{"./load-image":"../node_modules/blueimp-load-image/js/load-image.js","./load-image-exif":"../node_modules/blueimp-load-image/js/load-image-exif.js"}],"../node_modules/blueimp-load-image/js/load-image-iptc.js":[function(require,module,exports) {
var define;
/*
 * JavaScript Load Image IPTC Parser
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2013, Sebastian Tschan
 * Copyright 2018, Dave Bevan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

/* global define */

;(function (factory) {
  'use strict'
  if (typeof define === 'function' && define.amd) {
    // Register as an anonymous AMD module:
    define(['./load-image', './load-image-meta'], factory)
  } else if (typeof module === 'object' && module.exports) {
    factory(require('./load-image'), require('./load-image-meta'))
  } else {
    // Browser globals:
    factory(window.loadImage)
  }
})(function (loadImage) {
  'use strict'

  loadImage.IptcMap = function () {
    return this
  }

  loadImage.IptcMap.prototype.map = {
    ObjectName: 0x5
  }

  loadImage.IptcMap.prototype.get = function (id) {
    return this[id] || this[this.map[id]]
  }

  loadImage.parseIptcTags = function (
    dataView,
    startOffset,
    sectionLength,
    data
  ) {
    function getStringFromDB (buffer, start, length) {
      var outstr = ''
      for (var n = start; n < start + length; n++) {
        outstr += String.fromCharCode(buffer.getUint8(n))
      }
      return outstr
    }
    var fieldValue, dataSize, segmentType
    var segmentStartPos = startOffset
    while (segmentStartPos < startOffset + sectionLength) {
      // we currently handle the 2: class of iptc tag
      if (
        dataView.getUint8(segmentStartPos) === 0x1c &&
        dataView.getUint8(segmentStartPos + 1) === 0x02
      ) {
        segmentType = dataView.getUint8(segmentStartPos + 2)
        // only store data for known tags
        if (segmentType in data.iptc.tags) {
          dataSize = dataView.getInt16(segmentStartPos + 3)
          fieldValue = getStringFromDB(dataView, segmentStartPos + 5, dataSize)
          // Check if we already stored a value with this name
          if (data.iptc.hasOwnProperty(segmentType)) {
            // Value already stored with this name, create multivalue field
            if (data.iptc[segmentType] instanceof Array) {
              data.iptc[segmentType].push(fieldValue)
            } else {
              data.iptc[segmentType] = [data.iptc[segmentType], fieldValue]
            }
          } else {
            data.iptc[segmentType] = fieldValue
          }
        }
      }
      segmentStartPos++
    }
  }

  loadImage.parseIptcData = function (dataView, offset, length, data, options) {
    if (options.disableIptc) {
      return
    }
    var markerLength = offset + length
    // Found '8BIM<EOT><EOT>' ?
    var isFieldSegmentStart = function (dataView, offset) {
      return (
        dataView.getUint32(offset) === 0x3842494d &&
        dataView.getUint16(offset + 4) === 0x0404
      )
    }
    // Hunt forward, looking for the correct IPTC block signature:
    // Reference: https://metacpan.org/pod/distribution/Image-MetaData-JPEG/lib/Image/MetaData/JPEG/Structures.pod#Structure-of-a-Photoshop-style-APP13-segment
    // From https://github.com/exif-js/exif-js/blob/master/exif.js ~ line 474 on
    while (offset + 8 < markerLength) {
      if (isFieldSegmentStart(dataView, offset)) {
        var nameHeaderLength = dataView.getUint8(offset + 7)
        if (nameHeaderLength % 2 !== 0) nameHeaderLength += 1
        // Check for pre photoshop 6 format
        if (nameHeaderLength === 0) {
          // Always 4
          nameHeaderLength = 4
        }
        var startOffset = offset + 8 + nameHeaderLength
        if (startOffset > markerLength) {
          console.log('Invalid IPTC data: Invalid segment offset.')
          break
        }
        var sectionLength = dataView.getUint16(offset + 6 + nameHeaderLength)
        if (offset + sectionLength > markerLength) {
          console.log('Invalid IPTC data: Invalid segment size.')
          break
        }
        // Create the iptc object to store the tags:
        data.iptc = new loadImage.IptcMap()
        // Parse the tags
        return loadImage.parseIptcTags(
          dataView,
          startOffset,
          sectionLength,
          data
        )
      }
      offset++
    }
    console.log('No IPTC data at this offset - could be XMP')
  }

  // Registers this IPTC parser for the APP13 JPEG meta data segment:
  loadImage.metaDataParsers.jpeg[0xffed].push(loadImage.parseIptcData)

  // Adds the following properties to the parseMetaData callback data:
  // * iptc: The iptc tags, parsed by the parseIptcData method

  // Adds the following options to the parseMetaData method:
  // * disableIptc: Disables IPTC parsing.
})

},{"./load-image":"../node_modules/blueimp-load-image/js/load-image.js","./load-image-meta":"../node_modules/blueimp-load-image/js/load-image-meta.js"}],"../node_modules/blueimp-load-image/js/load-image-iptc-map.js":[function(require,module,exports) {
var define;
/*
 * JavaScript Load Image IPTC Map
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2013, Sebastian Tschan
 * Copyright 2018, Dave Bevan
 *
 * IPTC tags mapping based on
 * https://github.com/jseidelin/exif-js
 * https://iptc.org/standards/photo-metadata
 * http://www.iptc.org/std/IIM/4.1/specification/IIMV4.1.pdf
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

/* global define */

;(function (factory) {
  'use strict'
  if (typeof define === 'function' && define.amd) {
    // Register as an anonymous AMD module:
    define(['./load-image', './load-image-iptc'], factory)
  } else if (typeof module === 'object' && module.exports) {
    factory(require('./load-image'), require('./load-image-iptc'))
  } else {
    // Browser globals:
    factory(window.loadImage)
  }
})(function (loadImage) {
  'use strict'

  loadImage.IptcMap.prototype.tags = {
    // ==========
    // IPTC tags:
    // ==========
    0x03: 'ObjectType',
    0x04: 'ObjectAttribute',
    0x05: 'ObjectName',
    0x07: 'EditStatus',
    0x08: 'EditorialUpdate',
    0x0a: 'Urgency',
    0x0c: 'SubjectRef',
    0x0f: 'Category',
    0x14: 'SupplCategory',
    0x16: 'FixtureID',
    0x19: 'Keywords',
    0x1a: 'ContentLocCode',
    0x1b: 'ContentLocName',
    0x1e: 'ReleaseDate',
    0x23: 'ReleaseTime',
    0x25: 'ExpirationDate',
    0x26: 'ExpirationTime',
    0x28: 'SpecialInstructions',
    0x2a: 'ActionAdvised',
    0x2d: 'RefService',
    0x2f: 'RefDate',
    0x32: 'RefNumber',
    0x37: 'DateCreated',
    0x3c: 'TimeCreated',
    0x3e: 'DigitalCreationDate',
    0x3f: 'DigitalCreationTime',
    0x41: 'OriginatingProgram',
    0x46: 'ProgramVersion',
    0x4b: 'ObjectCycle',
    0x50: 'Byline',
    0x55: 'BylineTitle',
    0x5a: 'City',
    0x5c: 'Sublocation',
    0x5f: 'State',
    0x64: 'CountryCode',
    0x65: 'CountryName',
    0x67: 'OrigTransRef',
    0x69: 'Headline',
    0x6e: 'Credit',
    0x73: 'Source',
    0x74: 'CopyrightNotice',
    0x76: 'Contact',
    0x78: 'Caption',
    0x7a: 'WriterEditor',
    0x82: 'ImageType',
    0x83: 'ImageOrientation',
    0x87: 'LanguageID'

    // We don't record these tags:
    //
    // 0x00: 'RecordVersion',
    // 0x7d: 'RasterizedCaption',
    // 0x96: 'AudioType',
    // 0x97: 'AudioSamplingRate',
    // 0x98: 'AudioSamplingRes',
    // 0x99: 'AudioDuration',
    // 0x9a: 'AudioOutcue',
    // 0xc8: 'PreviewFileFormat',
    // 0xc9: 'PreviewFileFormatVer',
    // 0xca: 'PreviewData'
  }

  loadImage.IptcMap.prototype.getText = function (id) {
    var value = this.get(id)
    return String(value)
  }
  ;(function (iptcMapPrototype) {
    var tags = iptcMapPrototype.tags
    var map = iptcMapPrototype.map || {}
    var prop
    // Map the tag names to tags:
    for (prop in tags) {
      if (tags.hasOwnProperty(prop)) {
        map[tags[prop]] = prop
      }
    }
  })(loadImage.IptcMap.prototype)

  loadImage.IptcMap.prototype.getAll = function () {
    var map = {}
    var prop
    var id
    for (prop in this) {
      if (this.hasOwnProperty(prop)) {
        id = this.tags[prop]
        if (id) {
          map[id] = this.getText(id)
        }
      }
    }
    return map
  }
})

},{"./load-image":"../node_modules/blueimp-load-image/js/load-image.js","./load-image-iptc":"../node_modules/blueimp-load-image/js/load-image-iptc.js"}],"../node_modules/blueimp-load-image/js/load-image-orientation.js":[function(require,module,exports) {
var define;
/*
 * JavaScript Load Image Orientation
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

/* global define */

;(function (factory) {
  'use strict'
  if (typeof define === 'function' && define.amd) {
    // Register as an anonymous AMD module:
    define(['./load-image', './load-image-scale', './load-image-meta'], factory)
  } else if (typeof module === 'object' && module.exports) {
    factory(
      require('./load-image'),
      require('./load-image-scale'),
      require('./load-image-meta')
    )
  } else {
    // Browser globals:
    factory(window.loadImage)
  }
})(function (loadImage) {
  'use strict'

  var originalHasCanvasOption = loadImage.hasCanvasOption
  var originalHasMetaOption = loadImage.hasMetaOption
  var originalTransformCoordinates = loadImage.transformCoordinates
  var originalGetTransformedOptions = loadImage.getTransformedOptions

  // Determines if the target image should be a canvas element:
  loadImage.hasCanvasOption = function (options) {
    return (
      !!options.orientation || originalHasCanvasOption.call(loadImage, options)
    )
  }

  // Determines if meta data should be loaded automatically:
  loadImage.hasMetaOption = function (options) {
    return (
      (options && options.orientation === true) ||
      originalHasMetaOption.call(loadImage, options)
    )
  }

  // Transform image orientation based on
  // the given EXIF orientation option:
  loadImage.transformCoordinates = function (canvas, options) {
    originalTransformCoordinates.call(loadImage, canvas, options)
    var ctx = canvas.getContext('2d')
    var width = canvas.width
    var height = canvas.height
    var styleWidth = canvas.style.width
    var styleHeight = canvas.style.height
    var orientation = options.orientation
    if (!orientation || orientation > 8) {
      return
    }
    if (orientation > 4) {
      canvas.width = height
      canvas.height = width
      canvas.style.width = styleHeight
      canvas.style.height = styleWidth
    }
    switch (orientation) {
      case 2:
        // horizontal flip
        ctx.translate(width, 0)
        ctx.scale(-1, 1)
        break
      case 3:
        // 180° rotate left
        ctx.translate(width, height)
        ctx.rotate(Math.PI)
        break
      case 4:
        // vertical flip
        ctx.translate(0, height)
        ctx.scale(1, -1)
        break
      case 5:
        // vertical flip + 90 rotate right
        ctx.rotate(0.5 * Math.PI)
        ctx.scale(1, -1)
        break
      case 6:
        // 90° rotate right
        ctx.rotate(0.5 * Math.PI)
        ctx.translate(0, -height)
        break
      case 7:
        // horizontal flip + 90 rotate right
        ctx.rotate(0.5 * Math.PI)
        ctx.translate(width, -height)
        ctx.scale(-1, 1)
        break
      case 8:
        // 90° rotate left
        ctx.rotate(-0.5 * Math.PI)
        ctx.translate(-width, 0)
        break
    }
  }

  // Transforms coordinate and dimension options
  // based on the given orientation option:
  loadImage.getTransformedOptions = function (img, opts, data) {
    var options = originalGetTransformedOptions.call(loadImage, img, opts)
    var orientation = options.orientation
    var newOptions
    var i
    if (orientation === true && data && data.exif) {
      orientation = data.exif.get('Orientation')
    }
    if (!orientation || orientation > 8 || orientation === 1) {
      return options
    }
    newOptions = {}
    for (i in options) {
      if (options.hasOwnProperty(i)) {
        newOptions[i] = options[i]
      }
    }
    newOptions.orientation = orientation
    switch (orientation) {
      case 2:
        // horizontal flip
        newOptions.left = options.right
        newOptions.right = options.left
        break
      case 3:
        // 180° rotate left
        newOptions.left = options.right
        newOptions.top = options.bottom
        newOptions.right = options.left
        newOptions.bottom = options.top
        break
      case 4:
        // vertical flip
        newOptions.top = options.bottom
        newOptions.bottom = options.top
        break
      case 5:
        // vertical flip + 90 rotate right
        newOptions.left = options.top
        newOptions.top = options.left
        newOptions.right = options.bottom
        newOptions.bottom = options.right
        break
      case 6:
        // 90° rotate right
        newOptions.left = options.top
        newOptions.top = options.right
        newOptions.right = options.bottom
        newOptions.bottom = options.left
        break
      case 7:
        // horizontal flip + 90 rotate right
        newOptions.left = options.bottom
        newOptions.top = options.right
        newOptions.right = options.top
        newOptions.bottom = options.left
        break
      case 8:
        // 90° rotate left
        newOptions.left = options.bottom
        newOptions.top = options.left
        newOptions.right = options.top
        newOptions.bottom = options.right
        break
    }
    if (newOptions.orientation > 4) {
      newOptions.maxWidth = options.maxHeight
      newOptions.maxHeight = options.maxWidth
      newOptions.minWidth = options.minHeight
      newOptions.minHeight = options.minWidth
      newOptions.sourceWidth = options.sourceHeight
      newOptions.sourceHeight = options.sourceWidth
    }
    return newOptions
  }
})

},{"./load-image":"../node_modules/blueimp-load-image/js/load-image.js","./load-image-scale":"../node_modules/blueimp-load-image/js/load-image-scale.js","./load-image-meta":"../node_modules/blueimp-load-image/js/load-image-meta.js"}],"../node_modules/blueimp-load-image/js/index.js":[function(require,module,exports) {
module.exports = require('./load-image')

require('./load-image-scale')
require('./load-image-meta')
require('./load-image-fetch')
require('./load-image-exif')
require('./load-image-exif-map')
require('./load-image-iptc')
require('./load-image-iptc-map')
require('./load-image-orientation')

},{"./load-image":"../node_modules/blueimp-load-image/js/load-image.js","./load-image-scale":"../node_modules/blueimp-load-image/js/load-image-scale.js","./load-image-meta":"../node_modules/blueimp-load-image/js/load-image-meta.js","./load-image-fetch":"../node_modules/blueimp-load-image/js/load-image-fetch.js","./load-image-exif":"../node_modules/blueimp-load-image/js/load-image-exif.js","./load-image-exif-map":"../node_modules/blueimp-load-image/js/load-image-exif-map.js","./load-image-iptc":"../node_modules/blueimp-load-image/js/load-image-iptc.js","./load-image-iptc-map":"../node_modules/blueimp-load-image/js/load-image-iptc-map.js","./load-image-orientation":"../node_modules/blueimp-load-image/js/load-image-orientation.js"}],"js/date.js":[function(require,module,exports) {
/**
 * @version: 1.0 Alpha-1
 * @author: Coolite Inc. http://www.coolite.com/
 * @date: 2008-05-13
 * @copyright: Copyright (c) 2006-2008, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * @license: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
 * @website: http://www.datejs.com/
 */
Date.CultureInfo = {
  name: "en-US",
  englishName: "English (United States)",
  nativeName: "English (United States)",
  dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  abbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  shortestDayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  firstLetterDayNames: ["S", "M", "T", "W", "T", "F", "S"],
  monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  abbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  amDesignator: "AM",
  pmDesignator: "PM",
  firstDayOfWeek: 0,
  twoDigitYearMax: 2029,
  dateElementOrder: "mdy",
  formatPatterns: {
    shortDate: "M/d/yyyy",
    longDate: "dddd, MMMM dd, yyyy",
    shortTime: "h:mm tt",
    longTime: "h:mm:ss tt",
    fullDateTime: "dddd, MMMM dd, yyyy h:mm:ss tt",
    sortableDateTime: "yyyy-MM-ddTHH:mm:ss",
    universalSortableDateTime: "yyyy-MM-dd HH:mm:ssZ",
    rfc1123: "ddd, dd MMM yyyy HH:mm:ss GMT",
    monthDay: "MMMM dd",
    yearMonth: "MMMM, yyyy"
  },
  regexPatterns: {
    jan: /^jan(uary)?/i,
    feb: /^feb(ruary)?/i,
    mar: /^mar(ch)?/i,
    apr: /^apr(il)?/i,
    may: /^may/i,
    jun: /^jun(e)?/i,
    jul: /^jul(y)?/i,
    aug: /^aug(ust)?/i,
    sep: /^sep(t(ember)?)?/i,
    oct: /^oct(ober)?/i,
    nov: /^nov(ember)?/i,
    dec: /^dec(ember)?/i,
    sun: /^su(n(day)?)?/i,
    mon: /^mo(n(day)?)?/i,
    tue: /^tu(e(s(day)?)?)?/i,
    wed: /^we(d(nesday)?)?/i,
    thu: /^th(u(r(s(day)?)?)?)?/i,
    fri: /^fr(i(day)?)?/i,
    sat: /^sa(t(urday)?)?/i,
    future: /^next/i,
    past: /^last|past|prev(ious)?/i,
    add: /^(\+|aft(er)?|from|hence)/i,
    subtract: /^(\-|bef(ore)?|ago)/i,
    yesterday: /^yes(terday)?/i,
    today: /^t(od(ay)?)?/i,
    tomorrow: /^tom(orrow)?/i,
    now: /^n(ow)?/i,
    millisecond: /^ms|milli(second)?s?/i,
    second: /^sec(ond)?s?/i,
    minute: /^mn|min(ute)?s?/i,
    hour: /^h(our)?s?/i,
    week: /^w(eek)?s?/i,
    month: /^m(onth)?s?/i,
    day: /^d(ay)?s?/i,
    year: /^y(ear)?s?/i,
    shortMeridian: /^(a|p)/i,
    longMeridian: /^(a\.?m?\.?|p\.?m?\.?)/i,
    timezone: /^((e(s|d)t|c(s|d)t|m(s|d)t|p(s|d)t)|((gmt)?\s*(\+|\-)\s*\d\d\d\d?)|gmt|utc)/i,
    ordinalSuffix: /^\s*(st|nd|rd|th)/i,
    timeContext: /^\s*(\:|a(?!u|p)|p)/i
  },
  timezones: [{
    name: "UTC",
    offset: "-000"
  }, {
    name: "GMT",
    offset: "-000"
  }, {
    name: "EST",
    offset: "-0500"
  }, {
    name: "EDT",
    offset: "-0400"
  }, {
    name: "CST",
    offset: "-0600"
  }, {
    name: "CDT",
    offset: "-0500"
  }, {
    name: "MST",
    offset: "-0700"
  }, {
    name: "MDT",
    offset: "-0600"
  }, {
    name: "PST",
    offset: "-0800"
  }, {
    name: "PDT",
    offset: "-0700"
  }]
};

(function () {
  var $D = Date,
      $P = $D.prototype,
      $C = $D.CultureInfo,
      p = function p(s, l) {
    if (!l) {
      l = 2;
    }

    return ("000" + s).slice(l * -1);
  };

  $P.clearTime = function () {
    this.setHours(0);
    this.setMinutes(0);
    this.setSeconds(0);
    this.setMilliseconds(0);
    return this;
  };

  $P.setTimeToNow = function () {
    var n = new Date();
    this.setHours(n.getHours());
    this.setMinutes(n.getMinutes());
    this.setSeconds(n.getSeconds());
    this.setMilliseconds(n.getMilliseconds());
    return this;
  };

  $D.today = function () {
    return new Date().clearTime();
  };

  $D.compare = function (date1, date2) {
    if (isNaN(date1) || isNaN(date2)) {
      throw new Error(date1 + " - " + date2);
    } else if (date1 instanceof Date && date2 instanceof Date) {
      return date1 < date2 ? -1 : date1 > date2 ? 1 : 0;
    } else {
      throw new TypeError(date1 + " - " + date2);
    }
  };

  $D.equals = function (date1, date2) {
    return date1.compareTo(date2) === 0;
  };

  $D.getDayNumberFromName = function (name) {
    var n = $C.dayNames,
        m = $C.abbreviatedDayNames,
        o = $C.shortestDayNames,
        s = name.toLowerCase();

    for (var i = 0; i < n.length; i++) {
      if (n[i].toLowerCase() == s || m[i].toLowerCase() == s || o[i].toLowerCase() == s) {
        return i;
      }
    }

    return -1;
  };

  $D.getMonthNumberFromName = function (name) {
    var n = $C.monthNames,
        m = $C.abbreviatedMonthNames,
        s = name.toLowerCase();

    for (var i = 0; i < n.length; i++) {
      if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) {
        return i;
      }
    }

    return -1;
  };

  $D.isLeapYear = function (year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  };

  $D.getDaysInMonth = function (year, month) {
    return [31, $D.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  };

  $D.getTimezoneAbbreviation = function (offset) {
    var z = $C.timezones,
        p;

    for (var i = 0; i < z.length; i++) {
      if (z[i].offset === offset) {
        return z[i].name;
      }
    }

    return null;
  };

  $D.getTimezoneOffset = function (name) {
    var z = $C.timezones,
        p;

    for (var i = 0; i < z.length; i++) {
      if (z[i].name === name.toUpperCase()) {
        return z[i].offset;
      }
    }

    return null;
  };

  $P.clone = function () {
    return new Date(this.getTime());
  };

  $P.compareTo = function (date) {
    return Date.compare(this, date);
  };

  $P.equals = function (date) {
    return Date.equals(this, date || new Date());
  };

  $P.between = function (start, end) {
    return this.getTime() >= start.getTime() && this.getTime() <= end.getTime();
  };

  $P.isAfter = function (date) {
    return this.compareTo(date || new Date()) === 1;
  };

  $P.isBefore = function (date) {
    return this.compareTo(date || new Date()) === -1;
  };

  $P.isToday = function () {
    return this.isSameDay(new Date());
  };

  $P.isSameDay = function (date) {
    return this.clone().clearTime().equals(date.clone().clearTime());
  };

  $P.addMilliseconds = function (value) {
    this.setMilliseconds(this.getMilliseconds() + value);
    return this;
  };

  $P.addSeconds = function (value) {
    return this.addMilliseconds(value * 1000);
  };

  $P.addMinutes = function (value) {
    return this.addMilliseconds(value * 60000);
  };

  $P.addHours = function (value) {
    return this.addMilliseconds(value * 3600000);
  };

  $P.addDays = function (value) {
    this.setDate(this.getDate() + value);
    return this;
  };

  $P.addWeeks = function (value) {
    return this.addDays(value * 7);
  };

  $P.addMonths = function (value) {
    var n = this.getDate();
    this.setDate(1);
    this.setMonth(this.getMonth() + value);
    this.setDate(Math.min(n, $D.getDaysInMonth(this.getFullYear(), this.getMonth())));
    return this;
  };

  $P.addYears = function (value) {
    return this.addMonths(value * 12);
  };

  $P.add = function (config) {
    if (typeof config == "number") {
      this._orient = config;
      return this;
    }

    var x = config;

    if (x.milliseconds) {
      this.addMilliseconds(x.milliseconds);
    }

    if (x.seconds) {
      this.addSeconds(x.seconds);
    }

    if (x.minutes) {
      this.addMinutes(x.minutes);
    }

    if (x.hours) {
      this.addHours(x.hours);
    }

    if (x.weeks) {
      this.addWeeks(x.weeks);
    }

    if (x.months) {
      this.addMonths(x.months);
    }

    if (x.years) {
      this.addYears(x.years);
    }

    if (x.days) {
      this.addDays(x.days);
    }

    return this;
  };

  var $y, $m, $d;

  $P.getWeek = function () {
    var a, b, c, d, e, f, g, n, s, w;
    $y = !$y ? this.getFullYear() : $y;
    $m = !$m ? this.getMonth() + 1 : $m;
    $d = !$d ? this.getDate() : $d;

    if ($m <= 2) {
      a = $y - 1;
      b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
      c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0);
      s = b - c;
      e = 0;
      f = $d - 1 + 31 * ($m - 1);
    } else {
      a = $y;
      b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
      c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0);
      s = b - c;
      e = s + 1;
      f = $d + (153 * ($m - 3) + 2) / 5 + 58 + s;
    }

    g = (a + b) % 7;
    d = (f + g - e) % 7;
    n = f + 3 - d | 0;

    if (n < 0) {
      w = 53 - ((g - s) / 5 | 0);
    } else if (n > 364 + s) {
      w = 1;
    } else {
      w = (n / 7 | 0) + 1;
    }

    $y = $m = $d = null;
    return w;
  };

  $P.getISOWeek = function () {
    $y = this.getUTCFullYear();
    $m = this.getUTCMonth() + 1;
    $d = this.getUTCDate();
    return p(this.getWeek());
  };

  $P.setWeek = function (n) {
    return this.moveToDayOfWeek(1).addWeeks(n - this.getWeek());
  };

  $D._validate = function (n, min, max, name) {
    if (typeof n == "undefined") {
      return false;
    } else if (typeof n != "number") {
      throw new TypeError(n + " is not a Number.");
    } else if (n < min || n > max) {
      throw new RangeError(n + " is not a valid value for " + name + ".");
    }

    return true;
  };

  $D.validateMillisecond = function (value) {
    return $D._validate(value, 0, 999, "millisecond");
  };

  $D.validateSecond = function (value) {
    return $D._validate(value, 0, 59, "second");
  };

  $D.validateMinute = function (value) {
    return $D._validate(value, 0, 59, "minute");
  };

  $D.validateHour = function (value) {
    return $D._validate(value, 0, 23, "hour");
  };

  $D.validateDay = function (value, year, month) {
    return $D._validate(value, 1, $D.getDaysInMonth(year, month), "day");
  };

  $D.validateMonth = function (value) {
    return $D._validate(value, 0, 11, "month");
  };

  $D.validateYear = function (value) {
    return $D._validate(value, 0, 9999, "year");
  };

  $P.set = function (config) {
    if ($D.validateMillisecond(config.millisecond)) {
      this.addMilliseconds(config.millisecond - this.getMilliseconds());
    }

    if ($D.validateSecond(config.second)) {
      this.addSeconds(config.second - this.getSeconds());
    }

    if ($D.validateMinute(config.minute)) {
      this.addMinutes(config.minute - this.getMinutes());
    }

    if ($D.validateHour(config.hour)) {
      this.addHours(config.hour - this.getHours());
    }

    if ($D.validateMonth(config.month)) {
      this.addMonths(config.month - this.getMonth());
    }

    if ($D.validateYear(config.year)) {
      this.addYears(config.year - this.getFullYear());
    }

    if ($D.validateDay(config.day, this.getFullYear(), this.getMonth())) {
      this.addDays(config.day - this.getDate());
    }

    if (config.timezone) {
      this.setTimezone(config.timezone);
    }

    if (config.timezoneOffset) {
      this.setTimezoneOffset(config.timezoneOffset);
    }

    if (config.week && $D._validate(config.week, 0, 53, "week")) {
      this.setWeek(config.week);
    }

    return this;
  };

  $P.moveToFirstDayOfMonth = function () {
    return this.set({
      day: 1
    });
  };

  $P.moveToLastDayOfMonth = function () {
    return this.set({
      day: $D.getDaysInMonth(this.getFullYear(), this.getMonth())
    });
  };

  $P.moveToNthOccurrence = function (dayOfWeek, occurrence) {
    var shift = 0;

    if (occurrence > 0) {
      shift = occurrence - 1;
    } else if (occurrence === -1) {
      this.moveToLastDayOfMonth();

      if (this.getDay() !== dayOfWeek) {
        this.moveToDayOfWeek(dayOfWeek, -1);
      }

      return this;
    }

    return this.moveToFirstDayOfMonth().addDays(-1).moveToDayOfWeek(dayOfWeek, +1).addWeeks(shift);
  };

  $P.moveToDayOfWeek = function (dayOfWeek, orient) {
    var diff = (dayOfWeek - this.getDay() + 7 * (orient || +1)) % 7;
    return this.addDays(diff === 0 ? diff += 7 * (orient || +1) : diff);
  };

  $P.moveToMonth = function (month, orient) {
    var diff = (month - this.getMonth() + 12 * (orient || +1)) % 12;
    return this.addMonths(diff === 0 ? diff += 12 * (orient || +1) : diff);
  };

  $P.getOrdinalNumber = function () {
    return Math.ceil((this.clone().clearTime() - new Date(this.getFullYear(), 0, 1)) / 86400000) + 1;
  };

  $P.getTimezone = function () {
    return $D.getTimezoneAbbreviation(this.getUTCOffset());
  };

  $P.setTimezoneOffset = function (offset) {
    var here = this.getTimezoneOffset(),
        there = Number(offset) * -6 / 10;
    return this.addMinutes(there - here);
  };

  $P.setTimezone = function (offset) {
    return this.setTimezoneOffset($D.getTimezoneOffset(offset));
  };

  $P.hasDaylightSavingTime = function () {
    return Date.today().set({
      month: 0,
      day: 1
    }).getTimezoneOffset() !== Date.today().set({
      month: 6,
      day: 1
    }).getTimezoneOffset();
  };

  $P.isDaylightSavingTime = function () {
    return this.hasDaylightSavingTime() && new Date().getTimezoneOffset() === Date.today().set({
      month: 6,
      day: 1
    }).getTimezoneOffset();
  };

  $P.getUTCOffset = function () {
    var n = this.getTimezoneOffset() * -10 / 6,
        r;

    if (n < 0) {
      r = (n - 10000).toString();
      return r.charAt(0) + r.substr(2);
    } else {
      r = (n + 10000).toString();
      return "+" + r.substr(1);
    }
  };

  $P.getElapsed = function (date) {
    return (date || new Date()) - this;
  };

  if (!$P.toISOString) {
    $P.toISOString = function () {
      function f(n) {
        return n < 10 ? '0' + n : n;
      }

      return '"' + this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z"';
    };
  }

  $P._toString = $P.toString;

  $P.toString = function (format) {
    var x = this;

    if (format && format.length == 1) {
      var c = $C.formatPatterns;
      x.t = x.toString;

      switch (format) {
        case "d":
          return x.t(c.shortDate);

        case "D":
          return x.t(c.longDate);

        case "F":
          return x.t(c.fullDateTime);

        case "m":
          return x.t(c.monthDay);

        case "r":
          return x.t(c.rfc1123);

        case "s":
          return x.t(c.sortableDateTime);

        case "t":
          return x.t(c.shortTime);

        case "T":
          return x.t(c.longTime);

        case "u":
          return x.t(c.universalSortableDateTime);

        case "y":
          return x.t(c.yearMonth);
      }
    }

    var ord = function ord(n) {
      switch (n * 1) {
        case 1:
        case 21:
        case 31:
          return "st";

        case 2:
        case 22:
          return "nd";

        case 3:
        case 23:
          return "rd";

        default:
          return "th";
      }
    };

    return format ? format.replace(/(\\)?(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|S)/g, function (m) {
      if (m.charAt(0) === "\\") {
        return m.replace("\\", "");
      }

      x.h = x.getHours;

      switch (m) {
        case "hh":
          return p(x.h() < 13 ? x.h() === 0 ? 12 : x.h() : x.h() - 12);

        case "h":
          return x.h() < 13 ? x.h() === 0 ? 12 : x.h() : x.h() - 12;

        case "HH":
          return p(x.h());

        case "H":
          return x.h();

        case "mm":
          return p(x.getMinutes());

        case "m":
          return x.getMinutes();

        case "ss":
          return p(x.getSeconds());

        case "s":
          return x.getSeconds();

        case "yyyy":
          return p(x.getFullYear(), 4);

        case "yy":
          return p(x.getFullYear());

        case "dddd":
          return $C.dayNames[x.getDay()];

        case "ddd":
          return $C.abbreviatedDayNames[x.getDay()];

        case "dd":
          return p(x.getDate());

        case "d":
          return x.getDate();

        case "MMMM":
          return $C.monthNames[x.getMonth()];

        case "MMM":
          return $C.abbreviatedMonthNames[x.getMonth()];

        case "MM":
          return p(x.getMonth() + 1);

        case "M":
          return x.getMonth() + 1;

        case "t":
          return x.h() < 12 ? $C.amDesignator.substring(0, 1) : $C.pmDesignator.substring(0, 1);

        case "tt":
          return x.h() < 12 ? $C.amDesignator : $C.pmDesignator;

        case "S":
          return ord(x.getDate());

        default:
          return m;
      }
    }) : this._toString();
  };
})();

(function () {
  var $D = Date,
      $P = $D.prototype,
      $C = $D.CultureInfo,
      $N = Number.prototype;
  $P._orient = +1;
  $P._nth = null;
  $P._is = false;
  $P._same = false;
  $P._isSecond = false;
  $N._dateElement = "day";

  $P.next = function () {
    this._orient = +1;
    return this;
  };

  $D.next = function () {
    return $D.today().next();
  };

  $P.last = $P.prev = $P.previous = function () {
    this._orient = -1;
    return this;
  };

  $D.last = $D.prev = $D.previous = function () {
    return $D.today().last();
  };

  $P.is = function () {
    this._is = true;
    return this;
  };

  $P.same = function () {
    this._same = true;
    this._isSecond = false;
    return this;
  };

  $P.today = function () {
    return this.same().day();
  };

  $P.weekday = function () {
    if (this._is) {
      this._is = false;
      return !this.is().sat() && !this.is().sun();
    }

    return false;
  };

  $P.at = function (time) {
    return typeof time === "string" ? $D.parse(this.toString("d") + " " + time) : this.set(time);
  };

  $N.fromNow = $N.after = function (date) {
    var c = {};
    c[this._dateElement] = this;
    return (!date ? new Date() : date.clone()).add(c);
  };

  $N.ago = $N.before = function (date) {
    var c = {};
    c[this._dateElement] = this * -1;
    return (!date ? new Date() : date.clone()).add(c);
  };

  var dx = "sunday monday tuesday wednesday thursday friday saturday".split(/\s/),
      mx = "january february march april may june july august september october november december".split(/\s/),
      px = "Millisecond Second Minute Hour Day Week Month Year".split(/\s/),
      pxf = "Milliseconds Seconds Minutes Hours Date Week Month FullYear".split(/\s/),
      nth = "final first second third fourth fifth".split(/\s/),
      de;

  $P.toObject = function () {
    var o = {};

    for (var i = 0; i < px.length; i++) {
      o[px[i].toLowerCase()] = this["get" + pxf[i]]();
    }

    return o;
  };

  $D.fromObject = function (config) {
    config.week = null;
    return Date.today().set(config);
  };

  var df = function df(n) {
    return function () {
      if (this._is) {
        this._is = false;
        return this.getDay() == n;
      }

      if (this._nth !== null) {
        if (this._isSecond) {
          this.addSeconds(this._orient * -1);
        }

        this._isSecond = false;
        var ntemp = this._nth;
        this._nth = null;
        var temp = this.clone().moveToLastDayOfMonth();
        this.moveToNthOccurrence(n, ntemp);

        if (this > temp) {
          throw new RangeError($D.getDayName(n) + " does not occur " + ntemp + " times in the month of " + $D.getMonthName(temp.getMonth()) + " " + temp.getFullYear() + ".");
        }

        return this;
      }

      return this.moveToDayOfWeek(n, this._orient);
    };
  };

  var sdf = function sdf(n) {
    return function () {
      var t = $D.today(),
          shift = n - t.getDay();

      if (n === 0 && $C.firstDayOfWeek === 1 && t.getDay() !== 0) {
        shift = shift + 7;
      }

      return t.addDays(shift);
    };
  };

  for (var i = 0; i < dx.length; i++) {
    $D[dx[i].toUpperCase()] = $D[dx[i].toUpperCase().substring(0, 3)] = i;
    $D[dx[i]] = $D[dx[i].substring(0, 3)] = sdf(i);
    $P[dx[i]] = $P[dx[i].substring(0, 3)] = df(i);
  }

  var mf = function mf(n) {
    return function () {
      if (this._is) {
        this._is = false;
        return this.getMonth() === n;
      }

      return this.moveToMonth(n, this._orient);
    };
  };

  var smf = function smf(n) {
    return function () {
      return $D.today().set({
        month: n,
        day: 1
      });
    };
  };

  for (var j = 0; j < mx.length; j++) {
    $D[mx[j].toUpperCase()] = $D[mx[j].toUpperCase().substring(0, 3)] = j;
    $D[mx[j]] = $D[mx[j].substring(0, 3)] = smf(j);
    $P[mx[j]] = $P[mx[j].substring(0, 3)] = mf(j);
  }

  var ef = function ef(j) {
    return function () {
      if (this._isSecond) {
        this._isSecond = false;
        return this;
      }

      if (this._same) {
        this._same = this._is = false;
        var o1 = this.toObject(),
            o2 = (arguments[0] || new Date()).toObject(),
            v = "",
            k = j.toLowerCase();

        for (var m = px.length - 1; m > -1; m--) {
          v = px[m].toLowerCase();

          if (o1[v] != o2[v]) {
            return false;
          }

          if (k == v) {
            break;
          }
        }

        return true;
      }

      if (j.substring(j.length - 1) != "s") {
        j += "s";
      }

      return this["add" + j](this._orient);
    };
  };

  var nf = function nf(n) {
    return function () {
      this._dateElement = n;
      return this;
    };
  };

  for (var k = 0; k < px.length; k++) {
    de = px[k].toLowerCase();
    $P[de] = $P[de + "s"] = ef(px[k]);
    $N[de] = $N[de + "s"] = nf(de);
  }

  $P._ss = ef("Second");

  var nthfn = function nthfn(n) {
    return function (dayOfWeek) {
      if (this._same) {
        return this._ss(arguments[0]);
      }

      if (dayOfWeek || dayOfWeek === 0) {
        return this.moveToNthOccurrence(dayOfWeek, n);
      }

      this._nth = n;

      if (n === 2 && (dayOfWeek === undefined || dayOfWeek === null)) {
        this._isSecond = true;
        return this.addSeconds(this._orient);
      }

      return this;
    };
  };

  for (var l = 0; l < nth.length; l++) {
    $P[nth[l]] = l === 0 ? nthfn(-1) : nthfn(l);
  }
})();

(function () {
  Date.Parsing = {
    Exception: function Exception(s) {
      this.message = "Parse error at '" + s.substring(0, 10) + " ...'";
    }
  };
  var $P = Date.Parsing;

  var _ = $P.Operators = {
    rtoken: function rtoken(r) {
      return function (s) {
        var mx = s.match(r);

        if (mx) {
          return [mx[0], s.substring(mx[0].length)];
        } else {
          throw new $P.Exception(s);
        }
      };
    },
    token: function token(s) {
      return function (s) {
        return _.rtoken(new RegExp("^\s*" + s + "\s*"))(s);
      };
    },
    stoken: function stoken(s) {
      return _.rtoken(new RegExp("^" + s));
    },
    until: function until(p) {
      return function (s) {
        var qx = [],
            rx = null;

        while (s.length) {
          try {
            rx = p.call(this, s);
          } catch (e) {
            qx.push(rx[0]);
            s = rx[1];
            continue;
          }

          break;
        }

        return [qx, s];
      };
    },
    many: function many(p) {
      return function (s) {
        var rx = [],
            r = null;

        while (s.length) {
          try {
            r = p.call(this, s);
          } catch (e) {
            return [rx, s];
          }

          rx.push(r[0]);
          s = r[1];
        }

        return [rx, s];
      };
    },
    optional: function optional(p) {
      return function (s) {
        var r = null;

        try {
          r = p.call(this, s);
        } catch (e) {
          return [null, s];
        }

        return [r[0], r[1]];
      };
    },
    not: function not(p) {
      return function (s) {
        try {
          p.call(this, s);
        } catch (e) {
          return [null, s];
        }

        throw new $P.Exception(s);
      };
    },
    ignore: function ignore(p) {
      return p ? function (s) {
        var r = null;
        r = p.call(this, s);
        return [null, r[1]];
      } : null;
    },
    product: function product() {
      var px = arguments[0],
          qx = Array.prototype.slice.call(arguments, 1),
          rx = [];

      for (var i = 0; i < px.length; i++) {
        rx.push(_.each(px[i], qx));
      }

      return rx;
    },
    cache: function cache(rule) {
      var cache = {},
          r = null;
      return function (s) {
        try {
          r = cache[s] = cache[s] || rule.call(this, s);
        } catch (e) {
          r = cache[s] = e;
        }

        if (r instanceof $P.Exception) {
          throw r;
        } else {
          return r;
        }
      };
    },
    any: function any() {
      var px = arguments;
      return function (s) {
        var r = null;

        for (var i = 0; i < px.length; i++) {
          if (px[i] == null) {
            continue;
          }

          try {
            r = px[i].call(this, s);
          } catch (e) {
            r = null;
          }

          if (r) {
            return r;
          }
        }

        throw new $P.Exception(s);
      };
    },
    each: function each() {
      var px = arguments;
      return function (s) {
        var rx = [],
            r = null;

        for (var i = 0; i < px.length; i++) {
          if (px[i] == null) {
            continue;
          }

          try {
            r = px[i].call(this, s);
          } catch (e) {
            throw new $P.Exception(s);
          }

          rx.push(r[0]);
          s = r[1];
        }

        return [rx, s];
      };
    },
    all: function all() {
      var px = arguments,
          _ = _;
      return _.each(_.optional(px));
    },
    sequence: function sequence(px, d, c) {
      d = d || _.rtoken(/^\s*/);
      c = c || null;

      if (px.length == 1) {
        return px[0];
      }

      return function (s) {
        var r = null,
            q = null;
        var rx = [];

        for (var i = 0; i < px.length; i++) {
          try {
            r = px[i].call(this, s);
          } catch (e) {
            break;
          }

          rx.push(r[0]);

          try {
            q = d.call(this, r[1]);
          } catch (ex) {
            q = null;
            break;
          }

          s = q[1];
        }

        if (!r) {
          throw new $P.Exception(s);
        }

        if (q) {
          throw new $P.Exception(q[1]);
        }

        if (c) {
          try {
            r = c.call(this, r[1]);
          } catch (ey) {
            throw new $P.Exception(r[1]);
          }
        }

        return [rx, r ? r[1] : s];
      };
    },
    between: function between(d1, p, d2) {
      d2 = d2 || d1;

      var _fn = _.each(_.ignore(d1), p, _.ignore(d2));

      return function (s) {
        var rx = _fn.call(this, s);

        return [[rx[0][0], r[0][2]], rx[1]];
      };
    },
    list: function list(p, d, c) {
      d = d || _.rtoken(/^\s*/);
      c = c || null;
      return p instanceof Array ? _.each(_.product(p.slice(0, -1), _.ignore(d)), p.slice(-1), _.ignore(c)) : _.each(_.many(_.each(p, _.ignore(d))), px, _.ignore(c));
    },
    set: function set(px, d, c) {
      d = d || _.rtoken(/^\s*/);
      c = c || null;
      return function (s) {
        var r = null,
            p = null,
            q = null,
            rx = null,
            best = [[], s],
            last = false;

        for (var i = 0; i < px.length; i++) {
          q = null;
          p = null;
          r = null;
          last = px.length == 1;

          try {
            r = px[i].call(this, s);
          } catch (e) {
            continue;
          }

          rx = [[r[0]], r[1]];

          if (r[1].length > 0 && !last) {
            try {
              q = d.call(this, r[1]);
            } catch (ex) {
              last = true;
            }
          } else {
            last = true;
          }

          if (!last && q[1].length === 0) {
            last = true;
          }

          if (!last) {
            var qx = [];

            for (var j = 0; j < px.length; j++) {
              if (i != j) {
                qx.push(px[j]);
              }
            }

            p = _.set(qx, d).call(this, q[1]);

            if (p[0].length > 0) {
              rx[0] = rx[0].concat(p[0]);
              rx[1] = p[1];
            }
          }

          if (rx[1].length < best[1].length) {
            best = rx;
          }

          if (best[1].length === 0) {
            break;
          }
        }

        if (best[0].length === 0) {
          return best;
        }

        if (c) {
          try {
            q = c.call(this, best[1]);
          } catch (ey) {
            throw new $P.Exception(best[1]);
          }

          best[1] = q[1];
        }

        return best;
      };
    },
    forward: function forward(gr, fname) {
      return function (s) {
        return gr[fname].call(this, s);
      };
    },
    replace: function replace(rule, repl) {
      return function (s) {
        var r = rule.call(this, s);
        return [repl, r[1]];
      };
    },
    process: function process(rule, fn) {
      return function (s) {
        var r = rule.call(this, s);
        return [fn.call(this, r[0]), r[1]];
      };
    },
    min: function min(_min, rule) {
      return function (s) {
        var rx = rule.call(this, s);

        if (rx[0].length < _min) {
          throw new $P.Exception(s);
        }

        return rx;
      };
    }
  };

  var _generator = function _generator(op) {
    return function () {
      var args = null,
          rx = [];

      if (arguments.length > 1) {
        args = Array.prototype.slice.call(arguments);
      } else if (arguments[0] instanceof Array) {
        args = arguments[0];
      }

      if (args) {
        for (var i = 0, px = args.shift(); i < px.length; i++) {
          args.unshift(px[i]);
          rx.push(op.apply(null, args));
          args.shift();
          return rx;
        }
      } else {
        return op.apply(null, arguments);
      }
    };
  };

  var gx = "optional not ignore cache".split(/\s/);

  for (var i = 0; i < gx.length; i++) {
    _[gx[i]] = _generator(_[gx[i]]);
  }

  var _vector = function _vector(op) {
    return function () {
      if (arguments[0] instanceof Array) {
        return op.apply(null, arguments[0]);
      } else {
        return op.apply(null, arguments);
      }
    };
  };

  var vx = "each any all".split(/\s/);

  for (var j = 0; j < vx.length; j++) {
    _[vx[j]] = _vector(_[vx[j]]);
  }
})();

(function () {
  var $D = Date,
      $P = $D.prototype,
      $C = $D.CultureInfo;

  var flattenAndCompact = function flattenAndCompact(ax) {
    var rx = [];

    for (var i = 0; i < ax.length; i++) {
      if (ax[i] instanceof Array) {
        rx = rx.concat(flattenAndCompact(ax[i]));
      } else {
        if (ax[i]) {
          rx.push(ax[i]);
        }
      }
    }

    return rx;
  };

  $D.Grammar = {};
  $D.Translator = {
    hour: function hour(s) {
      return function () {
        this.hour = Number(s);
      };
    },
    minute: function minute(s) {
      return function () {
        this.minute = Number(s);
      };
    },
    second: function second(s) {
      return function () {
        this.second = Number(s);
      };
    },
    meridian: function meridian(s) {
      return function () {
        this.meridian = s.slice(0, 1).toLowerCase();
      };
    },
    timezone: function timezone(s) {
      return function () {
        var n = s.replace(/[^\d\+\-]/g, "");

        if (n.length) {
          this.timezoneOffset = Number(n);
        } else {
          this.timezone = s.toLowerCase();
        }
      };
    },
    day: function day(x) {
      var s = x[0];
      return function () {
        this.day = Number(s.match(/\d+/)[0]);
      };
    },
    month: function month(s) {
      return function () {
        this.month = s.length == 3 ? "jan feb mar apr may jun jul aug sep oct nov dec".indexOf(s) / 4 : Number(s) - 1;
      };
    },
    year: function year(s) {
      return function () {
        var n = Number(s);
        this.year = s.length > 2 ? n : n + (n + 2000 < $C.twoDigitYearMax ? 2000 : 1900);
      };
    },
    rday: function rday(s) {
      return function () {
        switch (s) {
          case "yesterday":
            this.days = -1;
            break;

          case "tomorrow":
            this.days = 1;
            break;

          case "today":
            this.days = 0;
            break;

          case "now":
            this.days = 0;
            this.now = true;
            break;
        }
      };
    },
    finishExact: function finishExact(x) {
      x = x instanceof Array ? x : [x];

      for (var i = 0; i < x.length; i++) {
        if (x[i]) {
          x[i].call(this);
        }
      }

      var now = new Date();

      if ((this.hour || this.minute) && !this.month && !this.year && !this.day) {
        this.day = now.getDate();
      }

      if (!this.year) {
        this.year = now.getFullYear();
      }

      if (!this.month && this.month !== 0) {
        this.month = now.getMonth();
      }

      if (!this.day) {
        this.day = 1;
      }

      if (!this.hour) {
        this.hour = 0;
      }

      if (!this.minute) {
        this.minute = 0;
      }

      if (!this.second) {
        this.second = 0;
      }

      if (this.meridian && this.hour) {
        if (this.meridian == "p" && this.hour < 12) {
          this.hour = this.hour + 12;
        } else if (this.meridian == "a" && this.hour == 12) {
          this.hour = 0;
        }
      }

      if (this.day > $D.getDaysInMonth(this.year, this.month)) {
        throw new RangeError(this.day + " is not a valid value for days.");
      }

      var r = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second);

      if (this.timezone) {
        r.set({
          timezone: this.timezone
        });
      } else if (this.timezoneOffset) {
        r.set({
          timezoneOffset: this.timezoneOffset
        });
      }

      return r;
    },
    finish: function finish(x) {
      x = x instanceof Array ? flattenAndCompact(x) : [x];

      if (x.length === 0) {
        return null;
      }

      for (var i = 0; i < x.length; i++) {
        if (typeof x[i] == "function") {
          x[i].call(this);
        }
      }

      var today = $D.today();

      if (this.now && !this.unit && !this.operator) {
        return new Date();
      } else if (this.now) {
        today = new Date();
      }

      var expression = !!(this.days && this.days !== null || this.orient || this.operator);
      var gap, mod, orient;
      orient = this.orient == "past" || this.operator == "subtract" ? -1 : 1;

      if (!this.now && "hour minute second".indexOf(this.unit) != -1) {
        today.setTimeToNow();
      }

      if (this.month || this.month === 0) {
        if ("year day hour minute second".indexOf(this.unit) != -1) {
          this.value = this.month + 1;
          this.month = null;
          expression = true;
        }
      }

      if (!expression && this.weekday && !this.day && !this.days) {
        var temp = Date[this.weekday]();
        this.day = temp.getDate();

        if (!this.month) {
          this.month = temp.getMonth();
        }

        this.year = temp.getFullYear();
      }

      if (expression && this.weekday && this.unit != "month") {
        this.unit = "day";
        gap = $D.getDayNumberFromName(this.weekday) - today.getDay();
        mod = 7;
        this.days = gap ? (gap + orient * mod) % mod : orient * mod;
      }

      if (this.month && this.unit == "day" && this.operator) {
        this.value = this.month + 1;
        this.month = null;
      }

      if (this.value != null && this.month != null && this.year != null) {
        this.day = this.value * 1;
      }

      if (this.month && !this.day && this.value) {
        today.set({
          day: this.value * 1
        });

        if (!expression) {
          this.day = this.value * 1;
        }
      }

      if (!this.month && this.value && this.unit == "month" && !this.now) {
        this.month = this.value;
        expression = true;
      }

      if (expression && (this.month || this.month === 0) && this.unit != "year") {
        this.unit = "month";
        gap = this.month - today.getMonth();
        mod = 12;
        this.months = gap ? (gap + orient * mod) % mod : orient * mod;
        this.month = null;
      }

      if (!this.unit) {
        this.unit = "day";
      }

      if (!this.value && this.operator && this.operator !== null && this[this.unit + "s"] && this[this.unit + "s"] !== null) {
        this[this.unit + "s"] = this[this.unit + "s"] + (this.operator == "add" ? 1 : -1) + (this.value || 0) * orient;
      } else if (this[this.unit + "s"] == null || this.operator != null) {
        if (!this.value) {
          this.value = 1;
        }

        this[this.unit + "s"] = this.value * orient;
      }

      if (this.meridian && this.hour) {
        if (this.meridian == "p" && this.hour < 12) {
          this.hour = this.hour + 12;
        } else if (this.meridian == "a" && this.hour == 12) {
          this.hour = 0;
        }
      }

      if (this.weekday && !this.day && !this.days) {
        var temp = Date[this.weekday]();
        this.day = temp.getDate();

        if (temp.getMonth() !== today.getMonth()) {
          this.month = temp.getMonth();
        }
      }

      if ((this.month || this.month === 0) && !this.day) {
        this.day = 1;
      }

      if (!this.orient && !this.operator && this.unit == "week" && this.value && !this.day && !this.month) {
        return Date.today().setWeek(this.value);
      }

      if (expression && this.timezone && this.day && this.days) {
        this.day = this.days;
      }

      return expression ? today.add(this) : today.set(this);
    }
  };

  var _ = $D.Parsing.Operators,
      g = $D.Grammar,
      t = $D.Translator,
      _fn;

  g.datePartDelimiter = _.rtoken(/^([\s\-\.\,\/\x27]+)/);
  g.timePartDelimiter = _.stoken(":");
  g.whiteSpace = _.rtoken(/^\s*/);
  g.generalDelimiter = _.rtoken(/^(([\s\,]|at|@|on)+)/);
  var _C = {};

  g.ctoken = function (keys) {
    var fn = _C[keys];

    if (!fn) {
      var c = $C.regexPatterns;
      var kx = keys.split(/\s+/),
          px = [];

      for (var i = 0; i < kx.length; i++) {
        px.push(_.replace(_.rtoken(c[kx[i]]), kx[i]));
      }

      fn = _C[keys] = _.any.apply(null, px);
    }

    return fn;
  };

  g.ctoken2 = function (key) {
    return _.rtoken($C.regexPatterns[key]);
  };

  g.h = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2]|[1-9])/), t.hour));
  g.hh = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2])/), t.hour));
  g.H = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3]|[0-9])/), t.hour));
  g.HH = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3])/), t.hour));
  g.m = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.minute));
  g.mm = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.minute));
  g.s = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.second));
  g.ss = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.second));
  g.hms = _.cache(_.sequence([g.H, g.m, g.s], g.timePartDelimiter));
  g.t = _.cache(_.process(g.ctoken2("shortMeridian"), t.meridian));
  g.tt = _.cache(_.process(g.ctoken2("longMeridian"), t.meridian));
  g.z = _.cache(_.process(_.rtoken(/^((\+|\-)\s*\d\d\d\d)|((\+|\-)\d\d\:?\d\d)/), t.timezone));
  g.zz = _.cache(_.process(_.rtoken(/^((\+|\-)\s*\d\d\d\d)|((\+|\-)\d\d\:?\d\d)/), t.timezone));
  g.zzz = _.cache(_.process(g.ctoken2("timezone"), t.timezone));
  g.timeSuffix = _.each(_.ignore(g.whiteSpace), _.set([g.tt, g.zzz]));
  g.time = _.each(_.optional(_.ignore(_.stoken("T"))), g.hms, g.timeSuffix);
  g.d = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1]|\d)/), _.optional(g.ctoken2("ordinalSuffix"))), t.day));
  g.dd = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1])/), _.optional(g.ctoken2("ordinalSuffix"))), t.day));
  g.ddd = g.dddd = _.cache(_.process(g.ctoken("sun mon tue wed thu fri sat"), function (s) {
    return function () {
      this.weekday = s;
    };
  }));
  g.M = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d|\d)/), t.month));
  g.MM = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d)/), t.month));
  g.MMM = g.MMMM = _.cache(_.process(g.ctoken("jan feb mar apr may jun jul aug sep oct nov dec"), t.month));
  g.y = _.cache(_.process(_.rtoken(/^(\d\d?)/), t.year));
  g.yy = _.cache(_.process(_.rtoken(/^(\d\d)/), t.year));
  g.yyy = _.cache(_.process(_.rtoken(/^(\d\d?\d?\d?)/), t.year));
  g.yyyy = _.cache(_.process(_.rtoken(/^(\d\d\d\d)/), t.year));

  _fn = function _fn() {
    return _.each(_.any.apply(null, arguments), _.not(g.ctoken2("timeContext")));
  };

  g.day = _fn(g.d, g.dd);
  g.month = _fn(g.M, g.MMM);
  g.year = _fn(g.yyyy, g.yy);
  g.orientation = _.process(g.ctoken("past future"), function (s) {
    return function () {
      this.orient = s;
    };
  });
  g.operator = _.process(g.ctoken("add subtract"), function (s) {
    return function () {
      this.operator = s;
    };
  });
  g.rday = _.process(g.ctoken("yesterday tomorrow today now"), t.rday);
  g.unit = _.process(g.ctoken("second minute hour day week month year"), function (s) {
    return function () {
      this.unit = s;
    };
  });
  g.value = _.process(_.rtoken(/^\d\d?(st|nd|rd|th)?/), function (s) {
    return function () {
      this.value = s.replace(/\D/g, "");
    };
  });
  g.expression = _.set([g.rday, g.operator, g.value, g.unit, g.orientation, g.ddd, g.MMM]);

  _fn = function _fn() {
    return _.set(arguments, g.datePartDelimiter);
  };

  g.mdy = _fn(g.ddd, g.month, g.day, g.year);
  g.ymd = _fn(g.ddd, g.year, g.month, g.day);
  g.dmy = _fn(g.ddd, g.day, g.month, g.year);

  g.date = function (s) {
    return (g[$C.dateElementOrder] || g.mdy).call(this, s);
  };

  g.format = _.process(_.many(_.any(_.process(_.rtoken(/^(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?)/), function (fmt) {
    if (g[fmt]) {
      return g[fmt];
    } else {
      throw $D.Parsing.Exception(fmt);
    }
  }), _.process(_.rtoken(/^[^dMyhHmstz]+/), function (s) {
    return _.ignore(_.stoken(s));
  }))), function (rules) {
    return _.process(_.each.apply(null, rules), t.finishExact);
  });
  var _F = {};

  var _get = function _get(f) {
    return _F[f] = _F[f] || g.format(f)[0];
  };

  g.formats = function (fx) {
    if (fx instanceof Array) {
      var rx = [];

      for (var i = 0; i < fx.length; i++) {
        rx.push(_get(fx[i]));
      }

      return _.any.apply(null, rx);
    } else {
      return _get(fx);
    }
  };

  g._formats = g.formats(["\"yyyy-MM-ddTHH:mm:ssZ\"", "yyyy-MM-ddTHH:mm:ssZ", "yyyy-MM-ddTHH:mm:ssz", "yyyy-MM-ddTHH:mm:ss", "yyyy-MM-ddTHH:mmZ", "yyyy-MM-ddTHH:mmz", "yyyy-MM-ddTHH:mm", "ddd, MMM dd, yyyy H:mm:ss tt", "ddd MMM d yyyy HH:mm:ss zzz", "MMddyyyy", "ddMMyyyy", "Mddyyyy", "ddMyyyy", "Mdyyyy", "dMyyyy", "yyyy", "Mdyy", "dMyy", "d"]);
  g._start = _.process(_.set([g.date, g.time, g.expression], g.generalDelimiter, g.whiteSpace), t.finish);

  g.start = function (s) {
    try {
      var r = g._formats.call({}, s);

      if (r[1].length === 0) {
        return r;
      }
    } catch (e) {}

    return g._start.call({}, s);
  };

  $D._parse = $D.parse;

  $D.parse = function (s) {
    var r = null;

    if (!s) {
      return null;
    }

    if (s instanceof Date) {
      return s;
    }

    try {
      r = $D.Grammar.start.call({}, s.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1"));
    } catch (e) {
      return null;
    }

    return r[1].length === 0 ? r[0] : null;
  };

  $D.getParseFunction = function (fx) {
    var fn = $D.Grammar.formats(fx);
    return function (s) {
      var r = null;

      try {
        r = fn.call({}, s);
      } catch (e) {
        return null;
      }

      return r[1].length === 0 ? r[0] : null;
    };
  };

  $D.parseExact = function (s, fx) {
    return $D.getParseFunction(fx)(s);
  };
})();
},{}],"js/date-en-GB.js":[function(require,module,exports) {
/**
 * @version: 1.0 Alpha-1
 * @author: Coolite Inc. http://www.coolite.com/
 * @date: 2008-05-13
 * @copyright: Copyright (c) 2006-2008, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * @license: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
 * @website: http://www.datejs.com/
 */
Date.CultureInfo = {
  name: "en-GB",
  englishName: "English (United Kingdom)",
  nativeName: "English (United Kingdom)",
  dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  abbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  shortestDayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  firstLetterDayNames: ["S", "M", "T", "W", "T", "F", "S"],
  monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  abbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  amDesignator: "AM",
  pmDesignator: "PM",
  firstDayOfWeek: 1,
  twoDigitYearMax: 2029,
  dateElementOrder: "dmy",
  formatPatterns: {
    shortDate: "dd/MM/yyyy",
    longDate: "dd MMMM yyyy",
    shortTime: "HH:mm",
    longTime: "HH:mm:ss",
    fullDateTime: "dd MMMM yyyy HH:mm:ss",
    sortableDateTime: "yyyy-MM-ddTHH:mm:ss",
    universalSortableDateTime: "yyyy-MM-dd HH:mm:ssZ",
    rfc1123: "ddd, dd MMM yyyy HH:mm:ss GMT",
    monthDay: "dd MMMM",
    yearMonth: "MMMM yyyy"
  },
  regexPatterns: {
    jan: /^jan(uary)?/i,
    feb: /^feb(ruary)?/i,
    mar: /^mar(ch)?/i,
    apr: /^apr(il)?/i,
    may: /^may/i,
    jun: /^jun(e)?/i,
    jul: /^jul(y)?/i,
    aug: /^aug(ust)?/i,
    sep: /^sep(t(ember)?)?/i,
    oct: /^oct(ober)?/i,
    nov: /^nov(ember)?/i,
    dec: /^dec(ember)?/i,
    sun: /^su(n(day)?)?/i,
    mon: /^mo(n(day)?)?/i,
    tue: /^tu(e(s(day)?)?)?/i,
    wed: /^we(d(nesday)?)?/i,
    thu: /^th(u(r(s(day)?)?)?)?/i,
    fri: /^fr(i(day)?)?/i,
    sat: /^sa(t(urday)?)?/i,
    future: /^next/i,
    past: /^last|past|prev(ious)?/i,
    add: /^(\+|aft(er)?|from|hence)/i,
    subtract: /^(\-|bef(ore)?|ago)/i,
    yesterday: /^yes(terday)?/i,
    today: /^t(od(ay)?)?/i,
    tomorrow: /^tom(orrow)?/i,
    now: /^n(ow)?/i,
    millisecond: /^ms|milli(second)?s?/i,
    second: /^sec(ond)?s?/i,
    minute: /^mn|min(ute)?s?/i,
    hour: /^h(our)?s?/i,
    week: /^w(eek)?s?/i,
    month: /^m(onth)?s?/i,
    day: /^d(ay)?s?/i,
    year: /^y(ear)?s?/i,
    shortMeridian: /^(a|p)/i,
    longMeridian: /^(a\.?m?\.?|p\.?m?\.?)/i,
    timezone: /^((e(s|d)t|c(s|d)t|m(s|d)t|p(s|d)t)|((gmt)?\s*(\+|\-)\s*\d\d\d\d?)|gmt|utc)/i,
    ordinalSuffix: /^\s*(st|nd|rd|th)/i,
    timeContext: /^\s*(\:|a(?!u|p)|p)/i
  },
  timezones: [{
    name: "UTC",
    offset: "-000"
  }, {
    name: "GMT",
    offset: "-000"
  }, {
    name: "EST",
    offset: "-0500"
  }, {
    name: "EDT",
    offset: "-0400"
  }, {
    name: "CST",
    offset: "-0600"
  }, {
    name: "CDT",
    offset: "-0500"
  }, {
    name: "MST",
    offset: "-0700"
  }, {
    name: "MDT",
    offset: "-0600"
  }, {
    name: "PST",
    offset: "-0800"
  }, {
    name: "PDT",
    offset: "-0700"
  }]
};

(function () {
  var $D = Date,
      $P = $D.prototype,
      $C = $D.CultureInfo,
      p = function p(s, l) {
    if (!l) {
      l = 2;
    }

    return ("000" + s).slice(l * -1);
  };

  $P.clearTime = function () {
    this.setHours(0);
    this.setMinutes(0);
    this.setSeconds(0);
    this.setMilliseconds(0);
    return this;
  };

  $P.setTimeToNow = function () {
    var n = new Date();
    this.setHours(n.getHours());
    this.setMinutes(n.getMinutes());
    this.setSeconds(n.getSeconds());
    this.setMilliseconds(n.getMilliseconds());
    return this;
  };

  $D.today = function () {
    return new Date().clearTime();
  };

  $D.compare = function (date1, date2) {
    if (isNaN(date1) || isNaN(date2)) {
      throw new Error(date1 + " - " + date2);
    } else if (date1 instanceof Date && date2 instanceof Date) {
      return date1 < date2 ? -1 : date1 > date2 ? 1 : 0;
    } else {
      throw new TypeError(date1 + " - " + date2);
    }
  };

  $D.equals = function (date1, date2) {
    return date1.compareTo(date2) === 0;
  };

  $D.getDayNumberFromName = function (name) {
    var n = $C.dayNames,
        m = $C.abbreviatedDayNames,
        o = $C.shortestDayNames,
        s = name.toLowerCase();

    for (var i = 0; i < n.length; i++) {
      if (n[i].toLowerCase() == s || m[i].toLowerCase() == s || o[i].toLowerCase() == s) {
        return i;
      }
    }

    return -1;
  };

  $D.getMonthNumberFromName = function (name) {
    var n = $C.monthNames,
        m = $C.abbreviatedMonthNames,
        s = name.toLowerCase();

    for (var i = 0; i < n.length; i++) {
      if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) {
        return i;
      }
    }

    return -1;
  };

  $D.isLeapYear = function (year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  };

  $D.getDaysInMonth = function (year, month) {
    return [31, $D.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  };

  $D.getTimezoneAbbreviation = function (offset) {
    var z = $C.timezones,
        p;

    for (var i = 0; i < z.length; i++) {
      if (z[i].offset === offset) {
        return z[i].name;
      }
    }

    return null;
  };

  $D.getTimezoneOffset = function (name) {
    var z = $C.timezones,
        p;

    for (var i = 0; i < z.length; i++) {
      if (z[i].name === name.toUpperCase()) {
        return z[i].offset;
      }
    }

    return null;
  };

  $P.clone = function () {
    return new Date(this.getTime());
  };

  $P.compareTo = function (date) {
    return Date.compare(this, date);
  };

  $P.equals = function (date) {
    return Date.equals(this, date || new Date());
  };

  $P.between = function (start, end) {
    return this.getTime() >= start.getTime() && this.getTime() <= end.getTime();
  };

  $P.isAfter = function (date) {
    return this.compareTo(date || new Date()) === 1;
  };

  $P.isBefore = function (date) {
    return this.compareTo(date || new Date()) === -1;
  };

  $P.isToday = function () {
    return this.isSameDay(new Date());
  };

  $P.isSameDay = function (date) {
    return this.clone().clearTime().equals(date.clone().clearTime());
  };

  $P.addMilliseconds = function (value) {
    this.setMilliseconds(this.getMilliseconds() + value);
    return this;
  };

  $P.addSeconds = function (value) {
    return this.addMilliseconds(value * 1000);
  };

  $P.addMinutes = function (value) {
    return this.addMilliseconds(value * 60000);
  };

  $P.addHours = function (value) {
    return this.addMilliseconds(value * 3600000);
  };

  $P.addDays = function (value) {
    this.setDate(this.getDate() + value);
    return this;
  };

  $P.addWeeks = function (value) {
    return this.addDays(value * 7);
  };

  $P.addMonths = function (value) {
    var n = this.getDate();
    this.setDate(1);
    this.setMonth(this.getMonth() + value);
    this.setDate(Math.min(n, $D.getDaysInMonth(this.getFullYear(), this.getMonth())));
    return this;
  };

  $P.addYears = function (value) {
    return this.addMonths(value * 12);
  };

  $P.add = function (config) {
    if (typeof config == "number") {
      this._orient = config;
      return this;
    }

    var x = config;

    if (x.milliseconds) {
      this.addMilliseconds(x.milliseconds);
    }

    if (x.seconds) {
      this.addSeconds(x.seconds);
    }

    if (x.minutes) {
      this.addMinutes(x.minutes);
    }

    if (x.hours) {
      this.addHours(x.hours);
    }

    if (x.weeks) {
      this.addWeeks(x.weeks);
    }

    if (x.months) {
      this.addMonths(x.months);
    }

    if (x.years) {
      this.addYears(x.years);
    }

    if (x.days) {
      this.addDays(x.days);
    }

    return this;
  };

  var $y, $m, $d;

  $P.getWeek = function () {
    var a, b, c, d, e, f, g, n, s, w;
    $y = !$y ? this.getFullYear() : $y;
    $m = !$m ? this.getMonth() + 1 : $m;
    $d = !$d ? this.getDate() : $d;

    if ($m <= 2) {
      a = $y - 1;
      b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
      c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0);
      s = b - c;
      e = 0;
      f = $d - 1 + 31 * ($m - 1);
    } else {
      a = $y;
      b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
      c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0);
      s = b - c;
      e = s + 1;
      f = $d + (153 * ($m - 3) + 2) / 5 + 58 + s;
    }

    g = (a + b) % 7;
    d = (f + g - e) % 7;
    n = f + 3 - d | 0;

    if (n < 0) {
      w = 53 - ((g - s) / 5 | 0);
    } else if (n > 364 + s) {
      w = 1;
    } else {
      w = (n / 7 | 0) + 1;
    }

    $y = $m = $d = null;
    return w;
  };

  $P.getISOWeek = function () {
    $y = this.getUTCFullYear();
    $m = this.getUTCMonth() + 1;
    $d = this.getUTCDate();
    return p(this.getWeek());
  };

  $P.setWeek = function (n) {
    return this.moveToDayOfWeek(1).addWeeks(n - this.getWeek());
  };

  $D._validate = function (n, min, max, name) {
    if (typeof n == "undefined") {
      return false;
    } else if (typeof n != "number") {
      throw new TypeError(n + " is not a Number.");
    } else if (n < min || n > max) {
      throw new RangeError(n + " is not a valid value for " + name + ".");
    }

    return true;
  };

  $D.validateMillisecond = function (value) {
    return $D._validate(value, 0, 999, "millisecond");
  };

  $D.validateSecond = function (value) {
    return $D._validate(value, 0, 59, "second");
  };

  $D.validateMinute = function (value) {
    return $D._validate(value, 0, 59, "minute");
  };

  $D.validateHour = function (value) {
    return $D._validate(value, 0, 23, "hour");
  };

  $D.validateDay = function (value, year, month) {
    return $D._validate(value, 1, $D.getDaysInMonth(year, month), "day");
  };

  $D.validateMonth = function (value) {
    return $D._validate(value, 0, 11, "month");
  };

  $D.validateYear = function (value) {
    return $D._validate(value, 0, 9999, "year");
  };

  $P.set = function (config) {
    if ($D.validateMillisecond(config.millisecond)) {
      this.addMilliseconds(config.millisecond - this.getMilliseconds());
    }

    if ($D.validateSecond(config.second)) {
      this.addSeconds(config.second - this.getSeconds());
    }

    if ($D.validateMinute(config.minute)) {
      this.addMinutes(config.minute - this.getMinutes());
    }

    if ($D.validateHour(config.hour)) {
      this.addHours(config.hour - this.getHours());
    }

    if ($D.validateMonth(config.month)) {
      this.addMonths(config.month - this.getMonth());
    }

    if ($D.validateYear(config.year)) {
      this.addYears(config.year - this.getFullYear());
    }

    if ($D.validateDay(config.day, this.getFullYear(), this.getMonth())) {
      this.addDays(config.day - this.getDate());
    }

    if (config.timezone) {
      this.setTimezone(config.timezone);
    }

    if (config.timezoneOffset) {
      this.setTimezoneOffset(config.timezoneOffset);
    }

    if (config.week && $D._validate(config.week, 0, 53, "week")) {
      this.setWeek(config.week);
    }

    return this;
  };

  $P.moveToFirstDayOfMonth = function () {
    return this.set({
      day: 1
    });
  };

  $P.moveToLastDayOfMonth = function () {
    return this.set({
      day: $D.getDaysInMonth(this.getFullYear(), this.getMonth())
    });
  };

  $P.moveToNthOccurrence = function (dayOfWeek, occurrence) {
    var shift = 0;

    if (occurrence > 0) {
      shift = occurrence - 1;
    } else if (occurrence === -1) {
      this.moveToLastDayOfMonth();

      if (this.getDay() !== dayOfWeek) {
        this.moveToDayOfWeek(dayOfWeek, -1);
      }

      return this;
    }

    return this.moveToFirstDayOfMonth().addDays(-1).moveToDayOfWeek(dayOfWeek, +1).addWeeks(shift);
  };

  $P.moveToDayOfWeek = function (dayOfWeek, orient) {
    var diff = (dayOfWeek - this.getDay() + 7 * (orient || +1)) % 7;
    return this.addDays(diff === 0 ? diff += 7 * (orient || +1) : diff);
  };

  $P.moveToMonth = function (month, orient) {
    var diff = (month - this.getMonth() + 12 * (orient || +1)) % 12;
    return this.addMonths(diff === 0 ? diff += 12 * (orient || +1) : diff);
  };

  $P.getOrdinalNumber = function () {
    return Math.ceil((this.clone().clearTime() - new Date(this.getFullYear(), 0, 1)) / 86400000) + 1;
  };

  $P.getTimezone = function () {
    return $D.getTimezoneAbbreviation(this.getUTCOffset());
  };

  $P.setTimezoneOffset = function (offset) {
    var here = this.getTimezoneOffset(),
        there = Number(offset) * -6 / 10;
    return this.addMinutes(there - here);
  };

  $P.setTimezone = function (offset) {
    return this.setTimezoneOffset($D.getTimezoneOffset(offset));
  };

  $P.hasDaylightSavingTime = function () {
    return Date.today().set({
      month: 0,
      day: 1
    }).getTimezoneOffset() !== Date.today().set({
      month: 6,
      day: 1
    }).getTimezoneOffset();
  };

  $P.isDaylightSavingTime = function () {
    return this.hasDaylightSavingTime() && new Date().getTimezoneOffset() === Date.today().set({
      month: 6,
      day: 1
    }).getTimezoneOffset();
  };

  $P.getUTCOffset = function () {
    var n = this.getTimezoneOffset() * -10 / 6,
        r;

    if (n < 0) {
      r = (n - 10000).toString();
      return r.charAt(0) + r.substr(2);
    } else {
      r = (n + 10000).toString();
      return "+" + r.substr(1);
    }
  };

  $P.getElapsed = function (date) {
    return (date || new Date()) - this;
  };

  if (!$P.toISOString) {
    $P.toISOString = function () {
      function f(n) {
        return n < 10 ? '0' + n : n;
      }

      return '"' + this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z"';
    };
  }

  $P._toString = $P.toString;

  $P.toString = function (format) {
    var x = this;

    if (format && format.length == 1) {
      var c = $C.formatPatterns;
      x.t = x.toString;

      switch (format) {
        case "d":
          return x.t(c.shortDate);

        case "D":
          return x.t(c.longDate);

        case "F":
          return x.t(c.fullDateTime);

        case "m":
          return x.t(c.monthDay);

        case "r":
          return x.t(c.rfc1123);

        case "s":
          return x.t(c.sortableDateTime);

        case "t":
          return x.t(c.shortTime);

        case "T":
          return x.t(c.longTime);

        case "u":
          return x.t(c.universalSortableDateTime);

        case "y":
          return x.t(c.yearMonth);
      }
    }

    var ord = function ord(n) {
      switch (n * 1) {
        case 1:
        case 21:
        case 31:
          return "st";

        case 2:
        case 22:
          return "nd";

        case 3:
        case 23:
          return "rd";

        default:
          return "th";
      }
    };

    return format ? format.replace(/(\\)?(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|S)/g, function (m) {
      if (m.charAt(0) === "\\") {
        return m.replace("\\", "");
      }

      x.h = x.getHours;

      switch (m) {
        case "hh":
          return p(x.h() < 13 ? x.h() === 0 ? 12 : x.h() : x.h() - 12);

        case "h":
          return x.h() < 13 ? x.h() === 0 ? 12 : x.h() : x.h() - 12;

        case "HH":
          return p(x.h());

        case "H":
          return x.h();

        case "mm":
          return p(x.getMinutes());

        case "m":
          return x.getMinutes();

        case "ss":
          return p(x.getSeconds());

        case "s":
          return x.getSeconds();

        case "yyyy":
          return p(x.getFullYear(), 4);

        case "yy":
          return p(x.getFullYear());

        case "dddd":
          return $C.dayNames[x.getDay()];

        case "ddd":
          return $C.abbreviatedDayNames[x.getDay()];

        case "dd":
          return p(x.getDate());

        case "d":
          return x.getDate();

        case "MMMM":
          return $C.monthNames[x.getMonth()];

        case "MMM":
          return $C.abbreviatedMonthNames[x.getMonth()];

        case "MM":
          return p(x.getMonth() + 1);

        case "M":
          return x.getMonth() + 1;

        case "t":
          return x.h() < 12 ? $C.amDesignator.substring(0, 1) : $C.pmDesignator.substring(0, 1);

        case "tt":
          return x.h() < 12 ? $C.amDesignator : $C.pmDesignator;

        case "S":
          return ord(x.getDate());

        default:
          return m;
      }
    }) : this._toString();
  };
})();

(function () {
  var $D = Date,
      $P = $D.prototype,
      $C = $D.CultureInfo,
      $N = Number.prototype;
  $P._orient = +1;
  $P._nth = null;
  $P._is = false;
  $P._same = false;
  $P._isSecond = false;
  $N._dateElement = "day";

  $P.next = function () {
    this._orient = +1;
    return this;
  };

  $D.next = function () {
    return $D.today().next();
  };

  $P.last = $P.prev = $P.previous = function () {
    this._orient = -1;
    return this;
  };

  $D.last = $D.prev = $D.previous = function () {
    return $D.today().last();
  };

  $P.is = function () {
    this._is = true;
    return this;
  };

  $P.same = function () {
    this._same = true;
    this._isSecond = false;
    return this;
  };

  $P.today = function () {
    return this.same().day();
  };

  $P.weekday = function () {
    if (this._is) {
      this._is = false;
      return !this.is().sat() && !this.is().sun();
    }

    return false;
  };

  $P.at = function (time) {
    return typeof time === "string" ? $D.parse(this.toString("d") + " " + time) : this.set(time);
  };

  $N.fromNow = $N.after = function (date) {
    var c = {};
    c[this._dateElement] = this;
    return (!date ? new Date() : date.clone()).add(c);
  };

  $N.ago = $N.before = function (date) {
    var c = {};
    c[this._dateElement] = this * -1;
    return (!date ? new Date() : date.clone()).add(c);
  };

  var dx = "sunday monday tuesday wednesday thursday friday saturday".split(/\s/),
      mx = "january february march april may june july august september october november december".split(/\s/),
      px = "Millisecond Second Minute Hour Day Week Month Year".split(/\s/),
      pxf = "Milliseconds Seconds Minutes Hours Date Week Month FullYear".split(/\s/),
      nth = "final first second third fourth fifth".split(/\s/),
      de;

  $P.toObject = function () {
    var o = {};

    for (var i = 0; i < px.length; i++) {
      o[px[i].toLowerCase()] = this["get" + pxf[i]]();
    }

    return o;
  };

  $D.fromObject = function (config) {
    config.week = null;
    return Date.today().set(config);
  };

  var df = function df(n) {
    return function () {
      if (this._is) {
        this._is = false;
        return this.getDay() == n;
      }

      if (this._nth !== null) {
        if (this._isSecond) {
          this.addSeconds(this._orient * -1);
        }

        this._isSecond = false;
        var ntemp = this._nth;
        this._nth = null;
        var temp = this.clone().moveToLastDayOfMonth();
        this.moveToNthOccurrence(n, ntemp);

        if (this > temp) {
          throw new RangeError($D.getDayName(n) + " does not occur " + ntemp + " times in the month of " + $D.getMonthName(temp.getMonth()) + " " + temp.getFullYear() + ".");
        }

        return this;
      }

      return this.moveToDayOfWeek(n, this._orient);
    };
  };

  var sdf = function sdf(n) {
    return function () {
      var t = $D.today(),
          shift = n - t.getDay();

      if (n === 0 && $C.firstDayOfWeek === 1 && t.getDay() !== 0) {
        shift = shift + 7;
      }

      return t.addDays(shift);
    };
  };

  for (var i = 0; i < dx.length; i++) {
    $D[dx[i].toUpperCase()] = $D[dx[i].toUpperCase().substring(0, 3)] = i;
    $D[dx[i]] = $D[dx[i].substring(0, 3)] = sdf(i);
    $P[dx[i]] = $P[dx[i].substring(0, 3)] = df(i);
  }

  var mf = function mf(n) {
    return function () {
      if (this._is) {
        this._is = false;
        return this.getMonth() === n;
      }

      return this.moveToMonth(n, this._orient);
    };
  };

  var smf = function smf(n) {
    return function () {
      return $D.today().set({
        month: n,
        day: 1
      });
    };
  };

  for (var j = 0; j < mx.length; j++) {
    $D[mx[j].toUpperCase()] = $D[mx[j].toUpperCase().substring(0, 3)] = j;
    $D[mx[j]] = $D[mx[j].substring(0, 3)] = smf(j);
    $P[mx[j]] = $P[mx[j].substring(0, 3)] = mf(j);
  }

  var ef = function ef(j) {
    return function () {
      if (this._isSecond) {
        this._isSecond = false;
        return this;
      }

      if (this._same) {
        this._same = this._is = false;
        var o1 = this.toObject(),
            o2 = (arguments[0] || new Date()).toObject(),
            v = "",
            k = j.toLowerCase();

        for (var m = px.length - 1; m > -1; m--) {
          v = px[m].toLowerCase();

          if (o1[v] != o2[v]) {
            return false;
          }

          if (k == v) {
            break;
          }
        }

        return true;
      }

      if (j.substring(j.length - 1) != "s") {
        j += "s";
      }

      return this["add" + j](this._orient);
    };
  };

  var nf = function nf(n) {
    return function () {
      this._dateElement = n;
      return this;
    };
  };

  for (var k = 0; k < px.length; k++) {
    de = px[k].toLowerCase();
    $P[de] = $P[de + "s"] = ef(px[k]);
    $N[de] = $N[de + "s"] = nf(de);
  }

  $P._ss = ef("Second");

  var nthfn = function nthfn(n) {
    return function (dayOfWeek) {
      if (this._same) {
        return this._ss(arguments[0]);
      }

      if (dayOfWeek || dayOfWeek === 0) {
        return this.moveToNthOccurrence(dayOfWeek, n);
      }

      this._nth = n;

      if (n === 2 && (dayOfWeek === undefined || dayOfWeek === null)) {
        this._isSecond = true;
        return this.addSeconds(this._orient);
      }

      return this;
    };
  };

  for (var l = 0; l < nth.length; l++) {
    $P[nth[l]] = l === 0 ? nthfn(-1) : nthfn(l);
  }
})();

(function () {
  Date.Parsing = {
    Exception: function Exception(s) {
      this.message = "Parse error at '" + s.substring(0, 10) + " ...'";
    }
  };
  var $P = Date.Parsing;

  var _ = $P.Operators = {
    rtoken: function rtoken(r) {
      return function (s) {
        var mx = s.match(r);

        if (mx) {
          return [mx[0], s.substring(mx[0].length)];
        } else {
          throw new $P.Exception(s);
        }
      };
    },
    token: function token(s) {
      return function (s) {
        return _.rtoken(new RegExp("^\s*" + s + "\s*"))(s);
      };
    },
    stoken: function stoken(s) {
      return _.rtoken(new RegExp("^" + s));
    },
    until: function until(p) {
      return function (s) {
        var qx = [],
            rx = null;

        while (s.length) {
          try {
            rx = p.call(this, s);
          } catch (e) {
            qx.push(rx[0]);
            s = rx[1];
            continue;
          }

          break;
        }

        return [qx, s];
      };
    },
    many: function many(p) {
      return function (s) {
        var rx = [],
            r = null;

        while (s.length) {
          try {
            r = p.call(this, s);
          } catch (e) {
            return [rx, s];
          }

          rx.push(r[0]);
          s = r[1];
        }

        return [rx, s];
      };
    },
    optional: function optional(p) {
      return function (s) {
        var r = null;

        try {
          r = p.call(this, s);
        } catch (e) {
          return [null, s];
        }

        return [r[0], r[1]];
      };
    },
    not: function not(p) {
      return function (s) {
        try {
          p.call(this, s);
        } catch (e) {
          return [null, s];
        }

        throw new $P.Exception(s);
      };
    },
    ignore: function ignore(p) {
      return p ? function (s) {
        var r = null;
        r = p.call(this, s);
        return [null, r[1]];
      } : null;
    },
    product: function product() {
      var px = arguments[0],
          qx = Array.prototype.slice.call(arguments, 1),
          rx = [];

      for (var i = 0; i < px.length; i++) {
        rx.push(_.each(px[i], qx));
      }

      return rx;
    },
    cache: function cache(rule) {
      var cache = {},
          r = null;
      return function (s) {
        try {
          r = cache[s] = cache[s] || rule.call(this, s);
        } catch (e) {
          r = cache[s] = e;
        }

        if (r instanceof $P.Exception) {
          throw r;
        } else {
          return r;
        }
      };
    },
    any: function any() {
      var px = arguments;
      return function (s) {
        var r = null;

        for (var i = 0; i < px.length; i++) {
          if (px[i] == null) {
            continue;
          }

          try {
            r = px[i].call(this, s);
          } catch (e) {
            r = null;
          }

          if (r) {
            return r;
          }
        }

        throw new $P.Exception(s);
      };
    },
    each: function each() {
      var px = arguments;
      return function (s) {
        var rx = [],
            r = null;

        for (var i = 0; i < px.length; i++) {
          if (px[i] == null) {
            continue;
          }

          try {
            r = px[i].call(this, s);
          } catch (e) {
            throw new $P.Exception(s);
          }

          rx.push(r[0]);
          s = r[1];
        }

        return [rx, s];
      };
    },
    all: function all() {
      var px = arguments,
          _ = _;
      return _.each(_.optional(px));
    },
    sequence: function sequence(px, d, c) {
      d = d || _.rtoken(/^\s*/);
      c = c || null;

      if (px.length == 1) {
        return px[0];
      }

      return function (s) {
        var r = null,
            q = null;
        var rx = [];

        for (var i = 0; i < px.length; i++) {
          try {
            r = px[i].call(this, s);
          } catch (e) {
            break;
          }

          rx.push(r[0]);

          try {
            q = d.call(this, r[1]);
          } catch (ex) {
            q = null;
            break;
          }

          s = q[1];
        }

        if (!r) {
          throw new $P.Exception(s);
        }

        if (q) {
          throw new $P.Exception(q[1]);
        }

        if (c) {
          try {
            r = c.call(this, r[1]);
          } catch (ey) {
            throw new $P.Exception(r[1]);
          }
        }

        return [rx, r ? r[1] : s];
      };
    },
    between: function between(d1, p, d2) {
      d2 = d2 || d1;

      var _fn = _.each(_.ignore(d1), p, _.ignore(d2));

      return function (s) {
        var rx = _fn.call(this, s);

        return [[rx[0][0], r[0][2]], rx[1]];
      };
    },
    list: function list(p, d, c) {
      d = d || _.rtoken(/^\s*/);
      c = c || null;
      return p instanceof Array ? _.each(_.product(p.slice(0, -1), _.ignore(d)), p.slice(-1), _.ignore(c)) : _.each(_.many(_.each(p, _.ignore(d))), px, _.ignore(c));
    },
    set: function set(px, d, c) {
      d = d || _.rtoken(/^\s*/);
      c = c || null;
      return function (s) {
        var r = null,
            p = null,
            q = null,
            rx = null,
            best = [[], s],
            last = false;

        for (var i = 0; i < px.length; i++) {
          q = null;
          p = null;
          r = null;
          last = px.length == 1;

          try {
            r = px[i].call(this, s);
          } catch (e) {
            continue;
          }

          rx = [[r[0]], r[1]];

          if (r[1].length > 0 && !last) {
            try {
              q = d.call(this, r[1]);
            } catch (ex) {
              last = true;
            }
          } else {
            last = true;
          }

          if (!last && q[1].length === 0) {
            last = true;
          }

          if (!last) {
            var qx = [];

            for (var j = 0; j < px.length; j++) {
              if (i != j) {
                qx.push(px[j]);
              }
            }

            p = _.set(qx, d).call(this, q[1]);

            if (p[0].length > 0) {
              rx[0] = rx[0].concat(p[0]);
              rx[1] = p[1];
            }
          }

          if (rx[1].length < best[1].length) {
            best = rx;
          }

          if (best[1].length === 0) {
            break;
          }
        }

        if (best[0].length === 0) {
          return best;
        }

        if (c) {
          try {
            q = c.call(this, best[1]);
          } catch (ey) {
            throw new $P.Exception(best[1]);
          }

          best[1] = q[1];
        }

        return best;
      };
    },
    forward: function forward(gr, fname) {
      return function (s) {
        return gr[fname].call(this, s);
      };
    },
    replace: function replace(rule, repl) {
      return function (s) {
        var r = rule.call(this, s);
        return [repl, r[1]];
      };
    },
    process: function process(rule, fn) {
      return function (s) {
        var r = rule.call(this, s);
        return [fn.call(this, r[0]), r[1]];
      };
    },
    min: function min(_min, rule) {
      return function (s) {
        var rx = rule.call(this, s);

        if (rx[0].length < _min) {
          throw new $P.Exception(s);
        }

        return rx;
      };
    }
  };

  var _generator = function _generator(op) {
    return function () {
      var args = null,
          rx = [];

      if (arguments.length > 1) {
        args = Array.prototype.slice.call(arguments);
      } else if (arguments[0] instanceof Array) {
        args = arguments[0];
      }

      if (args) {
        for (var i = 0, px = args.shift(); i < px.length; i++) {
          args.unshift(px[i]);
          rx.push(op.apply(null, args));
          args.shift();
          return rx;
        }
      } else {
        return op.apply(null, arguments);
      }
    };
  };

  var gx = "optional not ignore cache".split(/\s/);

  for (var i = 0; i < gx.length; i++) {
    _[gx[i]] = _generator(_[gx[i]]);
  }

  var _vector = function _vector(op) {
    return function () {
      if (arguments[0] instanceof Array) {
        return op.apply(null, arguments[0]);
      } else {
        return op.apply(null, arguments);
      }
    };
  };

  var vx = "each any all".split(/\s/);

  for (var j = 0; j < vx.length; j++) {
    _[vx[j]] = _vector(_[vx[j]]);
  }
})();

(function () {
  var $D = Date,
      $P = $D.prototype,
      $C = $D.CultureInfo;

  var flattenAndCompact = function flattenAndCompact(ax) {
    var rx = [];

    for (var i = 0; i < ax.length; i++) {
      if (ax[i] instanceof Array) {
        rx = rx.concat(flattenAndCompact(ax[i]));
      } else {
        if (ax[i]) {
          rx.push(ax[i]);
        }
      }
    }

    return rx;
  };

  $D.Grammar = {};
  $D.Translator = {
    hour: function hour(s) {
      return function () {
        this.hour = Number(s);
      };
    },
    minute: function minute(s) {
      return function () {
        this.minute = Number(s);
      };
    },
    second: function second(s) {
      return function () {
        this.second = Number(s);
      };
    },
    meridian: function meridian(s) {
      return function () {
        this.meridian = s.slice(0, 1).toLowerCase();
      };
    },
    timezone: function timezone(s) {
      return function () {
        var n = s.replace(/[^\d\+\-]/g, "");

        if (n.length) {
          this.timezoneOffset = Number(n);
        } else {
          this.timezone = s.toLowerCase();
        }
      };
    },
    day: function day(x) {
      var s = x[0];
      return function () {
        this.day = Number(s.match(/\d+/)[0]);
      };
    },
    month: function month(s) {
      return function () {
        this.month = s.length == 3 ? "jan feb mar apr may jun jul aug sep oct nov dec".indexOf(s) / 4 : Number(s) - 1;
      };
    },
    year: function year(s) {
      return function () {
        var n = Number(s);
        this.year = s.length > 2 ? n : n + (n + 2000 < $C.twoDigitYearMax ? 2000 : 1900);
      };
    },
    rday: function rday(s) {
      return function () {
        switch (s) {
          case "yesterday":
            this.days = -1;
            break;

          case "tomorrow":
            this.days = 1;
            break;

          case "today":
            this.days = 0;
            break;

          case "now":
            this.days = 0;
            this.now = true;
            break;
        }
      };
    },
    finishExact: function finishExact(x) {
      x = x instanceof Array ? x : [x];

      for (var i = 0; i < x.length; i++) {
        if (x[i]) {
          x[i].call(this);
        }
      }

      var now = new Date();

      if ((this.hour || this.minute) && !this.month && !this.year && !this.day) {
        this.day = now.getDate();
      }

      if (!this.year) {
        this.year = now.getFullYear();
      }

      if (!this.month && this.month !== 0) {
        this.month = now.getMonth();
      }

      if (!this.day) {
        this.day = 1;
      }

      if (!this.hour) {
        this.hour = 0;
      }

      if (!this.minute) {
        this.minute = 0;
      }

      if (!this.second) {
        this.second = 0;
      }

      if (this.meridian && this.hour) {
        if (this.meridian == "p" && this.hour < 12) {
          this.hour = this.hour + 12;
        } else if (this.meridian == "a" && this.hour == 12) {
          this.hour = 0;
        }
      }

      if (this.day > $D.getDaysInMonth(this.year, this.month)) {
        throw new RangeError(this.day + " is not a valid value for days.");
      }

      var r = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second);

      if (this.timezone) {
        r.set({
          timezone: this.timezone
        });
      } else if (this.timezoneOffset) {
        r.set({
          timezoneOffset: this.timezoneOffset
        });
      }

      return r;
    },
    finish: function finish(x) {
      x = x instanceof Array ? flattenAndCompact(x) : [x];

      if (x.length === 0) {
        return null;
      }

      for (var i = 0; i < x.length; i++) {
        if (typeof x[i] == "function") {
          x[i].call(this);
        }
      }

      var today = $D.today();

      if (this.now && !this.unit && !this.operator) {
        return new Date();
      } else if (this.now) {
        today = new Date();
      }

      var expression = !!(this.days && this.days !== null || this.orient || this.operator);
      var gap, mod, orient;
      orient = this.orient == "past" || this.operator == "subtract" ? -1 : 1;

      if (!this.now && "hour minute second".indexOf(this.unit) != -1) {
        today.setTimeToNow();
      }

      if (this.month || this.month === 0) {
        if ("year day hour minute second".indexOf(this.unit) != -1) {
          this.value = this.month + 1;
          this.month = null;
          expression = true;
        }
      }

      if (!expression && this.weekday && !this.day && !this.days) {
        var temp = Date[this.weekday]();
        this.day = temp.getDate();

        if (!this.month) {
          this.month = temp.getMonth();
        }

        this.year = temp.getFullYear();
      }

      if (expression && this.weekday && this.unit != "month") {
        this.unit = "day";
        gap = $D.getDayNumberFromName(this.weekday) - today.getDay();
        mod = 7;
        this.days = gap ? (gap + orient * mod) % mod : orient * mod;
      }

      if (this.month && this.unit == "day" && this.operator) {
        this.value = this.month + 1;
        this.month = null;
      }

      if (this.value != null && this.month != null && this.year != null) {
        this.day = this.value * 1;
      }

      if (this.month && !this.day && this.value) {
        today.set({
          day: this.value * 1
        });

        if (!expression) {
          this.day = this.value * 1;
        }
      }

      if (!this.month && this.value && this.unit == "month" && !this.now) {
        this.month = this.value;
        expression = true;
      }

      if (expression && (this.month || this.month === 0) && this.unit != "year") {
        this.unit = "month";
        gap = this.month - today.getMonth();
        mod = 12;
        this.months = gap ? (gap + orient * mod) % mod : orient * mod;
        this.month = null;
      }

      if (!this.unit) {
        this.unit = "day";
      }

      if (!this.value && this.operator && this.operator !== null && this[this.unit + "s"] && this[this.unit + "s"] !== null) {
        this[this.unit + "s"] = this[this.unit + "s"] + (this.operator == "add" ? 1 : -1) + (this.value || 0) * orient;
      } else if (this[this.unit + "s"] == null || this.operator != null) {
        if (!this.value) {
          this.value = 1;
        }

        this[this.unit + "s"] = this.value * orient;
      }

      if (this.meridian && this.hour) {
        if (this.meridian == "p" && this.hour < 12) {
          this.hour = this.hour + 12;
        } else if (this.meridian == "a" && this.hour == 12) {
          this.hour = 0;
        }
      }

      if (this.weekday && !this.day && !this.days) {
        var temp = Date[this.weekday]();
        this.day = temp.getDate();

        if (temp.getMonth() !== today.getMonth()) {
          this.month = temp.getMonth();
        }
      }

      if ((this.month || this.month === 0) && !this.day) {
        this.day = 1;
      }

      if (!this.orient && !this.operator && this.unit == "week" && this.value && !this.day && !this.month) {
        return Date.today().setWeek(this.value);
      }

      if (expression && this.timezone && this.day && this.days) {
        this.day = this.days;
      }

      return expression ? today.add(this) : today.set(this);
    }
  };

  var _ = $D.Parsing.Operators,
      g = $D.Grammar,
      t = $D.Translator,
      _fn;

  g.datePartDelimiter = _.rtoken(/^([\s\-\.\,\/\x27]+)/);
  g.timePartDelimiter = _.stoken(":");
  g.whiteSpace = _.rtoken(/^\s*/);
  g.generalDelimiter = _.rtoken(/^(([\s\,]|at|@|on)+)/);
  var _C = {};

  g.ctoken = function (keys) {
    var fn = _C[keys];

    if (!fn) {
      var c = $C.regexPatterns;
      var kx = keys.split(/\s+/),
          px = [];

      for (var i = 0; i < kx.length; i++) {
        px.push(_.replace(_.rtoken(c[kx[i]]), kx[i]));
      }

      fn = _C[keys] = _.any.apply(null, px);
    }

    return fn;
  };

  g.ctoken2 = function (key) {
    return _.rtoken($C.regexPatterns[key]);
  };

  g.h = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2]|[1-9])/), t.hour));
  g.hh = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2])/), t.hour));
  g.H = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3]|[0-9])/), t.hour));
  g.HH = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3])/), t.hour));
  g.m = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.minute));
  g.mm = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.minute));
  g.s = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.second));
  g.ss = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.second));
  g.hms = _.cache(_.sequence([g.H, g.m, g.s], g.timePartDelimiter));
  g.t = _.cache(_.process(g.ctoken2("shortMeridian"), t.meridian));
  g.tt = _.cache(_.process(g.ctoken2("longMeridian"), t.meridian));
  g.z = _.cache(_.process(_.rtoken(/^((\+|\-)\s*\d\d\d\d)|((\+|\-)\d\d\:?\d\d)/), t.timezone));
  g.zz = _.cache(_.process(_.rtoken(/^((\+|\-)\s*\d\d\d\d)|((\+|\-)\d\d\:?\d\d)/), t.timezone));
  g.zzz = _.cache(_.process(g.ctoken2("timezone"), t.timezone));
  g.timeSuffix = _.each(_.ignore(g.whiteSpace), _.set([g.tt, g.zzz]));
  g.time = _.each(_.optional(_.ignore(_.stoken("T"))), g.hms, g.timeSuffix);
  g.d = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1]|\d)/), _.optional(g.ctoken2("ordinalSuffix"))), t.day));
  g.dd = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1])/), _.optional(g.ctoken2("ordinalSuffix"))), t.day));
  g.ddd = g.dddd = _.cache(_.process(g.ctoken("sun mon tue wed thu fri sat"), function (s) {
    return function () {
      this.weekday = s;
    };
  }));
  g.M = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d|\d)/), t.month));
  g.MM = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d)/), t.month));
  g.MMM = g.MMMM = _.cache(_.process(g.ctoken("jan feb mar apr may jun jul aug sep oct nov dec"), t.month));
  g.y = _.cache(_.process(_.rtoken(/^(\d\d?)/), t.year));
  g.yy = _.cache(_.process(_.rtoken(/^(\d\d)/), t.year));
  g.yyy = _.cache(_.process(_.rtoken(/^(\d\d?\d?\d?)/), t.year));
  g.yyyy = _.cache(_.process(_.rtoken(/^(\d\d\d\d)/), t.year));

  _fn = function _fn() {
    return _.each(_.any.apply(null, arguments), _.not(g.ctoken2("timeContext")));
  };

  g.day = _fn(g.d, g.dd);
  g.month = _fn(g.M, g.MMM);
  g.year = _fn(g.yyyy, g.yy);
  g.orientation = _.process(g.ctoken("past future"), function (s) {
    return function () {
      this.orient = s;
    };
  });
  g.operator = _.process(g.ctoken("add subtract"), function (s) {
    return function () {
      this.operator = s;
    };
  });
  g.rday = _.process(g.ctoken("yesterday tomorrow today now"), t.rday);
  g.unit = _.process(g.ctoken("second minute hour day week month year"), function (s) {
    return function () {
      this.unit = s;
    };
  });
  g.value = _.process(_.rtoken(/^\d\d?(st|nd|rd|th)?/), function (s) {
    return function () {
      this.value = s.replace(/\D/g, "");
    };
  });
  g.expression = _.set([g.rday, g.operator, g.value, g.unit, g.orientation, g.ddd, g.MMM]);

  _fn = function _fn() {
    return _.set(arguments, g.datePartDelimiter);
  };

  g.mdy = _fn(g.ddd, g.month, g.day, g.year);
  g.ymd = _fn(g.ddd, g.year, g.month, g.day);
  g.dmy = _fn(g.ddd, g.day, g.month, g.year);

  g.date = function (s) {
    return (g[$C.dateElementOrder] || g.mdy).call(this, s);
  };

  g.format = _.process(_.many(_.any(_.process(_.rtoken(/^(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?)/), function (fmt) {
    if (g[fmt]) {
      return g[fmt];
    } else {
      throw $D.Parsing.Exception(fmt);
    }
  }), _.process(_.rtoken(/^[^dMyhHmstz]+/), function (s) {
    return _.ignore(_.stoken(s));
  }))), function (rules) {
    return _.process(_.each.apply(null, rules), t.finishExact);
  });
  var _F = {};

  var _get = function _get(f) {
    return _F[f] = _F[f] || g.format(f)[0];
  };

  g.formats = function (fx) {
    if (fx instanceof Array) {
      var rx = [];

      for (var i = 0; i < fx.length; i++) {
        rx.push(_get(fx[i]));
      }

      return _.any.apply(null, rx);
    } else {
      return _get(fx);
    }
  };

  g._formats = g.formats(["\"yyyy-MM-ddTHH:mm:ssZ\"", "yyyy-MM-ddTHH:mm:ssZ", "yyyy-MM-ddTHH:mm:ssz", "yyyy-MM-ddTHH:mm:ss", "yyyy-MM-ddTHH:mmZ", "yyyy-MM-ddTHH:mmz", "yyyy-MM-ddTHH:mm", "ddd, MMM dd, yyyy H:mm:ss tt", "ddd MMM d yyyy HH:mm:ss zzz", "MMddyyyy", "ddMMyyyy", "Mddyyyy", "ddMyyyy", "Mdyyyy", "dMyyyy", "yyyy", "Mdyy", "dMyy", "d"]);
  g._start = _.process(_.set([g.date, g.time, g.expression], g.generalDelimiter, g.whiteSpace), t.finish);

  g.start = function (s) {
    try {
      var r = g._formats.call({}, s);

      if (r[1].length === 0) {
        return r;
      }
    } catch (e) {}

    return g._start.call({}, s);
  };

  $D._parse = $D.parse;

  $D.parse = function (s) {
    var r = null;

    if (!s) {
      return null;
    }

    if (s instanceof Date) {
      return s;
    }

    try {
      r = $D.Grammar.start.call({}, s.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1"));
    } catch (e) {
      return null;
    }

    return r[1].length === 0 ? r[0] : null;
  };

  $D.getParseFunction = function (fx) {
    var fn = $D.Grammar.formats(fx);
    return function (s) {
      var r = null;

      try {
        r = fn.call({}, s);
      } catch (e) {
        return null;
      }

      return r[1].length === 0 ? r[0] : null;
    };
  };

  $D.parseExact = function (s, fx) {
    return $D.getParseFunction(fx)(s);
  };
})();
},{}],"js/leaflet.markercluster.js":[function(require,module,exports) {
var define;
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

!function (e, t) {
  "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) && "undefined" != typeof module ? t(exports) : "function" == typeof define && define.amd ? define(["exports"], t) : t((e.Leaflet = e.Leaflet || {}, e.Leaflet.markercluster = e.Leaflet.markercluster || {}));
}(this, function (e) {
  "use strict";

  var t = L.MarkerClusterGroup = L.FeatureGroup.extend({
    options: {
      maxClusterRadius: 80,
      iconCreateFunction: null,
      clusterPane: L.Marker.prototype.options.pane,
      spiderfyOnMaxZoom: !0,
      showCoverageOnHover: !0,
      zoomToBoundsOnClick: !0,
      singleMarkerMode: !1,
      disableClusteringAtZoom: null,
      removeOutsideVisibleBounds: !0,
      animate: !0,
      animateAddingMarkers: !1,
      spiderfyDistanceMultiplier: 1,
      spiderLegPolylineOptions: {
        weight: 1.5,
        color: "#222",
        opacity: .5
      },
      chunkedLoading: !1,
      chunkInterval: 200,
      chunkDelay: 50,
      chunkProgress: null,
      polygonOptions: {}
    },
    initialize: function initialize(e) {
      L.Util.setOptions(this, e), this.options.iconCreateFunction || (this.options.iconCreateFunction = this._defaultIconCreateFunction), this._featureGroup = L.featureGroup(), this._featureGroup.addEventParent(this), this._nonPointGroup = L.featureGroup(), this._nonPointGroup.addEventParent(this), this._inZoomAnimation = 0, this._needsClustering = [], this._needsRemoving = [], this._currentShownBounds = null, this._queue = [], this._childMarkerEventHandlers = {
        dragstart: this._childMarkerDragStart,
        move: this._childMarkerMoved,
        dragend: this._childMarkerDragEnd
      };
      var t = L.DomUtil.TRANSITION && this.options.animate;
      L.extend(this, t ? this._withAnimation : this._noAnimation), this._markerCluster = t ? L.MarkerCluster : L.MarkerClusterNonAnimated;
    },
    addLayer: function addLayer(e) {
      if (e instanceof L.LayerGroup) return this.addLayers([e]);
      if (!e.getLatLng) return this._nonPointGroup.addLayer(e), this.fire("layeradd", {
        layer: e
      }), this;
      if (!this._map) return this._needsClustering.push(e), this.fire("layeradd", {
        layer: e
      }), this;
      if (this.hasLayer(e)) return this;
      this._unspiderfy && this._unspiderfy(), this._addLayer(e, this._maxZoom), this.fire("layeradd", {
        layer: e
      }), this._topClusterLevel._recalculateBounds(), this._refreshClustersIcons();
      var t = e,
          i = this._zoom;
      if (e.__parent) for (; t.__parent._zoom >= i;) {
        t = t.__parent;
      }
      return this._currentShownBounds.contains(t.getLatLng()) && (this.options.animateAddingMarkers ? this._animationAddLayer(e, t) : this._animationAddLayerNonAnimated(e, t)), this;
    },
    removeLayer: function removeLayer(e) {
      return e instanceof L.LayerGroup ? this.removeLayers([e]) : e.getLatLng ? this._map ? e.__parent ? (this._unspiderfy && (this._unspiderfy(), this._unspiderfyLayer(e)), this._removeLayer(e, !0), this.fire("layerremove", {
        layer: e
      }), this._topClusterLevel._recalculateBounds(), this._refreshClustersIcons(), e.off(this._childMarkerEventHandlers, this), this._featureGroup.hasLayer(e) && (this._featureGroup.removeLayer(e), e.clusterShow && e.clusterShow()), this) : this : (!this._arraySplice(this._needsClustering, e) && this.hasLayer(e) && this._needsRemoving.push({
        layer: e,
        latlng: e._latlng
      }), this.fire("layerremove", {
        layer: e
      }), this) : (this._nonPointGroup.removeLayer(e), this.fire("layerremove", {
        layer: e
      }), this);
    },
    addLayers: function addLayers(e, t) {
      if (!L.Util.isArray(e)) return this.addLayer(e);
      var i,
          n = this._featureGroup,
          r = this._nonPointGroup,
          s = this.options.chunkedLoading,
          o = this.options.chunkInterval,
          a = this.options.chunkProgress,
          h = e.length,
          l = 0,
          u = !0;

      if (this._map) {
        var _ = new Date().getTime(),
            d = L.bind(function () {
          for (var c = new Date().getTime(); h > l; l++) {
            if (s && 0 === l % 200) {
              var p = new Date().getTime() - c;
              if (p > o) break;
            }

            if (i = e[l], i instanceof L.LayerGroup) u && (e = e.slice(), u = !1), this._extractNonGroupLayers(i, e), h = e.length;else if (i.getLatLng) {
              if (!this.hasLayer(i) && (this._addLayer(i, this._maxZoom), t || this.fire("layeradd", {
                layer: i
              }), i.__parent && 2 === i.__parent.getChildCount())) {
                var f = i.__parent.getAllChildMarkers(),
                    m = f[0] === i ? f[1] : f[0];

                n.removeLayer(m);
              }
            } else r.addLayer(i), t || this.fire("layeradd", {
              layer: i
            });
          }

          a && a(l, h, new Date().getTime() - _), l === h ? (this._topClusterLevel._recalculateBounds(), this._refreshClustersIcons(), this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds)) : setTimeout(d, this.options.chunkDelay);
        }, this);

        d();
      } else for (var c = this._needsClustering; h > l; l++) {
        i = e[l], i instanceof L.LayerGroup ? (u && (e = e.slice(), u = !1), this._extractNonGroupLayers(i, e), h = e.length) : i.getLatLng ? this.hasLayer(i) || c.push(i) : r.addLayer(i);
      }

      return this;
    },
    removeLayers: function removeLayers(e) {
      var t,
          i,
          n = e.length,
          r = this._featureGroup,
          s = this._nonPointGroup,
          o = !0;

      if (!this._map) {
        for (t = 0; n > t; t++) {
          i = e[t], i instanceof L.LayerGroup ? (o && (e = e.slice(), o = !1), this._extractNonGroupLayers(i, e), n = e.length) : (this._arraySplice(this._needsClustering, i), s.removeLayer(i), this.hasLayer(i) && this._needsRemoving.push({
            layer: i,
            latlng: i._latlng
          }), this.fire("layerremove", {
            layer: i
          }));
        }

        return this;
      }

      if (this._unspiderfy) {
        this._unspiderfy();

        var a = e.slice(),
            h = n;

        for (t = 0; h > t; t++) {
          i = a[t], i instanceof L.LayerGroup ? (this._extractNonGroupLayers(i, a), h = a.length) : this._unspiderfyLayer(i);
        }
      }

      for (t = 0; n > t; t++) {
        i = e[t], i instanceof L.LayerGroup ? (o && (e = e.slice(), o = !1), this._extractNonGroupLayers(i, e), n = e.length) : i.__parent ? (this._removeLayer(i, !0, !0), this.fire("layerremove", {
          layer: i
        }), r.hasLayer(i) && (r.removeLayer(i), i.clusterShow && i.clusterShow())) : (s.removeLayer(i), this.fire("layerremove", {
          layer: i
        }));
      }

      return this._topClusterLevel._recalculateBounds(), this._refreshClustersIcons(), this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds), this;
    },
    clearLayers: function clearLayers() {
      return this._map || (this._needsClustering = [], this._needsRemoving = [], delete this._gridClusters, delete this._gridUnclustered), this._noanimationUnspiderfy && this._noanimationUnspiderfy(), this._featureGroup.clearLayers(), this._nonPointGroup.clearLayers(), this.eachLayer(function (e) {
        e.off(this._childMarkerEventHandlers, this), delete e.__parent;
      }, this), this._map && this._generateInitialClusters(), this;
    },
    getBounds: function getBounds() {
      var e = new L.LatLngBounds();
      this._topClusterLevel && e.extend(this._topClusterLevel._bounds);

      for (var t = this._needsClustering.length - 1; t >= 0; t--) {
        e.extend(this._needsClustering[t].getLatLng());
      }

      return e.extend(this._nonPointGroup.getBounds()), e;
    },
    eachLayer: function eachLayer(e, t) {
      var i,
          n,
          r,
          s = this._needsClustering.slice(),
          o = this._needsRemoving;

      for (this._topClusterLevel && this._topClusterLevel.getAllChildMarkers(s), n = s.length - 1; n >= 0; n--) {
        for (i = !0, r = o.length - 1; r >= 0; r--) {
          if (o[r].layer === s[n]) {
            i = !1;
            break;
          }
        }

        i && e.call(t, s[n]);
      }

      this._nonPointGroup.eachLayer(e, t);
    },
    getLayers: function getLayers() {
      var e = [];
      return this.eachLayer(function (t) {
        e.push(t);
      }), e;
    },
    getLayer: function getLayer(e) {
      var t = null;
      return e = parseInt(e, 10), this.eachLayer(function (i) {
        L.stamp(i) === e && (t = i);
      }), t;
    },
    hasLayer: function hasLayer(e) {
      if (!e) return !1;
      var t,
          i = this._needsClustering;

      for (t = i.length - 1; t >= 0; t--) {
        if (i[t] === e) return !0;
      }

      for (i = this._needsRemoving, t = i.length - 1; t >= 0; t--) {
        if (i[t].layer === e) return !1;
      }

      return !(!e.__parent || e.__parent._group !== this) || this._nonPointGroup.hasLayer(e);
    },
    zoomToShowLayer: function zoomToShowLayer(e, t) {
      "function" != typeof t && (t = function t() {});

      var i = function i() {
        !e._icon && !e.__parent._icon || this._inZoomAnimation || (this._map.off("moveend", i, this), this.off("animationend", i, this), e._icon ? t() : e.__parent._icon && (this.once("spiderfied", t, this), e.__parent.spiderfy()));
      };

      e._icon && this._map.getBounds().contains(e.getLatLng()) ? t() : e.__parent._zoom < Math.round(this._map._zoom) ? (this._map.on("moveend", i, this), this._map.panTo(e.getLatLng())) : (this._map.on("moveend", i, this), this.on("animationend", i, this), e.__parent.zoomToBounds());
    },
    onAdd: function onAdd(e) {
      this._map = e;
      var t, i, n;
      if (!isFinite(this._map.getMaxZoom())) throw "Map has no maxZoom specified";

      for (this._featureGroup.addTo(e), this._nonPointGroup.addTo(e), this._gridClusters || this._generateInitialClusters(), this._maxLat = e.options.crs.projection.MAX_LATITUDE, t = 0, i = this._needsRemoving.length; i > t; t++) {
        n = this._needsRemoving[t], n.newlatlng = n.layer._latlng, n.layer._latlng = n.latlng;
      }

      for (t = 0, i = this._needsRemoving.length; i > t; t++) {
        n = this._needsRemoving[t], this._removeLayer(n.layer, !0), n.layer._latlng = n.newlatlng;
      }

      this._needsRemoving = [], this._zoom = Math.round(this._map._zoom), this._currentShownBounds = this._getExpandedVisibleBounds(), this._map.on("zoomend", this._zoomEnd, this), this._map.on("moveend", this._moveEnd, this), this._spiderfierOnAdd && this._spiderfierOnAdd(), this._bindEvents(), i = this._needsClustering, this._needsClustering = [], this.addLayers(i, !0);
    },
    onRemove: function onRemove(e) {
      e.off("zoomend", this._zoomEnd, this), e.off("moveend", this._moveEnd, this), this._unbindEvents(), this._map._mapPane.className = this._map._mapPane.className.replace(" leaflet-cluster-anim", ""), this._spiderfierOnRemove && this._spiderfierOnRemove(), delete this._maxLat, this._hideCoverage(), this._featureGroup.remove(), this._nonPointGroup.remove(), this._featureGroup.clearLayers(), this._map = null;
    },
    getVisibleParent: function getVisibleParent(e) {
      for (var t = e; t && !t._icon;) {
        t = t.__parent;
      }

      return t || null;
    },
    _arraySplice: function _arraySplice(e, t) {
      for (var i = e.length - 1; i >= 0; i--) {
        if (e[i] === t) return e.splice(i, 1), !0;
      }
    },
    _removeFromGridUnclustered: function _removeFromGridUnclustered(e, t) {
      for (var i = this._map, n = this._gridUnclustered, r = Math.floor(this._map.getMinZoom()); t >= r && n[t].removeObject(e, i.project(e.getLatLng(), t)); t--) {
        ;
      }
    },
    _childMarkerDragStart: function _childMarkerDragStart(e) {
      e.target.__dragStart = e.target._latlng;
    },
    _childMarkerMoved: function _childMarkerMoved(e) {
      if (!this._ignoreMove && !e.target.__dragStart) {
        var t = e.target._popup && e.target._popup.isOpen();

        this._moveChild(e.target, e.oldLatLng, e.latlng), t && e.target.openPopup();
      }
    },
    _moveChild: function _moveChild(e, t, i) {
      e._latlng = t, this.removeLayer(e), e._latlng = i, this.addLayer(e);
    },
    _childMarkerDragEnd: function _childMarkerDragEnd(e) {
      var t = e.target.__dragStart;
      delete e.target.__dragStart, t && this._moveChild(e.target, t, e.target._latlng);
    },
    _removeLayer: function _removeLayer(e, t, i) {
      var n = this._gridClusters,
          r = this._gridUnclustered,
          s = this._featureGroup,
          o = this._map,
          a = Math.floor(this._map.getMinZoom());
      t && this._removeFromGridUnclustered(e, this._maxZoom);
      var h,
          l = e.__parent,
          u = l._markers;

      for (this._arraySplice(u, e); l && (l._childCount--, l._boundsNeedUpdate = !0, !(l._zoom < a));) {
        t && l._childCount <= 1 ? (h = l._markers[0] === e ? l._markers[1] : l._markers[0], n[l._zoom].removeObject(l, o.project(l._cLatLng, l._zoom)), r[l._zoom].addObject(h, o.project(h.getLatLng(), l._zoom)), this._arraySplice(l.__parent._childClusters, l), l.__parent._markers.push(h), h.__parent = l.__parent, l._icon && (s.removeLayer(l), i || s.addLayer(h))) : l._iconNeedsUpdate = !0, l = l.__parent;
      }

      delete e.__parent;
    },
    _isOrIsParent: function _isOrIsParent(e, t) {
      for (; t;) {
        if (e === t) return !0;
        t = t.parentNode;
      }

      return !1;
    },
    fire: function fire(e, t, i) {
      if (t && t.layer instanceof L.MarkerCluster) {
        if (t.originalEvent && this._isOrIsParent(t.layer._icon, t.originalEvent.relatedTarget)) return;
        e = "cluster" + e;
      }

      L.FeatureGroup.prototype.fire.call(this, e, t, i);
    },
    listens: function listens(e, t) {
      return L.FeatureGroup.prototype.listens.call(this, e, t) || L.FeatureGroup.prototype.listens.call(this, "cluster" + e, t);
    },
    _defaultIconCreateFunction: function _defaultIconCreateFunction(e) {
      var t = e.getChildCount(),
          i = " marker-cluster-";
      return i += 10 > t ? "small" : 100 > t ? "medium" : "large", new L.DivIcon({
        html: "<div><span>" + t + "</span></div>",
        className: "marker-cluster" + i,
        iconSize: new L.Point(40, 40)
      });
    },
    _bindEvents: function _bindEvents() {
      var e = this._map,
          t = this.options.spiderfyOnMaxZoom,
          i = this.options.showCoverageOnHover,
          n = this.options.zoomToBoundsOnClick;
      (t || n) && this.on("clusterclick", this._zoomOrSpiderfy, this), i && (this.on("clustermouseover", this._showCoverage, this), this.on("clustermouseout", this._hideCoverage, this), e.on("zoomend", this._hideCoverage, this));
    },
    _zoomOrSpiderfy: function _zoomOrSpiderfy(e) {
      for (var t = e.layer, i = t; 1 === i._childClusters.length;) {
        i = i._childClusters[0];
      }

      i._zoom === this._maxZoom && i._childCount === t._childCount && this.options.spiderfyOnMaxZoom ? t.spiderfy() : this.options.zoomToBoundsOnClick && t.zoomToBounds(), e.originalEvent && 13 === e.originalEvent.keyCode && this._map._container.focus();
    },
    _showCoverage: function _showCoverage(e) {
      var t = this._map;
      this._inZoomAnimation || (this._shownPolygon && t.removeLayer(this._shownPolygon), e.layer.getChildCount() > 2 && e.layer !== this._spiderfied && (this._shownPolygon = new L.Polygon(e.layer.getConvexHull(), this.options.polygonOptions), t.addLayer(this._shownPolygon)));
    },
    _hideCoverage: function _hideCoverage() {
      this._shownPolygon && (this._map.removeLayer(this._shownPolygon), this._shownPolygon = null);
    },
    _unbindEvents: function _unbindEvents() {
      var e = this.options.spiderfyOnMaxZoom,
          t = this.options.showCoverageOnHover,
          i = this.options.zoomToBoundsOnClick,
          n = this._map;
      (e || i) && this.off("clusterclick", this._zoomOrSpiderfy, this), t && (this.off("clustermouseover", this._showCoverage, this), this.off("clustermouseout", this._hideCoverage, this), n.off("zoomend", this._hideCoverage, this));
    },
    _zoomEnd: function _zoomEnd() {
      this._map && (this._mergeSplitClusters(), this._zoom = Math.round(this._map._zoom), this._currentShownBounds = this._getExpandedVisibleBounds());
    },
    _moveEnd: function _moveEnd() {
      if (!this._inZoomAnimation) {
        var e = this._getExpandedVisibleBounds();

        this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), this._zoom, e), this._topClusterLevel._recursivelyAddChildrenToMap(null, Math.round(this._map._zoom), e), this._currentShownBounds = e;
      }
    },
    _generateInitialClusters: function _generateInitialClusters() {
      var e = Math.ceil(this._map.getMaxZoom()),
          t = Math.floor(this._map.getMinZoom()),
          i = this.options.maxClusterRadius,
          n = i;
      "function" != typeof i && (n = function n() {
        return i;
      }), null !== this.options.disableClusteringAtZoom && (e = this.options.disableClusteringAtZoom - 1), this._maxZoom = e, this._gridClusters = {}, this._gridUnclustered = {};

      for (var r = e; r >= t; r--) {
        this._gridClusters[r] = new L.DistanceGrid(n(r)), this._gridUnclustered[r] = new L.DistanceGrid(n(r));
      }

      this._topClusterLevel = new this._markerCluster(this, t - 1);
    },
    _addLayer: function _addLayer(e, t) {
      var i,
          n,
          r = this._gridClusters,
          s = this._gridUnclustered,
          o = Math.floor(this._map.getMinZoom());

      for (this.options.singleMarkerMode && this._overrideMarkerIcon(e), e.on(this._childMarkerEventHandlers, this); t >= o; t--) {
        i = this._map.project(e.getLatLng(), t);
        var a = r[t].getNearObject(i);
        if (a) return a._addChild(e), e.__parent = a, void 0;

        if (a = s[t].getNearObject(i)) {
          var h = a.__parent;
          h && this._removeLayer(a, !1);
          var l = new this._markerCluster(this, t, a, e);
          r[t].addObject(l, this._map.project(l._cLatLng, t)), a.__parent = l, e.__parent = l;
          var u = l;

          for (n = t - 1; n > h._zoom; n--) {
            u = new this._markerCluster(this, n, u), r[n].addObject(u, this._map.project(a.getLatLng(), n));
          }

          return h._addChild(u), this._removeFromGridUnclustered(a, t), void 0;
        }

        s[t].addObject(e, i);
      }

      this._topClusterLevel._addChild(e), e.__parent = this._topClusterLevel;
    },
    _refreshClustersIcons: function _refreshClustersIcons() {
      this._featureGroup.eachLayer(function (e) {
        e instanceof L.MarkerCluster && e._iconNeedsUpdate && e._updateIcon();
      });
    },
    _enqueue: function _enqueue(e) {
      this._queue.push(e), this._queueTimeout || (this._queueTimeout = setTimeout(L.bind(this._processQueue, this), 300));
    },
    _processQueue: function _processQueue() {
      for (var e = 0; e < this._queue.length; e++) {
        this._queue[e].call(this);
      }

      this._queue.length = 0, clearTimeout(this._queueTimeout), this._queueTimeout = null;
    },
    _mergeSplitClusters: function _mergeSplitClusters() {
      var e = Math.round(this._map._zoom);
      this._processQueue(), this._zoom < e && this._currentShownBounds.intersects(this._getExpandedVisibleBounds()) ? (this._animationStart(), this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), this._zoom, this._getExpandedVisibleBounds()), this._animationZoomIn(this._zoom, e)) : this._zoom > e ? (this._animationStart(), this._animationZoomOut(this._zoom, e)) : this._moveEnd();
    },
    _getExpandedVisibleBounds: function _getExpandedVisibleBounds() {
      return this.options.removeOutsideVisibleBounds ? L.Browser.mobile ? this._checkBoundsMaxLat(this._map.getBounds()) : this._checkBoundsMaxLat(this._map.getBounds().pad(1)) : this._mapBoundsInfinite;
    },
    _checkBoundsMaxLat: function _checkBoundsMaxLat(e) {
      var t = this._maxLat;
      return void 0 !== t && (e.getNorth() >= t && (e._northEast.lat = 1 / 0), e.getSouth() <= -t && (e._southWest.lat = -1 / 0)), e;
    },
    _animationAddLayerNonAnimated: function _animationAddLayerNonAnimated(e, t) {
      if (t === e) this._featureGroup.addLayer(e);else if (2 === t._childCount) {
        t._addToMap();

        var i = t.getAllChildMarkers();
        this._featureGroup.removeLayer(i[0]), this._featureGroup.removeLayer(i[1]);
      } else t._updateIcon();
    },
    _extractNonGroupLayers: function _extractNonGroupLayers(e, t) {
      var i,
          n = e.getLayers(),
          r = 0;

      for (t = t || []; r < n.length; r++) {
        i = n[r], i instanceof L.LayerGroup ? this._extractNonGroupLayers(i, t) : t.push(i);
      }

      return t;
    },
    _overrideMarkerIcon: function _overrideMarkerIcon(e) {
      var t = e.options.icon = this.options.iconCreateFunction({
        getChildCount: function getChildCount() {
          return 1;
        },
        getAllChildMarkers: function getAllChildMarkers() {
          return [e];
        }
      });
      return t;
    }
  });
  L.MarkerClusterGroup.include({
    _mapBoundsInfinite: new L.LatLngBounds(new L.LatLng(-1 / 0, -1 / 0), new L.LatLng(1 / 0, 1 / 0))
  }), L.MarkerClusterGroup.include({
    _noAnimation: {
      _animationStart: function _animationStart() {},
      _animationZoomIn: function _animationZoomIn(e, t) {
        this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), e), this._topClusterLevel._recursivelyAddChildrenToMap(null, t, this._getExpandedVisibleBounds()), this.fire("animationend");
      },
      _animationZoomOut: function _animationZoomOut(e, t) {
        this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), e), this._topClusterLevel._recursivelyAddChildrenToMap(null, t, this._getExpandedVisibleBounds()), this.fire("animationend");
      },
      _animationAddLayer: function _animationAddLayer(e, t) {
        this._animationAddLayerNonAnimated(e, t);
      }
    },
    _withAnimation: {
      _animationStart: function _animationStart() {
        this._map._mapPane.className += " leaflet-cluster-anim", this._inZoomAnimation++;
      },
      _animationZoomIn: function _animationZoomIn(e, t) {
        var i,
            n = this._getExpandedVisibleBounds(),
            r = this._featureGroup,
            s = Math.floor(this._map.getMinZoom());

        this._ignoreMove = !0, this._topClusterLevel._recursively(n, e, s, function (s) {
          var o,
              a = s._latlng,
              h = s._markers;

          for (n.contains(a) || (a = null), s._isSingleParent() && e + 1 === t ? (r.removeLayer(s), s._recursivelyAddChildrenToMap(null, t, n)) : (s.clusterHide(), s._recursivelyAddChildrenToMap(a, t, n)), i = h.length - 1; i >= 0; i--) {
            o = h[i], n.contains(o._latlng) || r.removeLayer(o);
          }
        }), this._forceLayout(), this._topClusterLevel._recursivelyBecomeVisible(n, t), r.eachLayer(function (e) {
          e instanceof L.MarkerCluster || !e._icon || e.clusterShow();
        }), this._topClusterLevel._recursively(n, e, t, function (e) {
          e._recursivelyRestoreChildPositions(t);
        }), this._ignoreMove = !1, this._enqueue(function () {
          this._topClusterLevel._recursively(n, e, s, function (e) {
            r.removeLayer(e), e.clusterShow();
          }), this._animationEnd();
        });
      },
      _animationZoomOut: function _animationZoomOut(e, t) {
        this._animationZoomOutSingle(this._topClusterLevel, e - 1, t), this._topClusterLevel._recursivelyAddChildrenToMap(null, t, this._getExpandedVisibleBounds()), this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), e, this._getExpandedVisibleBounds());
      },
      _animationAddLayer: function _animationAddLayer(e, t) {
        var i = this,
            n = this._featureGroup;
        n.addLayer(e), t !== e && (t._childCount > 2 ? (t._updateIcon(), this._forceLayout(), this._animationStart(), e._setPos(this._map.latLngToLayerPoint(t.getLatLng())), e.clusterHide(), this._enqueue(function () {
          n.removeLayer(e), e.clusterShow(), i._animationEnd();
        })) : (this._forceLayout(), i._animationStart(), i._animationZoomOutSingle(t, this._map.getMaxZoom(), this._zoom)));
      }
    },
    _animationZoomOutSingle: function _animationZoomOutSingle(e, t, i) {
      var n = this._getExpandedVisibleBounds(),
          r = Math.floor(this._map.getMinZoom());

      e._recursivelyAnimateChildrenInAndAddSelfToMap(n, r, t + 1, i);

      var s = this;
      this._forceLayout(), e._recursivelyBecomeVisible(n, i), this._enqueue(function () {
        if (1 === e._childCount) {
          var o = e._markers[0];
          this._ignoreMove = !0, o.setLatLng(o.getLatLng()), this._ignoreMove = !1, o.clusterShow && o.clusterShow();
        } else e._recursively(n, i, r, function (e) {
          e._recursivelyRemoveChildrenFromMap(n, r, t + 1);
        });

        s._animationEnd();
      });
    },
    _animationEnd: function _animationEnd() {
      this._map && (this._map._mapPane.className = this._map._mapPane.className.replace(" leaflet-cluster-anim", "")), this._inZoomAnimation--, this.fire("animationend");
    },
    _forceLayout: function _forceLayout() {
      L.Util.falseFn(document.body.offsetWidth);
    }
  }), L.markerClusterGroup = function (e) {
    return new L.MarkerClusterGroup(e);
  };
  var i = L.MarkerCluster = L.Marker.extend({
    options: L.Icon.prototype.options,
    initialize: function initialize(e, t, i, n) {
      L.Marker.prototype.initialize.call(this, i ? i._cLatLng || i.getLatLng() : new L.LatLng(0, 0), {
        icon: this,
        pane: e.options.clusterPane
      }), this._group = e, this._zoom = t, this._markers = [], this._childClusters = [], this._childCount = 0, this._iconNeedsUpdate = !0, this._boundsNeedUpdate = !0, this._bounds = new L.LatLngBounds(), i && this._addChild(i), n && this._addChild(n);
    },
    getAllChildMarkers: function getAllChildMarkers(e, t) {
      e = e || [];

      for (var i = this._childClusters.length - 1; i >= 0; i--) {
        this._childClusters[i].getAllChildMarkers(e);
      }

      for (var n = this._markers.length - 1; n >= 0; n--) {
        t && this._markers[n].__dragStart || e.push(this._markers[n]);
      }

      return e;
    },
    getChildCount: function getChildCount() {
      return this._childCount;
    },
    zoomToBounds: function zoomToBounds(e) {
      for (var t, i = this._childClusters.slice(), n = this._group._map, r = n.getBoundsZoom(this._bounds), s = this._zoom + 1, o = n.getZoom(); i.length > 0 && r > s;) {
        s++;
        var a = [];

        for (t = 0; t < i.length; t++) {
          a = a.concat(i[t]._childClusters);
        }

        i = a;
      }

      r > s ? this._group._map.setView(this._latlng, s) : o >= r ? this._group._map.setView(this._latlng, o + 1) : this._group._map.fitBounds(this._bounds, e);
    },
    getBounds: function getBounds() {
      var e = new L.LatLngBounds();
      return e.extend(this._bounds), e;
    },
    _updateIcon: function _updateIcon() {
      this._iconNeedsUpdate = !0, this._icon && this.setIcon(this);
    },
    createIcon: function createIcon() {
      return this._iconNeedsUpdate && (this._iconObj = this._group.options.iconCreateFunction(this), this._iconNeedsUpdate = !1), this._iconObj.createIcon();
    },
    createShadow: function createShadow() {
      return this._iconObj.createShadow();
    },
    _addChild: function _addChild(e, t) {
      this._iconNeedsUpdate = !0, this._boundsNeedUpdate = !0, this._setClusterCenter(e), e instanceof L.MarkerCluster ? (t || (this._childClusters.push(e), e.__parent = this), this._childCount += e._childCount) : (t || this._markers.push(e), this._childCount++), this.__parent && this.__parent._addChild(e, !0);
    },
    _setClusterCenter: function _setClusterCenter(e) {
      this._cLatLng || (this._cLatLng = e._cLatLng || e._latlng);
    },
    _resetBounds: function _resetBounds() {
      var e = this._bounds;
      e._southWest && (e._southWest.lat = 1 / 0, e._southWest.lng = 1 / 0), e._northEast && (e._northEast.lat = -1 / 0, e._northEast.lng = -1 / 0);
    },
    _recalculateBounds: function _recalculateBounds() {
      var e,
          t,
          i,
          n,
          r = this._markers,
          s = this._childClusters,
          o = 0,
          a = 0,
          h = this._childCount;

      if (0 !== h) {
        for (this._resetBounds(), e = 0; e < r.length; e++) {
          i = r[e]._latlng, this._bounds.extend(i), o += i.lat, a += i.lng;
        }

        for (e = 0; e < s.length; e++) {
          t = s[e], t._boundsNeedUpdate && t._recalculateBounds(), this._bounds.extend(t._bounds), i = t._wLatLng, n = t._childCount, o += i.lat * n, a += i.lng * n;
        }

        this._latlng = this._wLatLng = new L.LatLng(o / h, a / h), this._boundsNeedUpdate = !1;
      }
    },
    _addToMap: function _addToMap(e) {
      e && (this._backupLatlng = this._latlng, this.setLatLng(e)), this._group._featureGroup.addLayer(this);
    },
    _recursivelyAnimateChildrenIn: function _recursivelyAnimateChildrenIn(e, t, i) {
      this._recursively(e, this._group._map.getMinZoom(), i - 1, function (e) {
        var i,
            n,
            r = e._markers;

        for (i = r.length - 1; i >= 0; i--) {
          n = r[i], n._icon && (n._setPos(t), n.clusterHide());
        }
      }, function (e) {
        var i,
            n,
            r = e._childClusters;

        for (i = r.length - 1; i >= 0; i--) {
          n = r[i], n._icon && (n._setPos(t), n.clusterHide());
        }
      });
    },
    _recursivelyAnimateChildrenInAndAddSelfToMap: function _recursivelyAnimateChildrenInAndAddSelfToMap(e, t, i, n) {
      this._recursively(e, n, t, function (r) {
        r._recursivelyAnimateChildrenIn(e, r._group._map.latLngToLayerPoint(r.getLatLng()).round(), i), r._isSingleParent() && i - 1 === n ? (r.clusterShow(), r._recursivelyRemoveChildrenFromMap(e, t, i)) : r.clusterHide(), r._addToMap();
      });
    },
    _recursivelyBecomeVisible: function _recursivelyBecomeVisible(e, t) {
      this._recursively(e, this._group._map.getMinZoom(), t, null, function (e) {
        e.clusterShow();
      });
    },
    _recursivelyAddChildrenToMap: function _recursivelyAddChildrenToMap(e, t, i) {
      this._recursively(i, this._group._map.getMinZoom() - 1, t, function (n) {
        if (t !== n._zoom) for (var r = n._markers.length - 1; r >= 0; r--) {
          var s = n._markers[r];
          i.contains(s._latlng) && (e && (s._backupLatlng = s.getLatLng(), s.setLatLng(e), s.clusterHide && s.clusterHide()), n._group._featureGroup.addLayer(s));
        }
      }, function (t) {
        t._addToMap(e);
      });
    },
    _recursivelyRestoreChildPositions: function _recursivelyRestoreChildPositions(e) {
      for (var t = this._markers.length - 1; t >= 0; t--) {
        var i = this._markers[t];
        i._backupLatlng && (i.setLatLng(i._backupLatlng), delete i._backupLatlng);
      }

      if (e - 1 === this._zoom) for (var n = this._childClusters.length - 1; n >= 0; n--) {
        this._childClusters[n]._restorePosition();
      } else for (var r = this._childClusters.length - 1; r >= 0; r--) {
        this._childClusters[r]._recursivelyRestoreChildPositions(e);
      }
    },
    _restorePosition: function _restorePosition() {
      this._backupLatlng && (this.setLatLng(this._backupLatlng), delete this._backupLatlng);
    },
    _recursivelyRemoveChildrenFromMap: function _recursivelyRemoveChildrenFromMap(e, t, i, n) {
      var r, s;

      this._recursively(e, t - 1, i - 1, function (e) {
        for (s = e._markers.length - 1; s >= 0; s--) {
          r = e._markers[s], n && n.contains(r._latlng) || (e._group._featureGroup.removeLayer(r), r.clusterShow && r.clusterShow());
        }
      }, function (e) {
        for (s = e._childClusters.length - 1; s >= 0; s--) {
          r = e._childClusters[s], n && n.contains(r._latlng) || (e._group._featureGroup.removeLayer(r), r.clusterShow && r.clusterShow());
        }
      });
    },
    _recursively: function _recursively(e, t, i, n, r) {
      var s,
          o,
          a = this._childClusters,
          h = this._zoom;
      if (h >= t && (n && n(this), r && h === i && r(this)), t > h || i > h) for (s = a.length - 1; s >= 0; s--) {
        o = a[s], o._boundsNeedUpdate && o._recalculateBounds(), e.intersects(o._bounds) && o._recursively(e, t, i, n, r);
      }
    },
    _isSingleParent: function _isSingleParent() {
      return this._childClusters.length > 0 && this._childClusters[0]._childCount === this._childCount;
    }
  });
  L.Marker.include({
    clusterHide: function clusterHide() {
      var e = this.options.opacity;
      return this.setOpacity(0), this.options.opacity = e, this;
    },
    clusterShow: function clusterShow() {
      return this.setOpacity(this.options.opacity);
    }
  }), L.DistanceGrid = function (e) {
    this._cellSize = e, this._sqCellSize = e * e, this._grid = {}, this._objectPoint = {};
  }, L.DistanceGrid.prototype = {
    addObject: function addObject(e, t) {
      var i = this._getCoord(t.x),
          n = this._getCoord(t.y),
          r = this._grid,
          s = r[n] = r[n] || {},
          o = s[i] = s[i] || [],
          a = L.Util.stamp(e);

      this._objectPoint[a] = t, o.push(e);
    },
    updateObject: function updateObject(e, t) {
      this.removeObject(e), this.addObject(e, t);
    },
    removeObject: function removeObject(e, t) {
      var i,
          n,
          r = this._getCoord(t.x),
          s = this._getCoord(t.y),
          o = this._grid,
          a = o[s] = o[s] || {},
          h = a[r] = a[r] || [];

      for (delete this._objectPoint[L.Util.stamp(e)], i = 0, n = h.length; n > i; i++) {
        if (h[i] === e) return h.splice(i, 1), 1 === n && delete a[r], !0;
      }
    },
    eachObject: function eachObject(e, t) {
      var i,
          n,
          r,
          s,
          o,
          a,
          h,
          l = this._grid;

      for (i in l) {
        o = l[i];

        for (n in o) {
          for (a = o[n], r = 0, s = a.length; s > r; r++) {
            h = e.call(t, a[r]), h && (r--, s--);
          }
        }
      }
    },
    getNearObject: function getNearObject(e) {
      var t,
          i,
          n,
          r,
          s,
          o,
          a,
          h,
          l = this._getCoord(e.x),
          u = this._getCoord(e.y),
          _ = this._objectPoint,
          d = this._sqCellSize,
          c = null;

      for (t = u - 1; u + 1 >= t; t++) {
        if (r = this._grid[t]) for (i = l - 1; l + 1 >= i; i++) {
          if (s = r[i]) for (n = 0, o = s.length; o > n; n++) {
            a = s[n], h = this._sqDist(_[L.Util.stamp(a)], e), (d > h || d >= h && null === c) && (d = h, c = a);
          }
        }
      }

      return c;
    },
    _getCoord: function _getCoord(e) {
      var t = Math.floor(e / this._cellSize);
      return isFinite(t) ? t : e;
    },
    _sqDist: function _sqDist(e, t) {
      var i = t.x - e.x,
          n = t.y - e.y;
      return i * i + n * n;
    }
  }, function () {
    L.QuickHull = {
      getDistant: function getDistant(e, t) {
        var i = t[1].lat - t[0].lat,
            n = t[0].lng - t[1].lng;
        return n * (e.lat - t[0].lat) + i * (e.lng - t[0].lng);
      },
      findMostDistantPointFromBaseLine: function findMostDistantPointFromBaseLine(e, t) {
        var i,
            n,
            r,
            s = 0,
            o = null,
            a = [];

        for (i = t.length - 1; i >= 0; i--) {
          n = t[i], r = this.getDistant(n, e), r > 0 && (a.push(n), r > s && (s = r, o = n));
        }

        return {
          maxPoint: o,
          newPoints: a
        };
      },
      buildConvexHull: function buildConvexHull(e, t) {
        var i = [],
            n = this.findMostDistantPointFromBaseLine(e, t);
        return n.maxPoint ? (i = i.concat(this.buildConvexHull([e[0], n.maxPoint], n.newPoints)), i = i.concat(this.buildConvexHull([n.maxPoint, e[1]], n.newPoints))) : [e[0]];
      },
      getConvexHull: function getConvexHull(e) {
        var t,
            i = !1,
            n = !1,
            r = !1,
            s = !1,
            o = null,
            a = null,
            h = null,
            l = null,
            u = null,
            _ = null;

        for (t = e.length - 1; t >= 0; t--) {
          var d = e[t];
          (i === !1 || d.lat > i) && (o = d, i = d.lat), (n === !1 || d.lat < n) && (a = d, n = d.lat), (r === !1 || d.lng > r) && (h = d, r = d.lng), (s === !1 || d.lng < s) && (l = d, s = d.lng);
        }

        n !== i ? (_ = a, u = o) : (_ = l, u = h);
        var c = [].concat(this.buildConvexHull([_, u], e), this.buildConvexHull([u, _], e));
        return c;
      }
    };
  }(), L.MarkerCluster.include({
    getConvexHull: function getConvexHull() {
      var e,
          t,
          i = this.getAllChildMarkers(),
          n = [];

      for (t = i.length - 1; t >= 0; t--) {
        e = i[t].getLatLng(), n.push(e);
      }

      return L.QuickHull.getConvexHull(n);
    }
  }), L.MarkerCluster.include({
    _2PI: 2 * Math.PI,
    _circleFootSeparation: 25,
    _circleStartAngle: 0,
    _spiralFootSeparation: 28,
    _spiralLengthStart: 11,
    _spiralLengthFactor: 5,
    _circleSpiralSwitchover: 9,
    spiderfy: function spiderfy() {
      if (this._group._spiderfied !== this && !this._group._inZoomAnimation) {
        var e,
            t = this.getAllChildMarkers(null, !0),
            i = this._group,
            n = i._map,
            r = n.latLngToLayerPoint(this._latlng);
        this._group._unspiderfy(), this._group._spiderfied = this, t.length >= this._circleSpiralSwitchover ? e = this._generatePointsSpiral(t.length, r) : (r.y += 10, e = this._generatePointsCircle(t.length, r)), this._animationSpiderfy(t, e);
      }
    },
    unspiderfy: function unspiderfy(e) {
      this._group._inZoomAnimation || (this._animationUnspiderfy(e), this._group._spiderfied = null);
    },
    _generatePointsCircle: function _generatePointsCircle(e, t) {
      var i,
          n,
          r = this._group.options.spiderfyDistanceMultiplier * this._circleFootSeparation * (2 + e),
          s = r / this._2PI,
          o = this._2PI / e,
          a = [];

      for (s = Math.max(s, 35), a.length = e, i = 0; e > i; i++) {
        n = this._circleStartAngle + i * o, a[i] = new L.Point(t.x + s * Math.cos(n), t.y + s * Math.sin(n))._round();
      }

      return a;
    },
    _generatePointsSpiral: function _generatePointsSpiral(e, t) {
      var i,
          n = this._group.options.spiderfyDistanceMultiplier,
          r = n * this._spiralLengthStart,
          s = n * this._spiralFootSeparation,
          o = n * this._spiralLengthFactor * this._2PI,
          a = 0,
          h = [];

      for (h.length = e, i = e; i >= 0; i--) {
        e > i && (h[i] = new L.Point(t.x + r * Math.cos(a), t.y + r * Math.sin(a))._round()), a += s / r + 5e-4 * i, r += o / a;
      }

      return h;
    },
    _noanimationUnspiderfy: function _noanimationUnspiderfy() {
      var e,
          t,
          i = this._group,
          n = i._map,
          r = i._featureGroup,
          s = this.getAllChildMarkers(null, !0);

      for (i._ignoreMove = !0, this.setOpacity(1), t = s.length - 1; t >= 0; t--) {
        e = s[t], r.removeLayer(e), e._preSpiderfyLatlng && (e.setLatLng(e._preSpiderfyLatlng), delete e._preSpiderfyLatlng), e.setZIndexOffset && e.setZIndexOffset(0), e._spiderLeg && (n.removeLayer(e._spiderLeg), delete e._spiderLeg);
      }

      i.fire("unspiderfied", {
        cluster: this,
        markers: s
      }), i._ignoreMove = !1, i._spiderfied = null;
    }
  }), L.MarkerClusterNonAnimated = L.MarkerCluster.extend({
    _animationSpiderfy: function _animationSpiderfy(e, t) {
      var i,
          n,
          r,
          s,
          o = this._group,
          a = o._map,
          h = o._featureGroup,
          l = this._group.options.spiderLegPolylineOptions;

      for (o._ignoreMove = !0, i = 0; i < e.length; i++) {
        s = a.layerPointToLatLng(t[i]), n = e[i], r = new L.Polyline([this._latlng, s], l), a.addLayer(r), n._spiderLeg = r, n._preSpiderfyLatlng = n._latlng, n.setLatLng(s), n.setZIndexOffset && n.setZIndexOffset(1e6), h.addLayer(n);
      }

      this.setOpacity(.3), o._ignoreMove = !1, o.fire("spiderfied", {
        cluster: this,
        markers: e
      });
    },
    _animationUnspiderfy: function _animationUnspiderfy() {
      this._noanimationUnspiderfy();
    }
  }), L.MarkerCluster.include({
    _animationSpiderfy: function _animationSpiderfy(e, t) {
      var i,
          n,
          r,
          s,
          o,
          a,
          h = this,
          l = this._group,
          u = l._map,
          _ = l._featureGroup,
          d = this._latlng,
          c = u.latLngToLayerPoint(d),
          p = L.Path.SVG,
          f = L.extend({}, this._group.options.spiderLegPolylineOptions),
          m = f.opacity;

      for (void 0 === m && (m = L.MarkerClusterGroup.prototype.options.spiderLegPolylineOptions.opacity), p ? (f.opacity = 0, f.className = (f.className || "") + " leaflet-cluster-spider-leg") : f.opacity = m, l._ignoreMove = !0, i = 0; i < e.length; i++) {
        n = e[i], a = u.layerPointToLatLng(t[i]), r = new L.Polyline([d, a], f), u.addLayer(r), n._spiderLeg = r, p && (s = r._path, o = s.getTotalLength() + .1, s.style.strokeDasharray = o, s.style.strokeDashoffset = o), n.setZIndexOffset && n.setZIndexOffset(1e6), n.clusterHide && n.clusterHide(), _.addLayer(n), n._setPos && n._setPos(c);
      }

      for (l._forceLayout(), l._animationStart(), i = e.length - 1; i >= 0; i--) {
        a = u.layerPointToLatLng(t[i]), n = e[i], n._preSpiderfyLatlng = n._latlng, n.setLatLng(a), n.clusterShow && n.clusterShow(), p && (r = n._spiderLeg, s = r._path, s.style.strokeDashoffset = 0, r.setStyle({
          opacity: m
        }));
      }

      this.setOpacity(.3), l._ignoreMove = !1, setTimeout(function () {
        l._animationEnd(), l.fire("spiderfied", {
          cluster: h,
          markers: e
        });
      }, 200);
    },
    _animationUnspiderfy: function _animationUnspiderfy(e) {
      var t,
          i,
          n,
          r,
          s,
          o,
          a = this,
          h = this._group,
          l = h._map,
          u = h._featureGroup,
          _ = e ? l._latLngToNewLayerPoint(this._latlng, e.zoom, e.center) : l.latLngToLayerPoint(this._latlng),
          d = this.getAllChildMarkers(null, !0),
          c = L.Path.SVG;

      for (h._ignoreMove = !0, h._animationStart(), this.setOpacity(1), i = d.length - 1; i >= 0; i--) {
        t = d[i], t._preSpiderfyLatlng && (t.closePopup(), t.setLatLng(t._preSpiderfyLatlng), delete t._preSpiderfyLatlng, o = !0, t._setPos && (t._setPos(_), o = !1), t.clusterHide && (t.clusterHide(), o = !1), o && u.removeLayer(t), c && (n = t._spiderLeg, r = n._path, s = r.getTotalLength() + .1, r.style.strokeDashoffset = s, n.setStyle({
          opacity: 0
        })));
      }

      h._ignoreMove = !1, setTimeout(function () {
        var e = 0;

        for (i = d.length - 1; i >= 0; i--) {
          t = d[i], t._spiderLeg && e++;
        }

        for (i = d.length - 1; i >= 0; i--) {
          t = d[i], t._spiderLeg && (t.clusterShow && t.clusterShow(), t.setZIndexOffset && t.setZIndexOffset(0), e > 1 && u.removeLayer(t), l.removeLayer(t._spiderLeg), delete t._spiderLeg);
        }

        h._animationEnd(), h.fire("unspiderfied", {
          cluster: a,
          markers: d
        });
      }, 200);
    }
  }), L.MarkerClusterGroup.include({
    _spiderfied: null,
    unspiderfy: function unspiderfy() {
      this._unspiderfy.apply(this, arguments);
    },
    _spiderfierOnAdd: function _spiderfierOnAdd() {
      this._map.on("click", this._unspiderfyWrapper, this), this._map.options.zoomAnimation && this._map.on("zoomstart", this._unspiderfyZoomStart, this), this._map.on("zoomend", this._noanimationUnspiderfy, this), L.Browser.touch || this._map.getRenderer(this);
    },
    _spiderfierOnRemove: function _spiderfierOnRemove() {
      this._map.off("click", this._unspiderfyWrapper, this), this._map.off("zoomstart", this._unspiderfyZoomStart, this), this._map.off("zoomanim", this._unspiderfyZoomAnim, this), this._map.off("zoomend", this._noanimationUnspiderfy, this), this._noanimationUnspiderfy();
    },
    _unspiderfyZoomStart: function _unspiderfyZoomStart() {
      this._map && this._map.on("zoomanim", this._unspiderfyZoomAnim, this);
    },
    _unspiderfyZoomAnim: function _unspiderfyZoomAnim(e) {
      L.DomUtil.hasClass(this._map._mapPane, "leaflet-touching") || (this._map.off("zoomanim", this._unspiderfyZoomAnim, this), this._unspiderfy(e));
    },
    _unspiderfyWrapper: function _unspiderfyWrapper() {
      this._unspiderfy();
    },
    _unspiderfy: function _unspiderfy(e) {
      this._spiderfied && this._spiderfied.unspiderfy(e);
    },
    _noanimationUnspiderfy: function _noanimationUnspiderfy() {
      this._spiderfied && this._spiderfied._noanimationUnspiderfy();
    },
    _unspiderfyLayer: function _unspiderfyLayer(e) {
      e._spiderLeg && (this._featureGroup.removeLayer(e), e.clusterShow && e.clusterShow(), e.setZIndexOffset && e.setZIndexOffset(0), this._map.removeLayer(e._spiderLeg), delete e._spiderLeg);
    }
  }), L.MarkerClusterGroup.include({
    refreshClusters: function refreshClusters(e) {
      return e ? e instanceof L.MarkerClusterGroup ? e = e._topClusterLevel.getAllChildMarkers() : e instanceof L.LayerGroup ? e = e._layers : e instanceof L.MarkerCluster ? e = e.getAllChildMarkers() : e instanceof L.Marker && (e = [e]) : e = this._topClusterLevel.getAllChildMarkers(), this._flagParentsIconsNeedUpdate(e), this._refreshClustersIcons(), this.options.singleMarkerMode && this._refreshSingleMarkerModeMarkers(e), this;
    },
    _flagParentsIconsNeedUpdate: function _flagParentsIconsNeedUpdate(e) {
      var t, i;

      for (t in e) {
        for (i = e[t].__parent; i;) {
          i._iconNeedsUpdate = !0, i = i.__parent;
        }
      }
    },
    _refreshSingleMarkerModeMarkers: function _refreshSingleMarkerModeMarkers(e) {
      var t, i;

      for (t in e) {
        i = e[t], this.hasLayer(i) && i.setIcon(this._overrideMarkerIcon(i));
      }
    }
  }), L.Marker.include({
    refreshIconOptions: function refreshIconOptions(e, t) {
      var i = this.options.icon;
      return L.setOptions(i, e), this.setIcon(i), t && this.__parent && this.__parent._group.refreshClusters(this), this;
    }
  }), e.MarkerClusterGroup = t, e.MarkerCluster = i;
});
},{}],"../node_modules/parcel-bundler/src/builtins/bundle-url.js":[function(require,module,exports) {
var bundleURL = null;

function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }

  return bundleURL;
}

function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp|chrome-extension|moz-extension):\/\/[^)\n]+/g);

    if (matches) {
      return getBaseURL(matches[0]);
    }
  }

  return '/';
}

function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp|chrome-extension|moz-extension):\/\/.+)\/[^/]+$/, '$1') + '/';
}

exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
},{}],"../node_modules/parcel-bundler/src/builtins/css-loader.js":[function(require,module,exports) {
var bundle = require('./bundle-url');

function updateLink(link) {
  var newLink = link.cloneNode();

  newLink.onload = function () {
    link.remove();
  };

  newLink.href = link.href.split('?')[0] + '?' + Date.now();
  link.parentNode.insertBefore(newLink, link.nextSibling);
}

var cssTimeout = null;

function reloadCSS() {
  if (cssTimeout) {
    return;
  }

  cssTimeout = setTimeout(function () {
    var links = document.querySelectorAll('link[rel="stylesheet"]');

    for (var i = 0; i < links.length; i++) {
      if (bundle.getBaseURL(links[i].href) === bundle.getBundleURL()) {
        updateLink(links[i]);
      }
    }

    cssTimeout = null;
  }, 50);
}

module.exports = reloadCSS;
},{"./bundle-url":"../node_modules/parcel-bundler/src/builtins/bundle-url.js"}],"css/MarkerCluster.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"css/MarkerCluster.Default.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"css/style.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"js/reorientate.js":[function(require,module,exports) {
function reOrientateImage(imageName, orientation) {
  // function to re-orientate canvas object depending upon EXIF camera orientation number
  // receives name of image (assumed to be JPG) and orientation_
  // returns array to context of named canvas object and position of canvas draw elements
  console.log("orientation " + orientation + " imagename " + imageName);
  var c = document.getElementById(imageName + "_canvas");
  var ctx = c.getContext("2d"); //var img = document.getElementById(imageName);

  var img = new Image();
  img.src = imageName + ".jpg";
  canvas.width = img.width;
  canvas.height = img.height;
  var x = 0;
  var y = 0; //  ctx.save();
  // x = -canvas.width;
  // y = -canvas.height;

  ctx.save();

  if (orientation == 1) {
    ctx.scale(1, 1);
    console.log("scaled 1");
  } else if (orientation == 2) {
    x = -canvas.width;
    ctx.scale(-1, 1);
    console.log("scaled 2");
  } else if (orientation == 3) {
    x = -canvas.width;
    y = -canvas.height;
    ctx.scale(-1, -1);
    console.log("scaled 3");
  } else if (orientation == 4) {
    y = -canvas.height;
    ctx.scale(1, -1);
    console.log("scaled 4");
  } else if (orientation == 5) {
    canvas.width = img.height;
    canvas.height = img.width;
    ctx.translate(canvas.width, canvas.height / canvas.width);
    ctx.rotate(Math.PI / 2);
    y = -canvas.width;
    ctx.scale(1, -1);
    console.log("scaled 5");
  } else if (orientation == 6) {
    canvas.width = img.height;
    canvas.height = img.width;
    ctx.translate(canvas.width, canvas.height / canvas.width);
    ctx.rotate(Math.PI / 2);
    console.log("scaled 6");
  } else if (orientation == 7) {
    canvas.width = img.height;
    canvas.height = img.width;
    ctx.translate(canvas.width, canvas.height / canvas.width);
    ctx.rotate(Math.PI / 2);
    x = -canvas.height;
    ctx.scale(-1, 1);
    console.log("scaled 7");
  } else if (orientation == 8) {
    canvas.width = img.height;
    canvas.height = img.width;
    ctx.translate(canvas.width, canvas.height / canvas.width);
    ctx.rotate(Math.PI / 2);
    x = -canvas.height;
    y = -canvas.width;
    ctx.scale(-1, -1);
    console.log("scaled  8");
  }

  return [ctx, x, y]; //  ctx.drawImage(img, x, y);
  //ctx.restore();
}
},{}],"../files.json":[function(require,module,exports) {
module.exports = ["signs/sign0.jpg", "signs/sign1.jpg", "signs/sign10.jpg", "signs/sign100.jpg", "signs/sign1000.jpg", "signs/sign1001.jpg", "signs/sign1002.jpg", "signs/sign1003.jpg", "signs/sign1004.jpg", "signs/sign1005.jpg", "signs/sign1006.jpg", "signs/sign1007.jpg", "signs/sign1008.jpg", "signs/sign1009.jpg", "signs/sign101.jpg", "signs/sign1010.jpg", "signs/sign1011.jpg", "signs/sign1012.jpg", "signs/sign1013.jpg", "signs/sign1014.jpg", "signs/sign1015.jpg", "signs/sign1016.jpg", "signs/sign1017.jpg", "signs/sign1018.jpg", "signs/sign1019.jpg", "signs/sign102.jpg", "signs/sign1020.jpg", "signs/sign1021.jpg", "signs/sign1022.jpg", "signs/sign1023.jpg", "signs/sign1024.jpg", "signs/sign1025.jpg", "signs/sign1026.jpg", "signs/sign1027.jpg", "signs/sign1028.jpg", "signs/sign1029.jpg", "signs/sign103.jpg", "signs/sign1030.jpg", "signs/sign1031.jpg", "signs/sign1032.jpg", "signs/sign1033.jpg", "signs/sign1034.jpg", "signs/sign1035.jpg", "signs/sign1036.jpg", "signs/sign1037.jpg", "signs/sign1038.jpg", "signs/sign1039.jpg", "signs/sign104.jpg", "signs/sign1040.jpg", "signs/sign1041.jpg", "signs/sign1042.jpg", "signs/sign1043.jpg", "signs/sign1044.jpg", "signs/sign1045.jpg", "signs/sign1046.jpg", "signs/sign1047.jpg", "signs/sign1048.jpg", "signs/sign1049.jpg", "signs/sign105.jpg", "signs/sign1050.jpg", "signs/sign1051.jpg", "signs/sign1052.jpg", "signs/sign1053.jpg", "signs/sign1054.jpg", "signs/sign1055.jpg", "signs/sign1056.jpg", "signs/sign1057.jpg", "signs/sign1058.jpg", "signs/sign1059.jpg", "signs/sign106.jpg", "signs/sign1060.jpg", "signs/sign1061.jpg", "signs/sign1062.jpg", "signs/sign1063.jpg", "signs/sign1064.jpg", "signs/sign1065.jpg", "signs/sign1066.jpg", "signs/sign1067.jpg", "signs/sign1068.jpg", "signs/sign1069.jpg", "signs/sign107.jpg", "signs/sign1070.jpg", "signs/sign1071.jpg", "signs/sign1072.jpg", "signs/sign1073.jpg", "signs/sign1074.jpg", "signs/sign1075.jpg", "signs/sign1076.jpg", "signs/sign1077.jpg", "signs/sign1078.jpg", "signs/sign1079.jpg", "signs/sign108.jpg", "signs/sign1080.jpg", "signs/sign1081.jpg", "signs/sign1082.jpg", "signs/sign1083.jpg", "signs/sign1084.jpg", "signs/sign1085.jpg", "signs/sign1086.jpg", "signs/sign1087.jpg", "signs/sign1088.jpg", "signs/sign1089.jpg", "signs/sign109.jpg", "signs/sign1090.jpg", "signs/sign1091.jpg", "signs/sign1092.jpg", "signs/sign1093.jpg", "signs/sign1094.jpg", "signs/sign1095.jpg", "signs/sign1096.jpg", "signs/sign1097.jpg", "signs/sign1098.jpg", "signs/sign1099.jpg", "signs/sign11.jpg", "signs/sign110.jpg", "signs/sign1100.jpg", "signs/sign1101.jpg", "signs/sign1102.jpg", "signs/sign1103.jpg", "signs/sign1104.jpg", "signs/sign1105.jpg", "signs/sign1106.jpg", "signs/sign1107.jpg", "signs/sign1108.jpg", "signs/sign1109.jpg", "signs/sign111.jpg", "signs/sign1110.jpg", "signs/sign1111.jpg", "signs/sign1112.jpg", "signs/sign1113.jpg", "signs/sign1114.jpg", "signs/sign1115.jpg", "signs/sign1116.jpg", "signs/sign1117.jpg", "signs/sign1118.jpg", "signs/sign1119.jpg", "signs/sign112.jpg", "signs/sign1120.jpg", "signs/sign1121.jpg", "signs/sign1122.jpg", "signs/sign1123.jpg", "signs/sign1124.jpg", "signs/sign1125.jpg", "signs/sign1126.jpg", "signs/sign1127.jpg", "signs/sign1128.jpg", "signs/sign1129.jpg", "signs/sign113.jpg", "signs/sign1130.jpg", "signs/sign1131.jpg", "signs/sign1132.jpg", "signs/sign1133.jpg", "signs/sign1134.jpg", "signs/sign1135.jpg", "signs/sign1136.jpg", "signs/sign1137.jpg", "signs/sign1138.jpg", "signs/sign1139.jpg", "signs/sign114.jpg", "signs/sign1140.jpg", "signs/sign1141.jpg", "signs/sign1142.jpg", "signs/sign1143.jpg", "signs/sign1144.jpg", "signs/sign1145.jpg", "signs/sign1146.jpg", "signs/sign1147.jpg", "signs/sign1148.jpg", "signs/sign1149.jpg", "signs/sign115.jpg", "signs/sign1150.jpg", "signs/sign1151.jpg", "signs/sign1152.jpg", "signs/sign1153.jpg", "signs/sign1154.jpg", "signs/sign1155.jpg", "signs/sign1156.jpg", "signs/sign1157.jpg", "signs/sign1158.jpg", "signs/sign1159.jpg", "signs/sign116.jpg", "signs/sign1160.jpg", "signs/sign1161.jpg", "signs/sign1162.jpg", "signs/sign1163.jpg", "signs/sign1164.jpg", "signs/sign1165.jpg", "signs/sign1166.jpg", "signs/sign1167.jpg", "signs/sign1168.jpg", "signs/sign1169.jpg", "signs/sign117.jpg", "signs/sign1170.jpg", "signs/sign1171.jpg", "signs/sign1172.jpg", "signs/sign1173.jpg", "signs/sign1174.jpg", "signs/sign1175.jpg", "signs/sign1176.jpg", "signs/sign1177.jpg", "signs/sign1178.jpg", "signs/sign1179.jpg", "signs/sign118.jpg", "signs/sign1180.jpg", "signs/sign1181.jpg", "signs/sign1182.jpg", "signs/sign1183.jpg", "signs/sign1184.jpg", "signs/sign1185.jpg", "signs/sign1186.jpg", "signs/sign1187.jpg", "signs/sign1188.jpg", "signs/sign1189.jpg", "signs/sign119.jpg", "signs/sign1190.jpg", "signs/sign1191.jpg", "signs/sign1192.jpg", "signs/sign1193.jpg", "signs/sign1194.jpg", "signs/sign1195.jpg", "signs/sign1196.jpg", "signs/sign1197.jpg", "signs/sign1198.jpg", "signs/sign1199.jpg", "signs/sign12.jpg", "signs/sign120.jpg", "signs/sign1200.jpg", "signs/sign1201.jpg", "signs/sign1202.jpg", "signs/sign1203.jpg", "signs/sign1204.jpg", "signs/sign1205.jpg", "signs/sign1206.jpg", "signs/sign1207.jpg", "signs/sign1208.jpg", "signs/sign1209.jpg", "signs/sign121.jpg", "signs/sign1210.jpg", "signs/sign1211.jpg", "signs/sign1212.jpg", "signs/sign1213.jpg", "signs/sign1214.jpg", "signs/sign1215.jpg", "signs/sign1216.jpg", "signs/sign1217.jpg", "signs/sign1218.jpg", "signs/sign1219.jpg", "signs/sign122.jpg", "signs/sign1220.jpg", "signs/sign1221.jpg", "signs/sign1222.jpg", "signs/sign1223.jpg", "signs/sign1224.jpg", "signs/sign1225.jpg", "signs/sign1226.jpg", "signs/sign1227.jpg", "signs/sign1228.jpg", "signs/sign1229.jpg", "signs/sign123.jpg", "signs/sign1230.jpg", "signs/sign1231.jpg", "signs/sign1232.jpg", "signs/sign1233.jpg", "signs/sign1234.jpg", "signs/sign1235.jpg", "signs/sign1236.jpg", "signs/sign1237.jpg", "signs/sign1238.jpg", "signs/sign1239.jpg", "signs/sign124.jpg", "signs/sign1240.jpg", "signs/sign1241.jpg", "signs/sign1242.jpg", "signs/sign1243.jpg", "signs/sign1244.jpg", "signs/sign1245.jpg", "signs/sign1246.jpg", "signs/sign1247.jpg", "signs/sign1248.jpg", "signs/sign1249.jpg", "signs/sign125.jpg", "signs/sign1250.jpg", "signs/sign1251.jpg", "signs/sign1252.jpg", "signs/sign1253.jpg", "signs/sign1254.jpg", "signs/sign1255.jpg", "signs/sign1256.jpg", "signs/sign1257.jpg", "signs/sign1258.jpg", "signs/sign1259.jpg", "signs/sign126.jpg", "signs/sign1260.jpg", "signs/sign1261.jpg", "signs/sign1262.jpg", "signs/sign1263.jpg", "signs/sign1264.jpg", "signs/sign1265.jpg", "signs/sign1266.jpg", "signs/sign1267.jpg", "signs/sign1268.jpg", "signs/sign1269.jpg", "signs/sign127.jpg", "signs/sign1270.jpg", "signs/sign1271.jpg", "signs/sign1272.jpg", "signs/sign1273.jpg", "signs/sign1274.jpg", "signs/sign1275.jpg", "signs/sign1276.jpg", "signs/sign1277.jpg", "signs/sign1278.jpg", "signs/sign1279.jpg", "signs/sign128.jpg", "signs/sign1280.jpg", "signs/sign1281.jpg", "signs/sign1282.jpg", "signs/sign1283.jpg", "signs/sign1284.jpg", "signs/sign1285.jpg", "signs/sign1286.jpg", "signs/sign1287.jpg", "signs/sign1288.jpg", "signs/sign1289.jpg", "signs/sign129.jpg", "signs/sign1290.jpg", "signs/sign1291.jpg", "signs/sign1292.jpg", "signs/sign1293.jpg", "signs/sign1294.jpg", "signs/sign1295.jpg", "signs/sign1296.jpg", "signs/sign1297.jpg", "signs/sign1298.jpg", "signs/sign1299.jpg", "signs/sign13.jpg", "signs/sign130.jpg", "signs/sign1300.jpg", "signs/sign1301.jpg", "signs/sign1302.jpg", "signs/sign1303.jpg", "signs/sign1304.jpg", "signs/sign1305.jpg", "signs/sign1306.jpg", "signs/sign1307.jpg", "signs/sign1308.jpg", "signs/sign1309.jpg", "signs/sign131.jpg", "signs/sign1310.jpg", "signs/sign1311.jpg", "signs/sign1312.jpg", "signs/sign1313.jpg", "signs/sign1314.jpg", "signs/sign1315.jpg", "signs/sign1316.jpg", "signs/sign1317.jpg", "signs/sign1318.jpg", "signs/sign1319.jpg", "signs/sign132.jpg", "signs/sign1320.jpg", "signs/sign1321.jpg", "signs/sign1322.jpg", "signs/sign1323.jpg", "signs/sign1324.jpg", "signs/sign1325.jpg", "signs/sign1326.jpg", "signs/sign1327.jpg", "signs/sign1328.jpg", "signs/sign1329.jpg", "signs/sign133.jpg", "signs/sign1330.jpg", "signs/sign1331.jpg", "signs/sign1332.jpg", "signs/sign1333.jpg", "signs/sign1334.jpg", "signs/sign1335.jpg", "signs/sign1336.jpg", "signs/sign1337.jpg", "signs/sign1338.jpg", "signs/sign1339.jpg", "signs/sign134.jpg", "signs/sign1340.jpg", "signs/sign1341.jpg", "signs/sign1342.jpg", "signs/sign1343.jpg", "signs/sign1344.jpg", "signs/sign1345.jpg", "signs/sign1346.jpg", "signs/sign1347.jpg", "signs/sign1348.jpg", "signs/sign1349.jpg", "signs/sign135.jpg", "signs/sign1350.jpg", "signs/sign1351.jpg", "signs/sign1352.jpg", "signs/sign1353.jpg", "signs/sign1354.jpg", "signs/sign1355.jpg", "signs/sign1356.jpg", "signs/sign1357.jpg", "signs/sign1358.jpg", "signs/sign1359.jpg", "signs/sign136.jpg", "signs/sign1360.jpg", "signs/sign1361.jpg", "signs/sign1362.jpg", "signs/sign1363.jpg", "signs/sign1364.jpg", "signs/sign1365.jpg", "signs/sign1366.jpg", "signs/sign1367.jpg", "signs/sign1368.jpg", "signs/sign1369.jpg", "signs/sign137.jpg", "signs/sign1370.jpg", "signs/sign1371.jpg", "signs/sign1372.jpg", "signs/sign1373.jpg", "signs/sign1374.jpg", "signs/sign1375.jpg", "signs/sign1376.jpg", "signs/sign1377.jpg", "signs/sign1378.jpg", "signs/sign1379.jpg", "signs/sign138.jpg", "signs/sign1380.jpg", "signs/sign1381.jpg", "signs/sign1382.jpg", "signs/sign1383.jpg", "signs/sign1384.jpg", "signs/sign1385.jpg", "signs/sign1386.jpg", "signs/sign1387.jpg", "signs/sign1388.jpg", "signs/sign1389.jpg", "signs/sign139.jpg", "signs/sign1390.jpg", "signs/sign1391.jpg", "signs/sign1392.jpg", "signs/sign1393.jpg", "signs/sign1394.jpg", "signs/sign1395.jpg", "signs/sign1396.jpg", "signs/sign1397.jpg", "signs/sign1398.jpg", "signs/sign1399.jpg", "signs/sign14.jpg", "signs/sign140.jpg", "signs/sign1400.jpg", "signs/sign1401.jpg", "signs/sign1402.jpg", "signs/sign1403.jpg", "signs/sign1404.jpg", "signs/sign1405.jpg", "signs/sign1406.jpg", "signs/sign1407.jpg", "signs/sign1408.jpg", "signs/sign1409.jpg", "signs/sign141.jpg", "signs/sign1410.jpg", "signs/sign1411.jpg", "signs/sign1412.jpg", "signs/sign1413.jpg", "signs/sign1414.jpg", "signs/sign1415.jpg", "signs/sign1416.jpg", "signs/sign1417.jpg", "signs/sign1418.jpg", "signs/sign1419.jpg", "signs/sign142.jpg", "signs/sign1420.jpg", "signs/sign1421.jpg", "signs/sign1422.jpg", "signs/sign1423.jpg", "signs/sign1424.jpg", "signs/sign1425.jpg", "signs/sign1426.jpg", "signs/sign1427.jpg", "signs/sign1428.jpg", "signs/sign1429.jpg", "signs/sign143.jpg", "signs/sign1430.jpg", "signs/sign1431.jpg", "signs/sign1432.jpg", "signs/sign1433.jpg", "signs/sign1434.jpg", "signs/sign1435.jpg", "signs/sign1436.jpg", "signs/sign1437.jpg", "signs/sign1438.jpg", "signs/sign1439.jpg", "signs/sign144.jpg", "signs/sign1440.jpg", "signs/sign1441.jpg", "signs/sign1442.jpg", "signs/sign1443.jpg", "signs/sign1444.jpg", "signs/sign1445.jpg", "signs/sign1446.jpg", "signs/sign1447.jpg", "signs/sign1448.jpg", "signs/sign1449.jpg", "signs/sign145.jpg", "signs/sign1450.jpg", "signs/sign1451.jpg", "signs/sign1452.jpg", "signs/sign1453.jpg", "signs/sign1454.jpg", "signs/sign146.jpg", "signs/sign147.jpg", "signs/sign148.jpg", "signs/sign149.jpg", "signs/sign15.jpg", "signs/sign150.jpg", "signs/sign151.jpg", "signs/sign152.jpg", "signs/sign153.jpg", "signs/sign154.jpg", "signs/sign155.jpg", "signs/sign156.jpg", "signs/sign157.jpg", "signs/sign158.jpg", "signs/sign159.jpg", "signs/sign16.jpg", "signs/sign160.jpg", "signs/sign161.jpg", "signs/sign162.jpg", "signs/sign163.jpg", "signs/sign164.jpg", "signs/sign165.jpg", "signs/sign166.jpg", "signs/sign167.jpg", "signs/sign168.jpg", "signs/sign169.jpg", "signs/sign17.jpg", "signs/sign170.jpg", "signs/sign171.jpg", "signs/sign172.jpg", "signs/sign173.jpg", "signs/sign174.jpg", "signs/sign175.jpg", "signs/sign176.jpg", "signs/sign177.jpg", "signs/sign178.jpg", "signs/sign179.jpg", "signs/sign18.jpg", "signs/sign180.jpg", "signs/sign181.jpg", "signs/sign182.jpg", "signs/sign183.jpg", "signs/sign184.jpg", "signs/sign185.jpg", "signs/sign186.jpg", "signs/sign187.jpg", "signs/sign188.jpg", "signs/sign189.jpg", "signs/sign19.jpg", "signs/sign190.jpg", "signs/sign191.jpg", "signs/sign192.jpg", "signs/sign193.jpg", "signs/sign194.jpg", "signs/sign195.jpg", "signs/sign196.jpg", "signs/sign197.jpg", "signs/sign198.jpg", "signs/sign199.jpg", "signs/sign2.jpg", "signs/sign20.jpg", "signs/sign200.jpg", "signs/sign201.jpg", "signs/sign202.jpg", "signs/sign203.jpg", "signs/sign204.jpg", "signs/sign205.jpg", "signs/sign206.jpg", "signs/sign207.jpg", "signs/sign208.jpg", "signs/sign209.jpg", "signs/sign21.jpg", "signs/sign210.jpg", "signs/sign211.jpg", "signs/sign212.jpg", "signs/sign213.jpg", "signs/sign214.jpg", "signs/sign215.jpg", "signs/sign216.jpg", "signs/sign217.jpg", "signs/sign218.jpg", "signs/sign219.jpg", "signs/sign22.jpg", "signs/sign220.jpg", "signs/sign221.jpg", "signs/sign222.jpg", "signs/sign223.jpg", "signs/sign224.jpg", "signs/sign225.jpg", "signs/sign226.jpg", "signs/sign227.jpg", "signs/sign228.jpg", "signs/sign229.jpg", "signs/sign23.jpg", "signs/sign230.jpg", "signs/sign231.jpg", "signs/sign232.jpg", "signs/sign233.jpg", "signs/sign234.jpg", "signs/sign235.jpg", "signs/sign236.jpg", "signs/sign237.jpg", "signs/sign238.jpg", "signs/sign239.jpg", "signs/sign24.jpg", "signs/sign240.jpg", "signs/sign241.jpg", "signs/sign242.jpg", "signs/sign243.jpg", "signs/sign244.jpg", "signs/sign245.jpg", "signs/sign246.jpg", "signs/sign247.jpg", "signs/sign248.jpg", "signs/sign249.jpg", "signs/sign25.jpg", "signs/sign250.jpg", "signs/sign251.jpg", "signs/sign252.jpg", "signs/sign253.jpg", "signs/sign254.jpg", "signs/sign255.jpg", "signs/sign256.jpg", "signs/sign257.jpg", "signs/sign258.jpg", "signs/sign259.jpg", "signs/sign26.jpg", "signs/sign260.jpg", "signs/sign261.jpg", "signs/sign262.jpg", "signs/sign263.jpg", "signs/sign264.jpg", "signs/sign265.jpg", "signs/sign266.jpg", "signs/sign267.jpg", "signs/sign268.jpg", "signs/sign269.jpg", "signs/sign27.jpg", "signs/sign270.jpg", "signs/sign271.jpg", "signs/sign272.jpg", "signs/sign273.jpg", "signs/sign274.jpg", "signs/sign275.jpg", "signs/sign276.jpg", "signs/sign277.jpg", "signs/sign278.jpg", "signs/sign279.jpg", "signs/sign28.jpg", "signs/sign280.jpg", "signs/sign281.jpg", "signs/sign282.jpg", "signs/sign283.jpg", "signs/sign284.jpg", "signs/sign285.jpg", "signs/sign286.jpg", "signs/sign287.jpg", "signs/sign288.jpg", "signs/sign289.jpg", "signs/sign29.jpg", "signs/sign290.jpg", "signs/sign291.jpg", "signs/sign292.jpg", "signs/sign293.jpg", "signs/sign294.jpg", "signs/sign295.jpg", "signs/sign296.jpg", "signs/sign297.jpg", "signs/sign298.jpg", "signs/sign299.jpg", "signs/sign3.jpg", "signs/sign30.jpg", "signs/sign300.jpg", "signs/sign301.jpg", "signs/sign302.jpg", "signs/sign303.jpg", "signs/sign304.jpg", "signs/sign305.jpg", "signs/sign306.jpg", "signs/sign307.jpg", "signs/sign308.jpg", "signs/sign309.jpg", "signs/sign31.jpg", "signs/sign310.jpg", "signs/sign311.jpg", "signs/sign312.jpg", "signs/sign313.jpg", "signs/sign314.jpg", "signs/sign315.jpg", "signs/sign316.jpg", "signs/sign317.jpg", "signs/sign318.jpg", "signs/sign319.jpg", "signs/sign32.jpg", "signs/sign320.jpg", "signs/sign321.jpg", "signs/sign322.jpg", "signs/sign323.jpg", "signs/sign324.jpg", "signs/sign325.jpg", "signs/sign326.jpg", "signs/sign327.jpg", "signs/sign328.jpg", "signs/sign329.jpg", "signs/sign33.jpg", "signs/sign330.jpg", "signs/sign331.jpg", "signs/sign332.jpg", "signs/sign333.jpg", "signs/sign334.jpg", "signs/sign335.jpg", "signs/sign336.jpg", "signs/sign337.jpg", "signs/sign338.jpg", "signs/sign339.jpg", "signs/sign34.jpg", "signs/sign340.jpg", "signs/sign341.jpg", "signs/sign342.jpg", "signs/sign343.jpg", "signs/sign344.jpg", "signs/sign345.jpg", "signs/sign346.jpg", "signs/sign347.jpg", "signs/sign348.jpg", "signs/sign349.jpg", "signs/sign35.jpg", "signs/sign350.jpg", "signs/sign351.jpg", "signs/sign352.jpg", "signs/sign353.jpg", "signs/sign354.jpg", "signs/sign355.jpg", "signs/sign356.jpg", "signs/sign357.jpg", "signs/sign358.jpg", "signs/sign359.jpg", "signs/sign36.jpg", "signs/sign360.jpg", "signs/sign361.jpg", "signs/sign362.jpg", "signs/sign363.jpg", "signs/sign364.jpg", "signs/sign365.jpg", "signs/sign366.jpg", "signs/sign367.jpg", "signs/sign368.jpg", "signs/sign369.jpg", "signs/sign37.jpg", "signs/sign370.jpg", "signs/sign371.jpg", "signs/sign372.jpg", "signs/sign373.jpg", "signs/sign374.jpg", "signs/sign375.jpg", "signs/sign376.jpg", "signs/sign377.jpg", "signs/sign378.jpg", "signs/sign379.jpg", "signs/sign38.jpg", "signs/sign380.jpg", "signs/sign381.jpg", "signs/sign382.jpg", "signs/sign383.jpg", "signs/sign384.jpg", "signs/sign385.jpg", "signs/sign386.jpg", "signs/sign387.jpg", "signs/sign388.jpg", "signs/sign389.jpg", "signs/sign39.jpg", "signs/sign390.jpg", "signs/sign391.jpg", "signs/sign392.jpg", "signs/sign393.jpg", "signs/sign394.jpg", "signs/sign395.jpg", "signs/sign396.jpg", "signs/sign397.jpg", "signs/sign398.jpg", "signs/sign399.jpg", "signs/sign4.jpg", "signs/sign40.jpg", "signs/sign400.jpg", "signs/sign401.jpg", "signs/sign402.jpg", "signs/sign403.jpg", "signs/sign404.jpg", "signs/sign405.jpg", "signs/sign406.jpg", "signs/sign407.jpg", "signs/sign408.jpg", "signs/sign409.jpg", "signs/sign41.jpg", "signs/sign410.jpg", "signs/sign411.jpg", "signs/sign412.jpg", "signs/sign413.jpg", "signs/sign414.jpg", "signs/sign415.jpg", "signs/sign416.jpg", "signs/sign417.jpg", "signs/sign418.jpg", "signs/sign419.jpg", "signs/sign42.jpg", "signs/sign420.jpg", "signs/sign421.jpg", "signs/sign422.jpg", "signs/sign423.jpg", "signs/sign424.jpg", "signs/sign425.jpg", "signs/sign426.jpg", "signs/sign427.jpg", "signs/sign428.jpg", "signs/sign429.jpg", "signs/sign43.jpg", "signs/sign430.jpg", "signs/sign431.jpg", "signs/sign432.jpg", "signs/sign433.jpg", "signs/sign434.jpg", "signs/sign435.jpg", "signs/sign436.jpg", "signs/sign437.jpg", "signs/sign438.jpg", "signs/sign439.jpg", "signs/sign44.jpg", "signs/sign440.jpg", "signs/sign441.jpg", "signs/sign442.jpg", "signs/sign443.jpg", "signs/sign444.jpg", "signs/sign445.jpg", "signs/sign446.jpg", "signs/sign447.jpg", "signs/sign448.jpg", "signs/sign449.jpg", "signs/sign45.jpg", "signs/sign450.jpg", "signs/sign451.jpg", "signs/sign452.jpg", "signs/sign453.jpg", "signs/sign454.jpg", "signs/sign455.jpg", "signs/sign456.jpg", "signs/sign457.jpg", "signs/sign458.jpg", "signs/sign459.jpg", "signs/sign46.jpg", "signs/sign460.jpg", "signs/sign461.jpg", "signs/sign462.jpg", "signs/sign463.jpg", "signs/sign464.jpg", "signs/sign465.jpg", "signs/sign466.jpg", "signs/sign467.jpg", "signs/sign468.jpg", "signs/sign469.jpg", "signs/sign47.jpg", "signs/sign470.jpg", "signs/sign471.jpg", "signs/sign472.jpg", "signs/sign473.jpg", "signs/sign474.jpg", "signs/sign475.jpg", "signs/sign476.jpg", "signs/sign477.jpg", "signs/sign478.jpg", "signs/sign479.jpg", "signs/sign48.jpg", "signs/sign480.jpg", "signs/sign481.jpg", "signs/sign482.jpg", "signs/sign483.jpg", "signs/sign484.jpg", "signs/sign485.jpg", "signs/sign486.jpg", "signs/sign487.jpg", "signs/sign488.jpg", "signs/sign489.jpg", "signs/sign49.jpg", "signs/sign490.jpg", "signs/sign491.jpg", "signs/sign492.jpg", "signs/sign493.jpg", "signs/sign494.jpg", "signs/sign495.jpg", "signs/sign496.jpg", "signs/sign497.jpg", "signs/sign498.jpg", "signs/sign499.jpg", "signs/sign5.jpg", "signs/sign50.jpg", "signs/sign500.jpg", "signs/sign501.jpg", "signs/sign502.jpg", "signs/sign503.jpg", "signs/sign504.jpg", "signs/sign505.jpg", "signs/sign506.jpg", "signs/sign507.jpg", "signs/sign508.jpg", "signs/sign509.jpg", "signs/sign51.jpg", "signs/sign510.jpg", "signs/sign511.jpg", "signs/sign512.jpg", "signs/sign513.jpg", "signs/sign514.jpg", "signs/sign515.jpg", "signs/sign516.jpg", "signs/sign517.jpg", "signs/sign518.jpg", "signs/sign519.jpg", "signs/sign52.jpg", "signs/sign520.jpg", "signs/sign521.jpg", "signs/sign522.jpg", "signs/sign523.jpg", "signs/sign524.jpg", "signs/sign525.jpg", "signs/sign526.jpg", "signs/sign527.jpg", "signs/sign528.jpg", "signs/sign529.jpg", "signs/sign53.jpg", "signs/sign530.jpg", "signs/sign531.jpg", "signs/sign532.jpg", "signs/sign533.jpg", "signs/sign534.jpg", "signs/sign535.jpg", "signs/sign536.jpg", "signs/sign537.jpg", "signs/sign538.jpg", "signs/sign539.jpg", "signs/sign54.jpg", "signs/sign540.jpg", "signs/sign541.jpg", "signs/sign542.jpg", "signs/sign543.jpg", "signs/sign544.jpg", "signs/sign545.jpg", "signs/sign546.jpg", "signs/sign547.jpg", "signs/sign548.jpg", "signs/sign549.jpg", "signs/sign55.jpg", "signs/sign550.jpg", "signs/sign551.jpg", "signs/sign552.jpg", "signs/sign553.jpg", "signs/sign554.jpg", "signs/sign555.jpg", "signs/sign556.jpg", "signs/sign557.jpg", "signs/sign558.jpg", "signs/sign559.jpg", "signs/sign56.jpg", "signs/sign560.jpg", "signs/sign561.jpg", "signs/sign562.jpg", "signs/sign563.jpg", "signs/sign564.jpg", "signs/sign565.jpg", "signs/sign566.jpg", "signs/sign567.jpg", "signs/sign568.jpg", "signs/sign569.jpg", "signs/sign57.jpg", "signs/sign570.jpg", "signs/sign571.jpg", "signs/sign572.jpg", "signs/sign573.jpg", "signs/sign574.jpg", "signs/sign575.jpg", "signs/sign576.jpg", "signs/sign577.jpg", "signs/sign578.jpg", "signs/sign579.jpg", "signs/sign58.jpg", "signs/sign580.jpg", "signs/sign581.jpg", "signs/sign582.jpg", "signs/sign583.jpg", "signs/sign584.jpg", "signs/sign585.jpg", "signs/sign586.jpg", "signs/sign587.jpg", "signs/sign588.jpg", "signs/sign589.jpg", "signs/sign59.jpg", "signs/sign590.jpg", "signs/sign591.jpg", "signs/sign592.jpg", "signs/sign593.jpg", "signs/sign594.jpg", "signs/sign595.jpg", "signs/sign596.jpg", "signs/sign597.jpg", "signs/sign598.jpg", "signs/sign599.jpg", "signs/sign6.jpg", "signs/sign60.jpg", "signs/sign600.jpg", "signs/sign601.jpg", "signs/sign602.jpg", "signs/sign603.jpg", "signs/sign604.jpg", "signs/sign605.jpg", "signs/sign606.jpg", "signs/sign607.jpg", "signs/sign608.jpg", "signs/sign609.jpg", "signs/sign61.jpg", "signs/sign610.jpg", "signs/sign611.jpg", "signs/sign612.jpg", "signs/sign613.jpg", "signs/sign614.jpg", "signs/sign615.jpg", "signs/sign616.jpg", "signs/sign617.jpg", "signs/sign618.jpg", "signs/sign619.jpg", "signs/sign62.jpg", "signs/sign620.jpg", "signs/sign621.jpg", "signs/sign622.jpg", "signs/sign623.jpg", "signs/sign624.jpg", "signs/sign625.jpg", "signs/sign626.jpg", "signs/sign627.jpg", "signs/sign628.jpg", "signs/sign629.jpg", "signs/sign63.jpg", "signs/sign630.jpg", "signs/sign631.jpg", "signs/sign632.jpg", "signs/sign633.jpg", "signs/sign634.jpg", "signs/sign635.jpg", "signs/sign636.jpg", "signs/sign637.jpg", "signs/sign638.jpg", "signs/sign639.jpg", "signs/sign64.jpg", "signs/sign640.jpg", "signs/sign641.jpg", "signs/sign642.jpg", "signs/sign643.jpg", "signs/sign644.jpg", "signs/sign645.jpg", "signs/sign646.jpg", "signs/sign647.jpg", "signs/sign648.jpg", "signs/sign649.jpg", "signs/sign65.jpg", "signs/sign650.jpg", "signs/sign651.jpg", "signs/sign652.jpg", "signs/sign653.jpg", "signs/sign654.jpg", "signs/sign655.jpg", "signs/sign656.jpg", "signs/sign657.jpg", "signs/sign658.jpg", "signs/sign659.jpg", "signs/sign66.jpg", "signs/sign660.jpg", "signs/sign661.jpg", "signs/sign662.jpg", "signs/sign663.jpg", "signs/sign664.jpg", "signs/sign665.jpg", "signs/sign666.jpg", "signs/sign667.jpg", "signs/sign668.jpg", "signs/sign669.jpg", "signs/sign67.jpg", "signs/sign670.jpg", "signs/sign671.jpg", "signs/sign672.jpg", "signs/sign673.jpg", "signs/sign674.jpg", "signs/sign675.jpg", "signs/sign676.jpg", "signs/sign677.jpg", "signs/sign678.jpg", "signs/sign679.jpg", "signs/sign68.jpg", "signs/sign680.jpg", "signs/sign681.jpg", "signs/sign682.jpg", "signs/sign683.jpg", "signs/sign684.jpg", "signs/sign685.jpg", "signs/sign686.jpg", "signs/sign687.jpg", "signs/sign688.jpg", "signs/sign689.jpg", "signs/sign69.jpg", "signs/sign690.jpg", "signs/sign691.jpg", "signs/sign692.jpg", "signs/sign693.jpg", "signs/sign694.jpg", "signs/sign695.jpg", "signs/sign696.jpg", "signs/sign697.jpg", "signs/sign698.jpg", "signs/sign699.jpg", "signs/sign7.jpg", "signs/sign70.jpg", "signs/sign700.jpg", "signs/sign701.jpg", "signs/sign702.jpg", "signs/sign703.jpg", "signs/sign704.jpg", "signs/sign705.jpg", "signs/sign706.jpg", "signs/sign707.jpg", "signs/sign708.jpg", "signs/sign709.jpg", "signs/sign71.jpg", "signs/sign710.jpg", "signs/sign711.jpg", "signs/sign712.jpg", "signs/sign713.jpg", "signs/sign714.jpg", "signs/sign715.jpg", "signs/sign716.jpg", "signs/sign717.jpg", "signs/sign718.jpg", "signs/sign719.jpg", "signs/sign72.jpg", "signs/sign720.jpg", "signs/sign721.jpg", "signs/sign722.jpg", "signs/sign723.jpg", "signs/sign724.jpg", "signs/sign725.jpg", "signs/sign726.jpg", "signs/sign727.jpg", "signs/sign728.jpg", "signs/sign729.jpg", "signs/sign73.jpg", "signs/sign730.jpg", "signs/sign731.jpg", "signs/sign732.jpg", "signs/sign733.jpg", "signs/sign734.jpg", "signs/sign735.jpg", "signs/sign736.jpg", "signs/sign737.jpg", "signs/sign738.jpg", "signs/sign739.jpg", "signs/sign74.jpg", "signs/sign740.jpg", "signs/sign741.jpg", "signs/sign742.jpg", "signs/sign743.jpg", "signs/sign744.jpg", "signs/sign745.jpg", "signs/sign746.jpg", "signs/sign747.jpg", "signs/sign748.jpg", "signs/sign749.jpg", "signs/sign75.jpg", "signs/sign750.jpg", "signs/sign751.jpg", "signs/sign752.jpg", "signs/sign753.jpg", "signs/sign754.jpg", "signs/sign755.jpg", "signs/sign756.jpg", "signs/sign757.jpg", "signs/sign758.jpg", "signs/sign759.jpg", "signs/sign76.jpg", "signs/sign760.jpg", "signs/sign761.jpg", "signs/sign762.jpg", "signs/sign763.jpg", "signs/sign764.jpg", "signs/sign765.jpg", "signs/sign766.jpg", "signs/sign767.jpg", "signs/sign768.jpg", "signs/sign769.jpg", "signs/sign77.jpg", "signs/sign770.jpg", "signs/sign771.jpg", "signs/sign772.jpg", "signs/sign773.jpg", "signs/sign774.jpg", "signs/sign775.jpg", "signs/sign776.jpg", "signs/sign777.jpg", "signs/sign778.jpg", "signs/sign779.jpg", "signs/sign78.jpg", "signs/sign780.jpg", "signs/sign781.jpg", "signs/sign782.jpg", "signs/sign783.jpg", "signs/sign784.jpg", "signs/sign785.jpg", "signs/sign786.jpg", "signs/sign787.jpg", "signs/sign788.jpg", "signs/sign789.jpg", "signs/sign79.jpg", "signs/sign790.jpg", "signs/sign791.jpg", "signs/sign792.jpg", "signs/sign793.jpg", "signs/sign794.jpg", "signs/sign795.jpg", "signs/sign796.jpg", "signs/sign797.jpg", "signs/sign798.jpg", "signs/sign799.jpg", "signs/sign8.jpg", "signs/sign80.jpg", "signs/sign800.jpg", "signs/sign801.jpg", "signs/sign802.jpg", "signs/sign803.jpg", "signs/sign804.jpg", "signs/sign805.jpg", "signs/sign806.jpg", "signs/sign807.jpg", "signs/sign808.jpg", "signs/sign809.jpg", "signs/sign81.jpg", "signs/sign810.jpg", "signs/sign811.jpg", "signs/sign812.jpg", "signs/sign813.jpg", "signs/sign814.jpg", "signs/sign815.jpg", "signs/sign816.jpg", "signs/sign817.jpg", "signs/sign818.jpg", "signs/sign819.jpg", "signs/sign82.jpg", "signs/sign820.jpg", "signs/sign821.jpg", "signs/sign822.jpg", "signs/sign823.jpg", "signs/sign824.jpg", "signs/sign825.jpg", "signs/sign826.jpg", "signs/sign827.jpg", "signs/sign828.jpg", "signs/sign829.jpg", "signs/sign83.jpg", "signs/sign830.jpg", "signs/sign831.jpg", "signs/sign832.jpg", "signs/sign833.jpg", "signs/sign834.jpg", "signs/sign835.jpg", "signs/sign836.jpg", "signs/sign837.jpg", "signs/sign838.jpg", "signs/sign839.jpg", "signs/sign84.jpg", "signs/sign840.jpg", "signs/sign841.jpg", "signs/sign842.jpg", "signs/sign843.jpg", "signs/sign844.jpg", "signs/sign845.jpg", "signs/sign846.jpg", "signs/sign847.jpg", "signs/sign848.jpg", "signs/sign849.jpg", "signs/sign85.jpg", "signs/sign850.jpg", "signs/sign851.jpg", "signs/sign852.jpg", "signs/sign853.jpg", "signs/sign854.jpg", "signs/sign855.jpg", "signs/sign856.jpg", "signs/sign857.jpg", "signs/sign858.jpg", "signs/sign859.jpg", "signs/sign86.jpg", "signs/sign860.jpg", "signs/sign861.jpg", "signs/sign862.jpg", "signs/sign863.jpg", "signs/sign864.jpg", "signs/sign865.jpg", "signs/sign866.jpg", "signs/sign867.jpg", "signs/sign868.jpg", "signs/sign869.jpg", "signs/sign87.jpg", "signs/sign870.jpg", "signs/sign871.jpg", "signs/sign872.jpg", "signs/sign873.jpg", "signs/sign874.jpg", "signs/sign875.jpg", "signs/sign876.jpg", "signs/sign877.jpg", "signs/sign878.jpg", "signs/sign879.jpg", "signs/sign88.jpg", "signs/sign880.jpg", "signs/sign881.jpg", "signs/sign882.jpg", "signs/sign883.jpg", "signs/sign884.jpg", "signs/sign885.jpg", "signs/sign886.jpg", "signs/sign887.jpg", "signs/sign888.jpg", "signs/sign889.jpg", "signs/sign89.jpg", "signs/sign890.jpg", "signs/sign891.jpg", "signs/sign892.jpg", "signs/sign893.jpg", "signs/sign894.jpg", "signs/sign895.jpg", "signs/sign896.jpg", "signs/sign897.jpg", "signs/sign898.jpg", "signs/sign899.jpg", "signs/sign9.jpg", "signs/sign90.jpg", "signs/sign900.jpg", "signs/sign901.jpg", "signs/sign902.jpg", "signs/sign903.jpg", "signs/sign904.jpg", "signs/sign905.jpg", "signs/sign906.jpg", "signs/sign907.jpg", "signs/sign908.jpg", "signs/sign909.jpg", "signs/sign91.jpg", "signs/sign910.jpg", "signs/sign911.jpg", "signs/sign912.jpg", "signs/sign913.jpg", "signs/sign914.jpg", "signs/sign915.jpg", "signs/sign916.jpg", "signs/sign917.jpg", "signs/sign918.jpg", "signs/sign919.jpg", "signs/sign92.jpg", "signs/sign920.jpg", "signs/sign921.jpg", "signs/sign922.jpg", "signs/sign923.jpg", "signs/sign924.jpg", "signs/sign925.jpg", "signs/sign926.jpg", "signs/sign927.jpg", "signs/sign928.jpg", "signs/sign929.jpg", "signs/sign93.jpg", "signs/sign930.jpg", "signs/sign931.jpg", "signs/sign932.jpg", "signs/sign933.jpg", "signs/sign934.jpg", "signs/sign935.jpg", "signs/sign936.jpg", "signs/sign937.jpg", "signs/sign938.jpg", "signs/sign939.jpg", "signs/sign94.jpg", "signs/sign940.jpg", "signs/sign941.jpg", "signs/sign942.jpg", "signs/sign943.jpg", "signs/sign944.jpg", "signs/sign945.jpg", "signs/sign946.jpg", "signs/sign947.jpg", "signs/sign948.jpg", "signs/sign949.jpg", "signs/sign95.jpg", "signs/sign950.jpg", "signs/sign951.jpg", "signs/sign952.jpg", "signs/sign953.jpg", "signs/sign954.jpg", "signs/sign955.jpg", "signs/sign956.jpg", "signs/sign957.jpg", "signs/sign958.jpg", "signs/sign959.jpg", "signs/sign96.jpg", "signs/sign960.jpg", "signs/sign961.jpg", "signs/sign962.jpg", "signs/sign963.jpg", "signs/sign964.jpg", "signs/sign965.jpg", "signs/sign966.jpg", "signs/sign967.jpg", "signs/sign968.jpg", "signs/sign969.jpg", "signs/sign97.jpg", "signs/sign970.jpg", "signs/sign971.jpg", "signs/sign972.jpg", "signs/sign973.jpg", "signs/sign974.jpg", "signs/sign975.jpg", "signs/sign976.jpg", "signs/sign977.jpg", "signs/sign978.jpg", "signs/sign979.jpg", "signs/sign98.jpg", "signs/sign980.jpg", "signs/sign981.jpg", "signs/sign982.jpg", "signs/sign983.jpg", "signs/sign984.jpg", "signs/sign985.jpg", "signs/sign986.jpg", "signs/sign987.jpg", "signs/sign988.jpg", "signs/sign989.jpg", "signs/sign99.jpg", "signs/sign990.jpg", "signs/sign991.jpg", "signs/sign992.jpg", "signs/sign993.jpg", "signs/sign994.jpg", "signs/sign995.jpg", "signs/sign996.jpg", "signs/sign997.jpg", "signs/sign998.jpg", "signs/sign999.jpg"];
},{}],"js/index.js":[function(require,module,exports) {
var piexif = require('piexifjs');

require('blueimp-load-image');

require('./date.js');

require('./date-en-GB.js');

require('./leaflet.markercluster.js');

require('../css/MarkerCluster.css');

require('../css/MarkerCluster.Default.css');

require('../css/style.css');

require('./reorientate.js');

var myFileNames = require('../../files.json'); // global variables


var maxSigns = 0; // number of sign-images to load

var mySigns = []; // array of sign-image names

var myExif = []; // array of EXIF data for loaded sign-images

var signsLoaded = 0; // initialise count of loaded sign-images

var b_traversingMarkers = false;
var currentMarker = 0;
var delayMilli = 14000; // delay between flyto marker animation events occurring

var openMarkerDelay = 6000; // delay time on auto popup open and close

var closeMarkerDelay = 13000; // delay time on auto popup open and close

var flyAnimationLength = 8; // time in seconds for flyto marker animation

var flyMaxZoom = 18;
var markersList = []; // array of all markers added to clustering _layer
// myFileNames = getImageFileNames();

window.onload = function () {
  addSigns(); // add all the signs to the map
};

var myMap = L.map('mapid').setView([51.505, -0.09], 5); // generate map gentred on LONDON
// var myMap = L.map('mapid').setView([52.379, 4.899], 5); // generate map gentred on AMSTERDAM
// var accessToken = "pk.eyJ1IjoiZGFuYnoiLCJhIjoiY2p0cnN1bXcxMDQ5aTN5bXZ1YmNja2QxNCJ9.Uy4SmkElJKCMLsxy-P8CJQ"; // mapbox access token

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Map Imagery © <a href="https://www.mapbox.com/">Mapbox</a>, all other materials  © <a href="https://www.buzzo.com/">Daniel Buzzo</a>',
  maxZoom: 20,
  minZoom: 3,
  // mapbox styling
  // id: 'mapbox.streets',
  id: 'mapbox.dark',
  // id: 'mapbox.light',
  // id: 'mapbox.outdoors',
  // id: 'mapbox.satellite',
  accessToken: 'pk.eyJ1IjoiZGFuYnoiLCJhIjoiY2p0cnN1bXcxMDQ5aTN5bXZ1YmNja2QxNCJ9.Uy4SmkElJKCMLsxy-P8CJQ'
}).addTo(myMap); // add info to the map

var info = L.control(); // new leaflet map control layer

info.onAdd = function (myMap) {
  this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"

  this.update();
  return this._div;
}; // method that we will use to update the control based on feature properties passed


info.update = function (props) {
  // populate info map control layer
  this._div.innerHTML = "<h1 id='hero-title'>Signs of Surveillance</h1><h2 id='sub-title'>A photography project by <a href='http://www.buzzo.com'>Daniel Buzzo</a></h2><p id='loading-notice'><span id='signTotal'>0</span> signs loaded of <span id='signMax'>0</span>. Viewing sign <span id='currentSign'>0</span><form><div class='toggles'><input type='checkbox' name='styled' id='styled' onclick='traverseMarkers()'><label for='styled'>Traverse Markers</label></div></form></p>";
};

info.addTo(myMap); // add info layer to map
// make clustering group for markers

var markers = L.markerClusterGroup({
  maxClusterRadius: 25,
  spiderfyOnMaxZoom: false,
  disableClusteringAtZoom: 16
}); // to setup signs as custom icons in an array of markers

function addSigns() {
  maxSigns = myFileNames.length;
  document.getElementById('signMax').innerHTML = maxSigns;

  for (i = 0; i < maxSigns; i++) {
    //  var imagePath = "./signs/sign" + i + ".jpg";
    var imagePath = myFileNames[i];
    convertFileToBase64viaFileReader(imagePath); // previous routine to load via piexif.js
  }

  myMap.addLayer(markers); // add marker layer
} // traverse map from marker to marker in array


function traverseMarkers() {
  b_traversingMarkers = !b_traversingMarkers; //  currentMarker = 0;
  //  document.getElementById("traverseMarkers").innerHTML = b_traversingMarkers;

  document.getElementById('currentSign').innerHTML = currentMarker;

  if (b_traversingMarkers) {
    interval = setInterval(incrementTraverse, delayMilli);
    incrementTraverse();
  } else {
    clearInterval(interval);
  }
}

function incrementTraverse() {
  // fly from marker to marker on the map
  if (currentMarker >= maxSigns) {
    currentMarker = 0;
  } else {
    currentMarker += 1;
  }

  var exif = myExif[currentMarker];
  var lat = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLatitude], exif['GPS'][piexif.GPSIFD.GPSLatitudeRef]);
  var long = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLongitude], exif['GPS'][piexif.GPSIFD.GPSLongitudeRef]);
  document.getElementById('currentSign').innerHTML = currentMarker; // calculate distance to new latlong posiiton

  var distance = myMap.getCenter().distanceTo([lat, long]); // distance in meters

  if (distance > 100000) {
    flyAnimationLength = 12;
  } else {
    flyAnimationLength = 8;
  } // console.log("distance to " + distance);


  myMap.flyTo([lat, long], flyMaxZoom, {
    duration: flyAnimationLength
  });
  setTimeout(openPopupMarker, openMarkerDelay);
  setTimeout(removePopupMarker, closeMarkerDelay);
}

function openPopupMarker() {
  var m = markersList[currentMarker];
  markers.removeLayer(m);
  m.addTo(myMap);
  m.openPopup();
}

function removePopupMarker() {
  var m = markersList[currentMarker];
  myMap.removeLayer(m);
  markers.addLayer(m);
} // load and extract EXIF data from supplied image url string and URLdatablob


function loadExif(dataURL, url) {
  var originalImg = new Image();
  originalImg.src = dataURL;
  var exif = piexif.load(dataURL);

  originalImg.onload = function () {
    /// //////// requested image now loaded ///////////
    mySigns.push(url); // push image name into array

    myExif.push(exif); // push exif data into array of exif data

    var strLength = url.length; // extract sign-image name
    // var signName = url.substr(8, strLength - 8);

    console.log('loaded '.url); // extract EXIF data in preparation for building sign-image popup marker

    var dateStamp = exif['0th'][piexif.ImageIFD.DateTime];
    var prettyDate = dateStamp.substr(0, 10);
    var prettyTime = dateStamp.substr(11, 8);
    var prettyDate = prettyDate.replace(/:/g, '/');
    var newPrettyDate = Date.parse(prettyDate).toString('MMMM dS, yyyy');
    var newPrettyTime = Date.parse(prettyTime).toString('HH:mm tt');
    var make = exif['0th'][piexif.ImageIFD.Make];
    var model = exif['0th'][piexif.ImageIFD.Model];
    var orientation = exif['0th'][piexif.ImageIFD.Orientation];
    var lat = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLatitude], exif['GPS'][piexif.GPSIFD.GPSLatitudeRef]);
    var long = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLongitude], exif['GPS'][piexif.GPSIFD.GPSLongitudeRef]); // get reverse geocode lookup
    // example reverse GeoCode test
    // var geocodeDataUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places/%20-0.09%2C51.505.json?access_token=pk.eyJ1IjoiZGFuYnoiLCJhIjoiY2p0cnN1bXcxMDQ5aTN5bXZ1YmNja2QxNCJ9.Uy4SmkElJKCMLsxy-P8CJQ&cachebuster=1554397643233&autocomplete=true';

    var geocodeDataUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places/%20' + long + '%2C' + lat + '.json?access_token=pk.eyJ1IjoiZGFuYnoiLCJhIjoiY2p0cnN1bXcxMDQ5aTN5bXZ1YmNja2QxNCJ9.Uy4SmkElJKCMLsxy-P8CJQ&cachebuster=1554397643233&autocomplete=true'; // console.log("returned geodata " +  httpGetAsync(geocodeDataUrl));
    // create new image-sign marker for map

    var newSign = L.marker([piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLatitude], exif['GPS'][piexif.GPSIFD.GPSLatitudeRef]), piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLongitude], exif['GPS'][piexif.GPSIFD.GPSLongitudeRef])], riseOnHover = true, autoclose = true); // bind popup information to sign-image marker

    newSign.bindPopup("<div class ='sign_popup' ><h1>" + newPrettyDate + ', ' + newPrettyTime + "</h1><div class ='sign_popup_inner'><img class = 'orientation_" + orientation + "' src ='" + url + "'></div> <p>Recorded with " + make + ' ' + model + '. ');
    console.log('url for images ' + url);
    newSign.on('mouseover', function (e) {
      this.openPopup();
    });
    newSign.on('mouseout', function (e) {
      this.closePopup();
    });
    markersList.push(newSign);
    markers.addLayer(newSign);
    var locality = httpGetAsync(geocodeDataUrl, newSign);
    signsLoaded += 1; // update number of signs loaded to map

    document.getElementById('signTotal').innerHTML = signsLoaded;
  };
} // get geocode data


function httpGetAsync(theUrl, sign) {
  var xmlHttp = new XMLHttpRequest();

  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      // console.log(xmlHttp.responseText);
      var jsonText = xmlHttp.responseText;
      myLocality = JSON.parse(jsonText); // console.log("parsed JSON " + myLocality.features[2].place_name);

      locality = myLocality.features[2].place_name;
      var content = sign._popup._content;
      sign._popup._content = content + locality + '</p></div>';
    }
  };

  xmlHttp.open('GET', theUrl, true); // true for asynchronous

  xmlHttp.send(null);
}

;

function handleFileSelect(evt) {
  // var file = evt.target.files[0];
  // var reader = new FileReader();
  // reader.onloadend = function(e) {
  //   printExif(e.target.result);
  // };
  // reader.readAsDataURL(file);
  // new File("/signs/sign0.jpg", { type: 'image/jpeg' });
  // //reader.readAsDataURL(file);
  convertFileToBase64viaFileReader('./signs/sign0.jpg');
} // prepare image for correction orientation based upon EXIF orientation data


function drawSomeStuff(imageName, orientation) {
  var rotatedContext = reOrientateImage(imageName, orientation);
  var c = document.getElementById(imageName + '_canvas');
  var img = new Image();
  img.src = imageName + '.jpg';
  var ctx = rotatedContext[0];
  var x = rotatedContext[1];
  var y = rotatedContext[2];
  ctx.drawImage(img, x, y);
} // document.getElementById('piexif-file-input').addEventListener('change', handleFileSelect, false);
// convert filename to base64 dataURL Blob


function convertFileToBase64viaFileReader(url) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';

  xhr.onload = function () {
    var reader = new FileReader();

    reader.onloadend = function () {
      loadExif(reader.result, url);
    };

    reader.readAsDataURL(xhr.response);
  };

  xhr.open('GET', url);
  xhr.send();
}
},{"piexifjs":"../node_modules/piexifjs/piexif.js","blueimp-load-image":"../node_modules/blueimp-load-image/js/index.js","./date.js":"js/date.js","./date-en-GB.js":"js/date-en-GB.js","./leaflet.markercluster.js":"js/leaflet.markercluster.js","../css/MarkerCluster.css":"css/MarkerCluster.css","../css/MarkerCluster.Default.css":"css/MarkerCluster.Default.css","../css/style.css":"css/style.css","./reorientate.js":"js/reorientate.js","../../files.json":"../files.json"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "57668" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","js/index.js"], null)
//# sourceMappingURL=/js.00a46daa.js.map