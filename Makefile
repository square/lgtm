COMPILE_MODULES=./node_modules/.bin/compile-modules
KARMA=./node_modules/karma/bin/karma
RSVP_LIB=./node_modules/rsvp/lib

all: dist test

test:
	$(KARMA) start --single-run

# Collect the targets that may not exist yet for dist/commonjs/**/*.js.
SRC_FILES=$(shell find src -type f -name '*.js')
CJS_FILES=$(patsubst src/%.js, dist/commonjs/%.js, $(SRC_FILES))

dist/lgtm.js: $(SRC_FILES)
	$(COMPILE_MODULES) convert -I src -f bundle -o $@ lgtm.umd

dist/lgtm-standalone.js: $(SRC_FILES)
	$(COMPILE_MODULES) convert -I src -I $(RSVP_LIB) -f bundle -o $@ lgtm-standalone.umd

define cjsbuild
$(patsubst src/%.js, dist/commonjs/%.js, $(1)): $(1)
	$(COMPILE_MODULES) convert -I src -I $(RSVP_LIB) -f commonjs -o $$@ $$<
endef

# Create rules for each dist/commonjs/**/*.js file.
$(foreach file, $(SRC_FILES), $(eval $(call cjsbuild, $(file))))

# Build all commonjs files.
dist/commonjs: $(CJS_FILES)

clean:
	rm -rf dist

dist: dist/lgtm.js dist/lgtm-standalone.js dist/commonjs

.PHONY: clean dist dist/commonjs test
