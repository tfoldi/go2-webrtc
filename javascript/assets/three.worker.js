(function () {
    "use strict";
    var F = (() => {
      var r = self.location
        ? self.location.href.split("/").slice(0, -1).join("/")
        : "";
      return function (e = {}) {
        var e;
        e || (e = typeof e < "u" ? e : {});
        var c, u;
        e.ready = new Promise((t, n) => {
          (c = t), (u = n);
        });
        var p = Object.assign({}, e),
          R = !0,
          o = "";
        function G(t) {
          return e.locateFile ? e.locateFile(t, o) : o + t;
        }
        var w;
        (o = self.location.href),
          r && (o = r),
          o.indexOf("blob:") !== 0
            ? (o = o.substr(0, o.replace(/[?#].*/, "").lastIndexOf("/") + 1))
            : (o = ""),
          (w = (t) => {
            var n = new XMLHttpRequest();
            return (
              n.open("GET", t, !1),
              (n.responseType = "arraybuffer"),
              n.send(null),
              new Uint8Array(n.response)
            );
          }),
          e.print || console.log.bind(console);
        var d = e.printErr || console.error.bind(console);
        Object.assign(e, p),
          (p = null),
          e.arguments && e.arguments,
          e.thisProgram && e.thisProgram,
          e.quit && e.quit;
        var m;
        e.wasmBinary && (m = e.wasmBinary),
          e.noExitRuntime,
          typeof WebAssembly != "object" && h("no native wasm support detected");
        var I,
          H = !1,
          b,
          P,
          S,
          E,
          B,
          O,
          z;
        function k() {
          var t = I.buffer; //export.c == buffer
          (e.HEAP8 = b = new Int8Array(t)),
            (e.HEAP16 = S = new Int16Array(t)),
            (e.HEAP32 = E = new Int32Array(t)),
            (e.HEAPU8 = P = new Uint8Array(t)),
            (e.HEAPU16 = new Uint16Array(t)),
            (e.HEAPU32 = B = new Uint32Array(t)),
            (e.HEAPF32 = O = new Float32Array(t)),
            (e.HEAPF64 = z = new Float64Array(t));
        }
        var M = [],
          W = [],
          C = [];
        function K() {
          if (e.preRun)
            for (
              typeof e.preRun == "function" && (e.preRun = [e.preRun]);
              e.preRun.length;

            )
              J(e.preRun.shift());
          U(M);
        }
        function X() {
          U(W);
        }
        function $() {
          if (e.postRun)
            for (
              typeof e.postRun == "function" && (e.postRun = [e.postRun]);
              e.postRun.length;

            )
              Y(e.postRun.shift());
          U(C);
        }
        function J(t) {
          M.unshift(t);
        }
        function Q(t) {
          W.unshift(t);
        }
        function Y(t) {
          C.unshift(t);
        }
        var l = 0,
          _ = null;
        function Z(t) {
          l++, e.monitorRunDependencies && e.monitorRunDependencies(l);
        }
        function ee(t) {
          if (
            (l--,
            e.monitorRunDependencies && e.monitorRunDependencies(l),
            l == 0 && _)
          ) {
            var n = _;
            (_ = null), n();
          }
        }
        function h(t) {
          e.onAbort && e.onAbort(t),
            (t = "Aborted(" + t + ")"),
            d(t),
            (H = !0),
            (t += ". Build with -sASSERTIONS for more info.");
          var n = new WebAssembly.RuntimeError(t);
          throw (u(n), n);
        }
        var te = "data:application/octet-stream;base64,";
        function T(t) {
          return t.startsWith(te);
        }
        var f;
        e.locateFile
          ? ((f = "libvoxel.wasm"), T(f) || (f = G(f)))
          : (f = new URL("/assets/libvoxel.1ba27f06.wasm", self.location).href);
        function x(t) {
          try {
            if (t == f && m) return new Uint8Array(m);
            if (w) return w(t);
            throw "both async and sync fetching of the wasm failed";
          } catch (n) {
            h(n);
          }
        }
        function ne(t) {
          return !m && R && typeof fetch == "function"
            ? fetch(t, { credentials: "same-origin" })
                .then((n) => {
                  if (!n.ok)
                    throw "failed to load wasm binary file at '" + t + "'";
                  return n.arrayBuffer();
                })
                .catch(() => x(t))
            : Promise.resolve().then(() => x(t));
        }
        function D(t, n, a) {
          return ne(t)
            .then((i) => WebAssembly.instantiate(i, n))
            .then((i) => i)
            .then(a, (i) => {
              d("failed to asynchronously prepare wasm: " + i), h(i);
            });
        }
        function ie(t, n, a, i) {
          return !t &&
            typeof WebAssembly.instantiateStreaming == "function" &&
            !T(n) &&
            typeof fetch == "function"
            ? fetch(n, { credentials: "same-origin" }).then((N) => {
                // var g = WebAssembly.instantiateStreaming(N, a);
                var g = WebAssembly.instantiateStreaming(N, a);
                // N.headers.set("mimetype", "application/wasm") instead: http -m wasm:application/wasm
                return g.then(i, function (fe) {
                  return (
                    d("wasm streaming compile failed: " + fe),
                    d("falling back to ArrayBuffer instantiation"),
                    D(n, a, i)
                  );
                });
              })
            : D(n, a, i);
        }
        function re() { // create
          var t = { a: le }; //
          function n(i, N) {
            var g = i.exports;
            return (e.asm = g), (I = e.asm.c), k(), e.asm.h, Q(e.asm.d), ee(), g;
          }
          Z();
          function a(i) {
            n(i.instance);
          }
          if (e.instantiateWasm)
            try {
              return e.instantiateWasm(t, n);
            } catch (i) {
              d("Module.instantiateWasm callback failed with error: " + i), u(i);
            }
          return ie(m, f, t, a).catch(u), {};
        }
        function U(t) {
          for (; t.length > 0; ) t.shift()(e);
        }
        function se(t, n = "i8") { //BAM: get values from heap
          switch ((n.endsWith("*") && (n = "*"), n)) {
            case "i1":
              return b[t >> 0];
            case "i8":
              return b[t >> 0];
            case "i16":
              return S[t >> 1];
            case "i32":
              return E[t >> 2];
            case "i64":
              return E[t >> 2];
            case "float":
              return O[t >> 2];
            case "double":
              return z[t >> 3];
            case "*":
              return B[t >> 2];
            default:
              h(`invalid type for getValue: ${n}`);
          }
        }
        // BAM: t is this??
        function oe(t, n, a) {
          P.copyWithin(t, n, n + a); // BAM: copy into uint8 buffer
        }
        function ue(t) {
          h("OOM"); // BAM: throw error
        }
        function ae(t) {
          P.length, ue(); // BAM: if the buffer length is not 0 throw OoutOfMemory
        }
        var le = { b: oe, a: ae };
        re(),
          (e._generate = function () {
            return (e._generate = e.asm.e).apply(null, arguments); // exports.e = _generate
          }),
          (e._malloc = function () {
            return (e._malloc = e.asm.f).apply(null, arguments); // exports.f = _malloc
          }),
          (e._free = function () {
            return (e._free = e.asm.g).apply(null, arguments); // exports.g = _free
          }),
          (e.getValue = se); // BAM: gets value from the proper heap
        var y;
        _ = function t() {
          y || V(), y || (_ = t);
        };
        function V() {
          if (l > 0 || (K(), l > 0)) return;
          function t() {
            y ||
              ((y = !0),
              (e.calledRun = !0),
              !H &&
                (X(),
                c(e),
                e.onRuntimeInitialized && e.onRuntimeInitialized(),
                $()));
          }
          e.setStatus
            ? (e.setStatus("Running..."),
              setTimeout(function () {
                setTimeout(function () {
                  e.setStatus("");
                }, 1),
                  t();
              }, 1))
            : t();
        }
        if (e.preInit)
          for (
            typeof e.preInit == "function" && (e.preInit = [e.preInit]);
            e.preInit.length > 0;

          )
            e.preInit.pop()();
        return V(), e.ready;
      };
    })();
    async function j() {
      return await F();
    }
    class q {
      _module;
      _input;
      _decompressBuffer;
      _positions;
      _uvs;
      _indices;
      _decompressedSize;
      _faceCount;
      _pointCount;
      _decompressBufferSize;
      constructor(s, e) {
        (this._module = s),
          (this._input = this._module._malloc(61440)),
          (this._decompressBuffer = this._module._malloc(8e4)),
          (this._positions = this._module._malloc(288e4)),
          (this._uvs = this._module._malloc(192e4)),
          (this._indices = this._module._malloc(576e4)),
          (this._decompressedSize = this._module._malloc(4)),
          (this._faceCount = this._module._malloc(4)),
          (this._pointCount = this._module._malloc(4)),
          (this._decompressBufferSize = e);
      }
      release() {
        this._module._free(this._input),
          this._module._free(this._positions),
          this._module._free(this._uvs),
          this._module._free(this._indices),
          this._module._free(this._pointCount),
          this._module._free(this._decompressBuffer),
          this._module._free(this._decompressedSize);
      }
      generate(s, e) {
        this._module.HEAPU8.set(s, this._input),
          this._module._generate(
            this._input,
            s.length,
            this._decompressBufferSize,
            this._decompressBuffer,
            this._decompressedSize,
            this._positions,
            this._uvs,
            this._indices,
            this._faceCount,
            this._pointCount,
            e
          ),
          this._module.getValue(this._decompressedSize, "i32");
        const c = this._module.getValue(this._pointCount, "i32"),
          u = this._module.getValue(this._faceCount, "i32"),
          p = new Uint8Array(
            this._module.HEAPU8.subarray(
              this._positions,
              this._positions + u * 12
            ).slice()
          ),
          R = new Uint8Array(
            this._module.HEAPU8.subarray(this._uvs, this._uvs + u * 8).slice()
          ),
          o = new Uint32Array(
            this._module.HEAPU8.subarray(
              this._indices,
              this._indices + u * 24
            ).slice().buffer
          );
        return {
          point_count: c,
          face_count: u,
          positions: p,
          uvs: R,
          indices: o,
        };
      }
    }
    const A = self;
    let v = null;
    j().then((r) => {
      v = new q(r, 8e4);
    }),
      A.addEventListener(
        "message",
        (r) => {
          const s = L(r.data);
          if (v) {
            const e = v.generate(s.data, Math.floor(s.origin[2] / s.resolution));
            A.postMessage({
              geometryData: e,
              resolution: s.resolution,
              origin: s.origin,
            });
          }
        },
        !1
      ),
      A.addEventListener("error", () => {
        console.log("error");
      });
    function L(r) {
      const s = Number(r.resolution) || 0.1,
        e = r.origin,
        c = r.width;
      return { data: new Uint8Array(r.data), resolution: s, origin: e, width: c };
    }
  })();
