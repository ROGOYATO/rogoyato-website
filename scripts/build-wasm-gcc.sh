#!/usr/bin/env bash
# Builds cc1plus and cc1, GCC 7.3.0's C++ and C compilers (with Arduino's AVR patches, as in the
# Arduino IDE's avr-gcc 7.3.0-atmel3.6.1-arduino7), for WebAssembly with Emscripten. The browser
# compiler uses cc1plus for sketches and libraries (toolchain.pack.gz) and cc1 for libraries' .c
# and .S files (libraries.pack.gz).
#
# This is toolchain/build.sh from github.com/jeffrey-braam/arduino-ide at commit
# 8c563b189cacc9953ee20fa51fad1a80da75673d (same pinned sources, same configuration), changed to
# build cc1 too and to apply scripts/wasm-patches/gcc/avr-builtin-no-operands.patch: GCC called
# the generators of operand-less AVR builtins (__builtin_avr_cli, _sei, ...) with an extra
# argument, harmless natively but a trap in WebAssembly (FastLED uses __builtin_avr_cli).
#
# Runs on Linux (e.g. Ubuntu 24.04). Needs: gcc g++ make m4 flex bison texinfo curl git binutils-avr
# python3 xz bzip2 patch gnupg.
#
# Usage: WORK=~/aide-toolchain scripts/build-wasm-gcc.sh [fetch|emsdk|deps|gcc_build|all]   (default: all)
# Output: scripts/out/{cc1plus,cc1}.{mjs,wasm}
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="${WORK:-$HOME/aide-toolchain}"      # build tree; keep it on a Linux filesystem for speed
OUT="$HERE/out"
JOBS="${JOBS:-$(nproc)}"
SRC="$WORK/src"
PREFIX="$WORK/wasm-deps"

EMSDK_VERSION=6.0.10
ARDUINO_TOOLCHAIN_COMMIT=368b87a73e3677071fa44f2182c1ea4cc6a90557

# name|url|sha256 (hashes pinned after verifying the GNU release signatures on 2026-09-26)
SOURCES=(
  "gcc-7.3.0.tar.xz|https://ftp.gnu.org/gnu/gcc/gcc-7.3.0/gcc-7.3.0.tar.xz|832ca6ae04636adbb430e865a1451adf6979ab44ca1c8374f61fba65645ce15c"
  "binutils-2.42.tar.xz|https://ftp.gnu.org/gnu/binutils/binutils-2.42.tar.xz|f6e4d41fd5fc778b06b7891457b3620da5ecea1006c6a4a41ae998109f85a800"
  "gmp-6.1.0.tar.bz2|https://ftp.gnu.org/gnu/gmp/gmp-6.1.0.tar.bz2|498449a994efeba527885c10405993427995d3f86b8768d8cdf8d9dd7c6b73e8"
  "mpfr-3.1.4.tar.bz2|https://ftp.gnu.org/gnu/mpfr/mpfr-3.1.4.tar.bz2|d3103a80cdad2407ed581f3618c4bed04e0c92d1cf771a65ead662cc397f7775"
  "mpc-1.0.3.tar.gz|https://ftp.gnu.org/gnu/mpc/mpc-1.0.3.tar.gz|617decc6ea09889fb08ede330917a00b16809b8db88c29c31bfbb49cbf88ecc3"
  "atmel-patches-gcc.7.3.0-arduino2.patch|https://raw.githubusercontent.com/arduino/toolchain-avr/$ARDUINO_TOOLCHAIN_COMMIT/avr-gcc-patches/atmel-patches-gcc.7.3.0-arduino2.patch|96782c75dd11e994e1ab9250c41fc5cd81ba65bbcf44383cd9d660d01cc85f97"
)

log() { printf '\n=== %s\n' "$*"; }

fetch() {
  mkdir -p "$SRC"
  for entry in "${SOURCES[@]}"; do
    IFS='|' read -r name url sha <<<"$entry"
    [ -f "$SRC/$name" ] || { log "Downloading $name"; curl -fL --retry 3 -o "$SRC/$name.tmp" "$url" && mv "$SRC/$name.tmp" "$SRC/$name"; }
    if [[ "$sha" == SHA_* ]]; then
      echo "UNPINNED $name $(sha256sum "$SRC/$name" | cut -d' ' -f1)"
    else
      echo "$sha  $SRC/$name" | sha256sum -c --quiet || { echo "Checksum mismatch for $name" >&2; exit 1; }
    fi
  done
}

# One-off: checks the GNU tarballs against their detached signatures (used to pin the hashes).
verify_signatures() {
  [ -f "$SRC/gnu-keyring.gpg" ] || curl -fsSL -o "$SRC/gnu-keyring.gpg" https://ftp.gnu.org/gnu/gnu-keyring.gpg
  for entry in "${SOURCES[@]}"; do
    IFS='|' read -r name url _ <<<"$entry"
    [[ "$url" == https://ftp.gnu.org/* ]] || continue
    curl -fsSL -o "$SRC/$name.sig" "$url.sig"
    gpgv --keyring "$SRC/gnu-keyring.gpg" "$SRC/$name.sig" "$SRC/$name" 2>&1 | grep -E "Good signature|BAD|Can't" || true
  done
}

emsdk() {
  if [ ! -d "$WORK/emsdk" ]; then
    git clone --depth 1 --branch "$EMSDK_VERSION" https://github.com/emscripten-core/emsdk.git "$WORK/emsdk"
  fi
  (cd "$WORK/emsdk" && ./emsdk install "$EMSDK_VERSION" && ./emsdk activate "$EMSDK_VERSION" >/dev/null)
}

activate_emsdk() {
  # shellcheck disable=SC1091
  source "$WORK/emsdk/emsdk_env.sh" >/dev/null 2>&1
  emcc --version | head -1
}

extract() { # tarball dir
  rm -rf "$WORK/$2"
  mkdir -p "$WORK/$2"
  tar -xf "$SRC/$1" -C "$WORK/$2" --strip-components=1
}

# Autoconf's config.sub in these old releases doesn't know Emscripten, so the host is described as
# 32-bit Linux (wasm32 has the same int/long/pointer sizes) and the compilers are set to emcc.
HOST=i686-pc-linux-gnu
BUILD=x86_64-pc-linux-gnu
HOST_CFLAGS="-O2 -g0 -w"

# GMP, MPFR and MPC: arbitrary-precision maths libraries GCC uses for constant folding.
deps() {
  activate_emsdk
  log "GMP"
  extract gmp-6.1.0.tar.bz2 gmp
  (cd "$WORK/gmp" && emconfigure ./configure --host=none --build=$BUILD --prefix="$PREFIX" \
      --disable-assembly --disable-shared --enable-static CC_FOR_BUILD=gcc CFLAGS="$HOST_CFLAGS" >/dev/null \
    && emmake make -j"$JOBS" >/dev/null && emmake make install >/dev/null)
  log "MPFR"
  extract mpfr-3.1.4.tar.bz2 mpfr
  (cd "$WORK/mpfr" && emconfigure ./configure --host=$HOST --build=$BUILD --prefix="$PREFIX" \
      --with-gmp="$PREFIX" --disable-shared --enable-static CFLAGS="$HOST_CFLAGS" >/dev/null \
    && emmake make -j"$JOBS" >/dev/null && emmake make install >/dev/null)
  log "MPC"
  extract mpc-1.0.3.tar.gz mpc
  (cd "$WORK/mpc" && emconfigure ./configure --host=$HOST --build=$BUILD --prefix="$PREFIX" \
      --with-gmp="$PREFIX" --with-mpfr="$PREFIX" --disable-shared --enable-static CFLAGS="$HOST_CFLAGS" >/dev/null \
    && emmake make -j"$JOBS" >/dev/null && emmake make install >/dev/null)
  ls -la "$PREFIX/lib"
}

# Emscripten link settings shared by all tools: an ES module factory with a callable main(), an
# in-memory filesystem, and memory that grows as needed.
EM_LDFLAGS="-O2 -sMODULARIZE=1 -sEXPORT_ES6=1 -sINVOKE_RUN=0 -sEXIT_RUNTIME=1 -sFORCE_FILESYSTEM=1 \
  -sEXPORTED_RUNTIME_METHODS=callMain,FS -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=16MB \
  -sMAXIMUM_MEMORY=2GB -sSTACK_SIZE=8MB -sENVIRONMENT=web,worker,node"

# GCC 7.3.0 + Arduino's AVR patches, configured like Arduino's gcc.build.bash (minus the parts
# a single-translation-unit browser compiler doesn't need: LTO, plugins, docs).
gcc_build() {
  # GCC's configure runs the target assembler to decide which features to emit (COMDAT groups,
  # mergeable string sections, ...). Arduino's compiler was configured against binutils 2.26 with
  # Atmel's patches; Ubuntu's binutils-avr is that same release, so the output matches.
  [ -x /usr/bin/avr-as ] || { echo "Install binutils-avr (apt install binutils-avr) first." >&2; exit 1; }
  activate_emsdk
  log "GCC: unpack and patch"
  extract gcc-7.3.0.tar.xz gcc
  (cd "$WORK/gcc" && patch -p1 -s < "$SRC/atmel-patches-gcc.7.3.0-arduino2.patch")
  for p in "$HERE"/wasm-patches/gcc/*.patch; do
    [ -e "$p" ] && (cd "$WORK/gcc" && patch -p1 -s < "$p" && echo "applied $(basename "$p")")
  done

  log "GCC: configure"
  rm -rf "$WORK/gcc-build" && mkdir -p "$WORK/gcc-build" && cd "$WORK/gcc-build"
  # Emscripten's libc declares psignal() but configure can't link-test it, so libiberty would
  # define its own with an incompatible signature.
  export ac_cv_func_psignal=yes
  CC=emcc CXX=em++ AR=emar RANLIB=emranlib \
  CFLAGS="$HOST_CFLAGS" CXXFLAGS="$HOST_CFLAGS -std=gnu++98" \
  CC_FOR_BUILD=gcc CXX_FOR_BUILD=g++ CFLAGS_FOR_BUILD="-O2 -w" CXXFLAGS_FOR_BUILD="-O2 -w -std=gnu++98" \
    ../gcc/configure --build=$BUILD --host=$HOST --target=avr \
      --with-as=/usr/bin/avr-as --with-ld=/usr/bin/avr-ld \
      --enable-languages=c,c++ --enable-fixed-point --with-avrlibc=yes --with-dwarf2 \
      --disable-nls --disable-libssp --disable-libada --disable-shared --disable-doc \
      --disable-lto --disable-plugin --disable-bootstrap --without-isl \
      --with-gmp="$PREFIX" --with-mpfr="$PREFIX" --with-mpc="$PREFIX" >/dev/null

  log "GCC: build host libraries and generators"
  make -j"$JOBS" all-build-libiberty all-build-libcpp all-build-fixincludes \
    all-libiberty all-libcpp all-libdecnumber all-libbacktrace all-zlib configure-gcc >/dev/null

  # Building inside gcc/ directly skips the variables the top-level Makefile passes down, so the
  # native compiler for GCC's generator programs has to be named here. GCC 7 predates C++17, and
  # decides whether to include <algorithm> from a check against the WebAssembly compiler, not g++.
  # The same goes for the host flags: gcc/Makefile's own CFLAGS have -O2 stripped.
  local for_build=(CC_FOR_BUILD=gcc CXX_FOR_BUILD=g++ "CFLAGS_FOR_BUILD=-O2 -w" "CXXFLAGS_FOR_BUILD=-O2 -w -std=gnu++98 -include algorithm"
    "CFLAGS=$HOST_CFLAGS" "CXXFLAGS=$HOST_CFLAGS -std=gnu++98")
  mkdir -p "$OUT"
  for tool in cc1plus cc1; do
    log "GCC: build $tool"
    make -C gcc -j"$JOBS" $tool "${for_build[@]}" >/dev/null
    rm -f gcc/$tool gcc/$tool.wasm
    make -C gcc $tool "${for_build[@]}" LDFLAGS="$EM_LDFLAGS" >/dev/null
    cp gcc/$tool "$OUT/$tool.mjs"
    cp gcc/$tool.wasm "$OUT/$tool.wasm"
  done
  ls -la "$OUT"
}

all() {
  fetch
  emsdk
  deps
  gcc_build
}

"${@:-all}"
