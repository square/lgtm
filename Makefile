MOCHA=./node_modules/.bin/mocha
BROCCOLI=./node_modules/broccoli-cli/bin/broccoli

all: dist test

test:
	$(MOCHA) --recursive test
	env LGTM_STANDALONE=1 $(MOCHA) --recursive test

clean:
	rm -rf dist

dist: clean
	broccoli build dist

.PHONY: clean dist test
