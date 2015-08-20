MOCHA=$$(npm bin)/mocha
BROCCOLI=$$(npm bin)/broccoli-cli/bin/broccoli

all: dist test

test:
	$(MOCHA) --recursive --compilers js:babel/register test
	env LGTM_STANDALONE=1 $(MOCHA) --recursive --compilers js:babel/register test

clean:
	rm -rf dist

dist: clean
	broccoli build dist

.PHONY: clean dist test
